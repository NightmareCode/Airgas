/* ==========================================
   INVENTORI SYSTEM - SHARED JAVASCRIPT
   Connected to SkyBiz Cloud ERP (Read-Only)
   ========================================== */

// ==========================================
// CONFIGURATION
// ==========================================

// Auto-detect: use current host when deployed, localhost for dev
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : window.location.origin + '/api';

// ==========================================
// DATA & STATE
// ==========================================

let products = [];
let currentPage = 1;
const PAGE_SIZE = 50;
let totalItems = 0;
let totalPages = 0;
let searchDebounce = null;
let isLoading = false;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function isLoggedIn() {
  return sessionStorage.getItem('isLoggedIn') === 'true';
}

function getCurrentTheme() {
  return localStorage.getItem('theme') || 'light';
}

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggle();
}

function updateThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.checked = getCurrentTheme() === 'dark';
}

function getStockStatus(quantity) {
  if (quantity === null || quantity === undefined) return 'loading';
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= 10) return 'low-stock';
  return 'in-stock';
}

function getStatusBadge(status) {
  const cfg = {
    'in-stock':     { class: 'badge-success', text: 'In Stock' },
    'low-stock':    { class: 'badge-warning', text: 'Low Stock' },
    'out-of-stock': { class: 'badge-danger',  text: 'Out of Stock' },
    'loading':      { class: 'badge-secondary', text: '...' }
  };
  const c = cfg[status] || cfg['loading'];
  return `<span class="badge ${c.class}">${c.text}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================
// API
// ==========================================

async function apiGet(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}

// Send a write (POST / PUT / DELETE). Returns { ok, status, data }.
async function apiSend(method, endpoint, body) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API send error:', err);
    return { ok: false, status: 0, data: { error: 'Could not connect to server.' } };
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'success');
  toast.textContent = message;
  container.appendChild(toast);
  // Force reflow then animate in
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// LOAD PRODUCTS (one-time, no auto-refresh)
// ==========================================

async function loadProducts(page, search) {
  if (isLoading) return;
  isLoading = true;

  page = page || currentPage;
  search = search !== undefined ? search : (document.getElementById('searchInput')?.value || '');

  const statusEl = document.getElementById('connectionStatus');
  if (statusEl) statusEl.textContent = 'Loading from SkyBiz...';

  const data = await apiGet(`/items?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`);
  isLoading = false;

  if (!data) {
    if (statusEl) statusEl.textContent = 'Could not connect to server. Make sure server.js is running (npm start).';
    return;
  }

  products = data.items || [];
  currentPage = data.page;
  totalItems = data.total;
  totalPages = data.totalPages;

  const pageName = window.location.pathname.split('/').pop();

  if (pageName === 'products.html') {
    renderProducts();
    renderPagination();
  }

  if (pageName === 'dashboard.html') {
    renderRecentProducts();
  }

  // Status bar — display once, never auto-refresh
  if (statusEl) {
    if (data.stocksFetched) {
      statusEl.textContent = `Connected to SkyBiz  |  ${totalItems} items loaded`;
    } else {
      const pct = data.stockProgress
        ? Math.round((data.stockProgress.done / data.stockProgress.total) * 100)
        : 0;
      statusEl.textContent = `Connected to SkyBiz  |  ${totalItems} items  |  Stock quantities: ${pct}% loaded`;
    }
  }
}

// ==========================================
// LOGIN
// ==========================================

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password';
    errorEl.classList.add('show');
    return;
  }

  try {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('username', username);
      window.location.href = 'dashboard.html';
    } else {
      errorEl.textContent = 'Invalid username or password';
      errorEl.classList.add('show');
    }
  } catch (err) {
    errorEl.textContent = 'Could not connect to server';
    errorEl.classList.add('show');
  }
}

function handleLogout() {
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('username');
  window.location.href = 'login.html';
}

// ==========================================
// SIDEBAR
// ==========================================

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('show');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay').classList.remove('show');
}

// ==========================================
// THEME
// ==========================================

function toggleTheme() {
  setTheme(getCurrentTheme() === 'light' ? 'dark' : 'light');
}

// ==========================================
// DASHBOARD
// ==========================================

async function updateDashboardStats() {
  const data = await apiGet('/items?page=1&limit=99999');
  if (!data) return;

  const items = data.items || [];
  const total    = items.length;
  const lowStock = items.filter(p => p.status === 'low-stock').length;
  const outStock = items.filter(p => p.status === 'out-of-stock').length;
  const inStock  = items.filter(p => p.status === 'in-stock').length;

  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('totalProducts', total.toLocaleString());
  set('lowStock',      lowStock.toLocaleString());
  set('outOfStock',    outStock.toLocaleString());
  set('inStock',       inStock.toLocaleString());
}

function renderRecentProducts() {
  const tbody = document.getElementById('recentProductsTable');
  if (!tbody) return;

  tbody.innerHTML = '';
  const recent = products.slice(0, 5);

  if (!recent.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Loading products...</td></tr>';
    return;
  }

  recent.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.code)}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.stock !== null ? p.stock : '...'}</td>
      <td>${getStatusBadge(p.status)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// PRODUCTS TABLE (read-only display)
// ==========================================

function renderProducts() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">No products found</td></tr>';
    return;
  }

  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(p.code)}</strong></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.stock !== null ? p.stock : '...'}</td>
      <td>${getStatusBadge(p.status)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn" onclick="viewProduct('${escapeHtml(p.code)}')" title="View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="action-btn" onclick="openSellModal('${escapeHtml(p.code)}')" title="Sell / Reduce Stock">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
          <button class="action-btn" onclick="editProduct('${escapeHtml(p.code)}')" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" onclick="confirmDeleteProduct('${escapeHtml(p.code)}')" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// PAGINATION
// ==========================================

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Prev</button>`;

  const maxVis = 5;
  let sp = Math.max(1, currentPage - Math.floor(maxVis / 2));
  let ep = Math.min(totalPages, sp + maxVis - 1);
  if (ep - sp < maxVis - 1) sp = Math.max(1, ep - maxVis + 1);

  if (sp > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (sp > 2) html += `<span class="page-dots">...</span>`;
  }
  for (let i = sp; i <= ep; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (ep < totalPages) {
    if (ep < totalPages - 1) html += `<span class="page-dots">...</span>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next</button>`;
  html += `<span class="page-info">${totalItems} items</span>`;

  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadProducts(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// PRODUCT WRITE ACTIONS (Add / Edit / Delete / Sell)
// In demo mode these update the server's in-memory cache only and never
// touch the real SkyBiz database. See server.js WRITE config to go live.
// ==========================================

let productFormMode = 'add';   // 'add' | 'edit'
let editingCode = null;
let pendingDeleteCode = null;
let sellingCode = null;
let writeBusy = false;

function findProduct(code) {
  return products.find(p => p.code === code) || null;
}

function setFeedback(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'form-feedback' + (msg ? ' ' + (type || 'error') : '');
}

function openModal(id)  { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

// Reload the products table after a successful write so the change shows.
function refreshAfterWrite() {
  const page = window.location.pathname.split('/').pop();
  if (page === 'products.html') {
    loadProducts(currentPage);
  } else if (page === 'dashboard.html') {
    updateDashboardStats();
    loadProducts(1, '');
  }
}

// ── Add / Edit ──

function openAddProductModal() {
  productFormMode = 'add';
  editingCode = null;
  document.getElementById('productFormTitle').textContent = 'Add Product';
  document.getElementById('pfSubmit').textContent = 'Save Product';
  document.getElementById('pfCode').value = '';
  document.getElementById('pfCode').removeAttribute('disabled');
  document.getElementById('pfDesc').value = '';
  document.getElementById('pfStock').value = '0';
  document.getElementById('pfPrice').value = '';
  setFeedback('pfFeedback', '');
  openModal('productFormOverlay');
  document.getElementById('pfCode').focus();
}

function editProduct(code) {
  const p = findProduct(code);
  if (!p) { showToast('Item not found on this page.', 'error'); return; }
  productFormMode = 'edit';
  editingCode = code;
  document.getElementById('productFormTitle').textContent = 'Edit Product';
  document.getElementById('pfSubmit').textContent = 'Save Changes';
  const codeInput = document.getElementById('pfCode');
  codeInput.value = code;
  codeInput.setAttribute('disabled', 'disabled');   // code is the identifier — not editable
  document.getElementById('pfDesc').value = p.name || '';
  document.getElementById('pfStock').value = (p.stock !== null && p.stock !== undefined) ? p.stock : '';
  document.getElementById('pfPrice').value = '';
  setFeedback('pfFeedback', '');
  openModal('productFormOverlay');
  document.getElementById('pfDesc').focus();
}

function closeProductForm() { closeModal('productFormOverlay'); }

async function submitProductForm(event) {
  if (event) event.preventDefault();
  if (writeBusy) return;

  const code = document.getElementById('pfCode').value.trim();
  const description = document.getElementById('pfDesc').value.trim();
  const stockRaw = document.getElementById('pfStock').value.trim();
  const priceRaw = document.getElementById('pfPrice').value.trim();

  if (productFormMode === 'add' && !code) { setFeedback('pfFeedback', 'Item code is required.'); return; }
  if (!description) { setFeedback('pfFeedback', 'Description is required.'); return; }
  if (stockRaw !== '' && isNaN(parseFloat(stockRaw))) { setFeedback('pfFeedback', 'Stock must be a number.'); return; }
  if (priceRaw !== '' && isNaN(parseFloat(priceRaw))) { setFeedback('pfFeedback', 'Price must be a number.'); return; }

  const body = { description, stock: stockRaw, price: priceRaw };
  const btn = document.getElementById('pfSubmit');
  writeBusy = true; btn.disabled = true; setFeedback('pfFeedback', 'Saving...', 'info');

  let result;
  if (productFormMode === 'add') {
    body.code = code;
    result = await apiSend('POST', '/items', body);
  } else {
    result = await apiSend('PUT', '/items/' + encodeURIComponent(editingCode), body);
  }

  writeBusy = false; btn.disabled = false;

  if (result.ok && result.data.success) {
    closeProductForm();
    showToast(result.data.message || 'Saved.', result.data.simulated ? 'info' : 'success');
    if (productFormMode === 'add') {
      const si = document.getElementById('searchInput');
      if (si) si.value = code;
      currentPage = 1;
      loadProducts(1, code);
    } else {
      refreshAfterWrite();
    }
  } else {
    setFeedback('pfFeedback', result.data.error || 'Could not save. Please try again.');
  }
}

// ── Sell / Reduce Stock ──

function openSellModal(code) {
  const p = findProduct(code);
  if (!p) { showToast('Item not found on this page.', 'error'); return; }
  sellingCode = code;
  document.getElementById('sellItemName').textContent = (p.name || code) + ' (' + code + ')';
  document.getElementById('sellCurrentStock').textContent = (p.stock !== null && p.stock !== undefined) ? p.stock : '...';
  document.getElementById('sellQty').value = '';
  document.getElementById('sellCustomer').value = '';
  document.getElementById('sellPrice').value = '';
  setFeedback('sellFeedback', '');
  openModal('sellOverlay');
  document.getElementById('sellQty').focus();
}

function closeSellModal() { closeModal('sellOverlay'); }

async function submitSell(event) {
  if (event) event.preventDefault();
  if (writeBusy) return;

  const qtyRaw = document.getElementById('sellQty').value.trim();
  const customer = document.getElementById('sellCustomer').value.trim();
  const priceRaw = document.getElementById('sellPrice').value.trim();
  const qty = parseFloat(qtyRaw);

  if (qtyRaw === '' || isNaN(qty) || qty <= 0) { setFeedback('sellFeedback', 'Enter a quantity greater than 0.'); return; }
  if (priceRaw !== '' && isNaN(parseFloat(priceRaw))) { setFeedback('sellFeedback', 'Unit price must be a number.'); return; }

  const btn = document.getElementById('sellSubmit');
  writeBusy = true; btn.disabled = true; setFeedback('sellFeedback', 'Recording sale...', 'info');

  const result = await apiSend('POST', '/items/' + encodeURIComponent(sellingCode) + '/sell', {
    qty: qtyRaw, customer, unitPrice: priceRaw
  });

  writeBusy = false; btn.disabled = false;

  if (result.ok && result.data.success) {
    closeSellModal();
    showToast(result.data.message || 'Sale recorded.', result.data.simulated ? 'info' : 'success');
    refreshAfterWrite();
  } else {
    setFeedback('sellFeedback', result.data.error || 'Could not record sale. Please try again.');
  }
}

// ── Delete ──

function confirmDeleteProduct(code) {
  const p = findProduct(code);
  pendingDeleteCode = code;
  document.getElementById('deleteItemName').textContent = p ? `${p.name || code} (${code})` : code;
  setFeedback('deleteFeedback', '');
  openModal('deleteOverlay');
}

function closeDeleteModal() { closeModal('deleteOverlay'); }

async function doDeleteProduct() {
  if (writeBusy || !pendingDeleteCode) return;
  const btn = document.getElementById('deleteSubmit');
  writeBusy = true; btn.disabled = true; setFeedback('deleteFeedback', 'Deleting...', 'info');

  const result = await apiSend('DELETE', '/items/' + encodeURIComponent(pendingDeleteCode));

  writeBusy = false; btn.disabled = false;

  if (result.ok && result.data.success) {
    closeDeleteModal();
    showToast(result.data.message || 'Deleted.', result.data.simulated ? 'info' : 'success');
    pendingDeleteCode = null;
    refreshAfterWrite();
  } else {
    setFeedback('deleteFeedback', result.data.error || 'Could not delete. Please try again.');
  }
}

// ── Write-mode banner (Demo vs Live) ──

async function showWriteModeBanner() {
  const banner = document.getElementById('writeModeBanner');
  if (!banner) return;
  const status = await apiGet('/status');
  if (!status) return;
  if (status.writeLive) {
    banner.className = 'write-mode-banner live';
    banner.innerHTML = '<strong>Live mode:</strong> Add, Edit, Delete and Sell write directly to the SkyBiz database.';
  } else {
    banner.className = 'write-mode-banner demo';
    banner.innerHTML = '<strong>Demo mode:</strong> All buttons work, but changes are kept locally only and are <strong>not</strong> saved to the real SkyBiz database. Refreshing reloads the real data.';
  }
  banner.style.display = '';
}

/** Open rich product detail modal */
let currentDetailCode = null;

function viewProduct(code) {
  currentDetailCode = code;
  const overlay = document.getElementById('detailOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';

  // Reset tabs
  switchDetailTab('overview');

  // Set title immediately from products list
  const p = products.find(i => i.code === code);
  document.getElementById('detailTitle').textContent = p ? p.name : code;

  // Fetch full details from server
  loadDetailOverview(code);
}

function closeDetailModal() {
  const overlay = document.getElementById('detailOverlay');
  if (overlay) overlay.classList.remove('show');
  document.body.style.overflow = '';
  currentDetailCode = null;
}

function closeDetail(event) {
  if (event.target === event.currentTarget) closeDetailModal();
}

function switchDetailTab(tab) {
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.detail-tab[onclick="switchDetailTab('${tab}')"]`)?.classList.add('active');
  document.querySelectorAll('.detail-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById('dtab-' + tab);
  if (target) target.style.display = '';

  // Lazy-load tab data
  if (tab === 'sales' && currentDetailCode) loadDetailSales(currentDetailCode);
  if (tab === 'purchases') loadDetailPurchases(currentDetailCode);
  if (tab === 'stockcard') loadDetailStockCard(currentDetailCode);
}

async function loadDetailOverview(code) {
  // Reset content
  document.getElementById('detailCode').textContent = code;
  document.getElementById('detailDesc').textContent = 'Loading...';
  document.getElementById('detailStock').textContent = '...';
  document.getElementById('detailStatus').innerHTML = getStatusBadge('loading');
  document.getElementById('detailPricingTable').innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
  document.getElementById('detailLocationsTable').innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';
  document.getElementById('detailImageBox').innerHTML = '<div class="no-image">Loading...</div>';
  document.getElementById('detailMemoRow').style.display = 'none';

  const data = await apiGet(`/items/${encodeURIComponent(code)}/details`);
  if (!data) return;

  document.getElementById('detailTitle').textContent = data.name;
  document.getElementById('detailDesc').textContent = data.name;
  document.getElementById('detailStock').textContent = data.stock !== null ? data.stock.toLocaleString() : 'N/A';
  document.getElementById('detailStatus').innerHTML = getStatusBadge(data.status);

  // Image
  if (data.image) {
    document.getElementById('detailImageBox').innerHTML = `<img src="${data.image}" alt="Product Image" class="detail-product-img">`;
  } else {
    document.getElementById('detailImageBox').innerHTML = '<div class="no-image">No Image Available</div>';
  }

  // Memo
  if (data.memo) {
    document.getElementById('detailMemoRow').style.display = '';
    document.getElementById('detailMemo').textContent = data.memo;
  }

  // Pricing
  const pTbody = document.getElementById('detailPricingTable');
  if (data.pricing && data.pricing.length) {
    pTbody.innerHTML = '';
    data.pricing.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(p.uom)}</td><td>${escapeHtml(p.description)}</td><td>${p.factor}</td><td style="font-weight:600;">${p.price.toFixed(2)}</td>`;
      pTbody.appendChild(tr);
    });
  } else {
    pTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;">No pricing data</td></tr>';
  }

  // Locations
  const lTbody = document.getElementById('detailLocationsTable');
  if (data.locations && data.locations.length) {
    lTbody.innerHTML = '';
    data.locations.forEach(l => {
      const tr = document.createElement('tr');
      const color = l.qty > 0 ? '#22c55e' : l.qty < 0 ? '#ef4444' : 'var(--text-secondary)';
      tr.innerHTML = `<td>${escapeHtml(l.location)}</td><td style="font-weight:600;color:${color};">${l.qty.toLocaleString()}</td><td>${escapeHtml(l.uom)}</td>`;
      lTbody.appendChild(tr);
    });
  } else {
    lTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:16px;">No location data</td></tr>';
  }
}

function renderHistoryTable(tbodyId, infoId, rows, total, columns) {
  const tbody = document.getElementById(tbodyId);
  const info = document.getElementById(infoId);
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center;padding:20px;">No records found</td></tr>`;
    if (info) info.textContent = '';
    return;
  }

  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = columns.map(col => `<td>${escapeHtml(String(r[col] || '-'))}</td>`).join('');
    tbody.appendChild(tr);
  });
  if (info) info.textContent = `Showing ${rows.length} of ${total} records`;
}

