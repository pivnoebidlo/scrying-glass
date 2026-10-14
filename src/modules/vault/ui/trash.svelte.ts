// Корзина приложения в окне: что в ней лежит (у хранилища и библиотеки своя, main/trash.ts). Список перечитывается
// по событию ядра trash:changed.
import type { TrashItem } from '../../../shared/trash';

export const trash = $state({ vault: [] as TrashItem[], library: [] as TrashItem[] });

let connected = false;
export async function loadTrash() {
  if (!connected) {
    connected = true;
    window.api.onTrashChanged(() => void loadTrash());
  }
  const t = await window.api.listTrash();
  trash.vault = t.vault;
  trash.library = t.library;
}

export const trashCount = () => trash.vault.length + trash.library.length;
