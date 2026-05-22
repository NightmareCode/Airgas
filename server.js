require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SKYBIZ = {
  base: process.env.SKYBIZ_BASE   || 'https://clouderp.com.my/01',
  store: process.env.SKYBIZ_STORE || 'airgas',
  db:    process.env.SKYBIZ_DB    || 'cp112d_airgas',
  user:  process.env.SKYBIZ_USER  || '',
  pass:  process.env.SKYBIZ_PASS  || ''
};

let cookies = '';
let authenticated = false;
let items = [];
let stocks = {};
let stocksFetched = false;
let stockProgress = { done: 0, total: 0 };
let fetchingStocks = false;

// ── Cookie helpers ──

function extractSetCookies(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return raw.map(c => c.split(';')[0]).join('; ');
}

function mergeCookies(existing, incoming) {
  if (!incoming) return existing;
  const map = {};
  [existing, incoming].forEach(str => {
    str.split('; ').filter(Boolean).forEach(pair => {
      const eq = pair.indexOf('=');
      const key = eq > -1 ? pair.substring(0, eq) : pair;
      map[key] = pair;
    });
  });
  return Object.values(map).join('; ');
}

// ── SkyBiz 4-step login ──

async function skybizLogin() {
  console.log('[SkyBiz] Logging in...');
  cookies = '';

  let res = await fetch(
    `${SKYBIZ.base}/index.php?StoreMain=${SKYBIZ.store}&MultiDBName=${SKYBIZ.db}&MultipleStoreYN=0`,
    { redirect: 'manual' }
  );
  cookies = extractSetCookies(res);

  res = await fetch(`${SKYBIZ.base}/check_login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
    body: `StoreMain=${SKYBIZ.store}&MultiDBName=${SKYBIZ.db}&MultipleStoreYN=0`,
    redirect: 'manual'
  });
  cookies = mergeCookies(cookies, extractSetCookies(res));

  res = await fetch(`${SKYBIZ.base}/login.php`, {
    headers: { 'Cookie': cookies },
    redirect: 'manual'
  });
  cookies = mergeCookies(cookies, extractSetCookies(res));

  res = await fetch(`${SKYBIZ.base}/do_login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
    body: `Email=${SKYBIZ.user}&Password=${SKYBIZ.pass}&ModuleCode=dynamic&PublicIP=101.99.81.112&MacAddress=&DeviceID=api-inv&ControlUserYN=0&ConcurrentUser=2`,
    redirect: 'manual'
  });
  cookies = mergeCookies(cookies, extractSetCookies(res));

  authenticated = true;
  console.log('[SkyBiz] Login OK');
}

async function ensureAuth() {
  if (!authenticated) await skybizLogin();
}

// ── Fetch all items with descriptions ──

async function fetchAllItems() {
  await ensureAuth();

  const res = await fetch(`${SKYBIZ.base}/sharedfunction/global/fnjretitem_refreshv2.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
    body: 'ItemCode='
  });
  const html = await res.text();

  if (html.includes('login.php') || html.length < 100) {
    console.log('[SkyBiz] Session expired, re-authenticating...');
    authenticated = false;
    await skybizLogin();
    return fetchAllItems();
  }

  // Parse: <li onclick="setItem('', 'CODE')">CODE | DESCRIPTION</li>
  const parsed = [];
  const regex = /setItem\('[^']*',\s*'([^']+)'\)">[\s\n]*([^<]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const code = match[1].trim();
    const raw = match[2].trim();
    // Format: "CODE | Description" — strip the code prefix
    const pipeIdx = raw.indexOf('|');
    const description = pipeIdx > -1 ? raw.substring(pipeIdx + 1).trim() : raw;
    if (code) {
      parsed.push({ code, description: decodeHtmlEntities(description) });
    }
  }

  console.log(`[SkyBiz] Parsed ${parsed.length} items with descriptions`);
  if (parsed.length > 0) {
    console.log('[SkyBiz] Sample:', parsed[0].code, '→', parsed[0].description.substring(0, 60));
  }
  return parsed;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// ── Fetch REAL on-hand stock via location breakdown ──
// The calculate_onhand endpoint always returns "1" (existence flag).
// Real quantities come from the location on-hand tab which returns
// an HTML table with a "Total" row containing the actual stock.

async function fetchOnHand(code) {
  try {
    const res = await fetch(`${SKYBIZ.base}/sharedfunction/global/fnmitem_listing_details_tab_location_onhand.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
      body: `id=${encodeURIComponent(code)}&ItemCode=${encodeURIComponent(code)}&LocationType=All`
    });
    const html = await res.text();

    // Look for the Total row — SkyBiz wraps in <b> tags:
    // <td ...><b>Total</b></td><td ...><b>1.00<b></td>
    // (note: SkyBiz has malformed closing <b> instead of </b>)
    const totalMatch = html.match(/>\s*(?:<b>)?\s*Total\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>\s*(?:<b>)?\s*([-\d.,]+)/i);
    if (totalMatch) {
      return parseFloat(totalMatch[1].replace(/,/g, '')) || 0;
    }

    // No Total row means no stock transactions → 0
    return 0;
  } catch { return 0; }
}

