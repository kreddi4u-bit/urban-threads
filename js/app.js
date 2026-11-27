/* ============================================================
   URBAN THREADS, shared code used by every page
   ------------------------------------------------------------
   1. Firebase setup ..... connects to Authentication and Firestore
   2. Login state ........ who is logged in, log out, protected pages
   3. Cart ............... saved in Firestore under each user
   4. Page helpers ....... navbar, footer, messages, money
   5. Product card ....... one product on the page and its Add to cart button
   ============================================================ */


/* ============================================================
   1. FIREBASE SETUP
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

/* the other pages import these from here, so they never need the long web links */
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
  sendPasswordResetEmail,
};

/* true once the settings in firebase-config.js have been filled in */
export const isConfigured = !Object.values(firebaseConfig).some((value) =>
  String(value).startsWith("PASTE")
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


/* ============================================================
   2. LOGIN STATE
   ============================================================ */
let currentUser = null;
let stopCartWatch = null;

export const getUser = () => currentUser;

/* resolves with the logged-in user, or null, once Firebase has checked */
export const authReady = new Promise((resolve) => {
  if (!isConfigured) {
    resolve(null);
    return;
  }
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    resolve(user);
    refreshNavbar();
    watchCartBadge();
  });
});

/* use on pages that need an account: sends visitors to the login page */
export async function requireLogin(nextPage) {
  const user = await authReady;
  if (!user) location.replace(`login.html?next=${encodeURIComponent(nextPage)}`);
  return user;
}

export async function logout() {
  await signOut(auth);
  location.href = "index.html";
}


/* ============================================================
   3. CART
   Each item is a document at  users / {user id} / cart / {product id}
   ============================================================ */
const cartPath = (uid) => collection(db, "users", uid, "cart");

/* calls back with the cart items every time they change */
export function subscribeCart(uid, callback) {
  return onSnapshot(
    cartPath(uid),
    (snapshot) => callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => console.warn("Could not read the cart.", error)
  );
}

export async function addToCart(product) {
  if (!currentUser) throw new Error("Please log in first.");
  const ref = doc(db, "users", currentUser.uid, "cart", product.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { quantity: increment(1) });
  } else {
    await setDoc(ref, {
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageURL: product.imageURL,
      quantity: 1,
    });
  }
}

export async function setQuantity(productId, quantity) {
  if (quantity < 1) return removeFromCart(productId);
  return updateDoc(doc(db, "users", currentUser.uid, "cart", productId), { quantity });
}

export function removeFromCart(productId) {
  return deleteDoc(doc(db, "users", currentUser.uid, "cart", productId));
}

export const cartCount = (items) => items.reduce((sum, item) => sum + item.quantity, 0);

export const cartTotal = (items) =>
  Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

/* saves an order, then empties the cart. Returns the order number. */
export async function placeOrder(items) {
  const batch = writeBatch(db);
  const orderRef = doc(collection(db, "users", currentUser.uid, "orders"));
  batch.set(orderRef, {
    items: items.map(({ productId, name, price, quantity }) => ({ productId, name, price, quantity })),
    total: cartTotal(items),
    createdAt: serverTimestamp(),
  });
  items.forEach((item) => batch.delete(doc(db, "users", currentUser.uid, "cart", item.id)));
  await batch.commit();
  return orderRef.id;
}

/* keeps the number on the Cart link up to date */
function watchCartBadge() {
  if (stopCartWatch) {
    stopCartWatch();
    stopCartWatch = null;
  }
  setBadge(0);
  if (currentUser) {
    stopCartWatch = subscribeCart(currentUser.uid, (items) => setBadge(cartCount(items)));
  }
}

function setBadge(count) {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.textContent = count;
  badge.hidden = count === 0;
}


/* ============================================================
   4. PAGE HELPERS
   ============================================================ */
export const CATEGORIES = ["Hoodies", "T-shirts", "Sneakers", "Accessories"];

export const money = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

let toastTimer = null;
export function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

