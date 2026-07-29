/* ═══════════════════════════════════════════════════
   WEARS NONA · app.js  v2.0
   Full functionality — no external dependencies
═══════════════════════════════════════════════════ */

/* ── CONFIG ──────────────────────────────────────── */
const GAS = "https://script.google.com/macros/s/AKfycbzGKZcJMkrW7Wcs6G2dHTDl-taig5vjsmbO7VHLJ_zHlXbW0x4e0pc9rnRSvFMjsm8QAA/exec";

/* ── TRX COUNTER ─────────────────────────────────── */
/* Simple sequential ID: TRX-001, TRX-002, etc. */
function getNextTrxId() {
  const key = "wn-trx-counter";
  const n = (parseInt(localStorage.getItem(key) || "0") || 0) + 1;
  localStorage.setItem(key, n);
  return "TRX-" + String(n).padStart(3, "0");
}

/* ── CATALOG ─────────────────────────────────────── */
/*
  Stock is display-only. Actual stock reduction happens on admin side.
  To update stock: change the `stock` values below.
*/
const CATALOG = [
  {
    id:    "aluna-pleats",
    name:  "Aluna Pleats",
    tag:   "Pleated Series",
    badge: "best",
    price: 155000,
    originalPrice: 165000,
    images: [
      "assets/products/aluna-pleats/1.jpg",
      "assets/products/aluna-pleats/2.jpg",
      "assets/products/aluna-pleats/3.jpg",
      "assets/products/aluna-pleats/4.jpg",
      "assets/products/aluna-pleats/5.jpg"
    ],
    sizeChartImg: "assets/size-chart-aluna.jpg",
    desc: "Aluna Pleats is where effortless meets intentional. Flowing pleats that move with you — soft, structured, and endlessly versatile. Perfect for campus, work, coffee dates, or any moment you want to feel like yourself.",
    sizes: [
      { label: "S–M",  price: 155000, stock: 7 },
      { label: "L–XL", price: 155000, stock: 8 }
    ]
  },
  {
    id:    "naya-pleats",
    name:  "Naya Pleats",
    tag:   "Pleated Series",
    badge: "new",
    price: 155000,
    originalPrice: 165000,
    images: [
      "assets/products/naya-pleats/1.jpg",
      "assets/products/naya-pleats/2.jpg",
      "assets/products/naya-pleats/3.jpg",
      "assets/products/naya-pleats/4.jpg"
    ],
    sizeChartImg: "assets/size-chart-naya.jpg",
    desc: "Naya Pleats is your go-to for that quiet luxury vibe. Clean lines, feminine silhouette, and the kind of detail that makes people stop and ask — where did you get that? Every single time.",
    sizes: [
      { label: "S–M",  price: 155000, stock: 12 },
      { label: "L–XL", price: 155000, stock: 12 }
    ]
  }
];

/* ── STATE ───────────────────────────────────────── */
let cart         = JSON.parse(localStorage.getItem("wn-cart")     || "[]");
let wishlist     = JSON.parse(localStorage.getItem("wn-wishlist") || "[]");
let activeProd   = null;
let selSize      = null;
let currentQty   = 1;
let galIdx       = 0;
let heroIdx      = 0;
let heroTimer    = null;
let payMethod    = "";
let proofB64     = "";
let proofFileObj = null;
let prevPage     = "home";

/* ══════════════════════════════════════════════════
   LAUNCH CAMPAIGN POPUP
   Shows on every page load (no Local Storage — in-memory only)
══════════════════════════════════════════════════ */
function openLaunchPopup() {
  const modal = document.getElementById("launch-popup");
  if (!modal) return;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLaunchPopup(e) {
  if (e && e.target !== document.getElementById("launch-popup") &&
      !e.currentTarget?.classList.contains("launch-popup-close")) return;
  const modal = document.getElementById("launch-popup");
  if (modal) modal.classList.remove("open");
  document.body.style.overflow = "";
}

function maybeShowLaunchPopup() {
  setTimeout(openLaunchPopup, 1400);
}

/* ══════════════════════════════════════════════════
   LOADER
══════════════════════════════════════════════════ */
window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("hidden");
  }, 1200);
});

