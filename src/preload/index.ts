// Безопасный мост между окнами и ядром.
import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '../shared/api';

const api: Api = {
  getState: () => ipcRenderer.invoke('state:get'),
  dispatch: (module, name, ...payload) => ipcRenderer.invoke('action', { module, name, payload: payload[0] }),
  onState: (cb) => { ipcRenderer.on('state:changed', (_e, s) => cb(s)); },

  listCards: () => ipcRenderer.invoke('cards:list'),
  getCard: (ref) => ipcRenderer.invoke('cards:get', ref),
  onCardsChanged: (cb) => { ipcRenderer.on('cards:changed', () => cb()); },
  saveCard: (scope, card) => ipcRenderer.invoke('cards:save', { scope, card }),
  deleteCard: (ref) => ipcRenderer.invoke('cards:delete', ref),
  copyCardDraft: (ref, to) => ipcRenderer.invoke('cards:copyDraft', { ref, to }),
  moveCard: (ref, to) => ipcRenderer.invoke('cards:move', { ref, to }),
  addCardImage: (scope, vaultPath) => ipcRenderer.invoke('cards:addImage', { scope, vaultPath }),
  exportCards: (what) => ipcRenderer.invoke('cards:export', what),
  importCards: () => ipcRenderer.invoke('cards:import'),
  library: () => ipcRenderer.invoke('cards:library'),
  chooseLibrary: (reset) => ipcRenderer.invoke('cards:chooseLibrary', { reset }),
  revealLibrary: () => ipcRenderer.invoke('cards:revealLibrary'),

  listDisplays: () => ipcRenderer.invoke('displays:list'),
  onDisplaysChanged: (cb) => { ipcRenderer.on('displays:changed', () => cb()); },

  openDisplay: (id) => ipcRenderer.invoke('display:open', id),
  closeDisplay: () => ipcRenderer.invoke('display:close'),
  getDisplayStatus: () => ipcRenderer.invoke('display:status'),
  onDisplayStatus: (cb) => { ipcRenderer.on('display:status', (_e, open) => cb(open)); },
};

contextBridge.exposeInMainWorld('api', api);
