// public/cart.js

const CART_KEY = "bestbuy-demo-cart";
const ORDER_API_URL = window.APP_CONFIG.ORDER_API_BASE_URL;
// const ORDER_API_URL = "http://localhost:4001/api/orders"; --- IGNORE for ---

// --------- helpers localStorage --------- //

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

function saveCartToStorage(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Error saving cart to storage:", e);
  }
}

function getTotalItemsInCart() {
  const cart = getCartFromStorage();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
  const cartLink = document.getElementById("cart-link");
  if (!cartLink) return;
  const totalItems = getTotalItemsInCart();
  cartLink.textContent = `Cart (${totalItems})`;
}
// --------- build order payload --------- //
function buildOrderPayload(cart) {
  let totalAmount = 0;

  const items = cart.map((item) => {
    const productId = item.productId || item._id || item.id;

    const lineTotal = item.price * item.quantity;
    totalAmount += lineTotal;

    return {
      productId,          
      name: item.name,    
      unitPrice: item.price,
      quantity: item.quantity,
      lineTotal: lineTotal,
    };
  });

  return {
    items,
    totalAmount: Number(totalAmount.toFixed(2)),
    currency: "CAD",               
    createdAt: new Date().toISOString(),
    
  };
}

// --------- rendering --------- //
function renderCart() {
  const cart = getCartFromStorage();
  const emptyMessage = document.getElementById("cart-empty-message");
  const table = document.getElementById("cart-table");
  const tbody = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const summary = document.getElementById("cart-summary");

  tbody.innerHTML = "";

  if (!cart || cart.length === 0) {
    if (emptyMessage) emptyMessage.style.display = "block";
    if (table) table.style.display = "none";
    if (summary) summary.style.display = "none";
    return;
  }

  if (emptyMessage) emptyMessage.style.display = "none";
  if (table) table.style.display = "table";
  if (summary) summary.style.display = "block";

  let total = 0;

  cart.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
// Create table row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>$${item.price}</td>
      <td>
        <input
          type="number"
          min="1"
          value="${item.quantity}"
          data-id="${item.productId}"
          class="cart-qty-input"
        />
      </td>
      <td>$${lineTotal.toFixed(2)}</td>
      <td>
        <button
          type="button"
          class="cart-remove-btn"
          data-id="${item.productId}"
        >
          Remove
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (totalElement) {
    totalElement.textContent = `Total: $${total.toFixed(2)}`;
  }

  // Attach listeners after rendering
  setupRowEventHandlers();
}

function setupRowEventHandlers() {
  const qtyInputs = document.querySelectorAll(".cart-qty-input");
  const removeButtons = document.querySelectorAll(".cart-remove-btn");
  qtyInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const productId = e.target.dataset.id;
      let newQty = parseInt(e.target.value, 10);
      if (isNaN(newQty) || newQty < 1) {
        newQty = 1;
        e.target.value = "1";
      }

      let cart = getCartFromStorage();
      const item = cart.find((i) => i.productId === productId);
      if (item) {
        item.quantity = newQty;
        saveCartToStorage(cart);
        updateCartCount();
        renderCart();
      }
    });
  });

  removeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.target.dataset.id;
      let cart = getCartFromStorage();
      cart = cart.filter((i) => i.productId !== productId);
      saveCartToStorage(cart);
      updateCartCount();
      renderCart();
    });
  });
}

// --------- call order-service (future) --------- //

async function sendOrderToService(cart) {
  const payload = buildOrderPayload(cart);

  console.log("Sending order to order-service:");

  try {
    const response = await fetch(ORDER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Order service error: ${response.status} ${response.statusText} - ${text}`
      );
    }

    const orderResponse = await response.json();

    alert(
      "Order created successfully!\n\n" 
    );

    
    saveCartToStorage([]);
    updateCartCount();
    renderCart();
  } catch (err) {
    console.error("Error sending order:", err);
    alert(
      "Failed to create order.\n\n"  +
        "Error:\n" +
        err.message
    );
  }
}

// --------- other buttons (clear / checkout) --------- //

function setupButtons() {
  const clearBtn = document.getElementById("clear-cart-btn");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear the cart?")) {
        saveCartToStorage([]);
        updateCartCount();
        renderCart();
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      const cart = getCartFromStorage();
      if (!cart.length) {
        alert("Your cart is empty.");
        return;
      }

      // Confirm order details
      const payload = buildOrderPayload(cart);
      const ok = confirm(
        "You are about to send this order to the order-service:\n\n" +
          "\n\nContinue?"
      );

      if (!ok) return;

      await sendOrderToService(cart);
    });
  }
}

// --------- init --------- //

window.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();
  setupButtons();
});
