// Корзина приложения в окне: что в ней лежит (у хранилища и библиотеки своя, main/trash.ts). Список перечитывается
// по событию ядра trash:changed.
import { TRASH_DEFAULTS, type TrashItem, type TrashSettings } from '../../../shared/trash';

export const trash = $state({ vault: [] as TrashItem[], library: [] as TrashItem[], settings: { ...TRASH_DEFAULTS } as TrashSettings });

let connected = false;
export async function loadTrash() {
  if (!connected) {
    connected = true;
    window.api.onTrashChanged(() => void loadTrash());
  }
  const [t, settings] = await Promise.all([window.api.listTrash(), window.api.trashSettings()]);
  trash.vault = t.vault;
  trash.library = t.library;
  trash.settings = settings;
}

export async function setTrashSettings(next: Partial<TrashSettings>) {
  trash.settings = await window.api.setTrashSettings(next);
}

// Сроки автоочистки (дни; 0 — никогда).
export const TRASH_DAYS = [0, 7, 30, 90, 365];
export const daysTitle = (d: number) => (d === 0 ? 'Никогда' : d === 7 ? 'Через неделю' : d === 365 ? 'Через год' : `Через ${d} дней`);

export const trashCount = () => trash.vault.length + trash.library.length;
