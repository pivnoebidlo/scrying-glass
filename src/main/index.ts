// Ядро: единое состояние, хранилище, сохранение, загрузка модулей, IPC.
import { app, BrowserWindow, ipcMain, dialog, nativeTheme, protocol, shell } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { moduleList } from '../modules';
import type { Action, ModuleContext, ModuleDef, VaultAccess } from '../shared/module';
import type { AppState } from '../shared/types';
import { getLang, isLang, resolveLang, setLang, t, type Lang, type LangSetting } from '../shared/i18n';
import { allFiles, dirname, LIBRARY, renamePath, safeFileName, setRoleNames, HIDDEN_THEMES, isTheme, THEME_BACKGROUND, type RoleNames, type ThemeSetting, type VaultFolder, type VaultState } from '../shared/vault';
import { createSnapshot, listSnapshots, restoreSnapshot, type Reason } from './backups';
import { folderFiles, freeFolder, PACK_EXT, packManifest, readPack, remap, writePack, type LibraryCard, type PackSlices } from './packs';
import { BACKUP_EXT, backupSizes, placeFiles, readBackup, writeBackup } from './archive';
import { safeEntry } from './zip';
import { randomUUID } from 'node:crypto';
import type { CardRef, CardScope } from '../shared/cards';
import type { PortraitsState } from '../modules/portraits/types';
import { clipboardImage, copyImageFile, freeName, isDir, readJson, writeJsonAtomic } from './files';
import { scanVault } from './scan';
import { systemFor } from '../shared/adventures';
import { setSystemsOff } from '../systems';
import { loadSystemPacks, ownPackFile, savePack, systemPacks } from './syspacks';
import { deleteWords, discard, emptyTrash, listTrash, onTrashChanged, pruneTrash, purgeTrash, restoreFromTrash, setTrashSettings, trashSettings } from './trash';
import type { TrashPlace, TrashSettings } from '../shared/trash';
import { migrateOldCampaign } from './migrate';
import { serveFile } from './assets';
import { canThumb, pruneThumbs, thumbnail } from './thumbs';
import { createNote, readNote, renameNote, writeNote } from './notes';
import { createSketch, readSketch, renameSketch, writeSketch } from './sketches';
import type { Sketch } from '../shared/sketch';
import { builtinEntries, entries, watchLibraryCompendium } from './compendium';
import { pages } from './journal';
import { resolver } from './textstore';
import type { Note } from '../shared/notes';
import {
  cardsOf, readLss, updateFromLss, lssSpellTable, importLssSpells, clearLssSpells, copyDraft, setSrdPortraits, deleteCard, discardImages, reloadCards, revertSrd, ownImages, exportCards, getCard, importCards, migrateHiddenCards, moveCard, importCardImage, initCards, libraryPath, listCards, renameVaultImage, resolveInLibrary, saveCard, setCardsVault, setLibrary,
} from './cards';
import { IMAGE_EXT } from '../shared/vault';
import { builtinSounds, resolveSound } from './sounds';
import { resolvePdfjs } from './pdfjs';
import { importNameLists, listNameLists, namesDir } from './names';
import { checkForUpdates } from './updates';
import { buildMenu } from './menu';
import { isAboutLink } from '../shared/about';
import { announce, initSchedule, pressed, readSchedule, saveGames, updateAnnouncement } from './schedule';
import type { Game } from '../shared/schedule';
import { clearInbox, deleteSent, forgetChat, hideMessage, inboxPhoto, initTelegram, setTables, markRead, readInbox, sendPicture, sendText, setToken, status as tgStatus, stopTelegram, updateChat, type TgSettings } from './telegram';
import { setHotkeys } from '../shared/hotkeys';
import { addSource, adminBlocked, adminDismiss, adminRemove, adminReports, adminUnblock, catalog as repoCatalog, cover as repoCover, coverFrom, discardDownload, download as repoDownload, initRepo, keyFile, loadKeyFile, newAdventureId, publish as repoPublish, removeSource, report as repoReport, repoInfo, setAdmin, setAuthorName, setSourceOff, unpublish as repoUnpublish, type RepoSettings } from './repo';
import type { RepoEntry, RepoProgress } from '../shared/repo';
import { isReleaseUrl, type UpdateSettings } from '../shared/updates';
import {
  closeDisplay, createControlWindow, getControlWindow, isDisplayOpen, listDisplays, openDisplay, recreateControlWindow, TITLE_HEIGHT, watchDisplays,
} from './windows';
import type { TitleBarSetting, WindowFrame } from '../shared/api';

// Внутри ядра модули обрабатываются одинаково, без привязки к конкретным типам.
type AnyModule = ModuleDef<string, any, Record<string, Action<any>>>;
const modules: Record<string, AnyModule> = Object.fromEntries(moduleList.map((m) => [m.id, m as AnyModule]));

// Другая папка данных, например для тестов: SG_USER_DATA=/путь npm run dev
if (process.env['SG_USER_DATA']) app.setPath('userData', process.env['SG_USER_DATA']);

// ---- Схема для картинок хранилища: sg-asset://v/<путь> ----
protocol.registerSchemesAsPrivileged([
  { scheme: 'sg-asset', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } },
]);

const state = {} as AppState;
const stateById = state as Record<string, unknown>;

// ---------- Настройки приложения (не хранилища): какое хранилище открыто, недавние ----------
interface AppSettings {
  vault: string | null;
  recent: string[];
  // Папка библиотеки карточек (null — в папке данных приложения).
  library?: string | null;
  // Свои названия папок ролей (только изменённые роли; остальные — по умолчанию).
  roles?: Partial<RoleNames> | null;
  // Папка снимков и полных копий (null — в папке данных приложения).
  backups?: string | null;
  // Корзина: удалять сразу или в корзину, через сколько дней очищать (shared/trash.ts).
  trash?: TrashSettings;
  // Отключённые ролевые системы (systems/index.ts).
  systemsOff?: string[];
  // Interface language: 'auto' (OS language, else English) or a language.
  language?: LangSetting;
  // The control window's colour theme; no field — follow the system.
  theme?: ThemeSetting;
  // Update check on launch (shared/updates.ts); no field — on.
  updates?: UpdateSettings;
  // The tab bar as the window's title bar; no field — on in macOS, off (beta) in Windows and Linux.
  titleBar?: boolean;
  // The GM's own hotkeys (shared/hotkeys.ts): id → combo, only the changed ones.
  hotkeys?: Record<string, string>;
  // Hidden themes found (an easter egg); the theme before a hidden one — its «Exit» goes back to it.
  themesFound?: string[];
  themeBefore?: ThemeSetting;
  // The GM's Telegram bot (main/telegram.ts): the token (encrypted) and the chats it knows.
  telegram?: TgSettings;
  // The adventure repository (main/repo.ts): its address, the author's name and key.
  repo?: RepoSettings;
}
const RECENT_MAX = 10;
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
let settings: AppSettings = { vault: null, recent: [] };

function loadSettings() {
  try {
    const saved = readJson(settingsFile()) as Partial<AppSettings> | undefined;
    // Остальные поля (папка снимков, корзина) — как сохранены.
    settings = { ...saved, vault: saved?.vault ?? null, recent: saved?.recent ?? [], library: saved?.library ?? null, roles: saved?.roles ?? null };
    setTrashSettings(settings.trash);
    setSystemsOff(settings.systemsOff);
    setHotkeys(settings.hotkeys);
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
    roles: setRoleNames(settings.roles),
    systemsOff: setSystemsOff(settings.systemsOff),
    systems: systemPacks(),
    language: settings.language ?? 'auto',
    lang: interfaceLang(),
    theme: isTheme(settings.theme) ? settings.theme : 'auto',
    hotkeys: setHotkeys(settings.hotkeys),
    themesFound: settings.themesFound ?? [],
    themeBefore: isTheme(settings.themeBefore) ? settings.themeBefore : 'auto',
  };
}

// The language the interface is in right now (the setting resolved against the OS languages).
function interfaceLang(): Lang {
  return setLang(resolveLang(settings.language, app.getPreferredSystemLanguages()));
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
    dialog.showErrorBox(t('core.folderNotFound'), t('core.folderMoved', { root }));
    return vaultState();
  }

  let saved: Record<string, unknown> = {};
  if (root) {
    try {
      const data = readJson(path.join(root, DATA_DIR, 'state.json')) as { modules?: Record<string, unknown> } | undefined;
      saved = data?.modules ?? {};
    } catch (e) {
      // Файл есть, но не читается. Не открываем: первое же сохранение его затёрло бы.
      dialog.showErrorBox(t('core.vaultFailed'), `${root}\n\n${String(e)}`);
      return vaultState();
    }
  }

  watcher?.close();
  watcher = null;
  vaultRoot = root;
  vaultTree = root ? scanVault(root) : null;
  // Карточки версии 0.9 лежали в скрытой папке — переносим их в видимую папку бестиария.
  if (root && migrateHiddenCards(root, DATA_DIR, vaultTree)) vaultTree = scanVault(root);
  setCardsVault(root, vaultTree);

  for (const mod of Object.values(modules)) {
    if (mod.id === 'vault') continue;
    stateById[mod.id] = { ...mod.initialState, ...(mod.persist ? (saved[mod.id] as object) : {}) };
    if (root && mod.init) stateById[mod.id] = mod.init(stateById[mod.id], ctx);
  }

  settings = {
    ...settings,
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
    pruneAll();
    // Снимок при открытии — чуть позже, чтобы не задерживать запуск.
    setTimeout(() => vaultRoot === root && snapshotNow('open'), 3000);
  }
  broadcastState();
  return vaultState();
}

