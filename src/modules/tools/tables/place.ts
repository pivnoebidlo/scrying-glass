// Папка таблиц для места: приключения, «Общее» (null — корень хранилища) или библиотеки (LIBRARY).
import { store } from '../../../renderer/lib/store.svelte';
import { roleFolderHere } from '../../../shared/adventures';
import { LIBRARY, roleNames } from '../../../shared/vault';

export function tablesFolder(place: string | null): string {
  if (place === LIBRARY) return LIBRARY + 'tables';
  const app = store.state;
  const here = app.vault.tree ? roleFolderHere(app.vault.tree, { ...app.adventures, current: place }, 'tables') : null;
  const name = roleNames().tables[0]!;
  return here?.path ?? (place ? `${place}/${name}` : name);
}

// Видна ли таблица из этого места при текущем приключении (своё, общее, библиотека).
export const visibleHere = (place: string | null) => place === LIBRARY || place === null || store.state.adventures.current === null || place === store.state.adventures.current;