async function loadDetailSales(code) {
  const tbody = document.getElementById('detailSalesTable');
  if (tbody.dataset.loaded === code) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';

  const data = await apiGet(`/items/${encodeURIComponent(code)}/outgoing?start=0&length=50`);
  if (!data) return;
  renderHistoryTable('detailSalesTable', 'salesInfo', data.rows, data.total,
    ['date', 'document', 'customerName', 'qty', 'unitPrice', 'amount']);
  tbody.dataset.loaded = code;
}

async function loadDetailPurchases(code) {
  const tbody = document.getElementById('detailPurchasesTable');
  if (tbody.dataset.loaded === code) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';

  const data = await apiGet(`/items/${encodeURIComponent(code)}/incoming?start=0&length=50`);
  if (!data) return;
  renderHistoryTable('detailPurchasesTable', 'purchasesInfo', data.rows, data.total,
    ['date', 'document', 'supplierName', 'qty', 'unitPrice', 'amount']);
  tbody.dataset.loaded = code;
}

async function loadDetailStockCard(code) {
  const tbody = document.getElementById('detailStockCardTable');
  if (tbody.dataset.loaded === code) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';

  const data = await apiGet(`/items/${encodeURIComponent(code)}/stockcard?start=0&length=50`);
  if (!data) return;
  renderHistoryTable('detailStockCardTable', 'stockcardInfo', data.rows, data.total,
    ['date', 'type', 'invoiceNumber', 'qty', 'balance', 'name', 'locationFrom']);
  tbody.dataset.loaded = code;
}

