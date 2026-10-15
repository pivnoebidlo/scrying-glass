// API, который preload открывает окнам как window.api.
import type { BuiltinSounds } from './sounds';
import type { Card, CardRef, CardScope, CardSummary, LssMatch, LssPreview } from './cards';
import type { BuiltinBook } from './compendium';
import type { Note } from './notes';
import type { TrashItem, TrashKind, TrashPlace, TrashSettings } from './trash';
import type { ActionArgs, ActionName, AppState, ModuleId } from './types';

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

  // Хранилище перечитано (файлы изменились — в приложении или снаружи).
  onVaultRescan(cb: () => void): void;
  // Записки (shared/notes.ts): пути — внутри хранилища, только «….note.json».
  readNote(path: string): Promise<Note | null>;
  writeNote(path: string, note: Note): Promise<boolean>;
  // Новая записка в папке (создаётся, если её нет). Путь к файлу или null.
  createNote(folder: string, title: string, note: Note): Promise<string | null>;
  // Новое название = новое имя файла. Новый путь или null.
  renameNote(path: string, title: string): Promise<string | null>;

  // Справочник (shared/compendium.ts): Markdown-записи в папках справочника хранилища и в библиотеке
  // («library:compendium/…»). Удаление записи библиотеки — trashLibraryTable.
  readEntry(path: string): Promise<string | null>;
  listLibraryEntries(): Promise<{ path: string; text: string }[]>;
  // Встроенный справочник (SRD по редакциям), только чтение.
  listBuiltinEntries(): Promise<BuiltinBook[]>;
  writeEntry(path: string, text: string): Promise<boolean>;
  createEntry(folder: string, title: string, text: string): Promise<string | null>;
  renameEntry(path: string, title: string): Promise<string | null>;
  onCompendiumChanged(cb: () => void): void;
  // Таблицы случайностей (shared/tables.ts): .md / .txt в папках таблиц хранилища или в библиотеке
  // (пути «library:tables/…» — общие для всех кампаний).
  readTable(path: string): Promise<string | null>;
  listLibraryTables(): Promise<{ path: string; text: string }[]>;
  // Встроенные таблицы — в библиотеку (только новые; restore — и удалённые). Сколько файлов записано.
  seedLibraryTables(files: { name: string; text: string }[], restore?: boolean): Promise<number>;
  // Таблица или запись библиотеки — в корзину (спросит подтверждение). true — удалена.
  trashLibraryTable(path: string): Promise<boolean>;
  onTablesChanged(cb: () => void): void;
  writeTable(path: string, text: string): Promise<boolean>;
  createTable(folder: string, title: string, text: string): Promise<string | null>;
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
