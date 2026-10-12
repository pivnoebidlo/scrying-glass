// API, который preload открывает окнам как window.api.
import type { Card, CardRef, CardScope, CardSummary } from './cards';
import type { ActionArgs, ActionName, AppState, ModuleId } from './types';

export interface DisplayInfo {
  id: number;
  primary: boolean;
  label: string;
  width: number;
  height: number;
}

export interface Api {
  getState(): Promise<AppState>;
  dispatch<K extends ModuleId, A extends ActionName<K>>(module: K, name: A, ...payload: ActionArgs<K, A>): Promise<AppState>;
  onState(cb: (state: AppState) => void): void;

  // Карточки живут отдельно от состояния: их сотни, рассылать их после каждого действия незачем.
  listCards(): Promise<CardSummary[]>;
  getCard(ref: CardRef): Promise<Card | null>;
  onCardsChanged(cb: () => void): void;
  // Сохранить карточку. Существующая (id есть в этом месте) пишется в свой файл, новая — в библиотеку
  // или в папку бестиария хранилища folder (путь внутри хранилища). Возвращает ссылку на сохранённую.
  saveCard(scope: CardScope, card: Card, folder?: string): Promise<CardRef>;
  // Удалить карточку: спрашивает подтверждение и про её картинки. true — удалили.
  deleteCard(ref: CardRef): Promise<boolean>;
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
  addCardImage(scope: CardScope, vaultPath?: string, folder?: string): Promise<{ path: string; copied: boolean } | null>;
  // Экспорт выбранных карточек или всего места хранения в файл (диалог). Число карточек или null — отменили.
  exportCards(what: { refs?: CardRef[]; scope?: CardScope; folder?: string; name: string }): Promise<number | null>;
  // Импорт: выбрать файлы (диалог), затем импортировать их в выбранное место.
  pickImportFiles(): Promise<string[]>;
  importCards(files: string[], scope: CardScope, folder?: string): Promise<{ count: number; errors: string[] }>;
  library(): Promise<{ path: string | null; isDefault: boolean }>;
  chooseLibrary(reset?: boolean): Promise<void>;
  revealLibrary(): Promise<void>;

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
