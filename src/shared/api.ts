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
  // Сохранить в библиотеку или хранилище (пустой id — новая карточка). Возвращает ссылку на сохранённую.
  saveCard(scope: CardScope, card: Card): Promise<CardRef>;
  deleteCard(ref: CardRef): Promise<void>;
  // Черновик копии для другого места хранения (картинки копируются туда же). Сохраняется через saveCard.
  copyCardDraft(ref: CardRef, to: CardScope): Promise<Card | null>;
  moveCard(ref: CardRef, to: CardScope): Promise<CardRef | null>;
  // Добавить картинку: из хранилища (vaultPath) или с диска через диалог. Путь для card.portraits или null.
  addCardImage(scope: CardScope, vaultPath?: string): Promise<string | null>;
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
