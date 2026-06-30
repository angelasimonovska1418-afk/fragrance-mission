/* ============================================================
   FRAGRANCE MISSION — script.js (Main Frontend)
   All data fetched from /api/perfumes  (Express + MongoDB)
   ============================================================ */

const API = "/api";

/* ── API helpers ────────────────────────────────────────────── */
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.errors || [data.error || "Request failed"]).join(" "));
  return data;
}
const getPerfumes = (tag) =>
  apiFetch("/perfumes" + (tag && tag !== "All" ? `?tag=${encodeURIComponent(tag)}` : ""));

/* ── Constants ──────────────────────────────────────────────── */
const TAGS = ["Vanilla", "Oud & Wood", "Citrus & Fresh", "Amber & Spice", "Floral", "Leather"];
const TAG_COLOR = {
  "Vanilla":"#e8d3a0","Oud & Wood":"#7a5230","Citrus & Fresh":"#c9d97a",
  "Amber & Spice":"#d68a3a","Floral":"#d9a3a9","Leather":"#8c5a3c"
};
const PILLARS = [
  { tag:"Vanilla",       title:"Vanilla",        desc:"Warm, creamy, and unapologetically sensual — our most worn family." },
  { tag:"Oud & Wood",    title:"Oud & Wood",     desc:"Dense resins and dry forests. Grounded, regal, unmistakable." },
  { tag:"Citrus & Fresh",title:"Citrus & Fresh", desc:"Bright, sparkling, mineral-clean. Momentum in a bottle." },
  { tag:"Amber & Spice", title:"Amber & Spice",  desc:"Golden resin and spiced heat. Magnetic at close range." },
];
const QUIZ_MAP = {
  "Oud & Wood":    ["Royal Oud Reserve","Leather & Smoke","Mystical Wood"],
  "Citrus & Fresh":["Citron Royale","Bergamot Breeze","Oceanic Blue"],
  "Vanilla":       ["Noir Vanille Mission","White Vanilla Musk","Velvet Tobacco"],
  "Amber & Spice": ["Amber Absolute","Golden Frankincense","Spicy Saffron Noir"],
};
const VIBE_IDX = { bold:0, fresh:1, sensual:2, refined:0 };

/* ── State ──────────────────────────────────────────────────── */
const state = {
  view:        "home",
  activeFilter:"All",
  cart:        JSON.parse(localStorage.getItem("fm_cart") || "[]"),
  quizStep:    0,
  quizAnswers: {},
};

/* ── Util ───────────────────────────────────────────────────── */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => "$" + Number(n).toLocaleString("en-US");
const persistCart = () => localStorage.setItem("fm_cart", JSON.stringify(state.cart));

function showToast(msg, isError = false) {
  const t = $("#global-toast");
  t.textContent = msg;
  t.style.borderColor = isError ? "#c0584a" : "";
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 2400);
}

function bottleSVG(color = "#ecc874") {
  return `<svg viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bsvg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="#8a6a3a"/>
    </linearGradient></defs>
    <rect x="38" y="8"  width="24" height="18" rx="4" fill="url(#bsvg)" opacity=".85"/>
    <rect x="44" y="0"  width="12" height="10" rx="2" fill="${color}" opacity=".85"/>
    <path d="M30 26h40c4 0 6 3 6 7v100c0 14-11 23-26 23h0c-15 0-26-9-26-23V33c0-4 2-7 6-7z"
          fill="none" stroke="url(#bsvg)" stroke-width="2"/>
  </svg>`;
}

/* ── Navigation ─────────────────────────────────────────────── */
window.addEventListener("scroll", () =>
  $("#navbar").classList.toggle("scrolled", window.scrollY > 30)
);
$("#menuToggle").addEventListener("click", () =>
  $("#navLinks").classList.toggle("mobile-open")
);

function setActiveNav(view) {
  $$(".nav-links a[data-view]").forEach(a =>
    a.classList.toggle("active", a.dataset.view === view)
  );
}

function navigateTo(view) {
  state.view = view;
  $$(".view").forEach(v => v.classList.remove("active"));
  $(`#${view}-view`).classList.add("active");
  setActiveNav(view);
  window.scrollTo({ top: 0, behavior: "smooth" });
  $("#navLinks").classList.remove("mobile-open");
  if (view === "shop") renderShop();
  if (view === "quiz") { state.quizStep = 0; state.quizAnswers = {}; $$(".q-opt").forEach(o => o.classList.remove("selected")); renderQuizStep(); }
  requestAnimationFrame(() =>
    $$(`#${view}-view .reveal`).forEach(el => el.classList.add("in-view"))
  );
}

$$("a[data-view]").forEach(a =>
  a.addEventListener("click", e => { e.preventDefault(); navigateTo(a.dataset.view); })
);

