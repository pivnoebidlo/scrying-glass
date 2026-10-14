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
  saveCard: (scope, card, folder) => ipcRenderer.invoke('cards:save', { scope, card, folder }),
  deleteCard: (ref) => ipcRenderer.invoke('cards:delete', ref),
  setSrdPortraits: (ref, portraits) => ipcRenderer.invoke('cards:setSrdPortraits', { ref, portraits }),
  discardCardImages: (scope, paths, ownedOnly) => ipcRenderer.invoke('cards:discardImages', { scope, paths, ownedOnly }),
  copyCardDraft: (ref, to, folder) => ipcRenderer.invoke('cards:copyDraft', { ref, to, folder }),
  moveCard: (ref, to, folder) => ipcRenderer.invoke('cards:move', { ref, to, folder }),
  addCardImage: (scope, vaultPath, folder, fromClipboard) => ipcRenderer.invoke('cards:addImage', { scope, vaultPath, folder, fromClipboard }),
  exportCards: (what) => ipcRenderer.invoke('cards:export', what),
  pickImportFiles: () => ipcRenderer.invoke('cards:pickImport'),
  importCards: (files, scope, folder) => ipcRenderer.invoke('cards:import', { files, scope, folder }),
  library: () => ipcRenderer.invoke('cards:library'),
  chooseLibrary: (reset) => ipcRenderer.invoke('cards:chooseLibrary', { reset }),
  revealLibrary: () => ipcRenderer.invoke('cards:revealLibrary'),

  onVaultRescan: (cb) => { ipcRenderer.on('vault:rescanned', () => cb()); },
  readNote: (path) => ipcRenderer.invoke('notes:read', path),
  writeNote: (path, note) => ipcRenderer.invoke('notes:write', { path, note }),
  createNote: (folder, title, note) => ipcRenderer.invoke('notes:create', { folder, title, note }),
  renameNote: (path, title) => ipcRenderer.invoke('notes:rename', { path, title }),

  readTable: (path) => ipcRenderer.invoke('tables:read', path),
  listLibraryTables: () => ipcRenderer.invoke('tables:listLibrary'),
  seedLibraryTables: (files, restore) => ipcRenderer.invoke('tables:seed', { files, restore }),
  trashLibraryTable: (path) => ipcRenderer.invoke('tables:trash', path),
  onTablesChanged: (cb) => { ipcRenderer.on('tables:changed', () => cb()); },
  writeTable: (path, text) => ipcRenderer.invoke('tables:write', { path, text }),
  createTable: (folder, title, text) => ipcRenderer.invoke('tables:create', { folder, title, text }),
  exportAdventure: (name) => ipcRenderer.invoke('packs:export', name),
  importAdventure: () => ipcRenderer.invoke('packs:import'),
  listBackups: () => ipcRenderer.invoke('backups:list'),
  createBackup: () => ipcRenderer.invoke('backups:create'),
  restoreBackup: (id, parts) => ipcRenderer.invoke('backups:restore', { id, ...parts }),
  revealBackups: () => ipcRenderer.invoke('backups:reveal'),
  readLibraryData: (name) => ipcRenderer.invoke('library:readData', name),
  writeLibraryData: (name, data) => ipcRenderer.invoke('library:writeData', { name, data }),
  openFile: (path) => ipcRenderer.invoke('vault:openFile', path),

  listDisplays: () => ipcRenderer.invoke('displays:list'),
  onDisplaysChanged: (cb) => { ipcRenderer.on('displays:changed', () => cb()); },

  openDisplay: (id) => ipcRenderer.invoke('display:open', id),
  closeDisplay: () => ipcRenderer.invoke('display:close'),
  getDisplayStatus: () => ipcRenderer.invoke('display:status'),
  onDisplayStatus: (cb) => { ipcRenderer.on('display:status', (_e, open) => cb(open)); },
};

contextBridge.exposeInMainWorld('api', api);
