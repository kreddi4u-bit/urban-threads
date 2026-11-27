/* ============================================================
   SAMPLE PRODUCTS
   The "Add sample products" button on the Shop page saves these into
   the Firestore collection called products.
   The pictures are drawn with SVG, so no image files are needed.
   To use real photos, change imageURL in Firestore to a photo link.
   ============================================================ */

function toDataUri(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* c = main colour, d = detail colour, bg = background colour */
const SHAPES = {
  hoodie: (c, d, bg) => `
    <path d="M200 175 L105 305 L148 505 L208 495 L218 345 Z" fill="${c}"/>
    <path d="M400 175 L495 305 L452 505 L392 495 L382 345 Z" fill="${c}"/>
    <path d="M200 175 L400 175 L412 525 Q300 548 188 525 Z" fill="${c}"/>
    <path d="M222 160 Q300 60 378 160 Q300 225 222 160 Z" fill="${d}"/>
    <path d="M255 158 Q300 105 345 158 Q300 198 255 158 Z" fill="${bg}" opacity="0.55"/>
    <path d="M282 205 L282 285 M318 205 L318 285" stroke="${d}" stroke-width="7" stroke-linecap="round"/>
    <rect x="238" y="395" width="124" height="66" rx="16" fill="${d}" opacity="0.35"/>`,

  tee: (c, d) => `
    <path d="M205 135 L108 210 L158 282 L205 250 L205 495 L395 495 L395 250 L442 282 L492 210 L395 135 Q300 195 205 135 Z" fill="${c}"/>
    <path d="M205 135 Q300 195 395 135" fill="none" stroke="${d}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="300" cy="345" r="46" fill="${d}" opacity="0.55"/>
    <rect x="266" y="338" width="68" height="12" rx="6" fill="${c}"/>`,

  sneaker: (c, d) => `
    <path d="M88 405 L88 352 Q90 312 140 302 L214 288 Q258 222 312 238 L362 302 Q472 308 522 352 Q542 374 534 405 Z" fill="${c}"/>
    <path d="M214 288 Q262 262 312 238" stroke="${d}" stroke-width="8" fill="none"/>
    <path d="M270 262 L300 296 M300 248 L330 284 M250 276 L280 310" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
    <rect x="76" y="402" width="470" height="44" rx="22" fill="#f4f4f1"/>
    <rect x="76" y="430" width="470" height="16" rx="8" fill="${d}" opacity="0.4"/>`,

  cap: (c, d) => `
    <path d="M150 365 Q150 190 300 190 Q450 190 450 365 Z" fill="${c}"/>
    <path d="M150 365 L450 365 L470 372 Q560 368 575 402 Q470 425 150 392 Z" fill="${d}"/>
    <path d="M300 190 L300 365" stroke="${d}" stroke-width="5" opacity="0.45"/>
    <circle cx="300" cy="190" r="13" fill="${d}"/>`,

  beanie: (c, d) => `
    <path d="M165 370 Q165 175 300 175 Q435 175 435 370 Z" fill="${c}"/>
    <rect x="150" y="360" width="300" height="80" rx="16" fill="${d}"/>
    <path d="M190 365 L190 435 M230 365 L230 435 M270 365 L270 435 M310 365 L310 435 M350 365 L350 435 M390 365 L390 435" stroke="${c}" stroke-width="6" opacity="0.5"/>
    <circle cx="300" cy="160" r="30" fill="${d}"/>`,

  bag: (c, d) => `
    <path d="M175 245 Q300 40 425 245" fill="none" stroke="${d}" stroke-width="16" stroke-linecap="round"/>
    <rect x="150" y="230" width="300" height="250" rx="34" fill="${c}"/>
    <path d="M150 300 Q300 340 450 300" fill="none" stroke="${d}" stroke-width="9"/>
    <rect x="270" y="318" width="60" height="42" rx="12" fill="${d}"/>`,
};

function art(kind, { bg, color, detail }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="${bg}"/>${SHAPES[kind](color, detail, bg)}</svg>`;
  return toDataUri(svg);
}

export const sampleProducts = [
  {
    id: "oversized-hoodie", order: 1, category: "Hoodies", price: 49.99,
    name: "Oversized Hoodie",
    description: "Soft cotton hoodie in oversized fit.",
    imageURL: art("hoodie", { bg: "#e7e2d8", color: "#1c1c1c", detail: "#3a3a3a" }),
  },
  {
    id: "cropped-zip-hoodie", order: 2, category: "Hoodies", price: 54.99,
    name: "Cropped Zip Hoodie",
    description: "Boxy cropped fit with a full front zip.",
    imageURL: art("hoodie", { bg: "#d5dbe2", color: "#5b6b86", detail: "#3d4a61" }),
  },
  {
    id: "heavyweight-pullover", order: 3, category: "Hoodies", price: 64.99,
    name: "Heavyweight Pullover",
    description: "Thick fleece that holds its shape wash after wash.",
    imageURL: art("hoodie", { bg: "#1b1b1b", color: "#d7ff3a", detail: "#a6c92a" }),
  },
  {
    id: "boxy-graphic-tee", order: 4, category: "T-shirts", price: 24.99,
    name: "Boxy Graphic Tee",
    description: "Heavy cotton tee with a boxy cut and a chest print.",
    imageURL: art("tee", { bg: "#e9d9c9", color: "#fbfaf7", detail: "#1c1c1c" }),
  },
  {
    id: "essential-tee-2-pack", order: 5, category: "T-shirts", price: 34.99,
    name: "Essential Tee 2-Pack",
    description: "Two everyday tees in washed black and bone.",
    imageURL: art("tee", { bg: "#d9e2d3", color: "#202020", detail: "#555555" }),
  },
  {
    id: "vintage-wash-tee", order: 6, category: "T-shirts", price: 27.99,
    name: "Vintage Wash Tee",
    description: "Sun-faded wash for that worn-in look.",
    imageURL: art("tee", { bg: "#1f2a37", color: "#8fa3b8", detail: "#5c7087" }),
  },
  {
    id: "street-runner", order: 7, category: "Sneakers", price: 89.99,
    name: "Street Runner",
    description: "Lightweight runner with a cushioned sole.",
    imageURL: art("sneaker", { bg: "#d9d4ca", color: "#f4f4f1", detail: "#1c1c1c" }),
  },
  {
    id: "high-top-canvas", order: 8, category: "Sneakers", price: 69.99,
    name: "High-Top Canvas",
    description: "Classic canvas high-top built for daily wear.",
    imageURL: art("sneaker", { bg: "#e3e8ec", color: "#1c1c1c", detail: "#d7ff3a" }),
  },
  {
    id: "chunky-trainer", order: 9, category: "Sneakers", price: 99.99,
    name: "Chunky Trainer",
    description: "Platform sole and layered panels for extra height.",
    imageURL: art("sneaker", { bg: "#f0e9df", color: "#8a8f98", detail: "#0e0e0e" }),
  },
  {
    id: "everyday-cap", order: 10, category: "Accessories", price: 19.99,
    name: "Everyday Cap",
    description: "Six-panel cotton cap with an adjustable strap.",
    imageURL: art("cap", { bg: "#dfe3d6", color: "#1c1c1c", detail: "#3d3d3d" }),
  },
  {
    id: "ribbed-beanie", order: 11, category: "Accessories", price: 16.99,
    name: "Ribbed Beanie",
    description: "Stretch rib knit that keeps you warm.",
    imageURL: art("beanie", { bg: "#1b1b1b", color: "#d7ff3a", detail: "#9fbf1f" }),
  },
  {
    id: "crossbody-bag", order: 12, category: "Accessories", price: 29.99,
    name: "Crossbody Bag",
    description: "Compact water-resistant bag with an adjustable strap.",
    imageURL: art("bag", { bg: "#e6e1d6", color: "#2a2a2a", detail: "#d7ff3a" }),
  },
];
