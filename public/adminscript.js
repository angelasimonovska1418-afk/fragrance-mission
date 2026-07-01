/* ============================================================
   FRAGRANCE MISSION — adminscript.js
   ============================================================ */

const API = "/api";

/* ── Auth check on load ─────────────────────────────────────── */
(async () => {
  const res = await fetch("/api/auth/check").catch(() => null);
  if (!res || !res.ok) window.location.href = "/admin-login.html";
})();

/* ── Logout ─────────────────────────────────────────────────── */
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/admin-login.html";
});

/* ── API helpers ────────────────────────────────────────────── */
async function apiFetch(path, opts = {}) {
  const res  = await fetch(API + path, opts);
  if (res.status === 401) { window.location.href = "/admin-login.html"; return null; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.errors || [data.error || "Request failed"]).join(" "));
  return data;
}

const getPerfumes = (q = "") => apiFetch("/perfumes" + (q ? `?search=${encodeURIComponent(q)}` : ""));
const getStats    = ()        => apiFetch("/stats");
const createP     = (d)       => apiFetch("/perfumes", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(d) });
const updateP     = (id, d)   => apiFetch(`/perfumes/${id}`, { method:"PUT",  headers:{"Content-Type":"application/json"}, body:JSON.stringify(d) });
const deleteP     = (id)      => apiFetch(`/perfumes/${id}`, { method:"DELETE" });

/* ── Util ───────────────────────────────────────────────────── */
const $ = (s, el = document) => el.querySelector(s);
const money = (n) => "$" + Number(n).toLocaleString("en-US");

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("error", isError);
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ── State ──────────────────────────────────────────────────── */
let editingId   = null;
let allPerfumes = [];

/* ── Sidebar navigation ─────────────────────────────────────── */
document.querySelectorAll(".sb-item[data-section]").forEach(item =>
  item.addEventListener("click", () => goToSection(item.dataset.section))
);

function goToSection(name) {
  document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".sb-item").forEach(i => i.classList.remove("active"));
  $(`#section-${name}`)?.classList.add("active");
  $(`.sb-item[data-section="${name}"]`)?.classList.add("active");
  $("#sidebar").classList.remove("open");
  if (name === "dashboard") loadDashboard();
  if (name === "manage")    loadCatalog();
  if (name === "add" && !editingId) resetForm();
}
window.goToSection = goToSection;

/* ── Mobile sidebar ─────────────────────────────────────────── */
const sidebar = $("#sidebar");
$("#sidebarToggle")?.addEventListener("click", () => sidebar.classList.toggle("open"));
document.addEventListener("click", e => {
  if (sidebar.classList.contains("open")
      && !sidebar.contains(e.target)
      && !document.getElementById("sidebarToggle").contains(e.target))
    sidebar.classList.remove("open");
});

