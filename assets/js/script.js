/* ==========================================
   INVENTORI SYSTEM - SHARED JAVASCRIPT
   ========================================== */

// ==========================================
// DATA & STATE MANAGEMENT
// ==========================================

// Sample product data
let products = [
  { id: 1, name: 'Wireless Mouse', category: 'Electronics', stock: 50, price: 29.99, status: 'in-stock' },
  { id: 2, name: 'USB-C Cable', category: 'Electronics', stock: 8, price: 12.99, status: 'low-stock' },
  { id: 3, name: 'Office Chair', category: 'Furniture', stock: 0, price: 199.99, status: 'out-of-stock' },
  { id: 4, name: 'Mechanical Keyboard', category: 'Electronics', stock: 25, price: 89.99, status: 'in-stock' },
  { id: 5, name: 'Desk Lamp', category: 'Furniture', stock: 15, price: 45.99, status: 'in-stock' },
  { id: 6, name: 'Notebook Set', category: 'Office Supplies', stock: 3, price: 15.99, status: 'low-stock' },
  { id: 7, name: 'Monitor Stand', category: 'Furniture', stock: 0, price: 59.99, status: 'out-of-stock' },
  { id: 8, name: 'Webcam HD', category: 'Electronics', stock: 42, price: 79.99, status: 'in-stock' },
  { id: 9, name: 'Printer Paper', category: 'Office Supplies', stock: 200, price: 8.99, status: 'in-stock' },
  { id: 10, name: 'Pen Set', category: 'Office Supplies', stock: 5, price: 12.99, status: 'low-stock' }
];

// Sample categories
const categories = ['Electronics', 'Furniture', 'Office Supplies', 'Clothing', 'Food & Beverage', 'Tools & Hardware'];

// State management
let currentEditingProduct = null;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  return sessionStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Get current theme
 */
function getCurrentTheme() {
  return localStorage.getItem('theme') || 'light';
}

/**
 * Set theme
 */
function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggle();
}

/**
 * Update theme toggle state
 */
function updateThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = getCurrentTheme() === 'dark';
  }
}

/**
 * Get stock status based on quantity
 */
function getStockStatus(quantity) {
  if (quantity === 0) return 'out-of-stock';
  if (quantity <= 10) return 'low-stock';
  return 'in-stock';
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
  const statusConfig = {
    'in-stock': { class: 'badge-success', text: 'In Stock' },
    'low-stock': { class: 'badge-warning', text: 'Low Stock' },
    'out-of-stock': { class: 'badge-danger', text: 'Out of Stock' }
  };
  const config = statusConfig[status] || statusConfig['in-stock'];
  return `<span class="badge ${config.class}">${config.text}</span>`;
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

// ==========================================
// LOGIN FUNCTIONS
// ==========================================

/**
 * Handle login form submission
 */
function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');
  
  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password';
    errorEl.classList.add('show');
    return;
  }
  
  // Non-functional login - accept any credentials
  sessionStorage.setItem('isLoggedIn', 'true');
  sessionStorage.setItem('username', username);
  
  // Redirect to dashboard
  window.location.href = 'dashboard.html';
}

/**
 * Handle logout
 */
function handleLogout() {
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('username');
  window.location.href = 'login.html';
}

// ==========================================
// SIDEBAR FUNCTIONS
// ==========================================

/**
 * Toggle sidebar on mobile
 */
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

/**
 * Close sidebar
 */
function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

// ==========================================
// THEME FUNCTIONS
// ==========================================

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// ==========================================
// DASHBOARD FUNCTIONS
// ==========================================

/**
 * Calculate and update dashboard stats
 */
function updateDashboardStats() {
  const totalProducts = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter(p => p.status === 'low-stock').length;
  const outOfStock = products.filter(p => p.status === 'out-of-stock').length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  
  const totalEl = document.getElementById('totalProducts');
  const lowStockEl = document.getElementById('lowStock');
  const outOfStockEl = document.getElementById('outOfStock');
  const totalValueEl = document.getElementById('totalValue');
  
  if (totalEl) totalEl.textContent = products.length;
  if (lowStockEl) lowStockEl.textContent = lowStock;
  if (outOfStockEl) outOfStockEl.textContent = outOfStock;
  if (totalValueEl) totalValueEl.textContent = formatCurrency(totalValue);
}

/**
 * Render recent products table
 */
