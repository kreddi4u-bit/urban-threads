// Shop page: loads every product from Firestore and lets people filter, search and sort.
import {
  renderChrome, isConfigured, authReady, db, collection, doc, getDocs, writeBatch,
  productCardHtml, bindAddToCart, CATEGORIES, showToast,
} from "./app.js";

renderChrome("shop");

const grid = document.getElementById("productGrid");
const chips = document.getElementById("categoryChips");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const message = document.getElementById("shopMessage");
const resultCount = document.getElementById("resultCount");

let products = [];
const filters = {
  category: new URLSearchParams(location.search).get("category") || "All",
  search: "",
  sort: "featured",
};

/* ---------- loading ---------- */
async function loadProducts() {
  if (!isConfigured) {
    message.textContent = "Connect Firebase to see the products.";
    return;
  }
  message.textContent = "Loading products...";
  try {
    const snapshot = await getDocs(collection(db, "products"));
    products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    message.textContent = "";
    if (products.length === 0) {
      await showEmptyStore();
      return;
    }
    if (filters.category !== "All" && !products.some((p) => p.category === filters.category)) {
      filters.category = "All";
    }
    drawChips();
    draw();
  } catch (error) {
    console.error(error);
    message.textContent = "The products could not be loaded. Check your Firebase settings and rules.";
  }
}

/* when the collection is empty, a logged-in user can add the sample products */
async function showEmptyStore() {
  grid.innerHTML = "";
  chips.innerHTML = "";
  resultCount.textContent = "";
  const user = await authReady;
  message.innerHTML = user
    ? `<p>The store has no products yet.</p>
       <button type="button" class="btn" id="seedBtn">Add sample products</button>`
    : `<p>The store has no products yet. <a href="login.html?next=shop.html">Log in</a> to add the sample products.</p>`;

  const seedBtn = document.getElementById("seedBtn");
  if (seedBtn) seedBtn.addEventListener("click", seedProducts);
}

async function seedProducts() {
  const button = document.getElementById("seedBtn");
  button.disabled = true;
  button.textContent = "Adding...";
  try {
    const { sampleProducts } = await import("./seed-data.js");
    const batch = writeBatch(db);
    sampleProducts.forEach(({ id, ...data }) => batch.set(doc(db, "products", id), data));
    await batch.commit();
    showToast("Sample products added");
    await loadProducts();
  } catch (error) {
    console.error(error);
    message.innerHTML = `<p>The products could not be added. Check your Firestore rules (see the README).</p>`;
  }
}

/* ---------- showing ---------- */
function drawChips() {
  const found = [...new Set(products.map((p) => p.category))];
  const ordered = [
    ...CATEGORIES.filter((name) => found.includes(name)),
    ...found.filter((name) => !CATEGORIES.includes(name)),
  ];
  chips.innerHTML = ["All", ...ordered]
    .map(
      (name) =>
        `<button type="button" class="chip" data-category="${name}" aria-pressed="${filters.category === name}">${name}</button>`
    )
    .join("");
}

function visibleProducts() {
  const term = filters.search.trim().toLowerCase();
  const list = products.filter(
    (p) =>
      (filters.category === "All" || p.category === filters.category) &&
      (!term || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term))
  );
  const sorters = {
    featured: (a, b) => (a.order ?? 999) - (b.order ?? 999),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  return list.sort(sorters[filters.sort]);
}

function draw() {
  const list = visibleProducts();
  grid.innerHTML = list.length
    ? list.map((product) => productCardHtml(product)).join("")
    : `<p class="message">No products match your search.</p>`;
  resultCount.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
}

/* ---------- controls ---------- */
chips.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-category]");
  if (!chip) return;
  filters.category = chip.dataset.category;
  drawChips();
  draw();
});

searchInput.addEventListener("input", () => {
  filters.search = searchInput.value;
  draw();
});

sortSelect.addEventListener("change", () => {
  filters.sort = sortSelect.value;
  draw();
});

bindAddToCart(grid, (id) => products.find((p) => p.id === id), "shop.html");
loadProducts();