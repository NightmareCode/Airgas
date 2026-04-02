/**
 * Airgas Technology — Dynamic Product Catalog Engine
 * Fetches products.json, renders cards, handles filtering & search
 */
document.addEventListener('DOMContentLoaded', () => {
  // ─── DOM Refs ─────────────────────────────────────────────
  const productGrid = document.getElementById('productGrid');
  const searchInput = document.getElementById('searchInput');
  const filterTabs = document.getElementById('filterTabs');
  const resultsCount = document.getElementById('resultsCount');
  const noResults = document.getElementById('noResults');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const navbar = document.getElementById('navbar');

  let allProducts = [];
  let activeCategory = 'all';
  let searchQuery = '';

  // ─── Category Icon Map ────────────────────────────────────
  const categoryIcons = {
    'PPE for ERT': '🛡️',
    'PPE at Works': '👷',
    'Gases': '⚗️',
    'Gas Equipment': '⚙️',
    'Personal Care': '❤️',
    'Service & Maintenance': '🔧',
    'Welding Products': '🔥'
  };

  // ─── Load Products from JSON Data ────────────────────────
  fetch('assets/products.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      allProducts = data.products;
      updateCounts(allProducts);
      renderProducts();
    })
    .catch(error => {
      console.error('Error loading products.json:', error);
      productGrid.innerHTML = '<p style="text-align:center;color:#94A3B8;padding:48px;">Unable to load products. Please try again.</p>';
    });

  // ─── Update Tab Counts ────────────────────────────────────
  function updateCounts(products) {
    const countMap = {};
    products.forEach(p => {
      countMap[p.category] = (countMap[p.category] || 0) + 1;
    });

    document.getElementById('countAll').textContent = products.length;
    document.getElementById('countERT').textContent = countMap['PPE for ERT'] || 0;
    document.getElementById('countWorks').textContent = countMap['PPE at Works'] || 0;
    document.getElementById('countGases').textContent = countMap['Gases'] || 0;
    document.getElementById('countGasEquip').textContent = countMap['Gas Equipment'] || 0;
    document.getElementById('countPersonal').textContent = countMap['Personal Care'] || 0;
    document.getElementById('countService').textContent = countMap['Service & Maintenance'] || 0;
    document.getElementById('countWelding').textContent = countMap['Welding Products'] || 0;
  }

  // ─── Filter Logic ─────────────────────────────────────────
  function getFilteredProducts() {
    return allProducts.filter(product => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch = searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery)) ||
        product.category.toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }

  // ─── Render Products ──────────────────────────────────────
  function renderProducts() {
    const filtered = getFilteredProducts();

    // Update results count
    if (searchQuery || activeCategory !== 'all') {
      const catLabel = activeCategory === 'all' ? 'all categories' : activeCategory;
      resultsCount.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}${searchQuery ? ` for "${searchQuery}"` : ''} in ${catLabel}`;
    } else {
      resultsCount.textContent = `Showing all ${filtered.length} products`;
    }

    // Toggle no-results
    if (filtered.length === 0) {
      productGrid.style.display = 'none';
      noResults.style.display = 'block';
    } else {
      productGrid.style.display = 'grid';
      noResults.style.display = 'none';
    }

    // Generate HTML
    productGrid.innerHTML = filtered.map((product, i) => {
      const iconEmoji = categoryIcons[product.category] || '📦';
      const initials = product.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const hasBrandUrl = product.brandUrl !== null && product.brandUrl !== undefined;
      const brandDisplay = product.brand ? `<strong>${product.brand}</strong>` : 'Generic';

      const cardTag = hasBrandUrl ? 'a' : 'div';
      const linkAttrs = hasBrandUrl
        ? `href="${product.brandUrl}" target="_blank" rel="noopener"`
        : '';
        
      const sanitizedFilename = product.name.replace(/[^a-zA-Z0-9\s]/g, '').trim() + '.png';
      
      const categoryFolders = {
        'PPE for ERT': 'PPEForERT',
        'PPE at Works': 'PPEAtWorks',
        'Gases': 'Gases',
        'Gas Equipment': 'GasEquipment',
        'Personal Care': 'PersonalCare',
        'Service & Maintenance': 'ServiceAndMaintenance',
        'Welding Products': 'WeldingProducts'
      };
      
      const folderName = categoryFolders[product.category];
      let iconAreaHtml = `<div class="product-icon">${initials}</div>`;
      
      if (folderName) {
        const imgSrc = `assets/${folderName}/${sanitizedFilename}`;
        // The onerror handler falls back to the text initials if the image failed to download or is named wrong
        iconAreaHtml = `
          <div class="product-image-container">
            <img src="${imgSrc}" class="product-real-image" alt="${product.name}" onerror="this.parentElement.outerHTML='<div class=\\\'product-icon\\\'>${initials}</div>'" loading="lazy" />
          </div>
        `;
      }

      const brandLinkName = product.brand ? product.brand.toLowerCase().replace(/ /g, "_").replace(/&/g, "and").replace(/ä/g, "a") : "";
      const shieldLogo = product.brand 
        ? `<img class="shield-brand-logo" src="assets/BrandLogo/${brandLinkName}.png" alt="${product.brand}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" loading="lazy" />`
        : '';
      const shieldDisplay = product.brand ? 'style="display: none;"' : '';

      return `
        <${cardTag} ${linkAttrs} class="product-card" style="animation-delay: ${Math.min(i * 30, 600)}ms;">
          <div class="card-accent"></div>
          <div class="card-icon-area">
            ${iconAreaHtml}
          </div>
          <div class="card-body">
            <span class="product-badge">${product.category}</span>
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <p class="product-brand">Brand: ${brandDisplay}</p>
            <div class="card-footer">
              ${hasBrandUrl
                ? `<span class="view-link">Visit Brand <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></span>`
                : `<span class="view-link disabled">No Brand Link</span>`
              }
              <div class="shield-container">
                ${shieldLogo}
                <span class="category-tag" ${shieldDisplay}>${iconEmoji}</span>
              </div>
            </div>
          </div>
        </${cardTag}>
      `;
    }).join('');

    // Trigger staggered reveal animation
    requestAnimationFrame(() => {
      const cards = productGrid.querySelectorAll('.product-card');
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), Math.min(i * 25, 500));
      });
    });
  }

  // ─── HTML Escape Utility ──────────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Event: Filter Tabs ───────────────────────────────────
  filterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;

    filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    activeCategory = tab.dataset.category;
    renderProducts();

    // Scroll catalog into view on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  // Close mobile nav on link click
  mobileNav.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuBtn.classList.remove('active');
      mobileNav.classList.remove('open');
    });
  });

  // ─── Navbar Scroll Shadow ─────────────────────────────────
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 20);
    lastScroll = scrollY;
  }, { passive: true });

  // ─── Intersection Observer for Contact Cards ──────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.contact-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(card);
  });

  console.log('⚡ Airgas Technology catalog engine initialized.');
  // ─── 3D Hover Tracking Effect ─────────────────────────────────
  productGrid.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    
    // Only track cards that have the real image container
    const imgContainer = card.querySelector('.product-image-container');
    if (!imgContainer) return;
    
    const img = imgContainer.querySelector('.product-real-image');
    if (!img) return;
    
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate movement (limit to ~12px max for subtle premium feel)
    const moveX = ((e.clientX - centerX) / (rect.width / 2)) * 12;
    const moveY = ((e.clientY - centerY) / (rect.height / 2)) * 12;
    
    img.style.transition = 'none'; // Overwrite CSS transition for instant tracking
    img.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.08)`;
  });

  productGrid.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    
    // Check if we actually left the card entirely and not just hovering over child elements
    const related = e.relatedTarget;
    if (!card.contains(related)) {
      const img = card.querySelector('.product-real-image');
      if (img) {
        img.style.transition = ''; // Restore CSS smooth transition
        img.style.transform = `translate(0, 0) scale(1)`;
      }
    }
  });

});