// ==========================================
// SEARCH (debounced, no page refresh)
// ==========================================

function handleSearch() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    currentPage = 1;
    loadProducts(1);
  }, 400);
}

// ==========================================
// REPORTS
// ==========================================

let reportData = null;
let pieChart = null;
let barChart = null;

// Analytics chart instances
let locationChart = null;
let customerChart = null;
let productChart = null;
let monthlyChart = null;
let valuationBarChart = null;
let valuePie = null;

// Track which analytics tabs have been loaded
let analyticsLoaded = { locations: false, sales: false, valuation: false };

function switchReportTab(tabName) {
  document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

  document.querySelectorAll('.report-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById('tab-' + tabName);
  if (target) target.style.display = '';

  // Trigger analytics loading on first visit
  if (tabName === 'locations' && !analyticsLoaded.locations) loadLocationAnalytics();
  if (tabName === 'sales' && !analyticsLoaded.sales) loadSalesAnalytics();
  if (tabName === 'valuation' && !analyticsLoaded.valuation) loadValuationAnalytics();
}

async function loadReports() {
  const statusEl = document.getElementById('connectionStatus');
  if (statusEl) statusEl.textContent = 'Loading report data from SkyBiz...';

  const data = await apiGet('/reports');
  if (!data) {
    if (statusEl) statusEl.textContent = 'Could not load report data. Make sure server is running.';
    return;
  }

  reportData = data;
  renderReportCards(data);
  renderStatusPieChart(data.statusCounts);
  renderDistributionBarChart(data.distribution);
  renderAlertsTables(data);
  renderTopBottomTables(data);

  if (statusEl) {
    if (data.stocksFetched) {
      statusEl.textContent = `Connected to SkyBiz  |  ${data.totalItems} items loaded`;
    } else {
      const pct = data.stockProgress
        ? Math.round((data.stockProgress.done / data.stockProgress.total) * 100)
        : 0;
      statusEl.textContent = `Connected to SkyBiz  |  ${data.totalItems} items  |  Stock: ${pct}% loaded`;
    }
  }
}

function renderReportCards(data) {
  const s = data.statusCounts;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v.toLocaleString(); };
  set('rInStock', s.inStock);
  set('rLowStock', s.lowStock);
  set('rOutOfStock', s.outOfStock);
  set('rTotal', data.totalItems);
}

