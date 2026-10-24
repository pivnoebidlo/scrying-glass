// API, который preload открывает окнам как window.api.
import type { RepoCatalog, RepoEntry, RepoInfo, RepoProgress } from './repo';
import type { BuiltinSounds } from './sounds';
import type { Card, CardRef, CardScope, CardSummary, LssMatch, LssPreview } from './cards';
import type { BuiltinBook } from './compendium';
import type { Note } from './notes';
import type { Sketch } from './sketch';
import type { TrashItem, TrashKind, TrashPlace, TrashSettings } from './trash';
import type { ActionArgs, ActionName, AppState, ModuleId } from './types';
import type { UpdateInfo, UpdateSettings } from './updates';
import type { TgChat, TgMessage, TgStatus, TgTable } from './telegram';
import type { Game, ScheduleData } from './schedule';

// The control window's title bar (main/windows.ts): the system one, or the tab bar as the title bar — with the
// traffic lights inside (macOS) or the system buttons over the corner (Windows, Linux).
export type WindowFrame = 'system' | 'mac' | 'overlay';
// The setting: on — the tab bar is the title bar; byDefault — what "no setting" means on this system.
export interface TitleBarSetting {
  on: boolean;
  byDefault: boolean;
  // What the window was made with.
  now: WindowFrame;
}

export interface DisplayInfo {
  id: number;
  primary: boolean;
  label: string;
  width: number;
  height: number;
}

export interface BackupInfo {
  id: string;
  created: number;
  reason: 'open' | 'auto' | 'quit' | 'manual' | 'before-restore';
  vault: string | null;
  vaultName: string;
  files: number;
  bytes: number;
}

export interface Api {
  getState(): Promise<AppState>;
  dispatch<K extends ModuleId, A extends ActionName<K>>(module: K, name: A, ...payload: ActionArgs<K, A>): Promise<AppState>;
  onState(cb: (state: AppState) => void): void;

  // Карточки живут отдельно от состояния: их сотни, рассылать их после каждого действия незачем.
  // Встроенные звуки (resources/sounds): пути «sound:…».
  builtinSounds(): Promise<BuiltinSounds>;

  listCards(): Promise<CardSummary[]>;
  getCard(ref: CardRef): Promise<Card | null>;
  onCardsChanged(cb: () => void): void;
  // Сохранить карточку. Существующая (id есть в этом месте) пишется в свой файл, новая — в библиотеку
  // или в папку бестиария хранилища folder (путь внутри хранилища). Возвращает ссылку на сохранённую.
  // scope 'srd' — правка встроенной карточки (ложится в библиотеку и заменяет встроенную под той же ссылкой).
  saveCard(scope: CardScope, card: Card, folder?: string): Promise<CardRef>;
  // Удалить карточку: спрашивает подтверждение и про её картинки. true — удалили.
  deleteCard(ref: CardRef): Promise<boolean>;
  // Убрать правку встроенной карточки — снова как в SRD (спросит подтверждение). true — убрали.
  revertSrdCard(ref: CardRef): Promise<boolean>;
  // Портреты встроенной карточки (хранятся в библиотеке, общие для всех её переводов).
  setSrdPortraits(ref: CardRef, portraits: string[]): Promise<void>;
  // Убрать картинки, скопированные для несохранённого черновика (если ими никто не пользуется).
  // ownedOnly — не трогать картинки из папок персонажей (там обычно файлы пользователя).
  discardCardImages(scope: CardScope, paths: string[], ownedOnly?: boolean): Promise<void>;
  // Черновик копии для другого места (картинки копируются туда же). Сохраняется через saveCard.
  // copied — картинки, скопированные для черновика (убрать через discardCardImages, если не сохранят).
  copyCardDraft(ref: CardRef, to: CardScope, folder?: string): Promise<{ card: Card; copied: string[] } | null>;
  moveCard(ref: CardRef, to: CardScope, folder?: string): Promise<CardRef | null>;
  // Добавить картинку: из хранилища (vaultPath) или с диска через диалог. Путь для card.portraits и был ли
  // файл скопирован; null — отменили.
  addCardImage(scope: CardScope, vaultPath?: string, folder?: string, fromClipboard?: boolean): Promise<{ path: string; copied: boolean } | null>;
  // Экспорт выбранных карточек или всего места хранения в файл (диалог). Число карточек или null — отменили.
  exportCards(what: { refs?: CardRef[]; scope?: CardScope; folder?: string; name: string }): Promise<number | null>;
  // Импорт: выбрать файлы (диалог), затем импортировать их в выбранное место.
  pickImportFiles(): Promise<string[]>;
  // matches — персонажи из LSS, у которых в этом месте уже есть карточка: окно спрашивает, обновить её или создать
  // новую (newLss — импортировать их новыми).
  importCards(files: string[], scope: CardScope, folder?: string, newLss?: boolean): Promise<{ count: number; errors: string[]; matches: LssMatch[] }>;
  // Выбрать экспорт персонажа из LSS (диалог) и прочитать его для предпросмотра. null — отменили.
  pickLss(): Promise<{ file: string; lss: LssPreview } | null>;
  // Прочитать экспорт LSS по пути (для совпадений импорта).
  readLss(file: string): Promise<LssPreview>;
  // Таблица заклинаний LSS (номер → название) для заклинаний-карточек: сколько загружено, загрузить файлы
  // (диалог; null — отменили), очистить.
  lssSpellCount(): Promise<number>;
  importLssSpells(): Promise<{ before: number; total: number; errors: string[] } | null>;
  clearLssSpells(): Promise<void>;
  // Обновить карточку персонажа из экспорта LSS (прежняя версия — в корзину); merged — итог, собранный из
  // выбранных мастером изменений (нет — всё из файла).
  updateFromLss(ref: CardRef, file: string, merged?: { name: string; system: string; stats: unknown }): Promise<CardRef | null>;
  library(): Promise<{ path: string | null; isDefault: boolean }>;
  chooseLibrary(reset?: boolean): Promise<void>;
  revealLibrary(): Promise<void>;
  // The name generator's own lists in <library>/names/<lang>/: all of them, load files (a dialog; null — cancelled),
  // open the folder.
  listNameLists(): Promise<{ file: string; lang: string; text: string }[]>;
  importNameLists(): Promise<{ count: number; errors: string[] } | null>;
  revealNameLists(): Promise<void>;
  // Save text into a file the GM picks (name — the suggested name with an extension). false — cancelled or failed.
  saveTextFile(name: string, text: string): Promise<boolean>;
  // A picture (vault path or «library:…») into the clipboard as PNG; false — it could not be read.
  copyImage(path: string): Promise<boolean>;