/* ══════════════════════════════════════════════════
   ROUTING
══════════════════════════════════════════════════ */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + id);
  if (el) el.classList.add("active");
  window.scrollTo(0, 0);
  syncNav(id);
}

function goHome() {
  prevPage = "home";
  showPage("home");
  startHeroSlideshow();
}

function goCart() {
  prevPage = "cart";
  showPage("cart");
  renderCart();
}

function goBack() {
  if (prevPage === "product" && activeProd) showPage("product");
  else goHome();
}

function syncNav(page) {
  const nav  = document.getElementById("nav");
  const logo = nav?.querySelector(".nav-logo-img");
  if (page === "home") {
    nav?.classList.remove("solid");
    if (logo) logo.style.filter = "brightness(0) invert(1)";
  } else {
    nav?.classList.add("solid");
    if (logo) logo.style.filter = "none";
  }
}

/* Nav scroll */
window.addEventListener("scroll", () => {
  if (!document.getElementById("page-home")?.classList.contains("active")) return;
  const solid = window.scrollY > 80;
  const nav   = document.getElementById("nav");
  const logo  = nav?.querySelector(".nav-logo-img");
  nav?.classList.toggle("solid", solid);
  if (logo) logo.style.filter = solid ? "none" : "brightness(0) invert(1)";
}, { passive: true });

/* ══════════════════════════════════════════════════
   HERO SLIDESHOW
══════════════════════════════════════════════════ */
function startHeroSlideshow() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => heroStep(1), 5000);
}

function goSlide(idx) {
  heroIdx = idx;
  const slides = document.querySelectorAll(".hero-slide");
  const dots   = document.querySelectorAll(".hero-dot");
  slides.forEach((s, i) => s.classList.toggle("active", i === idx));
  dots.forEach((d, i) => d.classList.toggle("on", i === idx));
  clearInterval(heroTimer);
  heroTimer = setInterval(() => heroStep(1), 5000);
}

function heroStep(dir) {
  const slides = document.querySelectorAll(".hero-slide");
  heroIdx = (heroIdx + dir + slides.length) % slides.length;
  goSlide(heroIdx);
}

/* ══════════════════════════════════════════════════
   PRODUCT GRID (Homepage)
══════════════════════════════════════════════════ */
function renderGrid() {
  const grid = document.getElementById("pgrid");
  if (!grid) return;

  grid.innerHTML = CATALOG.map(p => {
    const minPrice  = Math.min(...p.sizes.map(s => s.price));
    const maxPrice  = Math.max(...p.sizes.map(s => s.price));
    const totalStock = p.sizes.reduce((a, s) => a + s.stock, 0);
    const badge = p.badge === "best"
      ? `<span class="pcard-badge b-best">Best Seller</span>`
      : `<span class="pcard-badge b-new">New</span>`;
    const stockLabel = totalStock === 0
      ? `<span class="pcard-stock">Sold Out</span>`
      : totalStock <= 10
        ? `<span class="pcard-stock low">Only ${totalStock} left</span>`
        : `<span class="pcard-stock">In Stock</span>`;
    const inWishlist = wishlist.includes(p.id);

    return `
      <article class="pcard" onclick="openProduct('${p.id}')" role="listitem" aria-label="${p.name}">
        <div class="pcard-img">
          <img src="${p.images[0]}" alt="${p.name}" loading="lazy"
               onerror="this.style.visibility='hidden'"/>
          ${badge}
          <button class="pcard-wish ${inWishlist ? 'wished' : ''}"
                  onclick="event.stopPropagation();toggleWishlistItem('${p.id}')"
                  aria-label="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
            <svg width="14" height="13" viewBox="0 0 18 17" fill="${inWishlist ? 'currentColor' : 'none'}">
              <path d="M9 15.5S1 10.5 1 5a4 4 0 018 0 4 4 0 018 0c0 5.5-8 10.5-8 10.5z"
                    stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="pcard-hover-cta">View Product</button>
        </div>
        <div class="pcard-body">
          <div class="pcard-name">${p.name}</div>
          <div class="pcard-sub">${p.tag}</div>
          <div class="pcard-price-row">
            ${p.originalPrice ? `<span class="pcard-price-old">${fmt(p.originalPrice)}</span>` : ''}
          </div>
          <div class="pcard-bottom">
            <div class="pcard-price">
              ${maxPrice > minPrice ? `<span class="pcard-from">from </span>` : ''}${fmt(minPrice)}
            </div>
            ${stockLabel}
          </div>
          <div class="pcard-promo">
            <span class="promo-tag">Special Launch Price</span>
            <span class="promo-tag ship">Free Shipping</span>
          </div>
        </div>
      </article>`;
  }).join("");
}