function renderStatusPieChart(counts) {
  const ctx = document.getElementById('statusPieChart');
  if (!ctx) return;

  if (pieChart) pieChart.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [{
        data: [counts.inStock, counts.lowStock, counts.outOfStock],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: isDark ? '#1e1e2e' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, padding: 16 } }
      }
    }
  });
}

function renderDistributionBarChart(dist) {
  const ctx = document.getElementById('distributionBarChart');
  if (!ctx) return;

  if (barChart) barChart.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? '#333' : '#e5e7eb';

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['0 or less', '1 - 10', '11 - 50', '51 - 100', '100+'],
      datasets: [{
        label: 'Number of Items',
        data: [dist.zero, dist.low, dist.medium, dist.high, dist.veryHigh],
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#06b6d4'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: textColor, precision: 0 },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        }
      }
    }
  });
}

function renderAlertsTables(data) {
  // Out of stock table
  const outTbody = document.getElementById('outOfStockTable');
  const outCount = document.getElementById('outCount');
  if (outTbody) {
    outTbody.innerHTML = '';
    if (outCount) outCount.textContent = data.outOfStockAlerts.length;
    if (!data.outOfStockAlerts.length) {
      outTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No out of stock items</td></tr>';
    } else {
      data.outOfStockAlerts.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(i.code)}</strong></td>
          <td>${escapeHtml(i.name)}</td>
          <td>${i.stock}</td>
          <td>${getStatusBadge(i.status)}</td>`;
        outTbody.appendChild(tr);
      });
    }
  }

  // Low stock table
  const lowTbody = document.getElementById('lowStockTable');
  const lowCount = document.getElementById('lowCount');
  if (lowTbody) {
    lowTbody.innerHTML = '';
    if (lowCount) lowCount.textContent = data.lowStockAlerts.length;
    if (!data.lowStockAlerts.length) {
      lowTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No low stock items</td></tr>';
    } else {
      data.lowStockAlerts.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(i.code)}</strong></td>
          <td>${escapeHtml(i.name)}</td>
          <td>${i.stock}</td>
          <td>${getStatusBadge(i.status)}</td>`;
        lowTbody.appendChild(tr);
      });
    }
  }
}

