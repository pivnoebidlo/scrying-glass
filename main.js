// Ядро: окна, единое состояние, сохранение кампании, загрузка модулей.
const { app, BrowserWindow, ipcMain, screen, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// ---- Модули. Чтобы добавить новый, положите его в modules/ и впишите сюда. ----
const modules = {};
for (const name of ['core', 'portraits']) {
  const mod = require(`./modules/${name}/main.js`);
  modules[mod.id] = mod;
}

// ---- Схема для картинок кампании: sg-asset://assets/<файл> ----
protocol.registerSchemesAsPrivileged([
  { scheme: 'sg-asset', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

let campaignDir, assetsDir, campaignFile;
let state = {};
let controlWindow = null;
let displayWindow = null;

const webPreferences = {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
};

// ---------- Кампания: загрузка и сохранение ----------
function initCampaign() {
  campaignDir = path.join(app.getPath('userData'), 'campaign');
  assetsDir = path.join(campaignDir, 'assets');
  campaignFile = path.join(campaignDir, 'campaign.json');
  fs.mkdirSync(assetsDir, { recursive: true });

  let saved = {};
  try {
    saved = JSON.parse(fs.readFileSync(campaignFile, 'utf8')).modules || {};
  } catch (_) { /* первый запуск */ }

  for (const mod of Object.values(modules)) {
    state[mod.id] = { ...mod.initialState, ...(mod.persist ? saved[mod.id] : {}) };
  }
  // Необязательный хук: модуль может подготовить своё состояние при запуске.
  for (const mod of Object.values(modules)) {
    if (mod.init) state[mod.id] = mod.init(state[mod.id], ctx);
  }
}

function saveCampaign() {
  const out = { version: 1, modules: {} };
  for (const mod of Object.values(modules)) {
    if (mod.persist) out.modules[mod.id] = state[mod.id];
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
  controlWindow.loadFile(path.join(__dirname, 'control', 'index.html'));
  controlWindow.on('closed', () => {
    controlWindow = null;
    closeDisplay();
  });
}

function listDisplays() {
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

function openDisplay(displayId) {
  closeDisplay();

  const displays = screen.getAllDisplays();
  const target = displays.find((d) => d.id === displayId) || displays[0];

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

  win.loadFile(path.join(__dirname, 'display', 'index.html'));
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
const ctx = {
  dialog,
  appRoot: __dirname,
  get assetsDir() { return assetsDir; },
  get controlWindow() { return controlWindow; },
};

ipcMain.handle('state:get', () => state);

// Любое изменение состояния идёт через действие модуля: dispatch(модуль, действие, данные).
ipcMain.handle('action', async (_event, { module: id, name, payload }) => {
  const mod = modules[id];
  const fn = mod && mod.actions && mod.actions[name];
  if (!fn) return state;
  state[id] = await fn(state[id], payload || {}, ctx);
  if (mod.persist) saveCampaign();
  broadcastState();
  return state;
});

ipcMain.handle('displays:list', () => listDisplays());
ipcMain.handle('display:open', (_event, id) => openDisplay(id));
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
      const file = mod.resolveAsset && mod.resolveAsset(state[mod.id], id, ctx);
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