/* ══════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
══════════════════════════════════════════════════ */
function openProduct(id) {
  const p = CATALOG.find(x => x.id === id);
  if (!p) return;

  activeProd  = p;
  selSize     = null;
  currentQty  = 1;
  galIdx      = 0;
  prevPage    = "product";
  clearInterval(heroTimer);

  /* Meta */
  setEl("pdp-crumb-name", p.name);
  setEl("pdp-tag", p.tag);
  setEl("pdp-h1", p.name);
  setEl("qty-val", 1);
  setEl("sel-motif-lbl", "");
  setEl("acc-desc-body", p.desc);

  /* Price & stock */
  const minPrice = Math.min(...p.sizes.map(s => s.price));
  setEl("pdp-price", fmt(minPrice));
  setEl("pdp-price-old", p.originalPrice ? fmt(p.originalPrice) : "");

  const totalStock = p.sizes.reduce((a, s) => a + s.stock, 0);
  const badge = document.getElementById("pdp-stock-badge");
  if (badge) {
    if (totalStock === 0) { badge.textContent = "Sold Out"; badge.className = "pdp-stock-badge out"; }
    else if (totalStock <= 10) { badge.textContent = `Only ${totalStock} left`; badge.className = "pdp-stock-badge low"; }
    else { badge.textContent = "In Stock"; badge.className = "pdp-stock-badge avail"; }
  }

  /* Wishlist button */
  updateWishlistBtn(p.id);

  /* Size pills */
  const pillsEl = document.getElementById("size-pills");
  if (pillsEl) {
    pillsEl.innerHTML = p.sizes.map(s => {
      const soldOut = s.stock === 0;
      const lowStock = s.stock > 0 && s.stock <= 5;
      return `
        <button class="pill ${soldOut ? 'sold-out' : ''}"
                onclick="${soldOut ? '' : `pickSize(this,'${s.label}',${s.price},${s.stock})`}"
                aria-label="Size ${s.label}${soldOut ? ' – Sold out' : ''}"
                ${soldOut ? 'disabled aria-disabled="true"' : ''}>
          ${s.label}
          ${lowStock ? `<span class="pill-stock">${s.stock} left</span>` : ''}
        </button>`;
    }).join("");
  }

  /* Qty hint */
  setEl("stock-hint", "");

  /* Galleries */
  buildGalDesk(p.images, p.name);
  buildGalMob(p.images, p.name);

  showPage("product");
}

function pickSize(el, label, price, stock) {
  document.querySelectorAll("#size-pills .pill").forEach(b => b.classList.remove("on"));
  el.classList.add("on");
  selSize = { label, price, stock };
  setEl("pdp-price", fmt(price));
  setEl("stock-hint", stock <= 5 ? `Only ${stock} left` : "");
}

