// public/app.js

// Base URL for the product-service API
const API_URL = window.APP_CONFIG.PRODUCT_API_BASE_URL;


// We will keep all products in memory after the first fetch
let allProducts = [];

// Key name used to store the cart in localStorage
const CART_KEY = "bestbuy-demo-cart";


let messageTimeoutId = null;

function showMessage(type, text, durationMs = 3000) {
  const el = document.getElementById("global-message");
  if (!el) return;

  // Reset classes
  el.className = "";
  el.classList.add(`alert--${type}`);

  // Set text
  el.textContent = text;

  // Force reflow to restart animation
  void el.offsetWidth;

  // Show animated toast
  el.classList.add("alert--show");

  // Clear old timer
  if (messageTimeoutId) clearTimeout(messageTimeoutId);

  // Hide later
  messageTimeoutId = setTimeout(() => {
    el.classList.remove("alert--show");
  }, durationMs);
}
// Specific images for demo products based on their name
const PRODUCT_IMAGE_MAP = {
  'Apple MacBook Air 13" (M2, 256GB)': 'images/products/macbook-air-m2.png',
  'ASUS VivoBook 15" (Ryzen 5, 512GB SSD)': 'images/products/asus-vivobook-15.jpg',
  'Samsung 55" 4K UHD Smart TV (Crystal UHD)': 'images/products/samsung554k uhd.jpg',
  'LG 65" OLED evo 4K Smart TV (C3 Series)': 'images/products/lg-c3-48-oled.jpg',
  'Sony WH-1000XM5 Wireless Noise Cancelling Headphones': 'images/products/sony-wh1000xm5.jpg',
  'JBL Flip 6 Portable Bluetooth Speaker': 'images/products/jbl-flip-6.jpg',
  'PlayStation 5 Slim Console (Disc Version)': 'images/products/PlayStation 5 Slim .jpg',
  'Nintendo Switch OLED Console (White Joy-Con)': 'images/products/nintendo-switch-oled.jpg',
  'Logitech G502 HERO Wired Gaming Mouse': 'images/products/logitech-g502-hero.jpg',
  'Razer BlackWidow V4 Mechanical Gaming Keyboard': 'images/products/gaming-keyboard.jpg',
  'HP OMEN 40L Gaming Desktop (Intel i7 + RTX 4070)': 'images/products/download.jpg',
  'Logitech MX Master 3S Wireless Darkfield Mouse - Black': 'images/products/mouse3s.jpg',
  'Anker 735 Nano II 65W USB-C Charger': 'images/products/anker.jpg',
  
};