function renderRecentProducts() {
  const tbody = document.getElementById('recentProductsTable');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  // Show only first 5 products
  const recentProducts = products.slice(0, 5);
  
  recentProducts.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.stock}</td>
      <td>${getStatusBadge(product.status)}</td>
      <td>${formatCurrency(product.price)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// PRODUCTS FUNCTIONS
// ==========================================

/**
 * Render products table
 */
function renderProducts() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  products.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.stock}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${getStatusBadge(product.status)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn" onclick="editProduct(${product.id})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" onclick="deleteProduct(${product.id})" title="Delete">
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

/**
 * Filter products by search and category
 */
function filterProducts() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('categoryFilter')?.value || '';
  
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  if (filteredProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="padding: 40px;">
          No products found
        </td>
      </tr>
    `;
    return;
  }
  
  filteredProducts.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.stock}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${getStatusBadge(product.status)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn" onclick="editProduct(${product.id})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" onclick="deleteProduct(${product.id})" title="Delete">
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

/**
 * Open add product modal
 */
function openAddProductModal() {
  currentEditingProduct = null;
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('productModal').classList.add('show');
}

/**
 * Edit product
 */
function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  currentEditingProduct = product;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productModal').classList.add('show');
}

/**
 * Close product modal
 */
function closeProductModal() {
  document.getElementById('productModal').classList.remove('show');
  currentEditingProduct = null;
}

/**
 * Save product (add or update)
 */
function saveProduct(event) {
  event.preventDefault();
  
  const name = document.getElementById('productName').value;
  const category = document.getElementById('productCategory').value;
  const stock = parseInt(document.getElementById('productStock').value);
  const price = parseFloat(document.getElementById('productPrice').value);
  const description = document.getElementById('productDescription').value;
  
  if (currentEditingProduct) {
    // Update existing product
    const index = products.findIndex(p => p.id === currentEditingProduct.id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        name,
        category,
        stock,
        price,
        description,
        status: getStockStatus(stock)
      };
    }
  } else {
    // Add new product
    products.push({
      id: generateId(),
      name,
      category,
      stock,
      price,
      description,
      status: getStockStatus(stock)
    });
  }
  
  closeProductModal();
  filterProducts();
  updateDashboardStats();
  renderRecentProducts();
}

/**
 * Delete product
 */
function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  products = products.filter(p => p.id !== id);
  filterProducts();
  updateDashboardStats();
  renderRecentProducts();
}

/**
 * Populate category dropdown
 */
function populateCategories() {
  const selects = document.querySelectorAll('#productCategory, #categoryFilter');
  selects.forEach(select => {
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
    select.value = currentValue;
  });
}

// ==========================================
// REPORTS FUNCTIONS
// ==========================================

/**
 * Switch report tab
 */
function switchReportTab(tabName) {
  // Update active tab
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  
  // In a real app, this would load different report data
  // For now, all tabs show the same placeholder content
}

// ==========================================
// SETTINGS FUNCTIONS
// ==========================================

/**
 * Save user profile
 */
function saveProfile(event) {
  event.preventDefault();
  alert('Profile saved successfully!');
}

/**
 * Save company info
 */
function saveCompanyInfo(event) {
  event.preventDefault();
  alert('Company info saved successfully!');
}

/**
 * Toggle notification setting
 */
function toggleNotification(setting) {
  // In a real app, this would save the setting
  console.log(`Notification ${setting} toggled`);
}

// ==========================================
// NAVIGATION GUARD
// ==========================================

/**
 * Check authentication and redirect if not logged in
 */
function checkAuth() {
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage !== 'login.html' && !isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (currentPage === 'login.html' && isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return false;
  }
  
  return true;
}

/**
 * Set active nav item based on current page
 */
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize app based on current page
 */
function initApp() {
  // Apply saved theme
  setTheme(getCurrentTheme());
  
  // Check authentication (skip for login page)
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage !== 'login.html') {
    if (!checkAuth()) return;
    setActiveNav();
  }
  
  // Page-specific initialization
  switch (currentPage) {
    case 'dashboard.html':
      updateDashboardStats();
      renderRecentProducts();
      break;
      
    case 'products.html':
      populateCategories();
      filterProducts();
      break;
      
    case 'settings.html':
      // Populate user info from session
      const username = sessionStorage.getItem('username');
      if (username) {
        const nameInput = document.getElementById('userName');
        const emailInput = document.getElementById('userEmail');
        if (nameInput) nameInput.value = username;
        if (emailInput) emailInput.value = username.toLowerCase().replace(' ', '.') + '@company.com';
      }
      break;
  }
  
  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Hamburger menu
  const hamburger = document.querySelector('.hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleSidebar);
  }
  
  // Sidebar overlay
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }
  
  // Close sidebar on nav item click (mobile)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('change', toggleTheme);
  }
  
  // Search and filter (products page)
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }
  
  // Product modal
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', saveProduct);
  }
  
  const closeModalBtn = document.querySelector('.modal-close');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeProductModal);
  }
  
  const modalOverlay = document.getElementById('productModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeProductModal();
      }
    });
  }
  
  // Logout button
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Report tabs
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchReportTab(tab.dataset.tab);
    });
  });
  
  // Settings form handlers
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', saveProfile);
  }
  
  const companyForm = document.getElementById('companyForm');
  if (companyForm) {
    companyForm.addEventListener('submit', saveCompanyInfo);
  }
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);