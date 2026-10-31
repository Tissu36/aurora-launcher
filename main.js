// Aurora Launcher · main process. Made by Whykrushy · Aur Krushy
const { app, BrowserWindow, ipcMain, dialog, shell, net } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const EXE_REL = path.join("FortniteGame", "Binaries", "Win64", "FortniteClient-Win64-Shipping.exe");
const SETTINGS_FILE = () => path.join(app.getPath("userData"), "settings.json");

const DEFAULTS = {
  buildPath: "",
  displayName: "",
  backendUrl: "http://127.0.0.1:3551",
  websiteUrl: "",
  closeOnLaunch: false,
  extraArgs: "",
};

function readSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE(), "utf8")) }; }
  catch { return { ...DEFAULTS }; }
}
function writeSettings(next) {
  const merged = { ...readSettings(), ...next };
  fs.mkdirSync(path.dirname(SETTINGS_FILE()), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(merged, null, 2));
  return merged;
}

function checkBuild(buildPath) {
  if (!buildPath) return { ok: false, reason: "No build folder picked yet." };
  const exe = path.join(buildPath, EXE_REL);
  if (!fs.existsSync(exe)) return { ok: false, reason: "Can't find FortniteClient-Win64-Shipping.exe in that folder. Pick the folder that has FortniteGame + Engine inside." };
  const looks28 = /28[._-]?\d{0,2}/.test(path.basename(buildPath));
  return { ok: true, exe, warning: looks28 ? "" : "Folder name doesn't say 28.xx. Make sure it's the Chapter 5 Season 1 build." };
}

let win;
let game = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1120,
    height: 700,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    backgroundColor: "#0b1024",
    title: "Aurora Launcher",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, "src", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

const send = (ch, data) => win && !win.isDestroyed() && win.webContents.send(ch, data);

ipcMain.handle("win:minimize", () => win.minimize());
ipcMain.handle("win:close", () => win.close());

ipcMain.handle("settings:get", () => readSettings());
ipcMain.handle("settings:set", (_e, patch) => writeSettings(patch));

ipcMain.handle("build:pick", async () => {
  const r = await dialog.showOpenDialog(win, { title: "Pick your 28.00 build folder", properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return null;
  const buildPath = r.filePaths[0];
  writeSettings({ buildPath });
  return { buildPath, ...checkBuild(buildPath) };
});
ipcMain.handle("build:check", () => { const s = readSettings(); return { buildPath: s.buildPath, ...checkBuild(s.buildPath) }; });
ipcMain.handle("build:open", () => { const s = readSettings(); if (s.buildPath) shell.openPath(s.buildPath); });

ipcMain.handle("backend:ping", async () => {
  const { backendUrl } = readSettings();
  if (!backendUrl) return { ok: false };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 2500);
  try { const res = await net.fetch(backendUrl, { signal: ctrl.signal }); return { ok: res.status < 500, status: res.status }; }
  catch { return { ok: false }; }
  finally { clearTimeout(t); }
});

ipcMain.handle("open:external", (_e, url) => { if (/^https?:\/\//.test(url || "")) shell.openExternal(url); });

ipcMain.handle("game:launch", () => {
  if (game) return { ok: false, reason: "Game's already running." };
  const s = readSettings();
  const b = checkBuild(s.buildPath);
  if (!b.ok) return { ok: false, reason: b.reason };
  const name = (s.displayName || "").trim();
  if (!name) return { ok: false, reason: "Set a display name in Settings first." };

  const args = [
    "-epicapp=Fortnite",
    "-epicenv=Prod",
    "-epiclocale=en-us",
    "-epicportal",
    "-skippatchcheck",
    "-nobe",
    "-fromfl=eac",
    `-AUTH_LOGIN=${name}@aurora.dev`,
    "-AUTH_PASSWORD=aurora",
    "-AUTH_TYPE=epic",
    ...String(s.extraArgs || "").split(/\s+/).filter(Boolean),
  ];

  try {
    game = spawn(b.exe, args, { cwd: path.dirname(b.exe), detached: false, stdio: "ignore" });
  } catch (err) {
    game = null;
    return { ok: false, reason: `Couldn't start the game: ${err.message}` };
  }
  game.on("error", (err) => { game = null; send("game:status", { state: "closed", reason: err.message }); });
  game.on("exit", (code) => { game = null; send("game:status", { state: "closed", code }); });
  send("game:status", { state: "running" });
  if (s.closeOnLaunch) setTimeout(() => win.minimize(), 1500);
  return { ok: true, args };
});

ipcMain.handle("game:stop", () => { if (game) { game.kill(); return true; } return false; });
