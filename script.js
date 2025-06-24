let cartItems = {};

// DOM elements 
let cartIcon = document.querySelector(".cart-icon");
let closeButton = document.querySelector(".close-btn");
let itemWrapper = document.querySelector(".items-wrapper");
let cartBadge = document.querySelector(".cart-icon span"); // Adjust if needed

// Save cart
function saveCartToLocalStorage() {
  localStorage.setItem("linoir_cart", JSON.stringify(cartItems));
}

// Load cart
function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem("linoir_cart");
  if (savedCart) {
    cartItems = JSON.parse(savedCart);
  }
}

// Update cart badge
function updateCartBadge() {
  let totalQty = 0;
  for (let key in cartItems) {
    totalQty += cartItems[key].qty;
  }
  if (cartBadge) {
    cartBadge.innerText = totalQty;
  }
}

// Render cart items in panel
function renderCart() {
  if (!itemWrapper) return;

  itemWrapper.innerHTML = "";
  for (let title in cartItems) {
    let item = cartItems[title];
    itemWrapper.insertAdjacentHTML("beforeend", `
      <div class="item-list">
        <div class="item">
          <img src="${item.img}">
          <div class="quantity">
            <label for="quantity">Qty:</label>
            <input type="number" min="1" max="10" value="${item.qty}" data-title="${title}">
          </div>
          <div class="item-title">
            <h3>${title}</h3>
            <p class="item-price">${item.price}</p>
          </div>
        </div>
      </div>
    `);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCartFromLocalStorage();
  updateCartBadge();
  renderCart();

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      document.querySelector(".cart-panel").classList.toggle("active-panel");
    });
  }

  if (cartIcon) {
    cartIcon.addEventListener("click", () => {
      document.querySelector(".cart-panel").classList.toggle("active-panel");
      renderCart();
    });
  }

  // Add to cart logic
  document.querySelectorAll(".btn-cart").forEach(button => {
    button.addEventListener("click", (e) => {
      let productCard = e.target.closest(".product-card");
      if (!productCard) return;

      let productImage = productCard.querySelector("img").src;
      let productTitle = productCard.querySelector(".product-title").innerText.trim();
      let productPrice = productCard.querySelector(".product-price").innerText.trim();

      if (cartItems[productTitle]) {
        if (cartItems[productTitle].qty < 10) {
          cartItems[productTitle].qty += 1;
        }
      } else {
        cartItems[productTitle] = {
          img: productImage,
          price: productPrice,
          qty: 1
        };
      }

      renderCart();
      updateCartBadge();
      saveCartToLocalStorage();
    });
  });

  // Quantity update logic
  if (itemWrapper) {
    itemWrapper.addEventListener("input", function (e) {
      if (e.target && e.target.matches('input[type="number"]')) {
        const title = e.target.getAttribute("data-title");
        const newQty = parseInt(e.target.value) || 1;
        cartItems[title].qty = Math.min(Math.max(newQty, 1), 10);
        updateCartBadge();
        saveCartToLocalStorage();
      }
    });
  }
});

