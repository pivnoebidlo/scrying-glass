// Связь справочника с остальным окном: выдвижная панель записи (открыть её можно откуда угодно — из статблока,
// листа персонажа, трекера инициативы). Панель рисует фоновый компонент справочника (modules/compendium); здесь
// только общее состояние без зависимостей.

// Что открыто в панели: названия, по которым искать запись (первое найденное; «Ослеплён» → «Ослеплённый», «Blinded»).
// path — когда известна сама запись (из поиска ⌘K): одинаковые названия бывают в разных местах.
export const entryPeek = $state({ names: null as string[] | null, path: null as string | null });

export function peekEntry(names: string | string[]) {
  const list = Array.isArray(names) ? names : [names];
  const same = entryPeek.names && entryPeek.names.join('|') === list.join('|');
  // Повторное нажатие на ту же ссылку закрывает панель, как у карточек.
  entryPeek.names = same ? null : list;
  entryPeek.path = null;
}
export function peekEntryAt(path: string, title: string) {
  entryPeek.names = [title];
  entryPeek.path = path;
}
export function closeEntryPeek() {
  entryPeek.names = null;
  entryPeek.path = null;
}