/* ── Dropdowns ──────────────────────────────────────────────── */
$("#cartBtn").addEventListener("click",   e => { e.stopPropagation(); toggleDD("#cartDropdown"); });
$("#profileBtn").addEventListener("click",e => { e.stopPropagation(); toggleDD("#profileDropdown"); });
document.addEventListener("click", () => $$(".dropdown").forEach(d => d.classList.remove("open")));
function toggleDD(sel) {
  const dd = $(sel), open = dd.classList.contains("open");
  $$(".dropdown").forEach(d => d.classList.remove("open"));
  if (!open) dd.classList.add("open");
}

/* ── Cart ───────────────────────────────────────────────────── */
function addToCart(p, btn) {
  const ex = state.cart.find(c => c.id === p._id);
  if (ex) ex.qty++;
  else state.cart.push({ id: p._id, title: p.title, price: p.price, img: p.img, qty: 1 });
  persistCart();
  renderCart();
  if (btn) {
    btn.classList.remove("added");
    requestAnimationFrame(() => btn.classList.add("added"));
    setTimeout(() => btn.classList.remove("added"), 900);
  }
  showToast(`${p.title} added to your bag`);
}
function removeFromCart(id) {
  state.cart = state.cart.filter(c => c.id !== id);
  persistCart();
  renderCart();
}
function renderCart() {
  const qty = state.cart.reduce((s, c) => s + c.qty, 0);
  const badge = $("#cartCount");
  badge.textContent = qty;
  badge.classList.toggle("show", qty > 0);
  badge.classList.add("pulse");
  setTimeout(() => badge.classList.remove("pulse"), 450);

  if (!state.cart.length) {
    $("#cartItemsWrap").innerHTML = `<div class="cart-empty">Your bag is empty.</div>`;
    $("#cartTotalWrap").innerHTML = "";
    return;
  }
  let total = 0;
  $("#cartItemsWrap").innerHTML = state.cart.map(c => {
    total += c.price * c.qty;
    return `<div class="cart-item">
      <img src="${c.img}" alt="" onerror="this.style.display='none'">
      <div style="flex:1">
        <div class="ci-name">${c.title}</div>
        <div class="ci-meta">${money(c.price)} × ${c.qty}</div>
      </div>
      <button class="mini-btn" onclick="removeFromCart('${c.id}')">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>`;
  }).join("");
  $("#cartTotalWrap").innerHTML =
    `<div class="cart-total"><span>Subtotal</span><span>${money(total)}</span></div>`;
}

/* ── Pillars ────────────────────────────────────────────────── */
function renderPillars() {
  $("#pillarsRow").innerHTML = PILLARS.map(p => `
    <div class="glass note-pillar reveal">
      <div class="ni" style="background:${TAG_COLOR[p.tag]};box-shadow:0 0 18px ${TAG_COLOR[p.tag]}88;"></div>
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
    </div>`).join("");
}