// ── Fetch item detail tabs from SkyBiz ──

async function fetchDetailTab(tab, code) {
  await ensureAuth();
  const res = await fetch(`${SKYBIZ.base}/sharedfunction/global/fnmitem_listing_details_${tab}.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
    body: `id=${encodeURIComponent(code)}&ItemCode=${encodeURIComponent(code)}&LocationType=All`
  });
  return await res.text();
}

function parsePricing(html) {
  const rows = [];
  const regex = /<tr>\s*<td[^>]*style="[^"]*display:none[^"]*"[^>]*>[\s\S]*?<\/td>\s*<td class="childtd">\s*(.*?)\s*<\/td>\s*<td class="childtd">\s*(.*?)\s*<\/td>\s*<td[^>]*>\s*([\d.,]+)\s*<\/td>\s*<td[^>]*>\s*([\d.,]+)\s*<\/td>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    rows.push({
      uom: m[1].trim(),
      description: m[2].trim(),
      factor: parseFloat(m[3].replace(/,/g, '')) || 0,
      price: parseFloat(m[4].replace(/,/g, '')) || 0
    });
  }
  return rows;
}

function parseLocations(html) {
  const rows = [];
  // Match location rows (NOT the Total row)
  const regex = /<tr>\s*<td class="childtd">\s*(.*?)\s*<\/td>\s*<td class="childtd"[^>]*>\s*([-\d.,]+)\s*<\/td>\s*<td class="childtd">\s*(.*?)\s*<\/td>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const loc = m[1].trim();
    if (loc.match(/<b>/i)) continue; // skip Total row
    rows.push({
      location: loc || '(No Location)',
      qty: parseFloat(m[2].replace(/,/g, '')) || 0,
      uom: m[3].trim()
    });
  }
  return rows;
}

function parseImage(html) {
  const m = html.match(/data:image\/[^"']+/i);
  return m ? m[0] : null;
}

function parseMemo(html) {
  const m = html.match(/<td class='childtd'>([\s\S]*?)<\/td>/i);
  if (!m) return '';
  return m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

async function fetchHistory(type, code, start, length) {
  await ensureAuth();
  const endpoint = type === 'outgoing'
    ? 'fnmitem_listing_server_processing_outgoing_history.php'
    : 'fnmitem_listing_server_processing_incoming_history.php';
  const res = await fetch(`${SKYBIZ.base}/sharedfunction/global/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
    body: `ItemCode=${encodeURIComponent(code)}&draw=1&start=${start || 0}&length=${length || 50}`
  });
  const json = await res.json();
  const columns = type === 'outgoing'
    ? ['date','document','customerCode','customerName','qty','fQty','uom','unitPrice','discPct','disc','tax','amount','batch','salesPerson','location','department','project','branch','id']
    : ['date','document','supplierCode','supplierName','qty','fQty','uom','unitPrice','discPct','disc','tax','amount','batch','purchaser','location','department','project','branch','id'];
  const rows = (json.data || []).map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i] || ''; });
    return obj;
  });
  return { total: json.recordsTotal || 0, filtered: json.recordsFiltered || 0, rows };
}

