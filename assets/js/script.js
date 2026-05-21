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

/** View item details in a simple alert */
function viewProduct(code) {
  const p = products.find(i => i.code === code);
  if (!p) return;
  alert(
    'Item Code: ' + p.code +
    '\nDescription: ' + p.name +
    '\nStock: ' + (p.stock !== null ? p.stock : 'Loading...') +
    '\nStatus: ' + (p.status === 'in-stock' ? 'In Stock' :
                    p.status === 'low-stock' ? 'Low Stock' :
                    p.status === 'out-of-stock' ? 'Out of Stock' : 'Loading...')
  );
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

function switchReportTab(tabName) {
  document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
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