function adjQty(d) {
  const max = selSize ? selSize.stock : 99;
  currentQty = Math.min(max, Math.max(1, currentQty + d));
  setEl("qty-val", currentQty);
}

/* ── Gallery — Desktop ───────────────────────────── */
function buildGalDesk(imgs, name) {
  const thumbs = document.getElementById("gal-thumbs");
  if (thumbs) {
    thumbs.innerHTML = imgs.map((src, i) => `
      <div class="gal-thumb ${i === 0 ? "on" : ""}" onclick="setGalImg(${i})" role="listitem"
           tabindex="0" onkeydown="if(event.key==='Enter')setGalImg(${i})"
           aria-label="View photo ${i + 1}">
        <img src="${src}" alt="${name} photo ${i + 1}" loading="lazy"/>
      </div>`).join("");
  }
  const main = document.getElementById("gal-main-img");
  if (main) { main.src = imgs[0]; main.alt = name; }
}

function setGalImg(i) {
  if (!activeProd) return;
  galIdx = i;
  const main = document.getElementById("gal-main-img");
  if (main) {
    main.classList.add("fade");
    setTimeout(() => { main.src = activeProd.images[i]; main.classList.remove("fade"); }, 220);
  }
  document.querySelectorAll(".gal-thumb").forEach((t, j) => t.classList.toggle("on", j === i));
  const sw = document.getElementById("gal-swipe");
  if (sw) sw.scrollTo({ left: sw.offsetWidth * i, behavior: "smooth" });
}

function galStep(dir) {
  if (!activeProd) return;
  setGalImg((galIdx + dir + activeProd.images.length) % activeProd.images.length);
}

/* ── Gallery — Mobile swipe ──────────────────────── */
function buildGalMob(imgs, name) {
  const sw = document.getElementById("gal-swipe");
  if (sw) {
    sw.innerHTML = imgs.map((src, i) => `
      <div class="gal-swipe-slide" role="listitem">
        <img src="${src}" alt="${name} photo ${i + 1}" loading="lazy"/>
      </div>`).join("");

    sw.addEventListener("scroll", () => {
      const idx = Math.round(sw.scrollLeft / sw.offsetWidth);
      galIdx = idx;
      document.querySelectorAll(".gal-dot").forEach((d, j) => d.classList.toggle("on", j === idx));
      document.querySelectorAll(".gal-thumb").forEach((t, j) => t.classList.toggle("on", j === idx));
      const mi = document.getElementById("gal-main-img");
      if (mi && activeProd) mi.src = activeProd.images[idx] || activeProd.images[0];
    }, { passive: true });
  }

  const dots = document.getElementById("gal-dots");
  if (dots) {
    dots.innerHTML = imgs.map((_, i) => `
      <button class="gal-dot ${i === 0 ? "on" : ""}"
              onclick="swipeToImg(${i})" aria-label="Photo ${i + 1}" role="tab"></button>`).join("");
  }
}

function swipeToImg(i) {
  const sw = document.getElementById("gal-swipe");
  if (sw) sw.scrollTo({ left: sw.offsetWidth * i, behavior: "smooth" });
}

/* ── Size chart modal ────────────────────────────── */
function openSizeChart() {
  if (!activeProd) return;
  const img = document.getElementById("size-chart-img");
  const missing = document.getElementById("size-chart-missing");
  if (img) { img.style.display = ""; img.src = activeProd.sizeChartImg; }
  if (missing) missing.style.display = "none";
  const modal = document.getElementById("size-modal");
  if (modal) modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSizeChart(e) {
  if (e && e.target !== document.getElementById("size-modal") && !e.currentTarget?.classList.contains("size-modal-close")) return;
  document.getElementById("size-modal")?.classList.remove("open");
  document.body.style.overflow = "";
}

/* ══════════════════════════════════════════════════
   WISHLIST
══════════════════════════════════════════════════ */
function toggleWishlist() {
  const drawer  = document.getElementById("wishlist-drawer");
  const overlay = document.getElementById("wishlist-overlay");
  const isOpen  = drawer?.classList.contains("open");
  drawer?.classList.toggle("open", !isOpen);
  overlay?.classList.toggle("show", !isOpen);
  document.body.style.overflow = isOpen ? "" : "hidden";
  if (!isOpen) renderWishlist();
}

function toggleWishlistItem(id) {
  /* Called from product grid (with id) or from PDP button (no id) */
  const pid = id || activeProd?.id;
  if (!pid) return;
  const idx = wishlist.indexOf(pid);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast("Removed from wishlist");
  } else {
    wishlist.push(pid);
    showToast("Saved to wishlist 🤍");
  }
  saveWishlist();
  updateWishlistBtn(pid);
  renderGrid(); // refresh heart icons
}