async function fetchStockCard(code, start, length) {
  await ensureAuth();
  const res = await fetch(`${SKYBIZ.base}/sharedfunction/global/fnmitem_listing_server_processing_stock_card.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
    body: `ItemCode=${encodeURIComponent(code)}&draw=1&start=${start || 0}&length=${length || 50}&LocationCode=&DateFrom=&DateTo=&SerialNumberYN=0&InvalidSerialNumberYN=0`
  });
  try {
    const json = await res.json();
    const columns = ['date','doNumber','invoiceNumber','qty','balance','locationFrom','locationTo','type','fQty','uom','disc','tax','unitPrice','lineAmount','name','itemBatch','salesPerson','department','project'];
    const rows = (json.data || []).map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i] || ''; });
      return obj;
    });
    return { total: json.recordsTotal || 0, filtered: json.recordsFiltered || 0, rows };
  } catch { return { total: 0, filtered: 0, rows: [] }; }
}

// ── Batch-fetch stocks ──

async function batchFetchStocks(codes) {
  if (fetchingStocks) return;
  fetchingStocks = true;
  stockProgress = { done: 0, total: codes.length };
  console.log(`[SkyBiz] Fetching stock for ${codes.length} items...`);

  const BATCH = 10;
  for (let i = 0; i < codes.length; i += BATCH) {
    if (!authenticated) await skybizLogin();
    const batch = codes.slice(i, i + BATCH);
    await Promise.all(batch.map(async code => {
      stocks[code] = await fetchOnHand(code);
      stockProgress.done++;
    }));
    if (stockProgress.done % 100 === 0 || stockProgress.done === codes.length) {
      console.log(`[SkyBiz] Stock: ${stockProgress.done}/${stockProgress.total}`);
    }
  }

  stocksFetched = true;
  fetchingStocks = false;
  console.log('[SkyBiz] All stocks loaded');
}

// ── Analytics cache ──

let analyticsCache = {
  locations: null,
  sales: null,
  valuation: null,
  fetchingLocations: false,
  fetchingSales: false,
  fetchingValuation: false
};

async function buildLocationAnalytics() {
  if (analyticsCache.fetchingLocations) return analyticsCache.locations;
  analyticsCache.fetchingLocations = true;
  console.log('[Analytics] Fetching location data...');

  const locationTotals = {};
  const BATCH = 10;
  const codes = items.map(i => i.code);

  for (let i = 0; i < codes.length; i += BATCH) {
    if (!authenticated) await skybizLogin();
    const batch = codes.slice(i, i + BATCH);
    await Promise.all(batch.map(async code => {
      try {
        const html = await (await fetch(`${SKYBIZ.base}/sharedfunction/global/fnmitem_listing_details_tab_location_onhand.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
          body: `id=${encodeURIComponent(code)}&ItemCode=${encodeURIComponent(code)}&LocationType=All`
        })).text();

        const regex = /<tr>\s*<td class="childtd">\s*(.*?)\s*<\/td>\s*<td class="childtd"[^>]*>\s*([-\d.,]+)\s*<\/td>/gi;
        let m;
        while ((m = regex.exec(html)) !== null) {
          const loc = m[1].trim();
          if (loc.match(/<b>/i)) continue;
          const name = loc.replace(/\s*-\s*$/, '').trim() || '(No Location)';
          const qty = parseFloat(m[2].replace(/,/g, '')) || 0;
          if (!locationTotals[name]) locationTotals[name] = { stock: 0, items: 0 };
          locationTotals[name].stock += qty;
          locationTotals[name].items++;
        }
      } catch {}
    }));
    if ((i + BATCH) % 200 === 0) console.log(`[Analytics] Locations: ${Math.min(i + BATCH, codes.length)}/${codes.length}`);
  }

  analyticsCache.locations = Object.entries(locationTotals)
    .map(([name, data]) => ({ name, stock: Math.round(data.stock * 100) / 100, items: data.items }))
    .sort((a, b) => b.stock - a.stock);

  analyticsCache.fetchingLocations = false;
  console.log(`[Analytics] Location data ready (${analyticsCache.locations.length} locations)`);
  return analyticsCache.locations;
}

