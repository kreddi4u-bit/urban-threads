// Home page: shows four featured products from Firestore.
import {
  renderChrome, isConfigured, db, collection, getDocs,
  productCardHtml, bindAddToCart,
} from "./app.js";

renderChrome("home");

const grid = document.getElementById("featuredGrid");
let products = [];

async function loadFeatured() {
  if (!isConfigured) {
    grid.innerHTML = `<p class="message">Connect Firebase to see products here.</p>`;
    return;
  }
  try {
    const snapshot = await getDocs(collection(db, "products"));
    products = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const featured = products.slice(0, 4);
    grid.innerHTML = featured.length
      ? featured.map((product) => productCardHtml(product)).join("")
      : `<p class="message">No products yet. Open the <a href="shop.html">shop</a> to add the sample products.</p>`;
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<p class="message">The products could not be loaded. Check your Firebase settings and rules.</p>`;
  }
}

bindAddToCart(grid, (id) => products.find((p) => p.id === id), "index.html");
loadFeatured();