// Перечитывает дерево и даёт модулям отреагировать на изменения файлов.
function rescanVault(): VaultState {
  if (!vaultRoot) return vaultState();
  vaultTree = scanVault(vaultRoot);
  stateById['vault'] = vaultState();
  setCardsVault(vaultRoot, vaultTree);
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
  // Файлы могли измениться без изменения дерева (правка записки): окна перечитывают то, что показывают.
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('vault:rescanned');
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

// Новые названия папок ролей (null — по умолчанию): назначение папок меняется, поэтому хранилище перечитывается.
function setRoles(roles: Partial<RoleNames> | null): VaultState {
  settings = { ...settings, roles };
  writeJsonAtomic(settingsFile(), settings);
  setRoleNames(roles);
  return vaultRoot ? rescanVault() : vaultState();
}

// Interface language: saved in settings; windows switch on the next state broadcast.
function setLanguageSetting(language: LangSetting): VaultState {
  settings = { ...settings, language: language === 'auto' || isLang(language) ? language : 'auto' };
  writeJsonAtomic(settingsFile(), settings);
  const state = vaultState();
  menu();
  return state;
}
// The menu in the interface language; «About» and «Settings» open the settings window in the control window.
const menu = () => buildMenu((section) => getControlWindow()?.webContents.send('app:openSettings', section));

// Colour theme: native parts (scrollbars, menus, dialogs) follow it through nativeTheme; the window background —
// so a reload does not flash the wrong colour; the pages switch on the next state broadcast.
function applyTheme() {
  const theme = isTheme(settings.theme) ? settings.theme : 'auto';
  nativeTheme.themeSource = theme === 'auto' ? 'system' : theme === 'light' || theme === 'parchment' ? 'light' : 'dark';
  const shown = theme === 'auto' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : theme;
  getControlWindow()?.setBackgroundColor(THEME_BACKGROUND[shown]);
}
// The window's title bar (windows.ts): chosen when the window is created, a change works after a restart.
const titleBarByDefault = process.platform === 'darwin';
const frameNow: () => WindowFrame = () =>
  !(settings.titleBar ?? titleBarByDefault) ? 'system' : process.platform === 'darwin' ? 'mac' : 'overlay';
let frame: WindowFrame = 'system';
const titleBarSetting = (): TitleBarSetting => ({ on: settings.titleBar ?? titleBarByDefault, byDefault: titleBarByDefault, now: frame });
// The system buttons over the corner before the page sends the theme's colours: by the window background.
function overlayColors() {
  const theme = isTheme(settings.theme) ? settings.theme : 'auto';
  const shown = theme === 'auto' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : theme;
  const light = shown === 'light' || shown === 'parchment';
  return { color: THEME_BACKGROUND[shown], symbolColor: light ? '#2e3338' : '#dcddde' };
}

// A hidden theme is found by switching it on; leaving it for another one — the one before is remembered for its «Exit».
function setThemeSetting(theme: ThemeSetting): VaultState {
  const next = isTheme(theme) ? theme : 'auto';
  const was = isTheme(settings.theme) ? settings.theme : 'auto';
  const hidden = HIDDEN_THEMES.includes(next);
  settings = {
    ...settings,
    theme: next,
    ...(hidden && !(settings.themesFound ?? []).includes(next) ? { themesFound: [...(settings.themesFound ?? []), next] } : {}),
    ...(hidden && !HIDDEN_THEMES.includes(was) ? { themeBefore: was } : {}),
  };
  writeJsonAtomic(settingsFile(), settings);
  applyTheme();
  return vaultState();
}

// The GM's own hotkeys: kept in settings; the app menu takes «Settings…» from them.
function setHotkeysSetting(map: Record<string, string> | null): VaultState {
  settings = { ...settings, hotkeys: setHotkeys(map) };
  writeJsonAtomic(settingsFile(), settings);
  menu();
  return vaultState();
}

// Отключить ненужные ролевые системы (все сразу нельзя — setSystemsOff оставит хотя бы одну).
function setSystemsOffSetting(list: string[]): VaultState {
  settings = { ...settings, systemsOff: setSystemsOff(list) };
  writeJsonAtomic(settingsFile(), settings);
  return vaultState();
}

// The library changed: its system packs are read again and the windows get them.
function useLibrary(dir: string) {
  setLibrary(dir);
  loadSystemPacks(dir);
  stateById['vault'] = vaultState();
  broadcastState();
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
  setRoles,
  setSystemsOff: setSystemsOffSetting,
  setLanguage: setLanguageSetting,
  setTheme: setThemeSetting,
  setHotkeys: setHotkeysSetting,
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

function runAction(id: string, name: string, payload: unknown): Promise<AppState> {
  const mod = modules[id];
  const fn = mod?.actions[name];
  if (!mod || !fn) return Promise.resolve(state);
  return enqueue(id, async () => {
    const before = { ...stateById };
    stateById[id] = await fn(stateById[id], payload || {}, ctx);
    if (mod.persist) saveVault();
    broadcastState();
    if (stateById[id] !== before[id]) reactTo(id, before);
    return state;
  });
}

// Хуки afterAction других модулей — в их очередях, чтобы не разойтись с их собственными действиями.
function reactTo(id: string, before: Record<string, unknown>) {
  const after = { ...stateById };
  for (const mod of Object.values(modules)) {
    const hook = mod.afterAction;
    if (!hook || mod.id === id) continue;
    void enqueue(mod.id, async () => {
      const next = hook(stateById[mod.id], before, after, ctx);
      if (next === stateById[mod.id]) return;
      stateById[mod.id] = next;
      if (mod.persist) saveVault();
      broadcastState();
    });
  }
}

ipcMain.handle('sounds:builtin', () => builtinSounds());

ipcMain.handle('action', (_event, { module: id, name, payload }: { module: string; name: string; payload: unknown }) => runAction(id, name, payload));

// Записки (раздатка, сделанная в приложении): файлы «….note.json» в хранилище. После записи хранилище
// перечитывается сразу (не дожидаясь наблюдателя), и раздатка у игроков обновляется.
const afterNoteWrite = () => enqueue('vault', async () => rescanVault());
ipcMain.handle('notes:read', (_event, rel: string) => readNote(resolveInVault, rel));
ipcMain.handle('notes:write', async (_event, { path: rel, note }: { path: string; note: Note }) => {
  const ok = writeNote(resolveInVault, rel, note);
  if (ok) await afterNoteWrite();
  return ok;
});
ipcMain.handle('notes:create', async (_event, { folder, title, note }: { folder: string; title: string; note: Note }) => {
  const rel = createNote(resolveInVault, folder, title, note);
  if (rel) await afterNoteWrite();
  return rel;
});
// Canvases: the same way (on the players' screen it is updated after every line — the core rereads the file).
ipcMain.handle('sketches:read', (_event, rel: string) => readSketch(resolveInVault, rel));
ipcMain.handle('sketches:write', async (_event, { path: rel, sketch }: { path: string; sketch: Sketch }) => {
  const ok = writeSketch(resolveInVault, rel, sketch);
  if (ok) await afterNoteWrite();
  return ok;
});
ipcMain.handle('sketches:create', async (_event, { folder, title, sketch }: { folder: string; title: string; sketch: Sketch }) => {
  const rel = createSketch(resolveInVault, folder, title, sketch);
  if (rel) await afterNoteWrite();
  return rel;
});
// Text files (compendium entries) in the vault or the library («library:…»).
const resolveText = resolver(resolveInVault, resolveInLibrary);
// Справочник: записи в папках справочника хранилища и в библиотеке («library:compendium/…»).
const afterEntryWrite = async (rel: string) => {
  if (rel.startsWith(LIBRARY)) for (const win of BrowserWindow.getAllWindows()) win.webContents.send('compendium:changed');
  else await afterNoteWrite();
};
ipcMain.handle('compendium:read', (_event, rel: string) => entries.read(resolveText, rel));
ipcMain.handle('compendium:listLibrary', () => entries.listLibrary(libraryPath()));
ipcMain.handle('compendium:builtin', () => builtinEntries());
ipcMain.handle('compendium:write', async (_event, { path: rel, text }: { path: string; text: string }) => {
  const ok = entries.write(resolveText, rel, text);
  if (ok) await afterEntryWrite(rel);
  return ok;
});
ipcMain.handle('compendium:create', async (_event, { folder, title, text }: { folder: string; title: string; text: string }) => {
  const rel = entries.create(resolveText, folder, title, text);
  if (rel) await afterEntryWrite(rel);
  return rel;
});
ipcMain.handle('compendium:rename', async (_event, { path: rel, title }: { path: string; title: string }) => {
  const next = entries.rename(resolveText, rel, title);
  if (next && next !== rel) {
    await runAction('handouts', 'move', { from: rel, to: next });
    await afterEntryWrite(next);
  }
  return next;
});

// Переименовать файл хранилища (картинку, трек) по команде пользователя. Ссылки на него поправляются сразу и
// синхронно — в состоянии всех модулей и в портретах карточек, — до того как наблюдатель увидит пропажу старого
// файла (иначе onTreeChange успел бы убрать его с экрана и из сцен). Новый путь или null.
ipcMain.handle('vault:rename', (_event, { path: rel, name }: { path: string; name: string }) => {
  const abs = resolveInVault(rel);
  const base = safeFileName(name);
  if (!abs || !base || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
  const dir = path.dirname(abs);
  const ext = path.extname(abs);
  // Только регистр букв: на macOS это тот же файл, свободное имя искать не нужно.
  const file = (base + ext).toLowerCase() === path.basename(abs).toLowerCase() ? base + ext : freeName(dir, base + ext);
  if (file === path.basename(abs)) return rel;
  fs.renameSync(abs, path.join(dir, file));
  const to = dirname(rel) ? `${dirname(rel)}/${file}` : file;
  for (const mod of Object.values(modules)) stateById[mod.id] = renamePath(stateById[mod.id], rel, to);
  saveVault();
  renameVaultImage(rel, to);
  rescanVault();
  return to;
});

// Журнал: заметки в папках журнала хранилища. Переименование и перенос — ещё и закреплённая заметка (journal/move).
ipcMain.handle('journal:read', (_event, rel: string) => pages.read(resolveInVault, rel));
ipcMain.handle('journal:write', async (_event, { path: rel, text }: { path: string; text: string }) => {
  const ok = pages.write(resolveInVault, rel, text);
  if (ok) await afterNoteWrite();
  return ok;
});
ipcMain.handle('journal:create', async (_event, { folder, title, text }: { folder: string; title: string; text: string }) => {
  const rel = pages.create(resolveInVault, folder, title, text);
  if (rel) await afterNoteWrite();
  return rel;
});
ipcMain.handle('journal:mkdir', async (_event, { folder, title }: { folder: string; title: string }) => {
  const rel = pages.mkdir(resolveInVault, folder, title);
  if (rel) await afterNoteWrite();
  return rel;
});
const afterPageMove = async (from: string, to: string | null) => {
  if (to && to !== from) {
    await runAction('journal', 'move', { from, to });
    await afterNoteWrite();
  }
  return to;
};
ipcMain.handle('journal:rename', (_event, { path: rel, title }: { path: string; title: string }) => afterPageMove(rel, pages.rename(resolveInVault, rel, title)));
ipcMain.handle('journal:move', (_event, { path: rel, folder }: { path: string; folder: string }) => afterPageMove(rel, pages.move(resolveInVault, rel, folder)));
ipcMain.handle('journal:renameFolder', (_event, { path: rel, title }: { path: string; title: string }) => afterPageMove(rel, pages.renameFolder(resolveInVault, rel, title)));

// A library file (a compendium entry) — to the library's trash, with a confirmation (vault files are removed by the
// vault/trash action).
ipcMain.handle('library:trash', async (_event, rel: string) => {
  const abs = rel.startsWith(LIBRARY) && entries.isPath(rel) ? resolveText(rel) : null;
  if (!abs || !fs.existsSync(abs)) return false;
  const win = getControlWindow();
  const words = deleteWords();
  const opts = {
    type: 'warning' as const,
    message: trashSettings().keep ? t('core.trashFile', { name: path.basename(abs) }) : t('core.deleteFile', { name: path.basename(abs) }),
    detail: t('core.libraryFile', { how: words.how }),
    buttons: [words.button, t('core.cancel')],
    defaultId: 0,
    cancelId: 1,
  };
  const res = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  if (res.response !== 0) return false;
  discard(libraryPath()!, [rel.slice(LIBRARY.length)], { title: path.basename(abs), kind: 'file' });
  await afterEntryWrite(rel);
  return true;
});
// ---------- Снимки (резервные копии данных приложения, main/backups.ts) ----------
const defaultBackups = () => path.join(app.getPath('userData'), 'backups');
const backupsDir = () => settings.backups || defaultBackups();

// Файлы приложения в хранилище: состояние, записки, таблицы, карточки (пути внутри хранилища).
function appVaultFiles(): string[] {
  const out: string[] = [];
  if (!vaultRoot) return out;
  if (fs.existsSync(vaultStateFile())) out.push(`${DATA_DIR}/state.json`);
  if (vaultTree) out.push(...allFiles(vaultTree).filter((f) => f.kind === 'note' || f.kind === 'sketch' || f.kind === 'entry' || f.kind === 'page').map((f) => f.path));
  out.push(...listCards().filter((c) => c.ref.scope === 'vault' && c.file).map((c) => c.file!));
  return out;
}

function snapshotNow(reason: Reason, force = false) {
  try {
    const vaultFiles = appVaultFiles();
    return createSnapshot({ dir: backupsDir(), vaultRoot, vaultFiles, library: libraryPath(), settingsFile: settingsFile() }, reason, force);
  } catch (e) {
    console.error('Snapshot not made', e);
    return null;
  }
}

// Раз в полчаса работы — снимок, если что-то изменилось.
setInterval(() => vaultRoot && snapshotNow('auto'), 30 * 60 * 1000);
app.on('before-quit', () => {
  if (vaultRoot) snapshotNow('quit');
  stopTelegram();
});

ipcMain.handle('backups:list', () => listSnapshots(backupsDir()));
ipcMain.handle('backups:dir', () => ({ path: backupsDir(), isDefault: !settings.backups }));
// Другая папка снимков (reset — по умолчанию): уже сделанные снимки переезжают туда же.
ipcMain.handle('backups:chooseDir', async (_event, { reset }: { reset?: boolean } = {}) => {
  let dir: string | null = null;
  if (!reset) {
    const win = getControlWindow();
    const opts = { title: t('core.backupsFolder'), buttonLabel: t('core.choose'), properties: ['openDirectory' as const, 'createDirectory' as const] };
    const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    if (res.canceled || !res.filePaths[0]) return { path: backupsDir(), isDefault: !settings.backups };
    dir = res.filePaths[0];
  }
  const from = backupsDir();
  const to = dir ?? defaultBackups();
  if (path.resolve(from) !== path.resolve(to)) {
    fs.mkdirSync(to, { recursive: true });
    for (const s of listSnapshots(from)) {
      const src = path.join(from, s.id);
      const dest = path.join(to, s.id);
      if (fs.existsSync(dest)) continue;
      fs.cpSync(src, dest, { recursive: true });
      fs.rmSync(src, { recursive: true, force: true });
    }
  }
  settings = { ...settings, backups: dir };
  writeJsonAtomic(settingsFile(), settings);
  return { path: backupsDir(), isDefault: !settings.backups };
});
ipcMain.handle('backups:create', () => snapshotNow('manual', true));
ipcMain.handle('backups:reveal', async () => {
  fs.mkdirSync(backupsDir(), { recursive: true });
  await shell.openPath(backupsDir());
});
// Восстановить: спросить, перед этим — снимок нынешнего состояния, потом вернуть файлы и перечитать хранилище
// и библиотеку. Данные хранилища — только в то же хранилище, из которого снимок.
ipcMain.handle('backups:restore', async (_event, { id, vault, library }: { id: string; vault: boolean; library: boolean }) => {
  const meta = listSnapshots(backupsDir()).find((s) => s.id === id);
  if (!meta) return 0;
  const toVault = vault && !!vaultRoot && meta.vault === vaultRoot;
  if (!toVault && !library) return 0;
  const win = getControlWindow();
  const what = [toVault && t('core.restoreVault', { name: meta.vaultName }), library && t('core.restoreLibrary')].filter(Boolean).join(t('core.and'));
  const opts = {
    type: 'warning' as const,
    message: t('core.restoreSnapshot', { what, when: new Date(meta.created).toLocaleString(getLang()) }),
    detail: t('core.restoreSnapshotDetail'),
    buttons: [t('core.restore'), t('core.cancel')],
    defaultId: 0,
    cancelId: 1,
  };
  const res = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  if (res.response !== 0) return 0;
  saveVault();
  snapshotNow('before-restore', true);
  const n = restoreSnapshot(backupsDir(), id, { vaultRoot, library: libraryPath() }, { vault: toVault, library });
  if (library) {
    useLibrary(libraryPath()!);
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send('compendium:changed');
  }
  if (toVault && vaultRoot) await enqueue('vault', () => openVault(vaultRoot));
  return n;
});

// ---------- Полная резервная копия одним файлом (main/archive.ts) ----------
const backupSources = () => ({ vaultRoot, vaultFiles: appVaultFiles(), library: libraryPath(), settingsFile: settingsFile() });
ipcMain.handle('archive:sizes', () => backupSizes(backupSources()));
ipcMain.handle('archive:create', async (_event, { media }: { media: boolean }) => {
  saveVault();
  const win = getControlWindow();
  const day = new Date().toISOString().slice(0, 10);
  const save = await dialog.showSaveDialog(win!, {
    title: t('core.saveBackup'),
    // По умолчанию — в папку резервных копий (если её выбрали, например, в облаке), иначе — в «Документы».
    defaultPath: path.join(settings.backups || app.getPath('documents'), `Scrying Glass — ${vaultRoot ? path.basename(vaultRoot) : t('core.data')} — ${day}.${BACKUP_EXT}`),
    filters: [{ name: t('core.backupFilter'), extensions: [BACKUP_EXT] }],
  });
  if (save.canceled || !save.filePath) return null;
  await writeBackup(save.filePath, backupSources(), {
    scryingGlass: 'backup', version: 1, created: Date.now(), app: app.getVersion(), vaultName: vaultRoot ? path.basename(vaultRoot) : '', media,
  });
  shell.showItemInFolder(save.filePath);
  return save.filePath;
});
// Восстановить из файла: в текущее хранилище или в другую папку (тогда она открывается). Библиотека из копии
// дополняет и заменяет файлы библиотеки; из настроек берутся только названия папок ролей.
ipcMain.handle('archive:restore', async () => {
  const win = getControlWindow();
  const pick = await dialog.showOpenDialog(win!, {
    title: t('core.restoreFromBackup'),
    filters: [{ name: t('core.backupFilter'), extensions: [BACKUP_EXT] }],
    properties: ['openFile'],
  });
  const file = pick.filePaths[0];
  if (pick.canceled || !file) return null;
  const tmp = path.join(app.getPath('userData'), `restore-${randomUUID().slice(0, 8)}`);
  try {
    const { manifest, settings: saved } = await readBackup(file, tmp);
    const when = new Date(manifest.created).toLocaleString(getLang());
    const buttons = vaultRoot ? [t('core.intoCurrent', { name: path.basename(vaultRoot) }), t('core.intoOther'), t('core.cancel')] : [t('core.intoFolder'), t('core.cancel')];
    const ask = await dialog.showMessageBox(win!, {
      type: 'question',
      message: t('core.restoreCopy', { name: manifest.vaultName || t('core.data'), when }),
      detail: t('core.restoreCopyDetail', { media: manifest.media ? '' : t('core.noMedia') }),
      buttons,
      defaultId: 0,
      cancelId: buttons.length - 1,
    });
    let target: string | null = null;
    if (vaultRoot && ask.response === 0) target = vaultRoot;
    else if (ask.response === buttons.length - 2) {
      const dir = await dialog.showOpenDialog(win!, { title: t('core.vaultFolder'), buttonLabel: t('core.restoreHere'), properties: ['openDirectory', 'createDirectory'] });
      target = dir.canceled ? null : (dir.filePaths[0] ?? null);
    }
    if (!target) return null;
    saveVault();
    snapshotNow('before-restore', true);
    let files = 0;
    if (isDir(path.join(tmp, 'vault'))) files += placeFiles(path.join(tmp, 'vault'), target);
    const lib = libraryPath();
    if (lib && isDir(path.join(tmp, 'library'))) files += placeFiles(path.join(tmp, 'library'), lib);
    const roles = (saved as { roles?: Partial<RoleNames> | null } | null)?.roles;
    if (roles) setRoles(roles);
    if (lib) useLibrary(lib);
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send('compendium:changed');
    await enqueue('vault', () => openVault(target));
    return { files, vault: path.basename(target) };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------- Приключение одним файлом (main/packs.ts) ----------
const inAdventure = (adv: string, p: string) => p === adv || p.startsWith(adv + '/');
type AnyRec = Record<string, unknown>;
// Что приложение знает об удалённом приключении: хранится в корзине вместе с папкой.
interface AdventureData {
  scenes: AnyRec[];
  encounters: AnyRec[];
  maps: AnyRec;
  order: AnyRec;
  names: AnyRec;
  // Подборка правой панели приключения (у удалённых до 0.20 нет).
  tray?: AnyRec;
  // Ролевая система приключения (у удалённых до 0.18 нет).
  system?: string;
  // The pinned journal notes and PDFs (none before 0.32, one path before 0.56).
  pinned?: string | string[];
  // Mausritter factions and clock (none before 0.41).
  mausritter?: AnyRec;
  // Progress clocks (none before 0.54).
  clocks?: unknown[];
  // The Forged in the Dark crew (none before 0.54).
  crew?: AnyRec;
}

ipcMain.handle('packs:export', async (_event, adventure: string) => {
  const folder = resolveInVault(adventure);
  if (!vaultRoot || !folder || !isDir(folder)) return null;
  const win = getControlWindow();
  const all = folderFiles(folder, true);
  const mb = (n: number) => t('core.mb', { n: Math.round(n / 1024 / 1024) });
  const musicSize = all.filter((f) => /\.(mp3|ogg|wav|flac|m4a)$/i.test(f.rel)).reduce((n, f) => n + f.size, 0);
  const ask = await (win ? dialog.showMessageBox(win, {
    type: 'question',
    message: t('core.exportAdventure', { name: adventure }),
    detail: t('core.exportDetail', { size: mb(all.reduce((n, f) => n + f.size, 0) - musicSize) }),
    checkboxLabel: musicSize ? t('core.withMusic', { size: mb(musicSize) }) : undefined,
    checkboxChecked: false,
    buttons: [t('core.export'), t('core.cancel')],
    defaultId: 0,
    cancelId: 1,
  }) : Promise.resolve({ response: 0, checkboxChecked: false }));
  if (ask.response !== 0) return null;
  const save = await dialog.showSaveDialog(win!, {
    title: t('core.saveAdventure'),
    defaultPath: path.join(app.getPath('documents'), `${adventure.replace(/[/\\:*?"<>|]/g, '_')}.${PACK_EXT}`),
    filters: [{ name: t('core.adventureFilter'), extensions: [PACK_EXT] }],
  });
  if (save.canceled || !save.filePath) return null;
  await buildPack(adventure, save.filePath, { music: !!ask.checkboxChecked });
  shell.showItemInFolder(save.filePath);
  return save.filePath;
});

// The adventure into one .sgpack file: its folder (music and PDFs — if asked), what the app knows of it and the
// library cards it refers to. For the export and for the repository.
async function buildPack(adventure: string, out: string, opts: { music: boolean; pdf?: boolean }, onProgress?: (done: number, total: number) => void) {
  const folder = resolveInVault(adventure);
  if (!folder || !isDir(folder)) throw new Error(t('core.notAdventure'));
  const s = state as unknown as AnyRec & { scenes: { scenes: AnyRec[]; trays?: AnyRec }; maps: { maps: Record<string, AnyRec> }; initiative: { encounters: AnyRec[] }; order: { groups: Record<string, string[]> }; portraits: { names: Record<string, string> } };
  const pick = <T,>(o: Record<string, T>, keep: (k: string) => boolean) => Object.fromEntries(Object.entries(o).filter(([k]) => keep(k)));
  const slices: PackSlices = {
    scenes: s.scenes.scenes.filter((x) => x['adventure'] === adventure),
    maps: pick(s.maps.maps, (k) => inAdventure(adventure, k)),
    encounters: s.initiative.encounters.filter((x) => x['adventure'] === adventure),
    order: pick(s.order.groups, (k) => inAdventure(adventure, k) || inAdventure(`monsters:${adventure}`, k)),
    names: pick(s.portraits.names, (k) => inAdventure(adventure, k)),
    tray: s.scenes.trays?.[adventure],
    pinned: (state as unknown as { journal: { pinned: Record<string, string[]> } }).journal.pinned[adventure],
    mausritter: (state as unknown as { mausritter: { byAdventure: Record<string, unknown> } }).mausritter.byAdventure[adventure],
    clocks: state.clocks.byAdventure[adventure],
    crew: state.crew.byAdventure[adventure] as unknown as AnyRec | undefined,
    repo: state.repo.published[adventure],
  };
  // Общие карточки, на которые ссылаются заготовки и метки карт приключения.
  const refs = new Set<string>();
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') {
      const o = v as AnyRec;
      if (o['scope'] === 'library' && typeof o['id'] === 'string') refs.add(o['id']);
      Object.values(o).forEach(collect);
    }
  };
  collect([slices.encounters, slices.maps]);
  const lib = libraryPath();
  const library: LibraryCard[] = [];
  for (const id of refs) {
    const card = getCard({ scope: 'library', id }) as (AnyRec & { portraits?: string[] }) | null;
    if (!card || !lib) continue;
    library.push({ id, json: card, images: (card.portraits ?? []).map((rel) => ({ rel, abs: path.join(lib, ...rel.split('/')) })) });
  }
  await writePack(out, {
    folder,
    manifest: {
      scryingGlass: 'adventure',
      version: 1,
      name: adventure,
      exported: Date.now(),
      app: app.getVersion(),
      music: opts.music,
      system: systemFor(state.adventures, adventure),
    },
    slices,
    library,
    pdf: opts.pdf,
  }, onProgress);
}

// Удалить приключение: папка — в корзину приложения, из приложения — его сцены, заготовки боёв, разметка карт,
// порядок плиток и подписи портретов (они сохраняются в корзине вместе с папкой и возвращаются с ней — AdventureData).
// Спрашивает подтверждение; перед удалением — снимок.
ipcMain.handle('adventures:delete', async (_event, name: string) => {
  const folder = resolveInVault(name);
  if (!vaultRoot || !folder || !isDir(folder) || name.includes('/')) return false;
  const s = state as unknown as { scenes: { scenes: AnyRec[] }; initiative: { encounters: AnyRec[] }; maps: { maps: Record<string, unknown> } };
  const files = folderFiles(folder, true).length;
  const scenes = s.scenes.scenes.filter((x) => x['adventure'] === name).length;
  const encounters = s.initiative.encounters.filter((x) => x['adventure'] === name).length;
  const maps = Object.keys(s.maps.maps).filter((k) => inAdventure(name, k)).length;
  const win = getControlWindow();
  const opts = {
    type: 'warning' as const,
    message: t('core.deleteAdventure', { name }),
    detail: [
      t('core.deleteAdventureDetail', { files, where: trashSettings().keep ? t('core.toTrash') : t('core.forever'), scenes, encounters, maps }),
      trashSettings().keep ? t('core.restoreAll') : t('core.trashOff'),
    ].join('\n\n'),
    buttons: [t('core.delete'), t('core.cancel')],
    defaultId: 1,
    cancelId: 1,
  };
  const res = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  if (res.response !== 0) return false;
  saveVault();
  snapshotNow('manual', true);
  const drop = <T,>(o: Record<string, T>, keep: (k: string) => boolean) => Object.fromEntries(Object.entries(o).filter(([k]) => keep(k)));
  const st = stateById as Record<string, AnyRec>;
  const mine = (k: string) => inAdventure(name, k) || inAdventure(`monsters:${name}`, k);
  const data: AdventureData = {
    scenes: (st['scenes']!['scenes'] as AnyRec[]).filter((x) => x['adventure'] === name),
    encounters: (st['initiative']!['encounters'] as AnyRec[]).filter((x) => x['adventure'] === name),
    maps: drop(st['maps']!['maps'] as AnyRec, (k) => inAdventure(name, k)),
    order: drop(st['order']!['groups'] as AnyRec, mine),
    names: drop(st['portraits']!['names'] as AnyRec, (k) => inAdventure(name, k)),
    tray: (st['scenes']!['trays'] as AnyRec | undefined)?.[name] as AnyRec | undefined,
    system: state.adventures.systems?.[name],
    pinned: (st['journal']!['pinned'] as Record<string, string[]>)[name],
    mausritter: (st['mausritter']!['byAdventure'] as Record<string, AnyRec>)[name],
    clocks: (st['clocks']!['byAdventure'] as Record<string, unknown[]>)[name],
    crew: (st['crew']!['byAdventure'] as Record<string, AnyRec>)[name],
  };
  try {
    discard(vaultRoot, [name], { title: name, kind: 'adventure', data });
  } catch (e) {
    dialog.showErrorBox(t('core.deleteFolderFailed'), `${folder}\n\n${String(e)}`);
    return false;
  }
  const merge = (id: string, fn: (st: AnyRec) => AnyRec) =>
    enqueue(id, async () => {
      stateById[id] = fn(stateById[id] as AnyRec);
    });
  await merge('scenes', (st) => ({
    ...st,
    scenes: (st['scenes'] as AnyRec[]).filter((x) => x['adventure'] !== name),
    trays: drop((st['trays'] as AnyRec | undefined) ?? {}, (k) => k !== name),
  }));
  await merge('journal', (st) => ({ ...st, pinned: drop(st['pinned'] as AnyRec, (k) => k !== name) }));
  await merge('mausritter', (st) => ({ ...st, byAdventure: drop(st['byAdventure'] as AnyRec, (k) => k !== name) }));
  await merge('clocks', (st) => ({ ...st, byAdventure: drop(st['byAdventure'] as AnyRec, (k) => k !== name) }));
  await merge('crew', (st) => ({ ...st, byAdventure: drop(st['byAdventure'] as AnyRec, (k) => k !== name) }));
  await merge('initiative', (st) => ({ ...st, encounters: (st['encounters'] as AnyRec[]).filter((x) => x['adventure'] !== name) }));
  await merge('maps', (st) => ({ ...st, maps: drop(st['maps'] as AnyRec, (k) => !inAdventure(name, k)) }));
  await merge('order', (st) => ({ ...st, groups: drop(st['groups'] as AnyRec, (k) => !mine(k)) }));
  await merge('portraits', (st) => ({ ...st, names: drop(st['names'] as AnyRec, (k) => !inAdventure(name, k)) }));
  await runAction('adventures', 'unmark', { path: name });
  saveVault();
  await enqueue('vault', async () => rescanVault());
  return true;
});

// ---------- Корзина приложения (main/trash.ts): у хранилища и библиотеки — своя ----------
const trashRoot = (place: TrashPlace) => (place === 'vault' ? vaultRoot : libraryPath());
onTrashChanged(() => {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('trash:changed');
});

// Автоочистка: из обеих корзин — то, что лежит дольше срока из настроек. При открытии хранилища, при смене
// настроек и раз в час.
function pruneAll() {
  const days = trashSettings().days;
  for (const root of [vaultRoot, libraryPath()]) {
    try {
      if (root) pruneTrash(root, days);
    } catch (e) {
      console.error('Trash not pruned', e);
    }
  }
}
setInterval(pruneAll, 60 * 60 * 1000);

ipcMain.handle('trash:settings', () => trashSettings());
ipcMain.handle('trash:setSettings', (_event, next: Partial<TrashSettings>) => {
  setTrashSettings({ ...trashSettings(), ...next });
  settings = { ...settings, trash: trashSettings() };
  writeJsonAtomic(settingsFile(), settings);
  pruneAll();
  return trashSettings();
});

ipcMain.handle('trash:list', () => ({
  vault: vaultRoot ? listTrash(vaultRoot, 'vault') : [],
  library: libraryPath() ? listTrash(libraryPath()!, 'library') : [],
}));

// Вернуть на место. Приключение возвращается вместе со сценами, заготовками и разметкой карт; если его название
// заняли — под новым («Страд (2)»). Что вернулось: название и путь главного файла.
ipcMain.handle('trash:restore', async (_event, { place, id }: { place: TrashPlace; id: string }) => {
  const root = trashRoot(place);
  if (!root) return null;
  let res;
  try {
    res = restoreFromTrash(root, id);
  } catch (e) {
    dialog.showErrorBox(t('core.restoreFailed'), String(e));
    return null;
  }
  if (!res?.moved.length) return null;
  const main = res.moved[0]!;
  if (place === 'vault' && res.meta.kind === 'adventure' && res.meta.data) {
    const data = remap(res.meta.data as AdventureData, main.from, main.to);
    const merge = (mod: string, fn: (st: AnyRec) => AnyRec) =>
      enqueue(mod, async () => {
        stateById[mod] = fn(stateById[mod] as AnyRec);
      });
    const addList = (list: AnyRec[], more: AnyRec[]) => [...list, ...more.filter((x) => !list.some((y) => y['id'] === x['id']))];
    await merge('scenes', (st) => ({
      ...st,
      scenes: addList(st['scenes'] as AnyRec[], data.scenes),
      ...(data.tray ? { trays: { ...(st['trays'] as AnyRec | undefined), [main.to]: data.tray } } : {}),
    }));
    await merge('initiative', (st) => ({ ...st, encounters: addList(st['encounters'] as AnyRec[], data.encounters) }));
    await merge('maps', (st) => ({ ...st, maps: { ...data.maps, ...(st['maps'] as AnyRec) } }));
    await merge('order', (st) => ({ ...st, groups: { ...data.order, ...(st['groups'] as AnyRec) } }));
    await merge('portraits', (st) => ({ ...st, names: { ...data.names, ...(st['names'] as AnyRec) } }));
    if (data.pinned) await merge('journal', (st) => ({ ...st, pinned: { ...(st['pinned'] as AnyRec), [main.to]: [data.pinned].flat() } }));
    if (data.mausritter) await merge('mausritter', (st) => ({ ...st, byAdventure: { ...(st['byAdventure'] as AnyRec), [main.to]: data.mausritter } }));
    if (data.clocks) await merge('clocks', (st) => ({ ...st, byAdventure: { ...(st['byAdventure'] as AnyRec), [main.to]: data.clocks } }));
    if (data.crew) await merge('crew', (st) => ({ ...st, byAdventure: { ...(st['byAdventure'] as AnyRec), [main.to]: data.crew } }));
    saveVault();
  }
  if (place === 'vault') {
    await enqueue('vault', async () => rescanVault());
    if (res.meta.kind === 'adventure') {
      await runAction('adventures', 'mark', { path: main.to });
      const system = (res.meta.data as AdventureData | undefined)?.system;
      if (system) await runAction('adventures', 'setSystem', { path: main.to, system });
    }
  } else {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('compendium:changed');
    }
  }
  reloadCards();
  return { title: res.meta.title, path: place === 'library' ? LIBRARY + main.to : main.to, kind: res.meta.kind };
});

async function confirmPurge(message: string) {
  const win = getControlWindow();
  const opts = {
    type: 'warning' as const,
    message,
    detail: t('core.cantUndo'),
    buttons: [t('core.deleteForever'), t('core.cancel')],
    defaultId: 1,
    cancelId: 1,
  };
  const res = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  return res.response === 0;
}

ipcMain.handle('trash:purge', async (_event, { place, id, title }: { place: TrashPlace; id: string; title: string }) => {
  const root = trashRoot(place);
  if (!root || !(await confirmPurge(t('core.purgeOne', { name: title })))) return false;
  return purgeTrash(root, id);
});

ipcMain.handle('trash:empty', async () => {
  const roots = [vaultRoot, libraryPath()].filter((r): r is string => !!r);
  const count = (vaultRoot ? listTrash(vaultRoot, 'vault').length : 0) + (libraryPath() ? listTrash(libraryPath()!, 'library').length : 0);
  if (!count || !(await confirmPurge(t('core.purgeAll', { count })))) return false;
  for (const r of roots) emptyTrash(r);
  return true;
});

ipcMain.handle('trash:reveal', async (_event, place: TrashPlace) => {
  const root = trashRoot(place);
  if (!root) return;
  const dir = path.join(root, '.trash');
  fs.mkdirSync(dir, { recursive: true });
  await shell.openPath(dir);
});

// Название папки приключения: без символов, запрещённых в именах файлов, не скрытое.
const cleanName = (name: string) => name.replace(/[/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+/, '');

// Шаг 1: выбрать файл и узнать название приключения (без распаковки). exists — такое уже есть в хранилище.
ipcMain.handle('packs:pick', async () => {
  if (!vaultRoot) return null;
  const win = getControlWindow();
  const pickFile = await dialog.showOpenDialog(win!, {
    title: t('core.importAdventure'),
    filters: [{ name: t('core.adventureFilter'), extensions: [PACK_EXT] }],
    properties: ['openFile'],
  });
  const file = pickFile.filePaths[0];
  if (pickFile.canceled || !file) return null;
  const m = await packManifest(file);
  return { file, name: m.name, exists: fs.existsSync(path.join(vaultRoot, m.name)), suggestion: freeFolder(vaultRoot, m.name) };
});

// Свободно ли название для нового приключения (для подсказки при вводе).
ipcMain.handle('packs:nameFree', (_event, name: string) => {
  const n = cleanName(name);
  return !!vaultRoot && !!n && !fs.existsSync(path.join(vaultRoot, n));
});

// Шаг 2: импорт под выбранным названием (занятое не принимается).
ipcMain.handle('packs:import', async (_event, { file, name: wanted }: { file: string; name: string }) => importPack(file, wanted));

// Unpack an adventure file into the vault under the name given (a taken one is refused) and merge what the app knew
// of it into the state. For the import and for the repository.
async function importPack(file: string, wanted: string) {
  if (!vaultRoot) return null;
  const root = vaultRoot;
  const target = cleanName(wanted);
  if (!target || fs.existsSync(path.join(root, target))) throw new Error(t('core.nameTaken', { name: wanted }));
  const tmp = path.join(root, DATA_DIR, `import-${randomUUID().slice(0, 8)}`);
  try {
    const pack = await readPack(file, tmp);
    snapshotNow('manual', true);
    const from = pack.manifest.name;
    const name = target;
    const src = path.join(tmp, 'files', from);
    if (isDir(src)) fs.renameSync(src, path.join(root, name));
    else fs.mkdirSync(path.join(root, name), { recursive: true });

    // Общие карточки — в библиотеку, если такой ещё нет (свою не перезаписываем), с картинками.
    const lib = libraryPath();
    let cards = 0;
    if (lib) {
      for (const c of pack.cards) {
        if (getCard({ scope: 'library', id: c.id })) continue;
        writeJsonAtomic(path.join(lib, 'cards', `${c.id}.json`), c.json);
        for (const rel of ((c.json as { portraits?: unknown[] })?.portraits ?? [])) {
          // A pack may come from a stranger (the repository): a portrait path must stay inside the library.
          if (typeof rel !== 'string' || !safeEntry(rel)) continue;
          const from = path.join(tmp, 'library', ...rel.split('/'));
          const to = path.join(lib, ...rel.split('/'));
          if (fs.existsSync(from) && !fs.existsSync(to)) {
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.copyFileSync(from, to);
          }
        }
        cards++;
      }
      if (cards) useLibrary(lib);
    }

    // Состояние приключения: пути — под новое название папки, сцены и заготовки — с новыми id.
    const sl = remap(pack.slices, from, name);
    const fresh = <T extends AnyRec>(x: T) => ({ ...x, id: randomUUID() });
    const scenes = (sl.scenes as AnyRec[]).map(fresh);
    const encounters = (sl.encounters as (AnyRec & { combatants?: AnyRec[] })[]).map((e) => ({ ...fresh(e), combatants: (e.combatants ?? []).map(fresh) }));
    const merge = (id: string, fn: (s: AnyRec) => AnyRec) =>
      enqueue(id, async () => {
        stateById[id] = fn(stateById[id] as AnyRec);
      });
    await merge('scenes', (s) => ({
      ...s,
      scenes: [...(s['scenes'] as AnyRec[]), ...scenes],
      ...(sl.tray ? { trays: { ...(s['trays'] as AnyRec | undefined), [name]: sl.tray } } : {}),
    }));
    await merge('maps', (s) => ({ ...s, maps: { ...(s['maps'] as AnyRec), ...sl.maps } }));
    await merge('initiative', (s) => ({ ...s, encounters: [...(s['encounters'] as AnyRec[]), ...encounters] }));
    await merge('order', (s) => ({ ...s, groups: { ...(s['groups'] as AnyRec), ...sl.order } }));
    await merge('portraits', (s) => ({ ...s, names: { ...(s['names'] as AnyRec), ...sl.names } }));
    if (sl.pinned) await merge('journal', (s) => ({ ...s, pinned: { ...(s['pinned'] as AnyRec), [name]: [sl.pinned].flat() } }));
    if (sl.mausritter) await merge('mausritter', (s) => ({ ...s, byAdventure: { ...(s['byAdventure'] as AnyRec), [name]: sl.mausritter } }));
    if (sl.clocks) await merge('clocks', (s) => ({ ...s, byAdventure: { ...(s['byAdventure'] as AnyRec), [name]: sl.clocks } }));
    if (sl.crew) await merge('crew', (s) => ({ ...s, byAdventure: { ...(s['byAdventure'] as AnyRec), [name]: sl.crew } }));
    if (sl.repo) await merge('repo', (s) => ({ ...s, published: { ...(s['published'] as AnyRec), [name]: sl.repo } }));
    saveVault();
    await enqueue('vault', async () => rescanVault());
    await runAction('adventures', 'mark', { path: name });
    if (pack.manifest.system) await runAction('adventures', 'setSystem', { path: name, system: pack.manifest.system });
    await runAction('adventures', 'select', { path: name });
    return { name, renamed: name !== from, scenes: scenes.length, encounters: encounters.length, cards };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---- The adventure repository (main/repo.ts, shared/repo.ts) ----
// Progress of packing, uploading and downloading — to the control window, at most a few times a second.
let progressAt = 0;
function repoProgress(p: RepoProgress) {
  const now = Date.now();
  if (now - progressAt < 150 && p.done < p.total) return;
  progressAt = now;
  getControlWindow()?.webContents.send('repo:progress', p);
}
ipcMain.handle('repo:info', () => repoInfo());
ipcMain.handle('repo:setName', (_event, name: string) => setAuthorName(name));
ipcMain.handle('repo:addSource', (_event, { name, url }: { name: string; url: string }) => addSource(name, url));
ipcMain.handle('repo:removeSource', (_event, id: string) => removeSource(id));
ipcMain.handle('repo:setSourceOff', (_event, { id, off }: { id: string; off: boolean }) => setSourceOff(id, off));
ipcMain.handle('repo:catalog', (_event, source: string) => repoCatalog(source));
ipcMain.handle('repo:report', (_event, { source, author, id, reason, text }: { source: string; author: string; id: string; reason: string; text: string }) => repoReport(source, author, id, reason, text));
ipcMain.handle('repo:setAdmin', (_event, { source, token }: { source: string; token: string }) => setAdmin(source, token));
ipcMain.handle('repo:adminReports', (_event, source: string) => adminReports(source));
ipcMain.handle('repo:adminRemove', (_event, { source, author, id, block }: { source: string; author: string; id: string; block: boolean }) => adminRemove(source, author, id, block));
ipcMain.handle('repo:adminBlocked', (_event, source: string) => adminBlocked(source));
ipcMain.handle('repo:adminUnblock', (_event, { source, author, id }: { source: string; author: string; id: string }) => adminUnblock(source, author, id));
ipcMain.handle('repo:adminDismiss', (_event, { source, author, id }: { source: string; author: string; id: string }) => adminDismiss(source, author, id));
ipcMain.handle('repo:cover', (_event, { source, author, id, version }: { source: string; author: string; id: string; version: number }) => repoCover(source, author, id, version));
// What an adventure weighs: all of it, its music, its PDFs (both optional in a publish).
ipcMain.handle('repo:sizes', (_event, adventure: string) => {
  const folder = resolveInVault(adventure);
  if (!folder || !isDir(folder)) return null;
  const all = folderFiles(folder, true);
  const sum = (re: RegExp) => all.filter((f) => re.test(f.rel)).reduce((n, f) => n + f.size, 0);
  return { total: all.reduce((n, f) => n + f.size, 0), music: sum(/\.(mp3|ogg|wav|flac|m4a)$/i), pdf: sum(/\.pdf$/i) };
});
// Publish (or update) an adventure: pack it into a temporary file, upload, remember the entry.
ipcMain.handle('repo:publish', async (_event, p: { source: string; adventure: string; title: string; description: string; lang: string; music: boolean; pdf?: boolean; cover?: string }) => {
  if (!vaultRoot || !state.adventures.list.includes(p.adventure)) return null;
  // The same id in every source: publishing again anywhere updates that source's entry.
  const known = state.repo.published[p.adventure];
  const jpeg = p.cover ? coverFrom(resolveInVault(p.cover) ?? '') : null;
  const tmp = path.join(app.getPath('userData'), 'repo', `publish-${randomUUID().slice(0, 8)}.${PACK_EXT}`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  try {
    await buildPack(p.adventure, tmp, { music: p.music, pdf: !!p.pdf }, (done, total) => repoProgress({ phase: 'pack', done, total }));
    const entry = await repoPublish(p.source, tmp, {
      id: known?.id ?? newAdventureId(),
      title: p.title,
      description: p.description,
      system: systemFor(state.adventures, p.adventure),
      lang: p.lang,
      music: p.music,
      app: app.getVersion(),
    }, jpeg);
    await runAction('repo', 'published', { folder: p.adventure, mark: { id: entry.id, version: entry.version, source: p.source } });
    return entry;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});
ipcMain.handle('repo:unpublish', async (_event, { source, id }: { source: string; id: string }) => {
  await repoUnpublish(source, id);
  await runAction('repo', 'unpublished', { id, source });
});
// Download: the file waits in a temporary folder; the answer is like packs:pick (the name, taken or not).
ipcMain.handle('repo:download', async (_event, { source, author, id }: { source: string; author: string; id: string }) => {
  if (!vaultRoot) return null;
  const file = await repoDownload(source, author, id);
  try {
    const m = await packManifest(file);
    return { file, name: m.name, exists: fs.existsSync(path.join(vaultRoot, m.name)), suggestion: freeFolder(vaultRoot, m.name) };
  } catch (e) {
    discardDownload(file);
    throw e;
  }
});
ipcMain.handle('repo:install', async (_event, { file, name, entry, source }: { file: string; name: string; entry: RepoEntry; source: string }) => {
  try {
    const r = await importPack(file, name);
    if (!r) return null;
    await runAction('repo', 'installed', { folder: r.name, mark: { author: entry.author, id: entry.id, version: entry.version, source } });
    // Someone else's adventure: publishing it from here makes an entry of this GM's own.
    if (entry.author !== repoInfo().author) await runAction('repo', 'published', { folder: r.name, mark: null });
    return r;
  } finally {
    discardDownload(file);
  }
});
ipcMain.handle('repo:discard', (_event, file: string) => discardDownload(file));
ipcMain.handle('repo:exportKey', async () => {
  const win = getControlWindow();
  const save = await dialog.showSaveDialog(win!, {
    title: t('core.repoKeySave'),
    defaultPath: path.join(app.getPath('documents'), 'scrying-glass-author-key.json'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (save.canceled || !save.filePath) return false;
  fs.writeFileSync(save.filePath, keyFile(), { mode: 0o600 });
  return true;
});
ipcMain.handle('repo:importKey', async () => {
  const win = getControlWindow();
  const pick = await dialog.showOpenDialog(win!, { title: t('core.repoKeyLoad'), filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
  const file = pick.filePaths[0];
  if (pick.canceled || !file) return null;
  if (repoInfo().author) {
    const ask = await dialog.showMessageBox(win!, {
      type: 'warning',
      message: t('core.repoKeyReplace'),
      detail: t('core.repoKeyReplaceDetail'),
      buttons: [t('core.repoKeyReplaceYes'), t('core.cancel')],
      defaultId: 1,
      cancelId: 1,
    });
    if (ask.response !== 0) return null;
  }
  return loadKeyFile(fs.readFileSync(file, 'utf8'));
});

// ---- System packs: the GM's own (the builder, files) ----
function reloadSystems() {
  loadSystemPacks(libraryPath());
  stateById['vault'] = vaultState();
  broadcastState();
}
ipcMain.handle('systems:save', (_event, { pack, was }: { pack: unknown; was?: string }) => {
  const lib = libraryPath();
  if (!lib) throw new Error('syspack:no-library');
  const p = savePack(lib, pack, was);
  reloadSystems();
  return p.id;
});
ipcMain.handle('systems:delete', (_event, id: string) => {
  const lib = libraryPath();
  const rel = lib ? ownPackFile(lib, id) : null;
  if (!lib || !rel) return false;
  discard(lib, [rel], { title: id, kind: 'file' });
  reloadSystems();
  return true;
});
ipcMain.handle('systems:import', async () => {
  const lib = libraryPath();
  const win = getControlWindow();
  if (!lib || !win) return null;
  const pick = await dialog.showOpenDialog(win, { title: t('core.systemImport'), filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
  const file = pick.filePaths[0];
  if (pick.canceled || !file) return null;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { id?: unknown };
  const old = systemPacks().find((p) => p.id === raw.id && p.own);
  if (old) {
    const ask = await dialog.showMessageBox(win, {
      type: 'question',
      message: t('core.systemReplace', { name: String(raw.id) }),
      detail: t('core.systemReplaceDetail'),
      buttons: [t('core.systemReplaceYes'), t('core.cancel')],
      defaultId: 1,
      cancelId: 1,
    });
    if (ask.response !== 0) return null;
  }
  const p = savePack(lib, raw);
  reloadSystems();
  return p.id;
});
ipcMain.handle('systems:export', async (_event, id: string) => {
  const win = getControlWindow();
  const p = systemPacks().find((x) => x.id === id);
  if (!p || !win) return false;
  const save = await dialog.showSaveDialog(win, { title: t('core.systemExport'), defaultPath: path.join(app.getPath('documents'), `${id}.json`), filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (save.canceled || !save.filePath) return false;
  const { own: _own, ...clean } = p;
  fs.writeFileSync(save.filePath, JSON.stringify(clean, null, 1));
  return true;
});

// Небольшие данные инструментов, общие для всех кампаний: JSON-файлы в библиотеке (только из списка).
const LIBRARY_DATA = new Set(['pointbuy.json', 'compendium-types.json', 'names.json', 'reshape-templates.json', 'wild-magic.json']);
ipcMain.handle('library:readData', (_event, name: string) => {
  const lib = libraryPath();
  return LIBRARY_DATA.has(name) && lib ? (readJson(path.join(lib, name)) ?? null) : null;
});
ipcMain.handle('library:writeData', (_event, { name, data }: { name: string; data: unknown }) => {
  const lib = libraryPath();
  if (!LIBRARY_DATA.has(name) || !lib) return false;
  writeJsonAtomic(path.join(lib, name), data);
  return true;
});

// Открыть файл в программе по умолчанию (таблицу — например, в Obsidian или текстовом редакторе).
ipcMain.handle('vault:openFile', async (_event, rel: string) => {
  const abs = rel.startsWith(LIBRARY) ? resolveText(rel) : resolveInVault(rel);
  if (abs) await shell.openPath(abs);
});

// Переименование меняет путь: раздатка у игроков и сцены, где была эта записка, переходят на новый.
ipcMain.handle('notes:rename', async (_event, { path: rel, title }: { path: string; title: string }) => moveHandout(rel, renameNote(resolveInVault, rel, title)));
ipcMain.handle('sketches:rename', async (_event, { path: rel, title }: { path: string; title: string }) => moveHandout(rel, renameSketch(resolveInVault, rel, title)));
async function moveHandout(rel: string, next: string | null) {
  if (!next || next === rel) return next;
  if (state.handouts.current === rel) await runAction('handouts', 'set', { path: next });
  for (const sc of state.scenes.scenes) {
    if (sc.handout.path === rel) await runAction('scenes', 'setContent', { id: sc.id, content: { handout: { path: next } } });
  }
  await afterNoteWrite();
  return next;
}

// Карточки (бестиарий): краткий список и полная карточка по ссылке, сохранение, картинки, папка библиотеки.
ipcMain.handle('cards:list', () => listCards());
ipcMain.handle('cards:get', (_event, ref) => getCard(ref));
// folder — папка бестиария хранилища (путь внутри хранилища) для новых карточек и их картинок.
ipcMain.handle('cards:save', (_event, { scope, card, folder }) => saveCard(scope, card, folder));
// Удалить карточку (с подтверждением). Картинки, которые есть только у неё и лежат в папке карточек,
// удаляются, если оставить галочку. true — удалили.
ipcMain.handle('cards:delete', async (_event, ref: CardRef) => {
  const card = getCard(ref);
  if (!card) return false;
  const images = ownImages(ref);
  const win = getControlWindow();
  const opts = {
    type: 'warning' as const,
    message: t('core.deleteCard', { name: card.name }),
    detail: trashSettings().keep ? t('core.cardToTrash', { how: deleteWords().how }) : deleteWords().how,
    buttons: [t('core.delete'), t('core.cancel')],
    defaultId: 0,
    cancelId: 1,
    ...(images.length
      ? { checkboxLabel: t('core.deleteImages', { count: images.length, list: images.map((p) => p.split('/').pop()).join(', ') }), checkboxChecked: true }
      : {}),
  };
  const res = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  if (res.response !== 0) return false;
  deleteCard(ref, res.checkboxChecked ? images : []);
  return true;
});
// «Вернуть как в SRD»: убрать правку встроенной карточки (с подтверждением; файл правки — в корзину).
ipcMain.handle('cards:revertSrd', async (_event, ref: CardRef) => {
  const card = getCard(ref);
  if (!card || ref.scope !== 'srd') return false;
  const win = getControlWindow();
  const words = deleteWords();
  const opts = {
    type: 'warning' as const,
    message: t('core.revertCard', { name: card.name }),
    detail: t('core.revertDetail', { how: words.how }),
    buttons: [t('core.revert'), t('core.cancel')],
    defaultId: 0,
    cancelId: 1,
  };
  const res = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  return res.response === 0 && revertSrd(ref);
});
ipcMain.handle('cards:setSrdPortraits', (_event, { ref, portraits }: { ref: CardRef; portraits: string[] }) => setSrdPortraits(ref, portraits));
ipcMain.handle('cards:discardImages', (_event, { scope, paths, ownedOnly }: { scope: CardScope; paths: string[]; ownedOnly?: boolean }) =>
  discardImages(scope, paths, ownedOnly)
);
ipcMain.handle('cards:copyDraft', (_event, { ref, to, folder }) => copyDraft(ref, to, folder));
ipcMain.handle('cards:move', (_event, { ref, to, folder }) => moveCard(ref, to, folder));

// Картинка для карточки: из хранилища (vaultPath) или файл с диска (диалог). null — отменили.
// fromClipboard — картинка из буфера обмена (если её там нет, приложение скажет об этом).
ipcMain.handle('cards:addImage', async (_event, { scope, vaultPath, folder, fromClipboard }: { scope: CardScope; vaultPath?: string; folder?: string; fromClipboard?: boolean }) => {
  if (fromClipboard) {
    const data = await clipboardImage();
    if (!data) {
      noImageInClipboard();
      return null;
    }
    const p = importCardImage(scope, { data }, folder);
    return p && { path: p, copied: true };
  }
  if (vaultPath) {
    const p = importCardImage(scope, { vaultPath }, folder);
    return p && { path: p, copied: p !== vaultPath };
  }
  const win = getControlWindow();
  const opts = {
    title: t('core.cardImage'),
    properties: ['openFile' as const],
    filters: [{ name: t('core.images'), extensions: IMAGE_EXT.map((e) => e.slice(1)) }],
  };
  const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  const p = res.canceled || !res.filePaths[0] ? null : importCardImage(scope, { file: res.filePaths[0] }, folder);
  return p && { path: p, copied: true };
});

// Экспорт: выбранные карточки (refs) или всё место хранения (scope, folder) в один файл с картинками.
ipcMain.handle('cards:export', async (_event, { refs, scope, folder, name }: { refs?: CardRef[]; scope?: CardScope; folder?: string; name: string }) => {
  const list = refs ?? (scope ? cardsOf(scope, folder) : []);
  if (!list.length) return null;
  const win = getControlWindow();
  const opts = {
    title: t('core.exportCards'),
    defaultPath: path.join(app.getPath('documents'), `${name.replace(/[/\\:*?"<>|]/g, '_')}.json`),
    filters: [{ name: t('core.cardsFilter'), extensions: ['json'] }],
  };
  const res = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts);
  if (res.canceled || !res.filePath) return null;
  try {
    return exportCards(list, res.filePath);
  } catch (e) {
    dialog.showErrorBox(t('core.saveFailed'), `${res.filePath}\n\n${String(e)}`);
    return null;
  }
});

// Импорт: сначала окно выбирает файлы (диалог здесь), потом место (в окне) и вызывает cards:import.
ipcMain.handle('cards:pickImport', async () => {
  const win = getControlWindow();
  const opts = {
    title: t('core.importCards'),
    properties: ['openFile' as const, 'multiSelections' as const],
    filters: [{ name: t('core.cardsFilter'), extensions: ['json'] }],
  };
  const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  return res.canceled ? [] : res.filePaths;
});
ipcMain.handle('cards:import', (_event, { files, scope, folder, newLss }: { files: string[]; scope: CardScope; folder?: string; newLss?: boolean }) =>
  importCards(files, scope, folder, newLss)
);
// Обновление персонажа из экспорта Long Story Short: выбрать файл и показать изменения, потом обновить карточку.
const lssPreview = (file: string) => {
  const r = readLss(file);
  return { name: r.name, system: r.system, stats: r.stats, lssId: r.lssId, warnings: r.warnings };
};
ipcMain.handle('cards:pickLss', async () => {
  const win = getControlWindow();
  const opts = {
    title: t('core.lssExport'),
    properties: ['openFile' as const],
    filters: [{ name: t('core.lssFilter'), extensions: ['json'] }],
  };
  const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  const file = res.canceled ? undefined : res.filePaths[0];
  return file ? { file, lss: lssPreview(file) } : null;
});
ipcMain.handle('cards:readLss', (_event, file: string) => lssPreview(file));
// Таблица заклинаний LSS (номер → название) для заклинаний-карточек: сколько загружено, загрузить, очистить.
ipcMain.handle('lssSpells:count', () => Object.keys(lssSpellTable()).length);
ipcMain.handle('lssSpells:import', async () => {
  const win = getControlWindow();
  const opts = {
    title: t('core.lssSpells'),
    properties: ['openFile' as const, 'multiSelections' as const],
    filters: [{ name: 'JSON', extensions: ['json', 'txt'] }],
  };
  const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  return res.canceled || !res.filePaths.length ? null : importLssSpells(res.filePaths);
});
ipcMain.handle('lssSpells:clear', () => clearLssSpells());
ipcMain.handle('cards:updateFromLss', (_event, { ref, file, merged }: { ref: CardRef; file: string; merged?: { name: string; system: string; stats: unknown } }) =>
  updateFromLss(ref, file, merged)
);

function noImageInClipboard() {
  const win = getControlWindow();
  const opts = {
    type: 'info' as const,
    message: t('core.noImage'),
    detail: t('core.noImageDetail'),
  };
  if (win) dialog.showMessageBox(win, opts);
  else dialog.showMessageBox(opts);
}

const defaultLibrary = () => path.join(app.getPath('userData'), 'library');
ipcMain.handle('cards:library', () => ({ path: libraryPath(), isDefault: !settings.library }));
// The name generator's own lists (main/names.ts): list, load files (a dialog), open the folder.
ipcMain.handle('names:list', () => listNameLists(libraryPath()));
ipcMain.handle('names:import', async () => {
  const win = getControlWindow();
  const opts = { title: t('names.importTitle'), properties: ['openFile' as const, 'multiSelections' as const], filters: [{ name: t('names.filter'), extensions: ['txt'] }] };
  const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  return res.canceled || !res.filePaths.length ? null : importNameLists(libraryPath(), res.filePaths);
});
ipcMain.handle('names:reveal', async () => {
  const lib = libraryPath();
  if (!lib) return;
  fs.mkdirSync(namesDir(lib), { recursive: true });
  await shell.openPath(namesDir(lib));
});
// Save text into a file the GM picks (a dialog): name — the suggested file name with its extension.
// A picture of the vault or the library into the clipboard (the lightbox: «Copy», ⌘C).
ipcMain.handle('files:copyImage', async (_event, file: string) => {
  const real = file.startsWith(LIBRARY) ? resolveInLibrary(file.slice(LIBRARY.length)) : resolveInVault(file);
  return real ? copyImageFile(real).catch(() => false) : false;
});

ipcMain.handle('files:saveText', async (_event, { name, text }: { name: string; text: string }) => {
  const win = getControlWindow();
  const ext = path.extname(name).slice(1) || 'txt';
  const opts = { defaultPath: path.join(app.getPath('documents'), name), filters: [{ name: ext.toUpperCase(), extensions: [ext] }] };
  const res = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts);
  if (res.canceled || !res.filePath) return false;
  try {
    fs.writeFileSync(res.filePath, text);
    return true;
  } catch (e) {
    dialog.showErrorBox(t('core.saveFailed'), `${res.filePath}\n\n${String(e)}`);
    return false;
  }
});
// Telegram: the bot's status and chats, the token, chats on/off and labels; sending text, a picture of the vault or
// library, or a capture of a part of the control window (a note as the players see it).
ipcMain.handle('telegram:status', () => tgStatus());
ipcMain.handle('telegram:setToken', (_event, token: string | null) => setToken(token));
ipcMain.handle('telegram:updateChat', (_event, { id, patch }: { id: number; patch: { enabled?: boolean; label?: string; table?: string } }) => updateChat(id, patch));
ipcMain.handle('telegram:setTables', (_event, tables: { id: string; name: string }[]) => setTables(tables));
ipcMain.handle('telegram:forgetChat', (_event, id: number) => forgetChat(id));
ipcMain.handle('telegram:sendText', (_event, { chats, html, replyTo }: { chats: number[]; html: string; replyTo?: number }) => sendText(chats, html, replyTo));
ipcMain.handle('telegram:inbox', () => readInbox());
ipcMain.handle('telegram:markRead', (_event, chat?: number) => markRead(chat));
ipcMain.handle('telegram:clearInbox', (_event, chat?: number) => clearInbox(chat));
ipcMain.handle('telegram:photo', (_event, name: string) => inboxPhoto(name));
ipcMain.handle('telegram:delete', (_event, id: string) => deleteSent(id));
// The game schedule (main/schedule.ts): the whole of it, the games as edited, an announcement to the table.
ipcMain.handle('schedule:get', () => readSchedule());
ipcMain.handle('schedule:save', (_event, games: Game[]) => saveGames(games));
ipcMain.handle('schedule:announce', (_event, key: string) => announce(key));
ipcMain.handle('schedule:update', (_event, { key, notify }: { key: string; notify: boolean }) => updateAnnouncement(key, notify));
ipcMain.handle('telegram:hide', (_event, id: string) => hideMessage(id));
// A pasted or dropped image: its bytes (≤ 20 MB) as a picture.
ipcMain.handle('telegram:sendBytes', (_event, { chats, data, name, caption }: { chats: number[]; data: Uint8Array; name: string; caption?: string }) =>
  data.byteLength > 20 * 1024 * 1024 ? { sent: 0, errors: ['> 20 MB'] } : sendPicture(chats, { png: Buffer.from(data), name: safeFileName(name) || 'image.png' }, caption)
);
ipcMain.handle('telegram:sendFile', (_event, { chats, path: rel, caption }: { chats: number[]; path: string; caption?: string }) => {
  const file = rel.startsWith(LIBRARY) ? resolveInLibrary(rel.slice(LIBRARY.length)) : resolveInVault(rel);
  if (!file || !fs.existsSync(file)) return { sent: 0, errors: [rel] };
  return sendPicture(chats, { file }, caption);
});
ipcMain.handle('telegram:sendCapture', async (_event, { chats, rect, caption, name }: { chats: number[]; rect: Electron.Rectangle; caption?: string; name: string }) => {
  const win = getControlWindow();
  if (!win) return { sent: 0, errors: ['no window'] };
  const r = { x: Math.max(0, Math.floor(rect.x)), y: Math.max(0, Math.floor(rect.y)), width: Math.ceil(rect.width), height: Math.ceil(rect.height) };
  const png = (await win.webContents.capturePage(r)).toPNG();
  return sendPicture(chats, { png, name }, caption);
});

// Updates: the setting, a check on demand, opening the release page (only the app's own releases).
const updateSettings = (): UpdateSettings => ({ check: true, ...settings.updates });
ipcMain.handle('window:titleBar', () => titleBarSetting());
// Works at once: the control window is made anew with the other title bar (a moment later — the answer goes first).
ipcMain.handle('window:setTitleBar', (_event, on: boolean) => {
  settings = { ...settings, titleBar: !!on };
  writeJsonAtomic(settingsFile(), settings);
  if (frameNow() !== frame) {
    frame = frameNow();
    setTimeout(() => {
      recreateControlWindow(frame, overlayColors());
      applyTheme();
    }, 50);
  }
  return titleBarSetting();
});
ipcMain.on('window:titleBarColors', (_event, colors: { color: string; symbolColor: string }) => {
  const win = getControlWindow();
  if (frame === 'overlay' && win && !win.isDestroyed()) win.setTitleBarOverlay({ ...colors, height: TITLE_HEIGHT });
});
ipcMain.handle('updates:settings', () => updateSettings());
ipcMain.handle('updates:setSettings', (_event, next: Partial<UpdateSettings>) => {
  settings = { ...settings, updates: { ...updateSettings(), ...next } };
  writeJsonAtomic(settingsFile(), settings);
  return updateSettings();
});
ipcMain.handle('updates:check', () => checkForUpdates());
ipcMain.handle('updates:open', (_event, url: string) => (isReleaseUrl(url) ? shell.openExternal(url) : undefined));
// The About section's links (only its own addresses).
ipcMain.handle('app:openLink', (_event, url: string) => (isAboutLink(url) ? shell.openExternal(url) : undefined));
ipcMain.handle('app:version', () => app.getVersion());
// On launch (if on): a newer version that the GM hasn't skipped — the control window shows a banner.
async function checkUpdatesOnLaunch() {
  const s = updateSettings();
  if (!s.check) return;
  const info = await checkForUpdates();
  if (info.newer && info.latest !== s.skip) getControlWindow()?.webContents.send('updates:available', info);
}

ipcMain.handle('cards:revealLibrary', async () => {
  const dir = libraryPath();
  if (dir) {
    fs.mkdirSync(dir, { recursive: true });
    await shell.openPath(dir);
  }
});
// Выбрать папку библиотеки (reset — вернуть папку по умолчанию). Карточки в старой папке остаются на месте.
ipcMain.handle('cards:chooseLibrary', async (_event, { reset }: { reset?: boolean } = {}) => {
  let dir: string | null = null;
  if (!reset) {
    const win = getControlWindow();
    const opts = { title: t('core.libraryFolder'), buttonLabel: t('core.choose'), properties: ['openDirectory' as const, 'createDirectory' as const] };
    const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    if (res.canceled || !res.filePaths[0]) return;
    dir = res.filePaths[0];
  }
  settings = { ...settings, library: dir };
  writeJsonAtomic(settingsFile(), settings);
  useLibrary(dir ?? defaultLibrary());
  watchLibraryCompendium(libraryPath());
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('compendium:changed');
});

ipcMain.handle('displays:list', () => listDisplays());
ipcMain.handle('display:open', (_event, id: number) => openDisplay(id));
ipcMain.handle('display:close', () => closeDisplay());
ipcMain.handle('display:status', () => isDisplayOpen());

// ---------- Запуск ----------
app.whenReady().then(async () => {
  for (const mod of Object.values(modules)) stateById[mod.id] = mod.initialState;
  loadSettings();
  loadSystemPacks(settings.library ?? defaultLibrary());
  stateById['vault'] = vaultState();
  initCards(settings.library ?? defaultLibrary());

  // Файлы хранилища (картинки, музыка): sg-asset://v/<путь внутри хранилища>,
  // картинки библиотеки карточек: sg-asset://l/<путь внутри библиотеки>, встроенные звуки: sg-asset://s/<путь>,
  // data of pdf.js (CMaps, fonts, wasm): sg-asset://p/<path>.
  // ?w=<ширина> — миниатюра.
  protocol.handle('sg-asset', async (request) => {
    const url = new URL(request.url);
    const rel = decodeURIComponent(url.pathname.slice(1));
    const file = url.host === 'v' ? resolveInVault(rel) : url.host === 'l' ? resolveInLibrary(rel) : url.host === 's' ? resolveSound(rel) : url.host === 'p' ? resolvePdfjs(rel) : null;
    if (!file) return new Response('Not found', { status: 404 });
    const w = Number(url.searchParams.get('w'));
    if (w > 0 && canThumb(file)) {
      const thumb = await thumbnail(file, w).catch(() => null);
      if (thumb) return serveFile(thumb, request);
    }
    return serveFile(file, request);
  });
  pruneThumbs();

  frame = frameNow();
  createControlWindow(frame, overlayColors());
  applyTheme();
  menu();
  watchDisplays();

  // Последнее открытое хранилище открывается само; если его нет, окно покажет выбор хранилища.
  if (settings.vault && isDir(settings.vault)) await enqueue('vault', () => openVault(settings.vault));
  initTelegram({
    get: () => settings.telegram ?? {},
    save: (next) => {
      settings = { ...settings, telegram: next };
      writeJsonAtomic(settingsFile(), settings);
    },
    changed: () => getControlWindow()?.webContents.send('telegram:changed'),
    dir: path.join(app.getPath('userData'), 'telegram'),
    received: (m) => getControlWindow()?.webContents.send('telegram:inbox', m),
    pressed,
  });
  initRepo({
    get: () => settings.repo ?? {},
    save: (next) => {
      settings = { ...settings, repo: next };
      writeJsonAtomic(settingsFile(), settings);
    },
    progress: repoProgress,
    dir: path.join(app.getPath('userData'), 'repo'),
  });
  initSchedule({
    file: path.join(app.getPath('userData'), 'schedule.json'),
    changed: () => getControlWindow()?.webContents.send('schedule:changed'),
    adventureName: (g) => g.adventure ?? '',
    imageFile: (g) => {
      if (!g.image) return null;
      if (g.image.startsWith(LIBRARY)) return resolveInLibrary(g.image.slice(LIBRARY.length));
      const root = g.vault ?? vaultRoot;
      if (!root) return null;
      const abs = path.resolve(root, g.image);
      return abs.startsWith(path.resolve(root) + path.sep) ? abs : null;
    },
  });
  // A little later: the window is up and the vault opened, the check doesn't slow the start.
  setTimeout(() => void checkUpdatesOnLaunch(), 5000);
});

app.on('window-all-closed', () => app.quit());
