// ─── LINOIR — MAIN JS ────────────────────────────────────────────────────────
// Shared UI logic across all pages:
// navbar scroll, mobile menu, dropdowns, cart panel, modal overlay

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar Scroll Shadow ──────────────────────────────────────────────────
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── Mobile Menu Toggle ────────────────────────────────────────────────────
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      document.body.style.overflow = isOpen ? 'hidden' : '';

      // Animate hamburger to X
      const spans = menuToggle.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        document.body.style.overflow = '';
        const spans = menuToggle.querySelectorAll('span');
        spans.forEach(s => s.style.transform = s.style.opacity = '');
      });
    });
  }

  // ── Mobile Shop Dropdown ──────────────────────────────────────────────────
  const shopToggle = document.querySelector('.nav-dropdown > a');
  const dropdownMenu = document.querySelector('.dropdown-menu');

  if (shopToggle && dropdownMenu) {
    shopToggle.addEventListener('click', (e) => {
      // Only intercept on mobile
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdownMenu.classList.toggle('mobile-show');
      }
    });
  }

  // ── Set Active Nav Link ───────────────────────────────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href.replace('../', '').replace('./', ''))) {
      link.classList.add('active');
    }
  });

  // ── Cart Panel ────────────────────────────────────────────────────────────
  // Cart trigger buttons (cart icon in navbar)
  document.querySelectorAll('.cart-trigger').forEach(el => {
    el.addEventListener('click', () => Cart.openPanel());
  });

  // Cart close button and overlay
  document.querySelectorAll('.cart-close').forEach(el => {
    el.addEventListener('click', () => Cart.closePanel());
  });

  const cartOverlay = document.getElementById('cartOverlay');
  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => Cart.closePanel());
  }

  // ── Quick Add Modal ───────────────────────────────────────────────────────
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', () => Products.closeQuickAdd());
  }

  const qaClose = document.querySelector('.qa-close');
  if (qaClose) {
    qaClose.addEventListener('click', () => Products.closeQuickAdd());
  }

  // ── Filter & Sort (collection pages) ─────────────────────────────────────
  const filterSelect = document.getElementById('filterSize');
  const sortSelect = document.getElementById('sortBy');

  function applyFilterSort() {
    const filterVal = filterSelect ? filterSelect.value : 'all';
    const sortVal = sortSelect ? sortSelect.value : 'default';
    Products.filterAndSort(filterVal, sortVal);
  }

  if (filterSelect) filterSelect.addEventListener('change', applyFilterSort);
  if (sortSelect) sortSelect.addEventListener('change', applyFilterSort);

  // ── Smooth Scroll for Anchor Links ───────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // ── Escape Key Closes Panels ──────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      Cart.closePanel();
      if (typeof Products !== 'undefined') Products.closeQuickAdd();
    }
  });

  // ── Lazy Load Images Fallback ─────────────────────────────────────────────
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.addEventListener('error', function() {
      this.src = this.src.includes('../')
        ? '../assets/images/placeholder.png'
        : './assets/images/placeholder.png';
    });
  });

  // ── Footer Year ───────────────────────────────────────────────────────────
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});