function updateWishlistBtn(pid) {
  const btn   = document.getElementById("wishlist-toggle-btn");
  const label = document.getElementById("wishlist-btn-label");
  if (!btn || !label) return;
  const wished = wishlist.includes(pid);
  btn.classList.toggle("wished", wished);
  label.textContent = wished ? "Saved to Wishlist ♥" : "Save to Wishlist";
  const svg = btn.querySelector("path");
  if (svg) svg.setAttribute("fill", wished ? "currentColor" : "none");
}

function renderWishlist() {
  const el = document.getElementById("wishlist-items");
  if (!el) return;
  if (!wishlist.length) {
    el.innerHTML = `<p style="font-size:.8rem;color:var(--stone);text-align:center;padding:2rem 0;">
      Your wishlist is empty.<br>
      <button onclick="toggleWishlist();document.getElementById('collection').scrollIntoView({behavior:'smooth'})"
              style="margin-top:.5rem;font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;
                     color:var(--accent);text-decoration:underline;text-underline-offset:3px;">
        Explore Collection
      </button>
    </p>`;
    return;
  }
  el.innerHTML = wishlist.map(id => {
    const p = CATALOG.find(x => x.id === id);
    if (!p) return "";
    return `
      <div class="wish-item">
        <div class="wish-img">
          <img src="${p.images[0]}" alt="${p.name}" loading="lazy"/>
        </div>
        <div style="flex:1;">
          <div class="wish-name">${p.name}</div>
          <div class="wish-sub">${p.tag}</div>
          <div class="wish-sub">${fmt(Math.min(...p.sizes.map(s => s.price)))}</div>
          <div class="wish-actions">
            <button class="wish-shop-btn" onclick="toggleWishlist();openProduct('${p.id}')">
              Shop Now
            </button>
            <button class="wish-rm-btn" onclick="toggleWishlistItem('${p.id}');renderWishlist()">
              Remove
            </button>
          </div>
        </div>
      </div>`;
  }).join("");
}

function saveWishlist() {
  localStorage.setItem("wn-wishlist", JSON.stringify(wishlist));
  const count = document.getElementById("wishlist-count");
  if (count) {
    count.textContent = wishlist.length;
    count.style.display = wishlist.length ? "flex" : "none";
  }
}

/* ══════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════ */
function doAddToCart() {
  if (!selSize)           { showToast("Please select a size first"); return; }
  if (selSize.stock === 0){ showToast("Sorry, this size is sold out"); return; }

  const key = activeProd.id + "|" + selSize.label;
  const ex  = cart.find(c => c.key === key);
  if (ex) {
    ex.qty = Math.min(ex.qty + currentQty, selSize.stock);
  } else {
    cart.push({
      key,
      id:    activeProd.id,
      name:  activeProd.name,
      img:   activeProd.images[0],
      size:  selSize.label,
      harga: selSize.price,
      qty:   Math.min(currentQty, selSize.stock)
    });
  }
  saveCart();
  showToast(`${activeProd.name} added to cart ✓`);

  /* Bump animation on badge */
  const badge = document.getElementById("nav-count");
  badge?.classList.remove("bump");
  setTimeout(() => badge?.classList.add("bump"), 10);
  setTimeout(() => badge?.classList.remove("bump"), 300);

  setTimeout(() => goCart(), 800);
}

