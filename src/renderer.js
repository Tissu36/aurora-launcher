// Aurora Launcher · UI. Made by Whykrushy · Aur Krushy
const api = window.aurora;
const $ = (s) => document.querySelector(s);
let settings = {};
let build = { ok: false };
let gameState = "idle"; // idle | launching | running

let toastT;
function toast(msg, err) {
  const t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3200);
}

function setChip(id, ok, text) {
  const c = $(id); c.classList.toggle("ok", ok === true); c.classList.toggle("bad", ok === false);
  c.querySelector("b").textContent = text;
}

function renderPlay() {
  const btn = $("#play");
  btn.className = "play-btn display";
  if (gameState === "running") { btn.textContent = "In game · Stop"; btn.classList.add("ingame"); }
  else if (gameState === "launching") { btn.textContent = "Launching…"; btn.classList.add("busy"); }
  else if (!build.ok) { btn.textContent = "Set build folder"; btn.classList.add("setup"); }
  else btn.textContent = "Play";
  const name = (settings.displayName || "").trim();
  $("#hello").innerHTML = name ? `Ready up, <b></b>.` : "Set your name in Settings.";
  if (name) $("#hello b").textContent = name;
}

function renderBuild() {
  $("#build-path").textContent = build.buildPath || "No folder picked";
  const note = $("#build-note");
  note.className = "note";
  if (!build.buildPath) note.textContent = "";
  else if (!build.ok) { note.textContent = build.reason; note.classList.add("bad"); }
  else if (build.warning) { note.textContent = build.warning; note.classList.add("warn"); }
  else { note.textContent = "Build found. You're good."; note.classList.add("ok"); }
  setChip("#chip-build", build.ok ? true : false, build.ok ? "28.00 found" : build.buildPath ? "Not found" : "Not set");
  renderPlay();
}

async function pingBackend() {
  const r = await api.pingBackend();
  setChip("#chip-backend", r.ok, r.ok ? "Online" : "Offline");
}

function show(view) {
  document.querySelectorAll(".nav").forEach((n) => n.classList.toggle("on", n.dataset.view === view));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("on", v.id === `view-${view}`));
}

async function pick() {
  const r = await api.pickBuild();
  if (!r) return;
  build = r; renderBuild();
  toast(r.ok ? "Build linked." : r.reason, !r.ok);
}

async function onPlay() {
  if (gameState === "running") { await api.stop(); return; }
  if (!build.ok) { show("library"); return pick(); }
  if (!(settings.displayName || "").trim()) { show("settings"); $("#s-name").focus(); return toast("Pick a display name first.", true); }
  gameState = "launching"; renderPlay();
  const r = await api.launch();
  if (!r.ok) { gameState = "idle"; renderPlay(); return toast(r.reason, true); }
}

function snow() {
  let html = "";
  for (let i = 0; i < 40; i++) {
    const r = Math.random, size = 1.5 + r() * 3;
    html += `<i style="left:${r() * 100}%;top:${r() * 70}%;width:${size}px;height:${size}px;animation-duration:${12 + r() * 16}s;animation-delay:${-r() * 30}s;--dx:${(r() - .5) * 120}px;--o:${.25 + r() * .5}"></i>`;
  }
  $(".snow").innerHTML = html;
}

function bindSettings() {
  const map = { "#s-name": "displayName", "#s-backend": "backendUrl", "#s-site": "websiteUrl", "#s-args": "extraArgs" };
  let t;
  for (const [sel, key] of Object.entries(map)) {
    const el = $(sel); el.value = settings[key] || "";
    el.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        settings = await api.setSettings({ [key]: el.value.trim() });
        renderPlay();
        if (key === "backendUrl") pingBackend();
      }, 400);
    });
  }
  const c = $("#s-close"); c.checked = !!settings.closeOnLaunch;
  c.addEventListener("change", async () => { settings = await api.setSettings({ closeOnLaunch: c.checked }); });
}

async function init() {
  snow();
  $("#min").onclick = () => api.minimize();
  $("#close").onclick = () => api.close();
  document.querySelectorAll(".nav").forEach((n) => n.addEventListener("click", () => show(n.dataset.view)));
  $("#play").onclick = onPlay;
  $("#pick").onclick = pick;
  $("#open-folder").onclick = () => (build.buildPath ? api.openBuild() : toast("Pick a build folder first.", true));
  $("#open-site").onclick = () => (settings.websiteUrl ? api.openExternal(settings.websiteUrl) : (show("settings"), $("#s-site").focus(), toast("Paste your Vercel link in Settings.")));

  api.onGameStatus((d) => {
    if (d.state === "running") { gameState = "running"; toast("Game launched. Have fun."); }
    if (d.state === "closed") { gameState = "idle"; if (d.reason) toast(d.reason, true); }
    renderPlay();
  });

  settings = await api.getSettings();
  bindSettings();
  build = await api.checkBuild();
  renderBuild();
  pingBackend();
  setInterval(pingBackend, 15000);
}
init();