/* turns Firebase error codes into sentences people can understand */
export function friendlyAuthError(code) {
  const messages = {
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/invalid-email": "That email address does not look right.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/invalid-credential": "The email or password is wrong.",
    "auth/user-not-found": "No account uses that email.",
    "auth/wrong-password": "The email or password is wrong.",
    "auth/too-many-requests": "Too many tries. Wait a moment and try again.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
  };
  return messages[code] || "Something went wrong. Please try again.";
}

/* draws the navbar and footer on the page */
export function renderChrome(active) {
  const current = (key) => (active === key ? ' class="is-active" aria-current="page"' : "");

  document.getElementById("site-header").innerHTML = `
    <nav class="nav" aria-label="Main">
      <a class="nav__brand" href="index.html">URBAN<span>THREADS</span></a>
      <button class="nav__toggle" id="navToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navMenu">
        <span></span><span></span><span></span>
      </button>
      <div class="nav__menu" id="navMenu">
        <ul class="nav__links">
          <li><a href="index.html"${current("home")}>Home</a></li>
          <li><a href="shop.html"${current("shop")}>Shop</a></li>
          <li><a href="cart.html"${current("cart")}>Cart <span class="cart-badge" id="cartBadge" hidden>0</span></a></li>
        </ul>
        <div class="nav__user" id="navUser"></div>
      </div>
    </nav>
    ${
      isConfigured
        ? ""
        : `<p class="setup-notice" role="alert">Firebase is not set up yet. Open <code>js/firebase-config.js</code> and paste your Firebase settings. The README explains how.</p>`
    }`;

  document.getElementById("site-footer").innerHTML = `
    <div class="footer__inner">
      <strong class="footer__brand">URBAN<span>THREADS</span></strong>
      <p>Casual streetwear for young adults. A student project, not a real store.</p>
    </div>`;

  const toggle = document.getElementById("navToggle");
  toggle.addEventListener("click", () => {
    const open = document.getElementById("navMenu").classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  refreshNavbar();
}

/* shows the user's name and a Log out button, or a Log in button */
function refreshNavbar() {
  const box = document.getElementById("navUser");
  if (!box) return;
  if (currentUser) {
    const name = currentUser.displayName || currentUser.email;
    box.innerHTML = `
      <span class="nav__name" title="${escapeHtml(currentUser.email)}">Hi, ${escapeHtml(name)}</span>
      <button type="button" class="btn btn--small btn--ghost" id="logoutBtn">Log out</button>`;
    document.getElementById("logoutBtn").addEventListener("click", logout);
  } else {
    box.innerHTML = `<a class="btn btn--small" href="login.html">Log in</a>`;
  }
}


/* ============================================================
   5. PRODUCT CARD
   ============================================================ */
export function productCardHtml(product) {
  return `
    <article class="card">
      <div class="card__media">
        <img src="${escapeHtml(product.imageURL)}" alt="${escapeHtml(product.name)}" loading="lazy">
      </div>
      <div class="card__body">
        <span class="card__tag">${escapeHtml(product.category)}</span>
        <h3 class="card__title">${escapeHtml(product.name)}</h3>
        <p class="card__desc">${escapeHtml(product.description)}</p>
        <div class="card__foot">
          <strong class="card__price">${money(product.price)}</strong>
          <button type="button" class="btn btn--small" data-add="${escapeHtml(product.id)}">Add to cart</button>
        </div>
      </div>
    </article>`;
}

/* makes every Add to cart button inside the container work.
   findProduct(id) gives back the product, and thisPage is where to return after login. */
export function bindAddToCart(container, findProduct, thisPage) {
  container.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;

    const user = await authReady;
    if (!user) {
      location.href = `login.html?next=${encodeURIComponent(thisPage)}`;
      return;
    }

    const product = findProduct(button.dataset.add);
    if (!product) return;

    button.disabled = true;
    try {
      await addToCart(product);
      button.textContent = "Added";
      showToast(`${product.name} added to your cart`);
    } catch (error) {
      console.error(error);
      showToast("Could not add that item. Please try again.");
    } finally {
      setTimeout(() => {
        button.textContent = "Add to cart";
        button.disabled = false;
      }, 900);
    }
  });
}
