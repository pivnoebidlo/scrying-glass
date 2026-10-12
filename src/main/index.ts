// Ядро: окна, единое состояние, сохранение кампании, загрузка модулей.
import { app, BrowserWindow, ipcMain, screen, dialog, shell, protocol, net, type WebPreferences } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { moduleList } from '../modules';
import type { Action, ModuleContext, ModuleDef } from '../shared/module';
import type { AppState } from '../shared/types';
import type { DisplayInfo } from '../shared/api';

// Внутри ядра модули обрабатываются одинаково, без привязки к конкретным типам.
type AnyModule = ModuleDef<string, any, Record<string, Action<any>>>;
const modules: Record<string, AnyModule> = Object.fromEntries(moduleList.map((m) => [m.id, m as AnyModule]));

// ---- Схема для картинок кампании: sg-asset://p/<id> ----
protocol.registerSchemesAsPrivileged([
  { scheme: 'sg-asset', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

let campaignDir: string, assetsDir: string, campaignFile: string;
const state = {} as AppState;
const stateById = state as Record<string, unknown>;
let controlWindow: BrowserWindow | null = null;
let displayWindow: BrowserWindow | null = null;

const webPreferences: WebPreferences = {
  preload: path.join(__dirname, '../preload/index.js'),
  contextIsolation: true,
  nodeIntegration: false,
};

// В разработке страницы отдаёт dev-сервер Vite, в собранном приложении они лежат рядом.
function loadPage(win: BrowserWindow, page: 'control' | 'display') {
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) win.loadURL(`${devUrl}/${page}/index.html`);
  else win.loadFile(path.join(__dirname, `../renderer/${page}/index.html`));
}

// ---------- Кампания: загрузка и сохранение ----------
function initCampaign() {
  campaignDir = path.join(app.getPath('userData'), 'campaign');
  assetsDir = path.join(campaignDir, 'assets');
  campaignFile = path.join(campaignDir, 'campaign.json');
  fs.mkdirSync(assetsDir, { recursive: true });

  let saved: Record<string, unknown> = {};
  try {
    saved = JSON.parse(fs.readFileSync(campaignFile, 'utf8')).modules || {};
  } catch { /* первый запуск */ }

  for (const mod of Object.values(modules)) {
    stateById[mod.id] = { ...mod.initialState, ...(mod.persist ? (saved[mod.id] as object) : {}) };
  }
  // Необязательный хук: модуль может подготовить своё состояние при запуске.
  for (const mod of Object.values(modules)) {
    if (mod.init) stateById[mod.id] = mod.init(stateById[mod.id], ctx);
  }
}

function saveCampaign() {
  const out = { version: 1, modules: {} as Record<string, unknown> };
  for (const mod of Object.values(modules)) {
    if (mod.persist) out.modules[mod.id] = stateById[mod.id];
  }
  fs.writeFileSync(campaignFile, JSON.stringify(out, null, 2));
}

// ---------- Рассылка состояния ----------
function broadcastState() {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('state:changed', state);
  }
}

function notifyDisplayStatus() {
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('display:status', !!displayWindow);
  }
}

// ---------- Окна ----------
function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    title: 'Scrying Glass — управление',
    backgroundColor: '#1b1a24',
    webPreferences,
  });
  loadPage(controlWindow, 'control');
  controlWindow.on('closed', () => {
    controlWindow = null;
    closeDisplay();
  });
}

function listDisplays(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    primary: d.id === primaryId,
    label: `Экран ${i + 1} (${d.size.width}×${d.size.height})${d.id === primaryId ? ' — основной' : ''}`,
  }));
}

function closeDisplay() {
  if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
  displayWindow = null;
  notifyDisplayStatus();
}

function openDisplay(displayId: number) {
  closeDisplay();

  const displays = screen.getAllDisplays();
  const target = displays.find((d) => d.id === displayId) || displays[0]!;

  // Если выбран тот же экран, где окно управления, открываем обычное окно-превью.
  const controlDisplay = controlWindow ? screen.getDisplayMatching(controlWindow.getBounds()) : null;
  const fullscreen = !(controlDisplay && controlDisplay.id === target.id);

  const b = target.bounds;
  const win = new BrowserWindow(
    fullscreen
      ? { x: b.x, y: b.y, width: b.width, height: b.height, frame: false, show: false, backgroundColor: '#000000', webPreferences }
      : { x: b.x + 100, y: b.y + 100, width: 960, height: 540, title: 'Scrying Glass — экран игроков (превью)', show: false, backgroundColor: '#000000', webPreferences }
  );
  displayWindow = win;

  loadPage(win, 'display');
  win.once('ready-to-show', () => {
    win.show();
    if (fullscreen) {
      if (process.platform === 'darwin') win.setSimpleFullScreen(true);
      else win.setFullScreen(true);
    }
  });
  win.on('closed', () => {
    if (displayWindow === win) displayWindow = null;
    notifyDisplayStatus();
  });
  notifyDisplayStatus();
}

// ---------- IPC ----------
// Контекст, который получают действия модулей.
const ctx: ModuleContext = {
  dialog,
  appRoot: app.getAppPath(),
  get assetsDir() { return assetsDir; },
  get controlWindow() { return controlWindow; },
};

ipcMain.handle('state:get', () => state);

// Любое изменение состояния идёт через действие модуля: dispatch(модуль, действие, данные).
ipcMain.handle('action', async (_event, { module: id, name, payload }: { module: string; name: string; payload: unknown }) => {
  const mod = modules[id];
  const fn = mod?.actions[name];
  if (!mod || !fn) return state;
  stateById[id] = await fn(stateById[id], payload || {}, ctx);
  if (mod.persist) saveCampaign();
  broadcastState();
  return state;
});

ipcMain.handle('displays:list', () => listDisplays());
ipcMain.handle('display:open', (_event, id: number) => openDisplay(id));
ipcMain.handle('display:close', () => closeDisplay());
ipcMain.handle('display:status', () => !!displayWindow);
ipcMain.handle('campaign:reveal', () => shell.openPath(campaignDir));

// ---------- Запуск ----------
app.whenReady().then(() => {
  initCampaign();

  // Картинки запрашиваются по id: sg-asset://p/<id>. Каждый модуль сам знает, где лежит файл.
  protocol.handle('sg-asset', (request) => {
    const id = decodeURIComponent(new URL(request.url).pathname.replace(/^\//, ''));
    for (const mod of Object.values(modules)) {
      const file = mod.resolveAsset?.(stateById[mod.id], id, ctx);
      if (file && fs.existsSync(file)) return net.fetch(pathToFileURL(file).toString());
    }
    return new Response('Not found', { status: 404 });
  });

  createControlWindow();

  const refresh = () => {
    if (controlWindow && !controlWindow.isDestroyed()) controlWindow.webContents.send('displays:changed');
  };
  screen.on('display-added', refresh);
  screen.on('display-removed', refresh);
});

app.on('window-all-closed', () => app.quit());
