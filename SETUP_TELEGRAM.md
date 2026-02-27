
# Telegram Bot & Contact Form Setup

This guide explains how to deploy the backend worker that handles the contact form and Telegram notifications.

## 1. Prerequisites
- A Cloudflare account
- Node.js installed locally (to run Wrangler)

## 2. Setup Cloudflare Worker
1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create the KV Namespace (database for chat IDs):
   ```bash
   wrangler kv:namespace create "CHAT_STATE"
   ```
   *Copy the output ID* and replace the `id` value in `wrangler.toml` under `[[kv_namespaces]]`.

## 3. Configure Secrets (IMPORTANT)
To keep your API key hidden from GitHub, set it as a secret in Cloudflare:

```bash
# Set your Telegram Bot Token (the one you got from BotFather)
wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your token when prompted
```

```bash
# Set your Access Password (optional, defaults to "airgas123" if not set)
wrangler secret put ACCESS_PASSWORD
# Enter: airgas123
```

## 4. Deploy
Publish the worker to the internet:
```bash
wrangler deploy
```
This will give you a URL like `https://airgas-telegram-bot.<your-subdomain>.workers.dev`.

## 5. Connect Telegram Webhook
Tell Telegram to send messages to your worker:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_WORKER_URL>/telegram"
```
Replace `<YOUR_BOT_TOKEN>` and `<YOUR_WORKER_URL>` with your actual values.

## 6. Update Contact Form
Open `html/contact.html` and update the meta tag with your new worker URL:
```html
<meta name="contact-api" content="https://<YOUR_WORKER_URL>/contact">
```

## 7. Usage
1. Open your bot in Telegram.
2. Send `/get`.
3. Enter password: `airgas123`.
4. You will now receive messages sent from the website contact form.
5. To stop, send `/stop` and reply `YES`.
