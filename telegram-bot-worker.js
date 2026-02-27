function jsonResponse(body, init) {
  var headers = new Headers(init && init.headers ? init.headers : undefined);
  if (!headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), Object.assign({}, init, { headers: headers }));
}

function textResponse(body, init) {
  var headers = new Headers(init && init.headers ? init.headers : undefined);
  if (!headers.has("content-type")) headers.set("content-type", "text/plain; charset=utf-8");
  return new Response(body, Object.assign({}, init, { headers: headers }));
}

function getAllowedOrigins() {
  return [
    "https://nightmarecode.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
  ];
}

function corsHeaders(request) {
  var origin = request.headers.get("origin");
  if (!origin) return {};
  if (getAllowedOrigins().indexOf(origin) === -1) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "origin"
  };
}

function safeText(v, maxLen) {
  var s = String(v == null ? "" : v);
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen) + "…";
  return s.trim();
}

function normalizeYes(s) {
  var t = safeText(s, 32).toLowerCase();
  return t === "yes" || t === "y";
}

function isCommand(text, cmd) {
  var t = safeText(text, 128);
  if (!t) return false;
  var first = t.split(/\s+/)[0];
  return first === cmd;
}

async function telegramApi(env, method, payload) {
  var token = env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  var res = await fetch("https://api.telegram.org/bot" + token + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  var data = await res.json().catch(function () { return null; });
  if (!res.ok || !data || data.ok !== true) {
    var desc = data && data.description ? data.description : "Telegram API error";
    throw new Error(desc);
  }
  return data;
}

async function sendMessage(env, chatId, text) {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  });
}

function chatKey(chatId) {
  return "chat:" + String(chatId);
}

async function getChatState(env, chatId) {
  if (!env.CHAT_STATE) throw new Error("Missing CHAT_STATE binding");
  var state = await env.CHAT_STATE.get(chatKey(chatId), { type: "json" });
  if (!state) {
    return { chatId: String(chatId), mode: "blocked", pending: null, updatedAt: Date.now() };
  }
  if (!state.mode) state.mode = "blocked";
  if (state.pending === undefined) state.pending = null;
  state.chatId = String(chatId);
  return state;
}

async function setChatState(env, chatId, partial) {
  if (!env.CHAT_STATE) throw new Error("Missing CHAT_STATE binding");
  var current = await getChatState(env, chatId);
  var next = Object.assign({}, current, partial, { chatId: String(chatId), updatedAt: Date.now() });
  await env.CHAT_STATE.put(chatKey(chatId), JSON.stringify(next));
  return next;
}

async function listReceivingChatIds(env) {
  if (!env.CHAT_STATE) throw new Error("Missing CHAT_STATE binding");
  var out = [];
  var cursor = undefined;
  do {
    var page = await env.CHAT_STATE.list({ prefix: "chat:", cursor: cursor });
    cursor = page.cursor;
    for (var i = 0; i < page.keys.length; i++) {
      var key = page.keys[i].name;
      var state = await env.CHAT_STATE.get(key, { type: "json" });
      if (state && state.mode === "receive" && state.chatId) out.push(String(state.chatId));
    }
  } while (cursor);
  return out;
}

function formatContactMessage(payload) {
  var name = safeText(payload.name, 120);
  var email = safeText(payload.email, 160);
  var message = safeText(payload.message, 4000);
  var subject = safeText(payload.subject || "", 160);
  var pageUrl = safeText(payload.pageUrl || "", 500);
  var ts = new Date().toISOString();

  var lines = [];
  lines.push("<b>New contact form submission</b>");
  lines.push("<b>Time:</b> " + ts);
  if (name) lines.push("<b>Name:</b> " + escapeHtml(name));
  if (email) lines.push("<b>Email:</b> " + escapeHtml(email));
  if (subject) lines.push("<b>Subject:</b> " + escapeHtml(subject));
  if (pageUrl) lines.push("<b>Page:</b> " + escapeHtml(pageUrl));
  lines.push("");
  lines.push("<b>Message:</b>");
  lines.push(escapeHtml(message));
  return lines.join("\n");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function validateContactPayload(payload) {
  var name = safeText(payload.name, 120);
  var email = safeText(payload.email, 160);
  var message = safeText(payload.message, 4000);
  if (!name) return { ok: false, error: "Name is required." };
  if (!email || email.indexOf("@") === -1) return { ok: false, error: "Valid email is required." };
  if (!message || message.length < 3) return { ok: false, error: "Message is required." };
  return { ok: true };
}

async function handleTelegramWebhook(request, env) {
  var update = await request.json();
  var msg = update && update.message ? update.message : null;
  if (!msg || !msg.chat || !msg.chat.id) return jsonResponse({ ok: true });

  var chatId = String(msg.chat.id);
  var text = msg.text != null ? String(msg.text) : "";

  var state = await getChatState(env, chatId);
  var password = env.ACCESS_PASSWORD;
  if (!password) throw new Error("Missing ACCESS_PASSWORD");

  if (isCommand(text, "/get")) {
    await setChatState(env, chatId, { pending: "password" });
    await sendMessage(env, chatId, "Please enter the password:");
    return jsonResponse({ ok: true });
  }

  if (isCommand(text, "/stop")) {
    await setChatState(env, chatId, { pending: "stop_confirm" });
    await sendMessage(env, chatId, "Are you sure? Reply <b>YES</b> to stop receiving messages.");
    return jsonResponse({ ok: true });
  }

  if (state.pending === "password") {
    if (safeText(text, 256) === password) {
      await setChatState(env, chatId, { mode: "receive", pending: null });
      await sendMessage(env, chatId, "Access granted. You will now receive contact messages. Send /stop to opt out.");
      return jsonResponse({ ok: true });
    }
    await setChatState(env, chatId, { pending: "password" });
    await sendMessage(env, chatId, "Wrong password. Please try again:");
    return jsonResponse({ ok: true });
  }

  if (state.pending === "stop_confirm") {
    if (normalizeYes(text)) {
      await setChatState(env, chatId, { mode: "blocked", pending: null });
      await sendMessage(env, chatId, "Stopped. You will no longer receive contact messages. Send /get to re-enable.");
      return jsonResponse({ ok: true });
    }
    await setChatState(env, chatId, { pending: null });
    await sendMessage(env, chatId, "Cancelled. You will continue receiving contact messages.");
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: true });
}

async function handleContact(request, env) {
  var cors = corsHeaders(request);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return textResponse("Method Not Allowed", { status: 405, headers: cors });

  var payload = await request.json();
  var valid = validateContactPayload(payload);
  if (!valid.ok) return jsonResponse({ ok: false, error: valid.error }, { status: 400, headers: cors });

  var receivers = await listReceivingChatIds(env);
  if (!receivers.length) return jsonResponse({ ok: true, delivered: 0 }, { headers: cors });

  var text = formatContactMessage(payload);
  var delivered = 0;
  await Promise.all(
    receivers.map(function (chatId) {
      return sendMessage(env, chatId, text)
        .then(function () { delivered += 1; })
        .catch(function () { return null; });
    })
  );

  return jsonResponse({ ok: true, delivered: delivered }, { headers: cors });
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (url.pathname === "/health") return jsonResponse({ ok: true });
    if (url.pathname === "/telegram") return handleTelegramWebhook(request, env);
    if (url.pathname === "/contact") return handleContact(request, env);
    return textResponse("Not Found", { status: 404 });
  }
};