  // Хранилище перечитано (файлы изменились — в приложении или снаружи).
  onVaultRescan(cb: () => void): void;
  // Записки (shared/notes.ts): пути — внутри хранилища, только «….note.json».
  readNote(path: string): Promise<Note | null>;
  writeNote(path: string, note: Note): Promise<boolean>;
  // Новая записка в папке (создаётся, если её нет). Путь к файлу или null.
  createNote(folder: string, title: string, note: Note): Promise<string | null>;
  // Новое название = новое имя файла. Новый путь или null.
  renameNote(path: string, title: string): Promise<string | null>;
  // Canvases (shared/sketch.ts): the same, only «….sketch.json».
  readSketch(path: string): Promise<Sketch | null>;
  writeSketch(path: string, sketch: Sketch): Promise<boolean>;
  createSketch(folder: string, title: string, sketch: Sketch): Promise<string | null>;
  renameSketch(path: string, title: string): Promise<string | null>;

  // Справочник (shared/compendium.ts): Markdown-записи в папках справочника хранилища и в библиотеке
  // («library:compendium/…»). Удаление записи библиотеки — trashLibraryEntry.
  readEntry(path: string): Promise<string | null>;
  listLibraryEntries(): Promise<{ path: string; text: string }[]>;
  // Встроенный справочник (SRD по редакциям), только чтение.
  listBuiltinEntries(): Promise<BuiltinBook[]>;
  writeEntry(path: string, text: string): Promise<boolean>;
  createEntry(folder: string, title: string, text: string): Promise<string | null>;
  renameEntry(path: string, title: string): Promise<string | null>;
  onCompendiumChanged(cb: () => void): void;
  // Переименовать файл хранилища (картинку, трек): name — без расширения. Ссылки в состоянии и в портретах карточек
  // поправит ядро. Новый путь или null.
  renameFile(path: string, name: string): Promise<string | null>;
  // Журнал (shared/journal.ts): Markdown-заметки в папках журнала хранилища. Удаление — действие vault/trash.
  readPage(path: string): Promise<string | null>;
  writePage(path: string, text: string): Promise<boolean>;
  createPage(folder: string, title: string, text: string): Promise<string | null>;
  createPageFolder(folder: string, title: string): Promise<string | null>;
  // Новое название = новое имя файла; перенос — в другую папку журнала. Новый путь или null.
  renamePage(path: string, title: string): Promise<string | null>;
  movePage(path: string, folder: string): Promise<string | null>;
  // Rename a folder inside a journal folder; the new path or null.
  renamePageFolder(path: string, title: string): Promise<string | null>;
  // A library entry of the compendium — to the trash (asks to confirm). true — removed.
  trashLibraryEntry(path: string): Promise<boolean>;
  // Updates (shared/updates.ts): the setting, a check now, open a release page, a newer version found on launch.
  pathForFile(file: File): string;
  // The control window's title bar: chosen when the window is made (--sg-frame); the setting makes it anew.
  frame: WindowFrame;
  onFullscreen(cb: (on: boolean) => void): void;
  titleBar(): Promise<TitleBarSetting>;
  setTitleBar(on: boolean): Promise<TitleBarSetting>;
  setTitleBarColors(colors: { color: string; symbolColor: string }): void;
  updateSettings(): Promise<UpdateSettings>;
  setUpdateSettings(next: Partial<UpdateSettings>): Promise<UpdateSettings>;
  checkForUpdates(): Promise<UpdateInfo>;
  appVersion(): Promise<string>;
  openRelease(url: string): Promise<void>;
  onUpdateAvailable(cb: (info: UpdateInfo) => void): void;
  // Telegram (main/telegram.ts): status and chats, token, a chat on/off and its label; sending — text (Telegram HTML),
  // a picture of the vault or library, a capture of a part of this window (in CSS pixels). Result: sent, errors.
  telegramStatus(): Promise<TgStatus>;
  setTelegramToken(token: string | null): Promise<TgStatus>;
  updateTelegramChat(id: number, patch: Partial<Pick<TgChat, 'enabled' | 'label' | 'table'>>): Promise<TgStatus>;
  // Tables (the groups of people who play together): the whole list; chats of a removed table lose it.
  setTelegramTables(tables: TgTable[]): Promise<TgStatus>;
  // About: open one of its links (shared/about.ts); the menu asks to open a settings section.
  openLink(url: string): Promise<void>;
  onOpenSettings(cb: (section: string) => void): void;
  // The game schedule (shared/schedule.ts, common to all vaults): the whole of it; the games as edited; announce a
  // game (its occurrence key) to its table with «I'll come» buttons; changes (answers, reminders sent).
  schedule(): Promise<ScheduleData>;
  saveSchedule(games: Game[]): Promise<ScheduleData>;
  announceGame(key: string): Promise<{ sent: number; error?: string }>;
  // The game changed after its announcement: edit the sent announcement; notify — and tell the players what changed.
  updateAnnouncement(key: string, notify: boolean): Promise<{ error?: string }>;
  onScheduleChanged(cb: () => void): void;
  forgetTelegramChat(id: number): Promise<TgStatus>;
  telegramSendText(chats: number[], html: string, replyTo?: number): Promise<{ sent: number; errors: string[] }>;
  // The inbox: what players wrote in enabled chats and what the app sent; mark read / clear (a chat or all); a
  // photo as a data: URL; a new message as it comes.
  telegramInbox(): Promise<TgMessage[]>;
  telegramMarkRead(chat?: number): Promise<TgMessage[]>;
  telegramClearInbox(chat?: number): Promise<TgMessage[]>;
  telegramPhoto(name: string): Promise<string | null>;
  // Delete a message the app sent — for everyone (Telegram allows 48 hours); an error text or null. Hide any message
  // in the app only. Send an image's bytes (pasted or dropped) as a picture.
  telegramDelete(id: string): Promise<string | null>;
  telegramHide(id: string): Promise<TgMessage[]>;
  telegramSendBytes(chats: number[], data: Uint8Array, name: string, caption?: string): Promise<{ sent: number; errors: string[] }>;
  onTelegramMessage(cb: (m: TgMessage) => void): void;
  telegramSendFile(chats: number[], path: string, caption?: string): Promise<{ sent: number; errors: string[] }>;
  telegramSendCapture(chats: number[], rect: { x: number; y: number; width: number; height: number }, name: string, caption?: string): Promise<{ sent: number; errors: string[] }>;
  onTelegramChanged(cb: () => void): void;
  // Полная резервная копия одним файлом (.sgbackup, main/archive.ts): сколько весят библиотека и папка хранилища,
  // сохранить (media — вместе с картинками и музыкой хранилища; путь или null), восстановить (спросит файл и куда).
  backupSizes(): Promise<{ library: number; media: number }>;
  saveFullBackup(media: boolean): Promise<string | null>;
  restoreFullBackup(): Promise<{ files: number; vault: string } | null>;
  // Приключение одним файлом (.sgpack, main/packs.ts): экспорт спросит про музыку и куда сохранить (путь или null),
  // импорт — какой файл (что вышло или null — отменили).
  exportAdventure(name: string): Promise<string | null>;
  // Удалить приключение: папка — в корзину, его сцены, заготовки и разметка карт — из приложения (спросит).
  deleteAdventure(name: string): Promise<boolean>;
  // Импорт в два шага: выбрать файл (название из него, есть ли такое уже, свободный вариант), потом — импорт под
  // выбранным названием (занятое не принимается).
  pickAdventurePack(): Promise<{ file: string; name: string; exists: boolean; suggestion: string } | null>;
  adventureNameFree(name: string): Promise<boolean>;
  importAdventure(file: string, name: string): Promise<{ name: string; renamed: boolean; scenes: number; encounters: number; cards: number } | null>;
  // The adventure repository (main/repo.ts, shared/repo.ts). Errors come as `repo:<code>` in the message.
  repoInfo(): Promise<RepoInfo>;
  setRepoName(name: string): Promise<RepoInfo>;
  // Sources of adventures: a repository is checked before it is added; the official one can only be turned off.
  repoAddSource(name: string, url: string): Promise<RepoInfo>;
  repoRemoveSource(id: string): Promise<RepoInfo>;
  repoSetSourceOff(id: string, off: boolean): Promise<RepoInfo>;
  repoCatalog(source: string): Promise<RepoCatalog>;
  // A cover as a data: URL (null — none or not reachable).
  repoCover(source: string, author: string, id: string, version: number): Promise<string | null>;
  // What an adventure weighs: all of it, its music, its PDFs (bytes).
  repoSizes(adventure: string): Promise<{ total: number; music: number; pdf: number } | null>;
  // Publish or update (the same entry if this vault published it before); cover — a picture of the vault.
  repoPublish(p: { source: string; adventure: string; title: string; description: string; lang: string; music: boolean; pdf: boolean; cover?: string }): Promise<RepoEntry | null>;
  repoUnpublish(source: string, id: string): Promise<void>;
  // Download into a temporary file, then install under a name (like the import of a file) or discard it.
  repoDownload(source: string, author: string, id: string): Promise<{ file: string; name: string; exists: boolean; suggestion: string } | null>;
  repoInstall(file: string, name: string, entry: RepoEntry, source: string): Promise<{ name: string; renamed: boolean; scenes: number; encounters: number; cards: number } | null>;
  repoDiscard(file: string): Promise<void>;
  // The author key to a file and back (asks where; true / the new info — done).
  repoExportKey(): Promise<boolean>;
  repoImportKey(): Promise<RepoInfo | null>;
  onRepoProgress(cb: (p: RepoProgress) => void): void;
  // Снимки данных приложения (main/backups.ts): список (новые сверху), сделать сейчас, восстановить (спросит
  // подтверждение; число записанных файлов, 0 — отменили), открыть папку снимков.
  listBackups(): Promise<BackupInfo[]>;
  createBackup(): Promise<BackupInfo | null>;
  restoreBackup(id: string, parts: { vault: boolean; library: boolean }): Promise<number>;
  revealBackups(): Promise<void>;
  // Папка снимков и полных копий; выбрать другую (reset — по умолчанию) — снимки переезжают туда.
  backupsDir(): Promise<{ path: string; isDefault: boolean }>;
  chooseBackupsDir(reset?: boolean): Promise<{ path: string; isDefault: boolean }>;
  // Данные инструментов в библиотеке (общие для всех кампаний): pointbuy.json — свои расы.
  readLibraryData(name: string): Promise<unknown>;
  writeLibraryData(name: string, data: unknown): Promise<boolean>;
  // Открыть файл хранилища в программе по умолчанию.
  openFile(path: string): Promise<void>;
  // Корзина приложения (main/trash.ts): у хранилища и библиотеки своя. Вернуть (что вернулось или null), удалить
  // насовсем и очистить (спросят подтверждение), показать папку .trash в Finder.
  listTrash(): Promise<{ vault: TrashItem[]; library: TrashItem[] }>;
  restoreTrash(place: TrashPlace, id: string): Promise<{ title: string; path: string; kind: TrashKind } | null>;
  purgeTrash(place: TrashPlace, id: string, title: string): Promise<boolean>;
  emptyTrash(): Promise<boolean>;
  revealTrash(place: TrashPlace): Promise<void>;
  // Настройки корзины: удалять сразу или в корзину, через сколько дней очищать (0 — никогда).
  trashSettings(): Promise<TrashSettings>;
  setTrashSettings(next: Partial<TrashSettings>): Promise<TrashSettings>;
  onTrashChanged(cb: () => void): void;

  listDisplays(): Promise<DisplayInfo[]>;
  onDisplaysChanged(cb: () => void): void;

  openDisplay(id: number): Promise<void>;
  closeDisplay(): Promise<void>;
  getDisplayStatus(): Promise<boolean>;
  onDisplayStatus(cb: (open: boolean) => void): void;
}

declare global {
  interface Window {
    api: Api;
  }
}