/* ── Product card HTML ──────────────────────────────────────── */
function cardHTML(p, idx) {
  const tColor = TAG_COLOR[p.tag] || "#c9a227";
  return `
  <div class="p-card glass" data-id="${p._id}" style="transition-delay:${(idx % 6) * 60}ms;">
    <div class="media">
      <div class="bottle-fallback" style="background:radial-gradient(circle,${tColor}33,transparent 70%);">
        ${bottleSVG(tColor)}
      </div>
      <img src="${p.img}" alt="${p.title}" loading="lazy"
           onload="this.classList.add('loaded')" onerror="this.style.display='none'">
      <div class="media-shade"></div>
      <span class="tag-chip">${p.tag}</span>
    </div>
    <div class="body">
      <div class="brand-line">${p.brand}</div>
      <h3>${p.title}</h3>
      <div class="notes-line">${p.notes}</div>
      <div class="foot">
        <span class="price">${money(p.price)}</span>
        <button class="add-btn" data-pid="${p._id}">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

function wireAddBtns(scopeEl, list) {
  $$(".add-btn", scopeEl).forEach(btn =>
    btn.addEventListener("click", () => {
      const p = list.find(pp => pp._id === btn.dataset.pid);
      if (p) addToCart(p, btn);
    })
  );
}

/* ── Featured (home) ────────────────────────────────────────── */
async function renderFeatured() {
  try {
    const list = await getPerfumes();
    const grid = $("#featuredGrid");
    grid.innerHTML = list.slice(0, 6).map((p, i) => cardHTML(p, i)).join("");
    wireAddBtns(grid, list);
  } catch {
    $("#featuredGrid").innerHTML = `<div class="empty-state">Could not load collection — is the server running?</div>`;
  }
}

/* ── Shop ───────────────────────────────────────────────────── */
function renderFilterBar() {
  $("#filterBar").innerHTML = ["All", ...TAGS].map(t =>
    `<button class="pill ${state.activeFilter === t ? "active" : ""}" data-tag="${t}">${t}</button>`
  ).join("");
  $$("#filterBar .pill").forEach(btn =>
    btn.addEventListener("click", () => {
      state.activeFilter = btn.dataset.tag;
      renderFilterBar();
      filterShopGrid();
    })
  );
}

async function renderShop() {
  renderFilterBar();
  const grid = $("#shopGrid");
  grid.innerHTML = `<div class="loading-state">Loading collection…</div>`;
  try {
    const list = await getPerfumes(state.activeFilter);
    if (!list.length) { grid.innerHTML = `<div class="empty-state">No formulas match this note yet.</div>`; return; }
    grid.innerHTML = list.map((p, i) => cardHTML(p, i)).join("");
    wireAddBtns(grid, list);
  } catch {
    grid.innerHTML = `<div class="empty-state">Could not load collection — is the server running?</div>`;
  }
}

async function filterShopGrid() {
  const grid = $("#shopGrid");
  $$(".p-card", grid).forEach(c => c.classList.add("fading-out"));
  await new Promise(r => setTimeout(r, 260));
  try {
    const list = await getPerfumes(state.activeFilter);
    if (!list.length) { grid.innerHTML = `<div class="empty-state">No formulas match this note yet.</div>`; return; }
    grid.innerHTML = list.map((p, i) =>
      cardHTML(p, i).replace('class="p-card glass"', 'class="p-card glass fading-in"')
    ).join("");
    wireAddBtns(grid, list);
    requestAnimationFrame(() =>
      $$(".p-card", grid).forEach((c, i) => setTimeout(() => c.classList.remove("fading-in"), i * 50))
    );
  } catch {
    grid.innerHTML = `<div class="empty-state">Could not load collection.</div>`;
  }
}

/* ── Quiz ───────────────────────────────────────────────────── */
function renderQuizStep() {
  $$(".q-step").forEach(s => s.classList.toggle("active", +s.dataset.step === state.quizStep));
  $$(".quiz-progress span").forEach(s => {
    const i = +s.dataset.i;
    s.classList.toggle("active", i === state.quizStep);
    s.classList.toggle("done",   i < state.quizStep);
  });
  $("#quizBack").style.visibility    = state.quizStep === 0 ? "hidden" : "visible";
  $("#quizRestart").style.display    = state.quizStep === 3 ? "inline-flex" : "none";
  if (state.quizStep === 3) buildQuizResult();
}

$$(".q-opt").forEach(opt =>
  opt.addEventListener("click", () => {
    $$(".q-opt", opt.closest(".q-options")).forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    state.quizAnswers[+opt.closest(".q-options").dataset.q] = opt.dataset.val;
    setTimeout(() => { state.quizStep = Math.min(3, state.quizStep + 1); renderQuizStep(); }, 380);
  })
);

$("#quizBack").addEventListener("click", () => {
  state.quizStep = Math.max(0, state.quizStep - 1);
  renderQuizStep();
});
$("#quizRestart").addEventListener("click", () => {
  state.quizStep = 0; state.quizAnswers = {};
  $$(".q-opt").forEach(o => o.classList.remove("selected"));
  renderQuizStep();
});

async function buildQuizResult() {
  const wrap = $("#quizResultWrap");
  wrap.innerHTML = `<div class="q-eyebrow" style="text-align:center;">Finding your match…</div>`;
  try {
    const noteAns = state.quizAnswers[2] || "Vanilla";
    const vibeAns = state.quizAnswers[0] || "sensual";
    const list    = await getPerfumes();
    const titles  = QUIZ_MAP[noteAns] || [];
    const idx     = VIBE_IDX[vibeAns] ?? 0;
    const p = list.find(pp => pp.title === titles[idx % titles.length])
           || list.find(pp => pp.tag   === noteAns)
           || list[0];

    wrap.innerHTML = `
      <div class="q-eyebrow" style="text-align:center;">Your Match</div>
      <div class="result-bottle">${bottleSVG(TAG_COLOR[p.tag] || "#ecc874")}</div>
      <h2>${p.title}</h2>
      <div class="r-brand">${p.brand} — ${money(p.price)}</div>
      <p class="r-desc">${p.desc} Dominant notes: ${p.notes}.</p>
      <div class="copy-toast" id="copyToast">Code copied to clipboard ✓</div>
      <div class="code-box" id="codeBox">
        <span class="code-txt">MISSION15</span>
        <span class="copy-flag">Tap to copy — 15% off</span>
      </div>
      <div style="margin-top:8px;">
        <button class="btn btn-gold btn-sm" id="quizAddBtn">Add to Bag</button>
      </div>`;

    $("#codeBox").addEventListener("click", () => {
      navigator.clipboard?.writeText("MISSION15").catch(() => {});
      $("#codeBox").classList.add("copied");
      const toast = $("#copyToast"); toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1800);
    });
    $("#quizAddBtn").addEventListener("click", () => { addToCart(p); navigateTo("shop"); });
  } catch {
    wrap.innerHTML = `<div class="empty-state">Couldn't find a match — is the server running?</div>`;
  }
}

/* ── Scroll reveal ──────────────────────────────────────────── */
const io = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
  { threshold: 0.14 }
);
const observeReveals = () => $$(".reveal").forEach(el => io.observe(el));

/* ── Init ───────────────────────────────────────────────────── */
renderPillars();
renderFeatured();
renderCart();
observeReveals();
setActiveNav("home");
