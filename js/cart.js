// ─── LINOIR CART ENGINE ───────────────────────────────────────────────────────
// Single source of truth for cart state across all pages.
// Persists to localStorage so cart survives page navigation.

const Cart = (() => {

  const STORAGE_KEY = 'linoir_cart';
  const WISHLIST_KEY = 'linoir_wishlist';

  // ── Internal State ──────────────────────────────────────────────────────────

  function getCart() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
    renderCartPanel();
  }

  function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  }

  function saveWishlist(wishlist) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }

  // ── Cart Operations ─────────────────────────────────────────────────────────

  function addItem(product, size, color, qty = 1) {
    const cart = getCart();
    // Check if same product + size + color already in cart
    const existingIndex = cart.findIndex(
      item => item.id === product.id && item.size === size && item.color === color
    );

    if (existingIndex >= 0) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        collection: product.collection,
        size,
        color,
        qty
      });
    }

    saveCart(cart);
    showToast(`${product.name} added to cart`);
  }

  function removeItem(id, size, color) {
    const cart = getCart().filter(
      item => !(item.id === id && item.size === size && item.color === color)
    );
    saveCart(cart);
  }

  function updateQty(id, size, color, qty) {
    const cart = getCart();
    const index = cart.findIndex(
      item => item.id === id && item.size === size && item.color === color
    );
    if (index >= 0) {
      if (qty <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].qty = qty;
      }
    }
    saveCart(cart);
  }

  function clearCart() {
    localStorage.removeItem(STORAGE_KEY);
    updateCartCount();
    renderCartPanel();
  }

  function getTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getItemCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  // ── Wishlist Operations ─────────────────────────────────────────────────────

  function toggleWishlist(product) {
    const wishlist = getWishlist();
    const index = wishlist.findIndex(p => p.id === product.id);
    if (index >= 0) {
      wishlist.splice(index, 1);
      showToast(`${product.name} removed from wishlist`);
    } else {
      wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image, collection: product.collection });
      showToast(`${product.name} added to wishlist`);
    }
    saveWishlist(wishlist);
    return index < 0; // returns true if added, false if removed
  }

  function isWishlisted(productId) {
    return getWishlist().some(p => p.id === productId);
  }

  // ── UI Updates ──────────────────────────────────────────────────────────────

  function updateCartCount() {
    const count = getItemCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function renderCartPanel() {
    const panel = document.getElementById('cartPanel');
    if (!panel) return;

    const cart = getCart();
    const itemsWrapper = panel.querySelector('.cart-items-wrapper');
    const cartTotal = panel.querySelector('.cart-total-amount');
    const checkoutBtn = panel.querySelector('.cart-checkout-btn');

    if (!itemsWrapper) return;

    if (cart.length === 0) {
      itemsWrapper.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Your cart is empty</p>
          <a href="../index.html" class="cart-browse-link">Browse Collections</a>
        </div>
      `;
      if (cartTotal) cartTotal.textContent = 'PKR 0';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    itemsWrapper.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='../assets/images/placeholder.png'">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-meta">${item.size} · ${item.color}</p>
          <p class="cart-item-price">PKR ${item.price.toLocaleString()}</p>
          <div class="cart-item-qty">
            <button class="qty-btn qty-minus" onclick="Cart.updateQty('${item.id}', '${item.size}', '${item.color}', ${item.qty - 1})">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn qty-plus" onclick="Cart.updateQty('${item.id}', '${item.size}', '${item.color}', ${item.qty + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.removeItem('${item.id}', '${item.size}', '${item.color}')" title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');

    if (cartTotal) cartTotal.textContent = `PKR ${getTotal().toLocaleString()}`;
  }

  // ── Toast Notification ──────────────────────────────────────────────────────

  function showToast(message, type = 'success') {
    const existing = document.getElementById('linoir-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'linoir-toast';
    toast.className = `linoir-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ── Cart Panel Toggle ───────────────────────────────────────────────────────

  function openPanel() {
    const panel = document.getElementById('cartPanel');
    const overlay = document.getElementById('cartOverlay');
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    const panel = document.getElementById('cartPanel');
    const overlay = document.getElementById('cartOverlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    updateCartCount();
    renderCartPanel();

    // Cart icon click
    document.querySelectorAll('.cart-trigger').forEach(el => {
      el.addEventListener('click', openPanel);
    });

    // Close panel
    document.querySelectorAll('.cart-close, #cartOverlay').forEach(el => {
      el.addEventListener('click', closePanel);
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  return {
    addItem,
    removeItem,
    updateQty,
    clearCart,
    getCart,
    getTotal,
    getItemCount,
    toggleWishlist,
    isWishlisted,
    getWishlist,
    showToast,
    openPanel,
    closePanel,
    renderCartPanel
  };

})();