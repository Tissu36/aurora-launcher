const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("aurora", {
  minimize: () => ipcRenderer.invoke("win:minimize"),
  close: () => ipcRenderer.invoke("win:close"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (patch) => ipcRenderer.invoke("settings:set", patch),
  pickBuild: () => ipcRenderer.invoke("build:pick"),
  checkBuild: () => ipcRenderer.invoke("build:check"),
  openBuild: () => ipcRenderer.invoke("build:open"),
  pingBackend: () => ipcRenderer.invoke("backend:ping"),
  openExternal: (url) => ipcRenderer.invoke("open:external", url),
  launch: () => ipcRenderer.invoke("game:launch"),
  stop: () => ipcRenderer.invoke("game:stop"),
  onGameStatus: (fn) => ipcRenderer.on("game:status", (_e, d) => fn(d)),
});
