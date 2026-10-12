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

// Другая папка данных, например для тестовой кампании: SG_USER_DATA=/путь npm run dev
if (process.env['SG_USER_DATA']) app.setPath('userData', process.env['SG_USER_DATA']);

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

  const saved = loadSaved();
  for (const mod of Object.values(modules)) {
    stateById[mod.id] = { ...mod.initialState, ...(mod.persist ? (saved[mod.id] as object) : {}) };
  }
  // Необязательный хук: модуль может подготовить своё состояние при запуске.
  for (const mod of Object.values(modules)) {
    if (mod.init) stateById[mod.id] = mod.init(stateById[mod.id], ctx);
  }
}

// Сохранённые данные модулей. Повреждённый файл не перезаписывается: он откладывается в сторону.
function loadSaved(): Record<string, unknown> {
  let text: string;
  try {
    text = fs.readFileSync(campaignFile, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {}; // первый запуск
    // Файл есть, но прочитать его нельзя. Работать дальше опасно: первое же сохранение его затрёт.
    dialog.showErrorBox('Не удалось открыть кампанию', `${campaignFile}\n\n${String(e)}`);
    app.exit(1);
    throw e;
  }

  try {
    const modules = JSON.parse(text).modules;
    if (modules && typeof modules === 'object') return modules;
    throw new Error('нет раздела modules');
  } catch (e) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = path.join(campaignDir, `campaign.broken-${stamp}.json`);
    fs.renameSync(campaignFile, backup);
    dialog.showMessageBoxSync({
      type: 'warning',
      message: 'Файл кампании повреждён, начинаем с чистого листа',
      detail: `Старый файл сохранён как ${backup}\n\n${String(e)}`,
      buttons: ['OK'],
    });
    return {};
  }
}

// Запись через временный файл: при сбое посреди записи на диске остаётся прежняя версия.
function saveCampaign() {
  const out = { version: 1, modules: {} as Record<string, unknown> };
  for (const mod of Object.values(modules)) {
    if (mod.persist) out.modules[mod.id] = stateById[mod.id];
  }
  const tmp = campaignFile + '.tmp';
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, JSON.stringify(out, null, 2));
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, campaignFile);
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
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 560,
    title: 'Scrying Glass — управление',
    backgroundColor: '#1e1e1e',
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
    width: d.size.width,
    height: d.size.height,
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
// Действия одного модуля выполняются строго по очереди. Иначе асинхронное действие (диалог, копирование
// файлов) вернуло бы результат, посчитанный от устаревшего состояния, и затёрло бы то, что изменилось за это время.
const queues = new Map<string, Promise<unknown>>();
function enqueue<T>(id: string, job: () => Promise<T>): Promise<T> {
  const run = (queues.get(id) ?? Promise.resolve()).catch(() => {}).then(job);
  queues.set(id, run);
  return run;
}

ipcMain.handle('action', (_event, { module: id, name, payload }: { module: string; name: string; payload: unknown }) => {
  const mod = modules[id];
  const fn = mod?.actions[name];
  if (!mod || !fn) return state;
  return enqueue(id, async () => {
    stateById[id] = await fn(stateById[id], payload || {}, ctx);
    if (mod.persist) saveCampaign();
    broadcastState();
    return state;
  });
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