function renderTopBottomTables(data) {
  const topTbody = document.getElementById('topStockTable');
  if (topTbody) {
    topTbody.innerHTML = '';
    data.topStock.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(i.code)}</strong></td>
        <td>${escapeHtml(i.name)}</td>
        <td style="font-weight:600;color:#22c55e;">${i.stock.toLocaleString()}</td>`;
      topTbody.appendChild(tr);
    });
  }

  const bottomTbody = document.getElementById('bottomStockTable');
  if (bottomTbody) {
    bottomTbody.innerHTML = '';
    data.bottomStock.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(i.code)}</strong></td>
        <td>${escapeHtml(i.name)}</td>
        <td style="font-weight:600;color:#ef4444;">${i.stock.toLocaleString()}</td>`;
      bottomTbody.appendChild(tr);
    });
  }
}

function exportCSV() {
  if (!reportData) { alert('Report data not loaded yet.'); return; }

  // Fetch all items for full export
  apiGet('/items?page=1&limit=99999').then(data => {
    if (!data || !data.items) { alert('Could not load items for export.'); return; }

    const rows = [['Item Code', 'Description', 'Stock', 'Status']];
    data.items.forEach(i => {
      rows.push([
        i.code,
        '"' + (i.name || '').replace(/"/g, '""') + '"',
        i.stock !== null ? i.stock : '',
        i.status === 'in-stock' ? 'In Stock' :
        i.status === 'low-stock' ? 'Low Stock' :
        i.status === 'out-of-stock' ? 'Out of Stock' : 'Loading'
      ]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_report_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ==========================================
// ANALYTICS — LOCATION ANALYSIS
// ==========================================

async function loadLocationAnalytics() {
  const loading = document.getElementById('locationsLoading');
  const content = document.getElementById('locationsContent');

  const data = await apiGet('/reports/locations');
  if (!data) {
    if (loading) loading.innerHTML = '<p style="color:var(--danger);">Could not load location data.</p>';
    return;
  }

  if (!data.ready) {
    // Poll every 3 seconds until ready
    setTimeout(loadLocationAnalytics, 3000);
    return;
  }

  analyticsLoaded.locations = true;
  if (loading) loading.style.display = 'none';
  if (content) content.style.display = '';

  const locations = data.data;

  // Summary cards
  const locCount = document.getElementById('rLocCount');
  const locTotal = document.getElementById('rLocTotalStock');
  if (locCount) locCount.textContent = locations.length.toLocaleString();
  const totalStock = locations.reduce((s, l) => s + l.stock, 0);
  if (locTotal) locTotal.textContent = Math.round(totalStock).toLocaleString();

  // Bar chart
  renderLocationBarChart(locations);

  // Table
  const tbody = document.getElementById('locationTable');
  if (tbody) {
    tbody.innerHTML = '';
    locations.forEach(loc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(loc.name)}</strong></td>
        <td style="font-weight:600;">${loc.stock.toLocaleString()}</td>
        <td>${loc.items.toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  }
}

function renderLocationBarChart(locations) {
  const ctx = document.getElementById('locationBarChart');
  if (!ctx) return;
  if (locationChart) locationChart.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? '#333' : '#e5e7eb';

  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444',
                  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7'];

  locationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: locations.map(l => l.name.length > 20 ? l.name.slice(0, 18) + '...' : l.name),
      datasets: [{
        label: 'Total Stock',
        data: locations.map(l => l.stock),
        backgroundColor: locations.map((_, i) => colors[i % colors.length]),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: locations.length > 6 ? 'y' : 'x',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Stock: ${ctx.raw.toLocaleString()}`
          }
        }
      },
      scales: {
        y: { ticks: { color: textColor }, grid: { color: gridColor } },
        x: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });
}

// ==========================================
// ANALYTICS — SALES INSIGHTS
// ==========================================

async function loadSalesAnalytics() {
  const loading = document.getElementById('salesLoading');
  const content = document.getElementById('salesContent');

  const data = await apiGet('/reports/sales');
  if (!data) {
    if (loading) loading.innerHTML = '<p style="color:var(--danger);">Could not load sales data.</p>';
    return;
  }

  if (!data.ready) {
    setTimeout(loadSalesAnalytics, 3000);
    return;
  }

  analyticsLoaded.sales = true;
  if (loading) loading.style.display = 'none';
  if (content) content.style.display = '';

  const sales = data.data;

  // Summary cards
  const setVal = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setVal('rTotalRevenue', 'RM ' + sales.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
  setVal('rTotalTransactions', sales.totalTransactions.toLocaleString());
  setVal('rItemsAnalyzed', sales.itemsAnalyzed.toLocaleString());

  // Charts
  renderCustomerRevenueChart(sales.topCustomers);
  renderProductSalesChart(sales.topProducts);
  renderMonthlyRevenueChart(sales.monthlyRevenue);
}

function renderCustomerRevenueChart(customers) {
  const ctx = document.getElementById('customerRevenueChart');
  if (!ctx) return;
  if (customerChart) customerChart.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? '#333' : '#e5e7eb';

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
                  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  customerChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: customers.map(c => c.name.length > 25 ? c.name.slice(0, 22) + '...' : c.name),
      datasets: [{
        label: 'Revenue (RM)',
        data: customers.map(c => c.revenue),
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `RM ${ctx.raw.toLocaleString(undefined, {minimumFractionDigits: 2})} (${customers[ctx.dataIndex].orders} orders)`
          }
        }
      },
      scales: {
        x: { ticks: { color: textColor, callback: v => 'RM ' + v.toLocaleString() }, grid: { color: gridColor }, beginAtZero: true },
        y: { ticks: { color: textColor }, grid: { display: false } }
      }
    }
  });
}

function renderProductSalesChart(products) {
  const ctx = document.getElementById('productSalesChart');
  if (!ctx) return;
  if (productChart) productChart.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? '#333' : '#e5e7eb';

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
                  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  productChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: products.map(p => p.name.length > 25 ? p.name.slice(0, 22) + '...' : p.name),
      datasets: [{
        label: 'Revenue (RM)',
        data: products.map(p => p.revenue),
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `RM ${ctx.raw.toLocaleString(undefined, {minimumFractionDigits: 2})} (${products[ctx.dataIndex].qty} units)`
          }
        }
      },
      scales: {
        x: { ticks: { color: textColor, callback: v => 'RM ' + v.toLocaleString() }, grid: { color: gridColor }, beginAtZero: true },
        y: { ticks: { color: textColor }, grid: { display: false } }
      }
    }
  });
}

function renderMonthlyRevenueChart(monthly) {
  const ctx = document.getElementById('monthlyRevenueChart');
  if (!ctx) return;
  if (monthlyChart) monthlyChart.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? '#333' : '#e5e7eb';

  // Format month labels: "2024-01" → "Jan 2024"
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const labels = monthly.map(m => {
    const [y, mo] = m.month.split('-');
    return `${monthNames[parseInt(mo)-1] || mo} ${y}`;
  });

  monthlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue (RM)',
        data: monthly.map(m => m.revenue),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `RM ${ctx.raw.toLocaleString(undefined, {minimumFractionDigits: 2})}`
          }
        }
      },
      scales: {
        y: { ticks: { color: textColor, callback: v => 'RM ' + v.toLocaleString() }, grid: { color: gridColor }, beginAtZero: true },
        x: { ticks: { color: textColor, maxRotation: 45 }, grid: { display: false } }
      }
    }
  });
}

// ==========================================
// ANALYTICS — INVENTORY VALUATION
// ==========================================

async function loadValuationAnalytics() {
  const loading = document.getElementById('valuationLoading');
  const content = document.getElementById('valuationContent');

  const data = await apiGet('/reports/valuation');
  if (!data) {
    if (loading) loading.innerHTML = '<p style="color:var(--danger);">Could not load valuation data.</p>';
    return;
  }

  if (!data.ready) {
    setTimeout(loadValuationAnalytics, 3000);
    return;
  }

  analyticsLoaded.valuation = true;
  if (loading) loading.style.display = 'none';
  if (content) content.style.display = '';

  const val = data.data;

  // Summary cards
  const setVal = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setVal('rTotalValue', 'RM ' + val.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
  setVal('rPricedItems', val.itemsWithPricing.toLocaleString());

  // Charts
  renderValuationBarChart(val.topByValue);
  renderValuePieChart(val.topByValue, val.totalValue);

  // Table
  const tbody = document.getElementById('valuationTable');
  if (tbody) {
    tbody.innerHTML = '';
    (val.all || val.topByValue).slice(0, 50).forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(item.code)}</strong></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.stock.toLocaleString()}</td>
        <td>${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        <td style="font-weight:600;color:#f59e0b;">RM ${item.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>`;
      tbody.appendChild(tr);
    });
  }
}

function renderValuationBarChart(topItems) {
  const ctx = document.getElementById('valuationChart');
  if (!ctx) return;
  if (valuationBarChart) valuationBarChart.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? '#333' : '#e5e7eb';

  const colors = ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
                  '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e'];

  valuationBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topItems.map(i => i.name.length > 20 ? i.name.slice(0, 18) + '...' : i.name),
      datasets: [{
        label: 'Value (RM)',
        data: topItems.map(i => i.value),
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `RM ${ctx.raw.toLocaleString(undefined, {minimumFractionDigits: 2})} (${topItems[ctx.dataIndex].stock} units @ RM ${topItems[ctx.dataIndex].price})`
          }
        }
      },
      scales: {
        x: { ticks: { color: textColor, callback: v => 'RM ' + v.toLocaleString() }, grid: { color: gridColor }, beginAtZero: true },
        y: { ticks: { color: textColor }, grid: { display: false } }
      }
    }
  });
}

function renderValuePieChart(topItems, totalValue) {
  const ctx = document.getElementById('valuePieChart');
  if (!ctx) return;
  if (valuePie) valuePie.destroy();

  const isDark = getCurrentTheme() === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';

  const top5 = topItems.slice(0, 5);
  const top5Value = top5.reduce((s, i) => s + i.value, 0);
  const otherValue = totalValue - top5Value;

  const labels = top5.map(i => i.name.length > 20 ? i.name.slice(0, 18) + '...' : i.name);
  const values = top5.map(i => i.value);
  if (otherValue > 0) {
    labels.push('Others');
    values.push(Math.round(otherValue * 100) / 100);
  }

  const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#94a3b8'];

  valuePie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: isDark ? '#1e1e2e' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, padding: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = ((ctx.raw / totalValue) * 100).toFixed(1);
              return `RM ${ctx.raw.toLocaleString(undefined, {minimumFractionDigits: 2})} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ==========================================
// SETTINGS
// ==========================================

function saveProfile(event) {
  event.preventDefault();
  alert('Profile saved successfully!');
}

function saveCompanyInfo(event) {
  event.preventDefault();
  alert('Company info saved successfully!');
}

function toggleNotification(setting) {
  console.log(`Notification ${setting} toggled`);
}

// ==========================================
// NAVIGATION GUARD
// ==========================================

function checkAuth() {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'login.html' && !isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  if (page === 'login.html' && isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
}

// ==========================================
// INITIALIZATION
// ==========================================

function initApp() {
  setTheme(getCurrentTheme());

  const page = window.location.pathname.split('/').pop();
  if (page !== 'login.html') {
    if (!checkAuth()) return;
    setActiveNav();
  }

  switch (page) {
    case 'dashboard.html':
      updateDashboardStats();
      loadProducts(1, '');
      break;

    case 'products.html':
      loadProducts(1, '');
      showWriteModeBanner();
      break;

    case 'reports.html':
      loadReports();
      break;

    case 'settings.html':
      const username = sessionStorage.getItem('username');
      if (username) {
        const nameInput = document.getElementById('userName');
        const emailInput = document.getElementById('userEmail');
        if (nameInput) nameInput.value = username;
        if (emailInput) emailInput.value = username.toLowerCase().replace(' ', '.') + '@company.com';
      }
      break;
  }

  setupEventListeners();
}

function setupEventListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const hamburger = document.querySelector('.hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleSidebar);

  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => { if (window.innerWidth <= 768) closeSidebar(); });
  });

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('change', toggleTheme);

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', handleSearch);

  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', () => switchReportTab(tab.dataset.tab));
  });

  const profileForm = document.getElementById('profileForm');
  if (profileForm) profileForm.addEventListener('submit', saveProfile);

  const companyForm = document.getElementById('companyForm');
  if (companyForm) companyForm.addEventListener('submit', saveCompanyInfo);

  // Close any write modal when clicking the dark backdrop (not the modal itself)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('mousedown', e => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  });

  // Close open write modals on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(o => o.classList.remove('show'));
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
