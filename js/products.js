// ─── LINOIR PRODUCTS ENGINE ───────────────────────────────────────────────────
// Loads products from data/products.json and renders them on collection pages.
// Also handles the quick-add modal (size + color selection before adding to cart).

const Products = (() => {

  let allProducts = [];
  let currentCollection = null;

  // ── Load Data ───────────────────────────────────────────────────────────────

  async function loadProducts() {
    // Detect path depth to build correct relative path
    const isInCollections = window.location.pathname.includes('/collections/');
    const base = isInCollections ? '../' : './';

    const response = await fetch(`${base}data/products.json`);
    const data = await response.json();
    allProducts = data.products;
    return data;
  }

  // ── Render Collection Page ──────────────────────────────────────────────────

  async function renderCollection(collectionId) {
    currentCollection = collectionId;
    await loadProducts();

    const products = allProducts.filter(p => p.collection === collectionId);
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = `<p class="no-products">No products found.</p>`;
      return;
    }

    grid.innerHTML = products.map(p => productCardHTML(p)).join('');
    bindCardEvents();
  }

  // ── Render Homepage Featured ────────────────────────────────────────────────

  async function renderFeatured(containerId, limit = 4) {
    await loadProducts();
    const container = document.getElementById(containerId);
    if (!container) return;

    // Pick bestsellers first, then fill with others
    const bestsellers = allProducts.filter(p => p.badge === 'Bestseller');
    const rest = allProducts.filter(p => p.badge !== 'Bestseller');
    const featured = [...bestsellers, ...rest].slice(0, limit);

    container.innerHTML = featured.map(p => productCardHTML(p, true)).join('');
    bindCardEvents();
  }

  // ── Product Card HTML ───────────────────────────────────────────────────────

  function productCardHTML(p, isHome = false) {
    const isInCollections = window.location.pathname.includes('/collections/');
    const base = isHome ? './collections/' : '';
    const imgBase = isInCollections ? '../' : './';

    const wishlisted = Cart.isWishlisted(p.id);
    const imgSrc = p.image.startsWith('http') ? p.image : `${imgBase}${p.image.replace('../', '')}`;

    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-img-wrap">
          <img
            src="${imgSrc}"
            alt="${p.name}"
            class="product-img"
            onerror="this.src='${imgBase}assets/images/placeholder.png'"
            loading="lazy"
          >
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
          <button
            class="wishlist-btn ${wishlisted ? 'active' : ''}"
            onclick="Products.handleWishlist(event, '${p.id}')"
            title="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
          <div class="product-actions-overlay">
            <button class="btn-quick-add" onclick="Products.openQuickAdd('${p.id}')">
              Quick Add
            </button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-meta">
            <h3 class="product-name">${p.name}</h3>
            <p class="product-price">PKR ${p.price.toLocaleString()}</p>
          </div>
          <div class="product-colors">
            ${p.colors.map(c => `<span class="color-dot" style="background:${colorToHex(c)}" title="${c}"></span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }

  // ── Quick Add Modal ─────────────────────────────────────────────────────────

  function openQuickAdd(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const isInCollections = window.location.pathname.includes('/collections/');
    const imgBase = isInCollections ? '../' : './';
    const imgSrc = product.image.startsWith('http')
      ? product.image
      : `${imgBase}${product.image.replace('../', '')}`;

    const modal = document.getElementById('quickAddModal');
    if (!modal) return;

    modal.querySelector('.qa-product-name').textContent = product.name;
    modal.querySelector('.qa-product-price').textContent = `PKR ${product.price.toLocaleString()}`;
    modal.querySelector('.qa-product-desc').textContent = product.description;
    modal.querySelector('.qa-product-img').src = imgSrc;
    modal.querySelector('.qa-product-img').onerror = function() {
      this.src = `${imgBase}assets/images/placeholder.png`;
    };

    // Render sizes
    modal.querySelector('.qa-sizes').innerHTML = product.sizes.map((s, i) => `
      <button class="size-btn ${i === 0 ? 'selected' : ''}" data-size="${s}">${s}</button>
    `).join('');

    // Render colors
    modal.querySelector('.qa-colors').innerHTML = product.colors.map((c, i) => `
      <button class="color-btn ${i === 0 ? 'selected' : ''}" data-color="${c}" style="--color:${colorToHex(c)}" title="${c}">
        <span class="color-swatch" style="background:${colorToHex(c)}"></span>
        <span class="color-label">${c}</span>
      </button>
    `).join('');

    // Size selection
    modal.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Color selection
    modal.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Add to cart button
    const addBtn = modal.querySelector('.qa-add-btn');
    addBtn.onclick = () => {
      const size = modal.querySelector('.size-btn.selected')?.dataset.size;
      const color = modal.querySelector('.color-btn.selected')?.dataset.color;
      if (!size || !color) {
        Cart.showToast('Please select a size and color', 'error');
        return;
      }
      Cart.addItem(product, size, color);
      closeQuickAdd();
      Cart.openPanel();
    };

    modal.classList.add('open');
    document.getElementById('modalOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickAdd() {
    const modal = document.getElementById('quickAddModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  // ── Wishlist Handler ────────────────────────────────────────────────────────

  function handleWishlist(event, productId) {
    event.stopPropagation();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const added = Cart.toggleWishlist(product);
    const btn = event.currentTarget;
    const svg = btn.querySelector('svg');

    btn.classList.toggle('active', added);
    svg.setAttribute('fill', added ? 'currentColor' : 'none');
  }

  // ── Filter & Sort ───────────────────────────────────────────────────────────

  function filterAndSort(filterValue, sortValue) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let products = allProducts.filter(p => p.collection === currentCollection);

    // Filter by size
    if (filterValue && filterValue !== 'all') {
      products = products.filter(p => p.sizes.includes(filterValue));
    }

    // Sort
    if (sortValue === 'price-asc') products.sort((a, b) => a.price - b.price);
    if (sortValue === 'price-desc') products.sort((a, b) => b.price - a.price);
    if (sortValue === 'name') products.sort((a, b) => a.name.localeCompare(b.name));

    grid.innerHTML = products.map(p => productCardHTML(p)).join('');
    bindCardEvents();
  }

  // ── Bind Card Events ────────────────────────────────────────────────────────

  function bindCardEvents() {
    // Rebind wishlist buttons after render
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const id = btn.closest('.product-card')?.dataset.id;
      if (id && Cart.isWishlisted(id)) {
        btn.classList.add('active');
        btn.querySelector('svg')?.setAttribute('fill', 'currentColor');
      }
    });
  }

  // ── Color Helper ────────────────────────────────────────────────────────────

  function colorToHex(colorName) {
    const map = {
      'White': '#f5f5f5', 'Black': '#1a1a1a', 'Navy': '#1B2A4A',
      'Sand': '#C2B280', 'Coral': '#FF6B6B', 'Teal': '#008080',
      'Red': '#CC2936', 'Olive': '#6B7C2C', 'Pink': '#FFB6C1',
      'Lilac': '#C8A2C8', 'Beige': '#F5F0E8', 'Dusty Rose': '#DCAE96',
      'Peach': '#FFCBA4', 'Sage': '#87AE73', 'Mauve': '#E0B0B0',
      'Charcoal': '#36454F', 'Cream': '#FFFDD0', 'Grey': '#9E9E9E',
      'Graphite': '#474747'
    };
    return map[colorName] || '#ccc';
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  return {
    loadProducts,
    renderCollection,
    renderFeatured,
    openQuickAdd,
    closeQuickAdd,
    handleWishlist,
    filterAndSort,
    getAllProducts: () => allProducts
  };

})();