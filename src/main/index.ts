// Ядро: единое состояние, хранилище, сохранение, загрузка модулей, IPC.
import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { moduleList } from '../modules';
import type { Action, ModuleContext, ModuleDef, VaultAccess } from '../shared/module';
import type { AppState } from '../shared/types';
import type { VaultFolder, VaultState } from '../shared/vault';
import type { PortraitsState } from '../modules/portraits/types';
import { isDir, readJson, writeJsonAtomic } from './files';
import { scanVault } from './scan';
import { migrateOldCampaign } from './migrate';
import { serveFile } from './assets';
import { getCard, initCards, listCards, setCardsVault } from './cards';
import {
  closeDisplay, createControlWindow, getControlWindow, isDisplayOpen, listDisplays, openDisplay, watchDisplays,
} from './windows';

// Внутри ядра модули обрабатываются одинаково, без привязки к конкретным типам.
type AnyModule = ModuleDef<string, any, Record<string, Action<any>>>;
const modules: Record<string, AnyModule> = Object.fromEntries(moduleList.map((m) => [m.id, m as AnyModule]));

// Другая папка данных, например для тестов: SG_USER_DATA=/путь npm run dev
if (process.env['SG_USER_DATA']) app.setPath('userData', process.env['SG_USER_DATA']);

// ---- Схема для картинок хранилища: sg-asset://v/<путь> ----
protocol.registerSchemesAsPrivileged([
  { scheme: 'sg-asset', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

const state = {} as AppState;
const stateById = state as Record<string, unknown>;

// ---------- Настройки приложения (не хранилища): какое хранилище открыто, недавние ----------
interface AppSettings {
  vault: string | null;
  recent: string[];
}
const RECENT_MAX = 10;
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
let settings: AppSettings = { vault: null, recent: [] };

function loadSettings() {
  try {
    const saved = readJson(settingsFile()) as Partial<AppSettings> | undefined;
    settings = { vault: saved?.vault ?? null, recent: saved?.recent ?? [] };
  } catch {
    /* не прочитались — начнём с выбора хранилища */
  }
}

// ---------- Хранилище ----------
const DATA_DIR = '.scrying-glass';
let vaultRoot: string | null = null;
let vaultTree: VaultFolder | null = null;
let watcher: fs.FSWatcher | null = null;

const vaultStateFile = () => path.join(vaultRoot!, DATA_DIR, 'state.json');

function vaultState(): VaultState {
  return {
    root: vaultRoot,
    name: vaultRoot ? path.basename(vaultRoot) : '',
    tree: vaultTree,
    recent: settings.recent,
  };
}

function resolveInVault(rel: string): string | null {
  if (!vaultRoot) return null;
  const abs = path.resolve(vaultRoot, ...rel.split('/'));
  return abs === vaultRoot || abs.startsWith(vaultRoot + path.sep) ? abs : null;
}

function saveVault() {
  if (!vaultRoot) return;
  const out = { version: 2, modules: {} as Record<string, unknown> };
  for (const mod of Object.values(modules)) {
    if (mod.persist) out.modules[mod.id] = stateById[mod.id];
  }
  writeJsonAtomic(vaultStateFile(), out);
}

// Открывает хранилище (null — закрыть): загружает сохранённое состояние модулей и начинает следить за папкой.
async function openVault(root: string | null): Promise<VaultState> {
  if (root && !isDir(root)) {
    dialog.showErrorBox('Папка не найдена', `${root}\n\nВозможно, её переместили или переименовали.`);
    return vaultState();
  }

  let saved: Record<string, unknown> = {};
  if (root) {
    try {
      const data = readJson(path.join(root, DATA_DIR, 'state.json')) as { modules?: Record<string, unknown> } | undefined;
      saved = data?.modules ?? {};
    } catch (e) {
      // Файл есть, но не читается. Не открываем: первое же сохранение его затёрло бы.
      dialog.showErrorBox('Не удалось открыть хранилище', `${root}\n\n${String(e)}`);
      return vaultState();
    }
  }

  watcher?.close();
  watcher = null;
  vaultRoot = root;
  vaultTree = root ? scanVault(root) : null;
  setCardsVault(root, DATA_DIR);

  for (const mod of Object.values(modules)) {
    if (mod.id === 'vault') continue;
    stateById[mod.id] = { ...mod.initialState, ...(mod.persist ? (saved[mod.id] as object) : {}) };
    if (root && mod.init) stateById[mod.id] = mod.init(stateById[mod.id], ctx);
  }

  settings = {
    vault: root,
    recent: root ? [root, ...settings.recent.filter((r) => r !== root)].slice(0, RECENT_MAX) : settings.recent,
  };
  writeJsonAtomic(settingsFile(), settings);
  stateById['vault'] = vaultState();

  if (root) {
    watchVault(root);
    // Данные из версии до хранилища: предложим перенести.
    const migrated = await migrateOldCampaign(root, stateById['portraits'] as PortraitsState, getControlWindow());
    if (migrated) {
      vaultTree = scanVault(root);
      stateById['portraits'] = migrated;
      stateById['vault'] = vaultState();
    }
    saveVault();
  }
  broadcastState();
  return vaultState();
}

// Перечитывает дерево и даёт модулям отреагировать на изменения файлов.
function rescanVault(): VaultState {
  if (!vaultRoot) return vaultState();
  vaultTree = scanVault(vaultRoot);
  stateById['vault'] = vaultState();
  let changed = false;
  for (const mod of Object.values(modules)) {
    if (!mod.onTreeChange) continue;
    const next = mod.onTreeChange(stateById[mod.id], ctx);
    if (next !== stateById[mod.id]) {
      stateById[mod.id] = next;
      if (mod.persist) changed = true;
    }
  }
  if (changed) saveVault();
  broadcastState();
  return vaultState();
}

// Следит за изменениями в папке хранилища и перечитывает её (с задержкой, чтобы пачка изменений
// обработалась один раз). Собственные файлы приложения в .scrying-glass не считаются.
function watchVault(root: string) {
  let timer: NodeJS.Timeout | null = null;
  try {
    watcher = fs.watch(root, { recursive: true }, (_event, file) => {
      if (file && String(file).split(path.sep)[0] === DATA_DIR) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (vaultRoot === root) enqueue('vault', async () => rescanVault());
      }, 300);
    });
    watcher.on('error', () => {
      /* папку могли удалить или отключить диск; обновление вручную всё равно работает */
    });
  } catch {
    watcher = null;
  }
}

function forgetVault(root: string): VaultState {
  settings = { ...settings, recent: settings.recent.filter((r) => r !== root) };
  writeJsonAtomic(settingsFile(), settings);
  return vaultState();
}

// ---------- Рассылка состояния ----------
function broadcastState() {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('state:changed', state);
  }
}