/* ── DASHBOARD ──────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    const stats = await getStats();
    if (!stats) return;
    $("#statProducts").textContent = stats.totalProducts;
    $("#statSales").textContent    = money(stats.totalSales);
    $("#statUsers").textContent    = stats.activeUsers.toLocaleString("en-US");
    $("#statProductsTrend").textContent = `${stats.totalProducts} formulas in catalog`;

    const COLORS = {
      "Vanilla":"#e8d3a0","Oud & Wood":"#7a5230","Citrus & Fresh":"#c9d97a",
      "Amber & Spice":"#d68a3a","Floral":"#d9a3a9","Leather":"#8c5a3c",
    };
    const chart  = $("#categoryChart");
    const byTag  = stats.byTag || [];
    const maxCnt = Math.max(...byTag.map(b => b.count), 1);
    chart.innerHTML = byTag.map(b => `
      <div class="chart-item">
        <span class="ci-label">${b._id}</span>
        <div class="ci-bar-wrap">
          <div class="ci-bar" style="width:0%;background:${COLORS[b._id]||'#c9a227'};"></div>
        </div>
        <span class="ci-val">${b.count}</span>
      </div>`).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      chart.querySelectorAll(".ci-bar").forEach((bar, i) => {
        bar.style.width = ((byTag[i].count / maxCnt) * 100) + "%";
      });
    }));
  } catch (err) {
    toast("Could not load stats: " + err.message, true);
  }
}

/* ── CATALOG TABLE ──────────────────────────────────────────── */
async function loadCatalog(query = "") {
  const tbody = $("#catalogTable");
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted-dim);">Loading…</td></tr>`;
  try {
    const list = await getPerfumes(query);
    if (!list) return;
    allPerfumes = list;
    renderTable(allPerfumes);
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Could not load: ${err.message}</td></tr>`;
  }
}

function renderTable(list) {
  const tbody = $("#catalogTable");
  if (!list.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No perfumes found.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td><img class="row-thumb" src="${p.img}" alt="" onerror="this.style.opacity=0"></td>
      <td class="row-name">
        ${p.title}<br>
        <span style="font-size:11px;color:var(--muted);font-weight:400;">${p.brand}</span>
      </td>
      <td><span class="row-tag">${p.tag}</span></td>
      <td>${money(p.price)}</td>
      <td style="text-align:center;font-size:17px;">${p.featured ? "✦" : "—"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-action" title="Edit" data-edit-id="${p._id}">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-action danger" title="Delete" data-del-id="${p._id}">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join("");

  tbody.querySelectorAll("[data-edit-id]").forEach(btn =>
    btn.addEventListener("click", () => startEdit(btn.dataset.editId))
  );
  tbody.querySelectorAll("[data-del-id]").forEach(btn =>
    btn.addEventListener("click", () => confirmDelete(btn.dataset.delId))
  );
}

let searchTimer;
$("#searchInput")?.addEventListener("input", e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadCatalog(e.target.value.trim()), 320);
});

/* ── FORM ───────────────────────────────────────────────────── */
function resetForm() {
  editingId = null;
  $("#perfumeForm").reset();
  $("#formPageTitle").innerHTML    = 'Add New <em>Perfume</em>';
  $("#formPanelTitle").textContent = "New Formula";
  $("#submitBtnLabel").textContent = "Add Perfume";
  $("#cancelEditBtn").style.display = "none";
}

async function startEdit(id) {
  // First try from local cache, then fetch from API
  let p = allPerfumes.find(pp => pp._id === id);
  if (!p) {
    p = await apiFetch(`/perfumes/${id}`).catch(() => null);
  }
  if (!p) { toast("Perfume not found", true); return; }

  editingId = id;
  $("#f-title").value      = p.title    || "";
  $("#f-brand").value      = p.brand    || "";
  $("#f-price").value      = p.price    || "";
  $("#f-tag").value        = p.tag      || "";
  $("#f-notes").value      = p.notes    || "";
  $("#f-desc").value       = p.desc     || "";
  $("#f-img").value        = p.img      || "";
  $("#f-featured").checked = !!p.featured;

  $("#formPageTitle").innerHTML    = `Editing <em>${p.title}</em>`;
  $("#formPanelTitle").textContent = `Editing — ${p.title}`;
  $("#submitBtnLabel").textContent = "Save Changes";
  $("#cancelEditBtn").style.display = "inline-flex";

  goToSection("add");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("#cancelEditBtn")?.addEventListener("click", resetForm);

$("#perfumeForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#submitBtn");
  btn.disabled = true; btn.style.opacity = ".6";

  const payload = {
    title:    $("#f-title").value.trim(),
    brand:    $("#f-brand").value.trim(),
    price:    Number($("#f-price").value),
    tag:      $("#f-tag").value,
    notes:    $("#f-notes").value.trim(),
    desc:     $("#f-desc").value.trim(),
    img:      $("#f-img").value.trim() || undefined,
    featured: $("#f-featured").checked,
  };

  try {
    if (editingId) {
      await updateP(editingId, payload);
      toast(`"${payload.title}" updated`);
    } else {
      await createP(payload);
      toast(`"${payload.title}" added to catalog`);
    }
    resetForm();
    await loadCatalog();
    goToSection("manage");
  } catch (err) {
    toast(err.message || "Could not save", true);
  } finally {
    btn.disabled = false; btn.style.opacity = "1";
  }
});

/* ── Delete ─────────────────────────────────────────────────── */
async function confirmDelete(id) {
  const p    = allPerfumes.find(pp => pp._id === id);
  const name = p ? `"${p.title}"` : "this perfume";
  if (!confirm(`Remove ${name} from the catalog?\n\nThis cannot be undone.`)) return;
  try {
    await deleteP(id);
    toast(`${name} removed`);
    loadCatalog($("#searchInput")?.value.trim() || "");
  } catch (err) {
    toast(err.message || "Could not delete", true);
  }
}

/* ── Init ───────────────────────────────────────────────────── */
loadDashboard();