function renderCart() {
  const el    = document.getElementById("cart-items");
  const count = document.getElementById("cart-item-count");
  if (!el) return;

  const totalItems = cart.reduce((a, c) => a + c.qty, 0);
  if (count) count.textContent = `${totalItems} item${totalItems !== 1 ? "s" : ""}`;

  if (!cart.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:2rem 1rem;">
        <p style="font-size:.82rem;color:var(--stone);">Your cart is empty.</p>
        <button onclick="goHome()"
          style="margin-top:.75rem;font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;
                 color:var(--accent);text-decoration:underline;text-underline-offset:3px;">
          Start Shopping
        </button>
      </div>`;
  } else {
    el.innerHTML = cart.map((c, i) => `
      <div class="ci">
        <div class="ci-img">
          <img src="${c.img}" alt="${c.name}" loading="lazy"
               onerror="this.style.visibility='hidden'"/>
        </div>
        <div class="ci-body">
          <div class="ci-name">${c.name}</div>
          <div class="ci-meta">Size ${c.size}</div>
          <div class="ci-foot">
            <div class="ci-qctrl">
              <button class="cqbtn" onclick="cQty(${i},-1)" aria-label="Decrease">−</button>
              <span class="cqval">${c.qty}</span>
              <button class="cqbtn" onclick="cQty(${i},1)"  aria-label="Increase">+</button>
            </div>
            <div class="ci-price">${fmt(c.harga * c.qty)}</div>
          </div>
          <button class="ci-del" onclick="cDel(${i})">Remove</button>
        </div>
      </div>`).join("");
  }

  /* Summary */
  const lines = document.getElementById("sum-lines");
  let total = 0;
  if (lines) {
    lines.innerHTML = cart.map(c => {
      const s = c.harga * c.qty; total += s;
      return `<div class="sum-row">
        <span>${c.name} · Size ${c.size} ×${c.qty}</span>
        <span>${fmt(s)}</span>
      </div>`;
    }).join("");
  }
  const tv = document.getElementById("sum-total-val");
  if (tv) tv.textContent = fmt(total);
}

function cQty(i, d) {
  cart[i].qty = Math.max(1, cart[i].qty + d);
  saveCart(); renderCart();
}
function cDel(i)   { cart.splice(i, 1); saveCart(); renderCart(); }

/* ══════════════════════════════════════════════════
   PAYMENT
══════════════════════════════════════════════════ */
function selPay(method, el) {
  payMethod = method;
  document.querySelectorAll(".pay-opt").forEach(o => o.classList.remove("on"));
  el.classList.add("on");
  document.querySelectorAll(".pay-info").forEach(d => d.classList.remove("show"));
  document.getElementById("pi-" + method)?.classList.add("show");
  const dl = document.getElementById("payment-deadline");
  if (dl) dl.style.display = "flex";
}

function copyNum(n) {
  navigator.clipboard.writeText(n)
    .then(() => showToast("Account number copied ✓"))
    .catch(() => showToast("Copy failed — please copy manually"));
}

/* ══════════════════════════════════════════════════
   UPLOAD
══════════════════════════════════════════════════ */
function handleProof(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast("File too large (max 5MB)"); return; }
  proofFileObj = file;
  const r = new FileReader();
  r.onload = e => {
    proofB64 = e.target.result.split(",")[1];
    const prev = document.getElementById("proof-preview-img");
    const wrap = document.getElementById("proof-wrap");
    if (prev) prev.src = e.target.result;
    if (wrap) wrap.style.display = "block";
  };
  r.readAsDataURL(file);
}

function clearProof() {
  proofFileObj = null; proofB64 = "";
  const fi = document.getElementById("proof-file");
  const pw = document.getElementById("proof-wrap");
  if (fi) fi.value = "";
  if (pw) pw.style.display = "none";
}

/* ══════════════════════════════════════════════════
   SUBMIT ORDER
══════════════════════════════════════════════════ */
async function submitOrder() {
  const nama    = document.getElementById("f-nama")?.value.trim();
  const hp      = document.getElementById("f-hp")?.value.trim();
  const alamat  = document.getElementById("f-alamat")?.value.trim();
  const kodepos = document.getElementById("f-kodepos")?.value.trim();
  const catatan = document.getElementById("f-catatan")?.value.trim();

  if (!cart.length)            { showToast("Your cart is empty!"); return; }
  if (!nama || !hp || !alamat) { showToast("Please fill in all required fields."); return; }
  if (!kodepos)                { showToast("Please enter your postal code."); return; }
  if (!payMethod)              { showToast("Please choose a payment method."); return; }
  if (!proofFileObj)           { showToast("Please upload your transfer proof 📎"); return; }

  const btn = document.getElementById("submit-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Processing…"; }

  const trxId = getNextTrxId();
  const total  = cart.reduce((a, c) => a + c.harga * c.qty, 0);

  const payload = {
    orderId:     trxId,
    tanggal:     new Date().toLocaleString("id-ID"),
    nama, hp,
    alamat:      alamat + (kodepos ? ", " + kodepos : ""),
    catatan:     catatan || "-",
    metodeBayar: payMethod === "blu" ? "BLU by BCA Digital" : "SeaBank",
    total,
    cart: JSON.stringify(cart.map(c => ({
      produk: c.name, ukuran: c.size,
      qty: c.qty, harga: c.harga, subtotal: c.harga * c.qty
    }))),
    buktiBase64: proofB64,
    buktiNama:   proofFileObj.name
  };

  try {
    await fetch(GAS, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
    const soid = document.getElementById("s-oid");
    if (soid) soid.textContent = trxId;
    document.getElementById("success")?.classList.add("open");
  } catch (_) {
    showToast("Failed to submit. Please check your connection and try again.");
  }

  if (btn) { btn.disabled = false; btn.textContent = "Place Order  →"; }
}

function resetAll() {
  cart = []; saveCart();
  proofFileObj = null; proofB64 = ""; payMethod = "";
  clearProof();
  ["f-nama","f-hp","f-alamat","f-kodepos","f-catatan"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  document.querySelectorAll(".pay-opt").forEach(o => o.classList.remove("on"));
  document.querySelectorAll(".pay-info").forEach(d => d.classList.remove("show"));
  const dl = document.getElementById("payment-deadline");
  if (dl) dl.style.display = "none";
  document.getElementById("success")?.classList.remove("open");
  goHome();
}

/* ══════════════════════════════════════════════════
   INFO MODALS (Shipping / Payment / FAQ)
══════════════════════════════════════════════════ */
const INFO_CONTENT = {
  shipping: {
    title: "Shipping",
    body: `
      <p>We ship from <strong>Bandung, Indonesia</strong>.</p>
      <p>Orders are processed within 1–2 business days after payment is confirmed.</p>
      <p><strong>Regular Shipping</strong> — Available nationwide via JNE, J&T, and SiCepat.</p>
      <p><strong>Same-Day Delivery</strong> — Available in certain areas upon confirmation.
         Please message us on WhatsApp before placing your order.</p>
      <p>Shipping costs are calculated at checkout and confirmed via WhatsApp.</p>
      <p>Admin WhatsApp: <a href="https://wa.me/62816660415" target="_blank" rel="noopener">+62 816-6604-15</a></p>
    `
  },
  payment: {
    title: "Payment",
    body: `
      <p>We accept bank transfer to the following accounts:</p>
      <p><strong>BLU by BCA Digital</strong><br>090139820956 · a.n. Dena Resti</p>
      <p><strong>SeaBank</strong><br>901945376335 · a.n. Dena Resti</p>
      <p>Please complete payment within <strong>24 hours</strong> of placing your order.
         Orders will be automatically cancelled after the payment deadline.</p>
      <p>After transferring, please upload your proof of payment during checkout.</p>
      <p>Need help? Admin WhatsApp: <a href="https://wa.me/62816660415" target="_blank" rel="noopener">+62 816-6604-15</a></p>
    `
  },
  faq: {
    title: "FAQ",
    body: `
      <p><strong>How do I know my order was received?</strong><br>
         You'll see a confirmation screen with your Transaction ID after placing your order.
         Our team will also reach out via WhatsApp.</p>
      <p><strong>Can I return or exchange?</strong><br>
         Returns are accepted within 3 days for manufacturing defects only.
         Please contact us via WhatsApp with photos of the issue.</p>
      <p><strong>How long does shipping take?</strong><br>
         Regular shipping typically takes 2–5 business days depending on your location.</p>
      <p><strong>What if my size is sold out?</strong><br>
         Follow us on Instagram or TikTok @wearsnona for restock announcements.</p>
    `
  }
};

function showInfoModal(key) {
  const content = INFO_CONTENT[key];
  if (!content) return;
  setEl("info-modal-title", content.title);
  const body = document.getElementById("info-modal-body");
  if (body) body.innerHTML = content.body;
  document.getElementById("info-modal")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeInfoModal(e) {
  if (e && e.target !== document.getElementById("info-modal") &&
      !e.currentTarget?.classList.contains("info-modal-close")) return;
  document.getElementById("info-modal")?.classList.remove("open");
  document.body.style.overflow = "";
}

/* ══════════════════════════════════════════════════
   ACCORDION
══════════════════════════════════════════════════ */
function togAcc(row) {
  const body = row.nextElementSibling;
  const ico  = row.querySelector(".acc-ico");
  const open = body.classList.toggle("open");
  if (ico)  { ico.classList.toggle("open", open); ico.textContent = open ? "−" : "+"; }
  row.setAttribute("aria-expanded", open);
}

/* ══════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════ */
function fmt(n) { return "Rp " + Number(n).toLocaleString("id-ID"); }
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function saveCart() {
  localStorage.setItem("wn-cart", JSON.stringify(cart));
  const badge = document.getElementById("nav-count");
  if (badge) badge.textContent = cart.reduce((a, c) => a + c.qty, 0);
}

let _toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ══════════════════════════════════════════════════
   DRAG & DROP UPLOAD
══════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  const uz = document.getElementById("upzone");
  if (!uz) return;
  uz.addEventListener("dragover",  e => { e.preventDefault(); uz.classList.add("drag"); });
  uz.addEventListener("dragleave", () => uz.classList.remove("drag"));
  uz.addEventListener("drop",      e => {
    e.preventDefault(); uz.classList.remove("drag");
    const f = e.dataTransfer.files[0]; if (f) handleProof(f);
  });
});

/* Desktop main image touch swipe */
document.addEventListener("DOMContentLoaded", () => {
  const mi = document.getElementById("gal-main-img");
  if (!mi) return;
  let _tx = 0;
  mi.addEventListener("touchstart", e => { _tx = e.touches[0].clientX; }, { passive: true });
  mi.addEventListener("touchend",   e => {
    const dx = e.changedTouches[0].clientX - _tx;
    if (Math.abs(dx) > 40 && activeProd) galStep(dx < 0 ? 1 : -1);
  }, { passive: true });
});

/* Keyboard close for modals */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeSizeChart();
    closeInfoModal();
    closeLaunchPopup();
    const wd = document.getElementById("wishlist-drawer");
    if (wd?.classList.contains("open")) toggleWishlist();
  }
});

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  renderGrid();
  saveCart();
  saveWishlist();
  syncNav("home");
  startHeroSlideshow();
  maybeShowLaunchPopup();
});
