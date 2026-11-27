// Cart page: shows the cart saved in Firestore, lets people change it and check out.
import {
  renderChrome, requireLogin, subscribeCart, setQuantity, removeFromCart,
  placeOrder, cartCount, cartTotal, money, escapeHtml, showToast,
} from "./app.js";

renderChrome("cart");

const itemsBox = document.getElementById("cartItems");
const summaryBox = document.getElementById("cartSummary");

let items = [];
let orderNumber = null;

function draw() {
  if (orderNumber) {
    itemsBox.innerHTML = `
      <div class="panel panel--success" role="status">
        <h2>Order placed</h2>
        <p>Thank you for shopping with Urban Threads. Your order number is <strong>${escapeHtml(orderNumber)}</strong>.</p>
        <a class="btn" href="shop.html">Keep shopping</a>
      </div>`;
    summaryBox.hidden = true;
    return;
  }

  if (items.length === 0) {
    itemsBox.innerHTML = `
      <div class="panel">
        <h2>Your cart is empty</h2>
        <p>Add something from the shop and it will show up here.</p>
        <a class="btn" href="shop.html">Go to the shop</a>
      </div>`;
    summaryBox.hidden = true;
    return;
  }

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  itemsBox.innerHTML = sorted
    .map(
      (item) => `
      <article class="line" data-id="${escapeHtml(item.id)}">
        <img class="line__img" src="${escapeHtml(item.imageURL)}" alt="${escapeHtml(item.name)}">
        <div class="line__info">
          <h3>${escapeHtml(item.name)}</h3>
          <p class="line__meta">${escapeHtml(item.category)} &middot; ${money(item.price)} each</p>
          <div class="qty" role="group" aria-label="Quantity for ${escapeHtml(item.name)}">
            <button type="button" class="qty__btn" data-action="dec" aria-label="Decrease quantity">&minus;</button>
            <span class="qty__value" aria-live="polite">${item.quantity}</span>
            <button type="button" class="qty__btn" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="line__side">
          <strong class="line__total">${money(item.price * item.quantity)}</strong>
          <button type="button" class="link-btn" data-action="remove">Remove</button>
        </div>
      </article>`
    )
    .join("");

  summaryBox.hidden = false;
  summaryBox.innerHTML = `
    <h2>Order summary</h2>
    <dl class="summary">
      <div><dt>Items</dt><dd>${cartCount(items)}</dd></div>
      <div><dt>Subtotal</dt><dd>${money(cartTotal(items))}</dd></div>
      <div><dt>Shipping</dt><dd>Free</dd></div>
      <div class="summary__total"><dt>Total</dt><dd>${money(cartTotal(items))}</dd></div>
    </dl>
    <button type="button" class="btn btn--wide" id="checkoutBtn">Checkout</button>
    <p class="summary__note">This is a demo store. No payment is taken.</p>`;
}

itemsBox.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const line = button.closest(".line");
  const item = items.find((i) => i.id === line.dataset.id);
  if (!item) return;

  try {
    if (button.dataset.action === "inc") await setQuantity(item.id, item.quantity + 1);
    if (button.dataset.action === "dec") await setQuantity(item.id, item.quantity - 1);
    if (button.dataset.action === "remove") {
      await removeFromCart(item.id);
      showToast(`${item.name} removed`);
    }
  } catch (error) {
    console.error(error);
    showToast("Could not update your cart. Please try again.");
  }
});

summaryBox.addEventListener("click", async (event) => {
  const button = event.target.closest("#checkoutBtn");
  if (!button) return;
  button.disabled = true;
  button.textContent = "Placing order...";
  try {
    orderNumber = (await placeOrder(items)).slice(0, 8).toUpperCase();
    draw();
  } catch (error) {
    console.error(error);
    showToast("Checkout failed. Please try again.");
    button.disabled = false;
    button.textContent = "Checkout";
  }
});

/* only people who are logged in can see their cart */
requireLogin("cart.html").then((user) => {
  if (!user) return;
  subscribeCart(user.uid, (list) => {
    items = list;
    draw();
  });
});