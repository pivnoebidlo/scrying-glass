// Корзина приложения в окне: что в ней лежит (у хранилища и библиотеки своя, main/trash.ts). Список перечитывается
// по событию ядра trash:changed.
import { t } from '../../../renderer/lib/i18n.svelte';
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
export const daysTitle = (d: number) =>
  d === 0 ? t('vault.trash.never') : d === 7 ? t('vault.trash.week') : d === 365 ? t('vault.trash.year') : t('vault.trash.days', { count: d });

export const trashCount = () => trash.vault.length + trash.library.length;
