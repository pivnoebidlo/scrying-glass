// Безопасный мост между окнами и ядром.
import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '../shared/api';

const api: Api = {
  getState: () => ipcRenderer.invoke('state:get'),
  dispatch: (module, name, ...payload) => ipcRenderer.invoke('action', { module, name, payload: payload[0] }),
  onState: (cb) => { ipcRenderer.on('state:changed', (_e, s) => cb(s)); },

  listDisplays: () => ipcRenderer.invoke('displays:list'),
  onDisplaysChanged: (cb) => { ipcRenderer.on('displays:changed', () => cb()); },

  openDisplay: (id) => ipcRenderer.invoke('display:open', id),
  closeDisplay: () => ipcRenderer.invoke('display:close'),
  getDisplayStatus: () => ipcRenderer.invoke('display:status'),
  onDisplayStatus: (cb) => { ipcRenderer.on('display:status', (_e, open) => cb(open)); },
};

contextBridge.exposeInMainWorld('api', api);