// ---------- Контекст модулей ----------
const vault: VaultAccess = {
  get root() { return vaultRoot; },
  get tree() { return vaultTree; },
  resolve: resolveInVault,
  open: openVault,
  rescan: rescanVault,
  forget: forgetVault,
};

const ctx: ModuleContext = {
  dialog,
  get controlWindow() { return getControlWindow(); },
  vault,
};

// ---------- IPC ----------
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
    if (mod.persist) saveVault();
    broadcastState();
    return state;
  });
});

// Карточки (бестиарий): краткий список и полная карточка по ссылке.
ipcMain.handle('cards:list', () => listCards());
ipcMain.handle('cards:get', (_event, ref) => getCard(ref));

ipcMain.handle('displays:list', () => listDisplays());
ipcMain.handle('display:open', (_event, id: number) => openDisplay(id));
ipcMain.handle('display:close', () => closeDisplay());
ipcMain.handle('display:status', () => isDisplayOpen());

// ---------- Запуск ----------
app.whenReady().then(async () => {
  for (const mod of Object.values(modules)) stateById[mod.id] = mod.initialState;
  loadSettings();
  stateById['vault'] = vaultState();
  initCards(path.join(app.getPath('userData'), 'library'));

  // Файлы хранилища (картинки, музыка): sg-asset://v/<путь внутри хранилища>
  protocol.handle('sg-asset', (request) => {
    const url = new URL(request.url);
    const file = url.host === 'v' ? resolveInVault(decodeURIComponent(url.pathname.slice(1))) : null;
    return file ? serveFile(file, request) : new Response('Not found', { status: 404 });
  });

  createControlWindow();
  watchDisplays();

  // Последнее открытое хранилище открывается само; если его нет, окно покажет выбор хранилища.
  if (settings.vault && isDir(settings.vault)) await enqueue('vault', () => openVault(settings.vault));
});

app.on('window-all-closed', () => app.quit());