async function buildSalesAnalytics() {
  if (analyticsCache.fetchingSales) return analyticsCache.sales;
  analyticsCache.fetchingSales = true;
  console.log('[Analytics] Fetching sales data...');

  // Get top 30 items with the most stock activity (non-zero stock)
  const activeItems = items.filter(i => stocks[i.code] !== undefined && stocks[i.code] !== 0)
    .slice(0, 30).map(i => i.code);

  // Also add items with highest absolute stock values
  const topByStock = [...items]
    .filter(i => stocks[i.code] !== undefined)
    .sort((a, b) => Math.abs(stocks[b.code] || 0) - Math.abs(stocks[a.code] || 0))
    .slice(0, 20).map(i => i.code);

  const codesToFetch = [...new Set([...activeItems, ...topByStock])];

  const customers = {};
  const topProducts = {};
  let totalRevenue = 0;
  let totalTransactions = 0;
  const monthlyRevenue = {};

  for (const code of codesToFetch) {
    try {
      if (!authenticated) await skybizLogin();
      const data = await fetchHistory('outgoing', code, 0, 100);
      const itemName = items.find(i => i.code === code)?.description || code;

      data.rows.forEach(r => {
        const amt = parseFloat(String(r.amount).replace(/,/g, '')) || 0;
        const qty = parseFloat(String(r.qty).replace(/,/g, '')) || 0;
        const custName = r.customerName || 'Unknown';

        totalRevenue += amt;
        totalTransactions++;

        if (!customers[custName]) customers[custName] = { revenue: 0, orders: 0 };
        customers[custName].revenue += amt;
        customers[custName].orders++;

        if (!topProducts[code]) topProducts[code] = { name: itemName, revenue: 0, qty: 0 };
        topProducts[code].revenue += amt;
        topProducts[code].qty += qty;

        // Monthly breakdown
        if (r.date) {
          const parts = r.date.split('/');
          if (parts.length === 3) {
            const monthKey = `${parts[2]}-${parts[1]}`;
            if (!monthlyRevenue[monthKey]) monthlyRevenue[monthKey] = 0;
            monthlyRevenue[monthKey] += amt;
          }
        }
      });
    } catch {}
  }

  analyticsCache.sales = {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalTransactions,
    itemsAnalyzed: codesToFetch.length,
    topCustomers: Object.entries(customers)
      .map(([name, d]) => ({ name, revenue: Math.round(d.revenue * 100) / 100, orders: d.orders }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    topProducts: Object.values(topProducts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({ ...p, revenue: Math.round(p.revenue * 100) / 100, qty: Math.round(p.qty * 100) / 100 })),
    monthlyRevenue: Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
  };

  analyticsCache.fetchingSales = false;
  console.log(`[Analytics] Sales data ready (${totalTransactions} transactions)`);
  return analyticsCache.sales;
}

async function buildValuationAnalytics() {
  if (analyticsCache.fetchingValuation) return analyticsCache.valuation;
  analyticsCache.fetchingValuation = true;
  console.log('[Analytics] Fetching pricing for valuation...');

  const valuations = [];
  const BATCH = 10;
  const itemsWithStock = items.filter(i => stocks[i.code] && stocks[i.code] > 0);

  for (let i = 0; i < itemsWithStock.length; i += BATCH) {
    if (!authenticated) await skybizLogin();
    const batch = itemsWithStock.slice(i, i + BATCH);
    await Promise.all(batch.map(async item => {
      try {
        const html = await (await fetch(`${SKYBIZ.base}/sharedfunction/global/fnmitem_listing_details_tab_pricing.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies },
          body: `id=${encodeURIComponent(item.code)}&ItemCode=${encodeURIComponent(item.code)}`
        })).text();

        const pricing = parsePricing(html);
        const basePrice = pricing.find(p => p.description.toLowerCase() === 'base')?.price || pricing[0]?.price || 0;
        const stock = stocks[item.code] || 0;
        const uom = pricing[0]?.uom || '';

        if (basePrice > 0) {
          valuations.push({
            code: item.code,
            name: item.description || item.code,
            stock,
            price: basePrice,
            value: Math.round(stock * basePrice * 100) / 100,
            uom
          });
        }
      } catch {}
    }));
  }

  valuations.sort((a, b) => b.value - a.value);
  const totalValue = valuations.reduce((sum, v) => sum + v.value, 0);

  analyticsCache.valuation = {
    totalValue: Math.round(totalValue * 100) / 100,
    itemsWithPricing: valuations.length,
    topByValue: valuations.slice(0, 10),
    all: valuations
  };

  analyticsCache.fetchingValuation = false;
  console.log(`[Analytics] Valuation ready (RM ${totalValue.toFixed(2)} total)`);
  return analyticsCache.valuation;
}

// ── Build frontend item objects ──

function getStockStatus(qty) {
  if (qty === null) return 'loading';
  if (qty <= 0) return 'out-of-stock';
  if (qty <= 10) return 'low-stock';
  return 'in-stock';
}

function buildItems() {
  return items.map(item => {
    const stock = stocks[item.code] !== undefined ? stocks[item.code] : null;
    return {
      id: item.code,
      code: item.code,
      name: item.description || item.code,
      stock,
      status: getStockStatus(stock)
    };
  });
}

// ── App login credentials (NOT SkyBiz — this is for the web UI) ──

const APP_USER = process.env.APP_USER || 'airgas';
const APP_PASS = process.env.APP_PASS || 'airgas';

// ── Express setup ──

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === APP_USER && password === APP_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    connected: authenticated,
    itemCount: items.length,
    stocksFetched,
    stockProgress
  });
});

app.post('/api/connect', async (req, res) => {
  try {
    await skybizLogin();
    items = await fetchAllItems();
    res.json({ success: true, itemCount: items.length });

    const codes = items.map(i => i.code);
    batchFetchStocks(codes);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    if (!items.length) {
      await ensureAuth();
      items = await fetchAllItems();
      if (!fetchingStocks && !stocksFetched) {
        batchFetchStocks(items.map(i => i.code));
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = (req.query.search || '').toLowerCase();

    let result = buildItems();

    if (search) {
      result = result.filter(i =>
        i.name.toLowerCase().includes(search) ||
        i.code.toLowerCase().includes(search)
      );
    }

    const total = result.length;
    const start = (page - 1) * limit;
    const paged = result.slice(start, start + limit);

    res.json({ items: paged, total, page, totalPages: Math.ceil(total / limit), stocksFetched, stockProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:code', async (req, res) => {
  const code = req.params.code;
  const item = items.find(i => i.code === code);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const stock = stocks[code] !== undefined ? stocks[code] : await fetchOnHand(code);
  if (stocks[code] === undefined) stocks[code] = stock;

  res.json({
    id: item.code,
    code: item.code,
    name: item.description || item.code,
    stock,
    status: getStockStatus(stock)
  });
});

// ── Item Detail API ──

app.get('/api/items/:code/details', async (req, res) => {
  try {
    const code = req.params.code;
    const item = items.find(i => i.code === code);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const [pricingHtml, locationHtml, imageHtml, memoHtml] = await Promise.all([
      fetchDetailTab('tab_pricing', code),
      fetchDetailTab('tab_location_onhand', code),
      fetchDetailTab('tab_item_picture', code),
      fetchDetailTab('tab_memo', code)
    ]);

    const stock = stocks[code] !== undefined ? stocks[code] : await fetchOnHand(code);

    res.json({
      code: item.code,
      name: item.description || item.code,
      stock,
      status: getStockStatus(stock),
      pricing: parsePricing(pricingHtml),
      locations: parseLocations(locationHtml),
      image: parseImage(imageHtml),
      memo: parseMemo(memoHtml)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:code/outgoing', async (req, res) => {
  try {
    const data = await fetchHistory('outgoing', req.params.code, req.query.start, req.query.length);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/items/:code/incoming', async (req, res) => {
  try {
    const data = await fetchHistory('incoming', req.params.code, req.query.start, req.query.length);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/items/:code/stockcard', async (req, res) => {
  try {
    const data = await fetchStockCard(req.params.code, req.query.start, req.query.length);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Reports API ──

app.get('/api/reports', (req, res) => {
  const all = buildItems();

  // Status counts
  const inStock    = all.filter(i => i.status === 'in-stock').length;
  const lowStock   = all.filter(i => i.status === 'low-stock').length;
  const outOfStock = all.filter(i => i.status === 'out-of-stock').length;
  const loading    = all.filter(i => i.status === 'loading').length;

  // Stock distribution ranges
  const distribution = { zero: 0, low: 0, medium: 0, high: 0, veryHigh: 0 };
  all.forEach(i => {
    if (i.stock === null) return;
    if (i.stock <= 0)       distribution.zero++;
    else if (i.stock <= 10) distribution.low++;
    else if (i.stock <= 50) distribution.medium++;
    else if (i.stock <= 100) distribution.high++;
    else                     distribution.veryHigh++;
  });

  // Items with stock loaded (exclude still-loading)
  const withStock = all.filter(i => i.stock !== null);

  // Top 10 highest stock
  const topStock = [...withStock]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 10)
    .map(i => ({ code: i.code, name: i.name, stock: i.stock, status: i.status }));

  // Bottom 10 (most critical — lowest/negative first)
  const bottomStock = [...withStock]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10)
    .map(i => ({ code: i.code, name: i.name, stock: i.stock, status: i.status }));

  // Low stock alerts (stock > 0 and <= 10)
  const lowStockAlerts = withStock
    .filter(i => i.stock > 0 && i.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .map(i => ({ code: i.code, name: i.name, stock: i.stock, status: i.status }));

  // Out of stock alerts (stock <= 0)
  const outOfStockAlerts = withStock
    .filter(i => i.stock <= 0)
    .sort((a, b) => a.stock - b.stock)
    .map(i => ({ code: i.code, name: i.name, stock: i.stock, status: i.status }));

  res.json({
    totalItems: all.length,
    statusCounts: { inStock, lowStock, outOfStock, loading },
    distribution,
    topStock,
    bottomStock,
    lowStockAlerts,
    outOfStockAlerts,
    stocksFetched,
    stockProgress
  });
});

app.get('/api/reports/locations', async (req, res) => {
  try {
    if (analyticsCache.locations) return res.json({ ready: true, data: analyticsCache.locations });
    if (analyticsCache.fetchingLocations) return res.json({ ready: false, message: 'Fetching location data...' });
    buildLocationAnalytics();
    res.json({ ready: false, message: 'Started fetching location data...' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/sales', async (req, res) => {
  try {
    if (analyticsCache.sales) return res.json({ ready: true, data: analyticsCache.sales });
    if (analyticsCache.fetchingSales) return res.json({ ready: false, message: 'Analyzing sales data...' });
    buildSalesAnalytics();
    res.json({ ready: false, message: 'Started analyzing sales data...' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/valuation', async (req, res) => {
  try {
    if (analyticsCache.valuation) return res.json({ ready: true, data: analyticsCache.valuation });
    if (analyticsCache.fetchingValuation) return res.json({ ready: false, message: 'Calculating inventory value...' });
    buildValuationAnalytics();
    res.json({ ready: false, message: 'Started calculating inventory value...' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/items/:code/stock', async (req, res) => {
  const qty = await fetchOnHand(req.params.code);
  stocks[req.params.code] = qty;
  res.json({ code: req.params.code, stock: qty });
});


app.listen(PORT, () => {
  console.log(`\n  InventoriSystem Server`);
  console.log(`  http://localhost:${PORT}\n`);

  skybizLogin()
    .then(() => fetchAllItems())
    .then(parsed => {
      items = parsed;
      console.log(`Loaded ${items.length} items with descriptions`);
      batchFetchStocks(items.map(i => i.code));
    })
    .catch(err => console.error('Startup error:', err.message));
});