// Default image per category (for products created in the admin)
const CATEGORY_IMAGE_MAP = {
  'laptops': 'images/category-laptops.jpg',
  'tv & home theatre': 'images/category-tv.png',
  'All products': 'images/callproduct.png',
  'headphones and portable speakers': 'images/cat-accessories.jpg',
  'video games, consoles, and accessories': 'images/cat-games.jpg',
  'pc gaming': 'images/cat-pc-gaming.jpg',
  'accessories': 'images/cat-accessories.jpg'
};
// Get the best image URL for a product
function getProductImageUrl(product) {
  if (!product) {
    return 'images/products/download.jpg';
  }

  if (typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
    const url = product.imageUrl.trim();
    return url;
  }

  const name = product.name || '';
  if (PRODUCT_IMAGE_MAP[name]) {
    return PRODUCT_IMAGE_MAP[name];
  }

  const catKey = (product.category || '').toLowerCase().trim();
  if (CATEGORY_IMAGE_MAP[catKey]) {
    return CATEGORY_IMAGE_MAP[catKey];
  }

  // generic image
  return 'images/products/download.jpg';
}
// ---------- CART MANAGEMENT ---------- //
function getCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error reading cart from storage:", e);
    return [];
  }
}
// Save the cart array to localStorage
function saveCartToStorage(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Error saving cart to storage:", e);
  }
}
// Get total number of items in the cart
function getTotalItemsInCart() {
  const cart = getCartFromStorage();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
// Update the Cart (X) link in the header
function updateCartCount() {
  const cartLink = document.getElementById("cart-link");
  if (!cartLink) return;
  const totalItems = getTotalItemsInCart();
  cartLink.textContent = `Cart (${totalItems})`;
}

// Add a product to the cart
function addToCart(product) {
  if (!product) return;

  // Use _id, or id, or name as a fallback for productId
  const productId = product._id || product.id || product.name;
  let cart = getCartFromStorage();

  // Try to find the product in the existing cart
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    // If found, increase quantity
    existingItem.quantity += 1;
  } else {
    // If not found, push a new item
    cart.push({
      productId,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  // Save and update cart display
  saveCartToStorage(cart);
  updateCartCount();
  // Show confirmation message
  alert(
    ` "${product.name}" has been added to your cart.\n\n` +
      `Cart now contains ${getTotalItemsInCart()} item(s).\n\n` 
  );
}

// ---------- PRODUCT RENDERING ---------- //
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  // Set data-category attribute for filtering
  card.dataset.category = product.category || "";

  const imageUrl = getProductImageUrl(product);

  card.innerHTML = `
    <img src="${imageUrl}" alt="${product.name}" class="product-image" />
    <h3>${product.name}</h3>
    <p><strong>Category:</strong> ${product.category}</p>
    <p class="price"><strong>Price:</strong> $${product.price}</p>
    <button class="order-btn" type="button">Order</button>
  `;

  // Add click handler to the Order button
  const orderBtn = card.querySelector(".order-btn");
  orderBtn.addEventListener("click", () => {
    addToCart(product);
  });

  return card;
}

// Render a list of products in the products container
function renderProducts(list) {
  const container = document.getElementById("products-container");
  const errorMessage = document.getElementById("error-message");

  container.innerHTML = "";
  errorMessage.textContent = "";

  if (!list || list.length === 0) {
    container.innerHTML = "<p>No products available.</p>";
    return;
  }

  list.forEach((product) => {
    const card = createProductCard(product);
    container.appendChild(card);
  });
}
// Load products from the API
async function loadProducts() {
  const errorMessage = document.getElementById("error-message");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
     
      const text = await response.text();
      throw new Error(
        `API error: ${response.status} ${response.statusText} - ${text}`
      );
    }

    // Parse JSON response
    const data = await response.json();

    const arrayData = Array.isArray(data) ? data : [];
    allProducts = arrayData.slice(0, 100);

    renderProducts(allProducts);
  } catch (err) {
    console.error("Error loading products:", err);

    // Inline error message below the categories
    if (errorMessage) {
      errorMessage.textContent =
        "We’re sorry, we couldn’t load products right now. Please try again in a few moments.";
    }

    // Global toast message
    showMessage(
      "error",
      "We’re sorry, we couldn’t load products at the moment. Please check your connection and try again."
    );
  }

}
// ---------- SEARCH FEATURE ---------- //
function setupSearch() {
  const input = document.querySelector("#search-input");
  const button = document.querySelector(".search-container button");

  if (!input) return;

  // Common function to apply the search filter
  function applySearch() {
    const value = input.value.trim().toLowerCase();

    if (!value) {
      // If the search bar is empty → show all products again
      renderProducts(allProducts);
      return;
    }

    // Filter by name or category
    const filtered = allProducts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      return name.includes(value) || category.includes(value);
    });

    renderProducts(filtered);
  }

  // Filter while the user is typing
  input.addEventListener("input", applySearch);

  // Filter when the user presses Enter
  input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      applySearch();
    }
  });

  // Filter when the user clicks the Search button
  if (button) {
    button.addEventListener("click", applySearch);
  }
}
// ---------- CATEGORY FILTERS ---------- //
function setupCategoryFilters() {
  const cards = document.querySelectorAll(".category-card");


  function focusProductsSection() {
    const section = document.getElementById("products-section");
    if (!section) return;

    // Scroll to the products section
    section.scrollIntoView({ behavior: "smooth", block: "start" });

    // Put focus on the heading for screen readers / keyboard
    const heading = document.getElementById("products-heading") ||
                    section.querySelector("h2");
    if (heading) {
      heading.focus();
    }
  }

  // Add click handler to each category card
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const cat = card.dataset.category;

      // If no category or "ALL" → show all products
      if (!cat || cat === "ALL") {
        renderProducts(allProducts);
        focusProductsSection();
        return;
      }

      // Otherwise filter products with the same category (case-insensitive)
      const filtered = allProducts.filter((p) => {
        const category = (p.category || "").toLowerCase();
        return category === cat.toLowerCase();
      });

      renderProducts(filtered);
      focusProductsSection();
    });
  });
}

// ---------- INITIALIZATION ---------- //
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  setupSearch();
  setupCategoryFilters();
  updateCartCount();
});
