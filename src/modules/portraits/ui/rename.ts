// Переименовать портрет с плитки или из правой панели: у картинки есть своя карточка — меняется название карточки
// (оно же подпись у игроков), иначе — имя файла. Ручная подпись прежних версий при этом убирается.
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { isLibraryAsset } from '../../../shared/vault';
import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';

export const canRename = (path: string) => !isLibraryAsset(path) || !!bestiary.cardFor(path);

export async function renamePortrait(path: string, name: string) {
  await connectCards();
  if (store.state.portraits.names[path]) await dispatch('portraits', 'rename', { path, name: '' });
  const card = bestiary.cardFor(path);
  if (card) await bestiary.rename(card.ref, name);
  else if (!isLibraryAsset(path)) await window.api.renameFile(path, name);
}
