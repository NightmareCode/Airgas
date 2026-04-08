/**
 * Airgas Technology — Industry-Based Product Engine
 */
document.addEventListener('DOMContentLoaded', () => {
  // ─── DOM Refs ─────────────────────────────────────────────
  const productContainer = document.getElementById('productContainer');
  const searchInput = document.getElementById('searchInput');
  const filterTabs = document.getElementById('filterTabs');
  const resultsCount = document.getElementById('resultsCount');
  const noResults = document.getElementById('noResults');
  const industryDescription = document.getElementById('industryDescription');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const navbar = document.getElementById('navbar');

  let allProducts = [];
  let industryDescriptions = {};
  let activeIndustry = 'Confined Space';
  let searchQuery = '';

  // ─── Load Data ────────────────────────
  fetch('assets/products.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      allProducts = data.products;
      industryDescriptions = data.industryDescriptions || {};
      updateIndustryInfo();
      renderProducts();
    })
    .catch(error => {
      console.error('Error loading products.json:', error);
      productContainer.innerHTML = `<p style="text-align:center;padding:48px;">Error loading products. Please refresh.</p>`;
    });

  // ─── Update Industry Description ──────────────────────────
  function updateIndustryInfo() {
    const desc = industryDescriptions[activeIndustry] || "Expert solutions for your industry needs.";
    if (industryDescription) {
      industryDescription.textContent = desc;
    }
  }

  // ─── Filter & Group Logic ─────────────────────────────────
  function getFilteredAndGroupedProducts() {
    const filtered = allProducts.filter(product => {
      const matchesIndustry = product.industry === activeIndustry;
      const matchesSearch = searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery));
      return matchesIndustry && matchesSearch;
    });

    const groups = {};
    filtered.forEach(product => {
      const sub = product.subCategory || 'General Products';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(product);
    });

    return { groups, total: filtered.length };
  }

  // ─── Render Products ──────────────────────────────────────
  function renderProducts() {
    const { groups, total } = getFilteredAndGroupedProducts();

    resultsCount.textContent = searchQuery 
      ? `Found ${total} result${total !== 1 ? 's' : ''}`
      : `Showing ${total} products in ${activeIndustry}`;

    if (total === 0) {
      productContainer.innerHTML = '';
      noResults.style.display = 'block';
      return;
    } else {
      noResults.style.display = 'none';
    }

    let fragment = document.createDocumentFragment();
    const sortedSubCats = Object.keys(groups).sort();

    sortedSubCats.forEach(subCat => {
      const section = document.createElement('div');
      section.className = 'subcategory-section';
      
      const title = document.createElement('h2');
      title.className = 'subcategory-title';
      title.textContent = subCat;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'product-grid';

      groups[subCat].forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        const initials = product.name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'AG';
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${initials}&background=F85A2B&color=fff&size=128`;
        
        // Industry-based folder path
        const industryFolder = (product.industry || 'Other industries').replace(/\s+/g, '').replace('&', 'and');
        const sanitizedFilename = product.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 100).trim() + '.png';
        const localSrc = `assets/${industryFolder}/${sanitizedFilename}`;
        
        // Priority: 1. Local industry folder, 2. Live imgUrl, 3. Avatar fallback
        const mainImgSrc = localSrc; 

        card.innerHTML = `
          <div class="card-image-area">
            <img src="${mainImgSrc}" 
                 class="product-img" 
                 alt="${product.name}" 
                 onerror="if(this.src !== '${product.imgUrl || ''}') { this.src='${product.imgUrl || fallbackAvatar}'; } else { this.src='${fallbackAvatar}'; this.onerror=null; }" 
                 loading="lazy" />
          </div>
          <div class="card-content">
            <div class="product-brand">${product.brand || 'Airgas Technology'}</div>
            <div class="product-name" title="${product.name}">${product.name}</div>
            <div class="product-description">${product.description || ''}</div>
            <a href="${product.url || '#'}" target="_blank" rel="noopener" class="view-more-btn">View more</a>
          </div>
        `;
        grid.appendChild(card);
      });

      section.appendChild(grid);
      fragment.appendChild(section);
    });

    productContainer.innerHTML = '';
    productContainer.appendChild(fragment);
  }

  // ─── Event: Filter Tabs ───────────────────────────────────
  filterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;

    filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    activeIndustry = tab.dataset.industry;
    updateIndustryInfo();
    renderProducts();
    window.scrollTo({ top: document.getElementById('catalog').offsetTop - 100, behavior: 'smooth' });
  });

  // ─── Event: Search ────────────────────────────────────────
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderProducts();
    }, 200);
  });

  // ─── Event: Mobile Menu ───────────────────────────────────
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    mobileNav.classList.toggle('open');
  });

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
});
