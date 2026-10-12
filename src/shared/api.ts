// API, который preload открывает окнам как window.api.
import type { Card, CardRef, CardSummary } from './cards';
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
