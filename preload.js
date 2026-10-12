// Безопасный мост между окнами и ядром.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getState: () => ipcRenderer.invoke('state:get'),
  dispatch: (module, name, payload) => ipcRenderer.invoke('action', { module, name, payload }),
  onState: (cb) => ipcRenderer.on('state:changed', (_e, s) => cb(s)),

  listDisplays: () => ipcRenderer.invoke('displays:list'),
  onDisplaysChanged: (cb) => ipcRenderer.on('displays:changed', () => cb()),

  openDisplay: (id) => ipcRenderer.invoke('display:open', id),
  closeDisplay: () => ipcRenderer.invoke('display:close'),
  getDisplayStatus: () => ipcRenderer.invoke('display:status'),
  onDisplayStatus: (cb) => ipcRenderer.on('display:status', (_e, open) => cb(open)),

  revealCampaign: () => ipcRenderer.invoke('campaign:reveal'),
});
