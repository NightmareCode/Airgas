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
          <button class="action-btn" onclick="dummyAction('Edit')" title="Edit (Demo)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" onclick="dummyAction('Delete')" title="Delete (Demo)">
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
// DUMMY ACTIONS (buttons look real but do nothing)
// These never modify SkyBiz data.
// ==========================================

function dummyAction(action) {
  alert(action + ' is disabled in read-only mode.\nSkyBiz data is protected and cannot be modified from this system.');
}

function openAddProductModal() {
  dummyAction('Add Product');
}

function editProduct(code) {
  dummyAction('Edit');
}

function deleteProduct(code) {
  dummyAction('Delete');
}

function saveProduct(event) {
  if (event) event.preventDefault();
  dummyAction('Save');
}

function resetOverlay() {
  // No overlay to reset — system is read-only
  alert('System is in read-only mode. No local changes to reset.');
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

function switchReportTab(tabName) {
  document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

  document.querySelectorAll('.report-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById('tab-' + tabName);
  if (target) target.style.display = '';
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
}

document.addEventListener('DOMContentLoaded', initApp);
