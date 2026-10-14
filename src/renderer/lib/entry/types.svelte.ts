// Типы записей справочника в окне управления: встроенные (shared/compendium.ts) и свои — из библиотеки
// (compendium-types.json, окно «Типы записей»). typeDef читает реактивное состояние: виды перерисуются после правки типов.
import { CUSTOM_TYPES_FILE, parseCustomTypes, TYPES, typeOf, type CustomType, type Entry, type TypeDef } from '../../../shared/compendium';

export const customTypes = $state({ list: [] as CustomType[], loaded: false });

let loading: Promise<void> | null = null;
export function loadCustomTypes(): Promise<void> {
  loading ??= window.api.readLibraryData(CUSTOM_TYPES_FILE).then((data) => {
    customTypes.list = parseCustomTypes(data);
    customTypes.loaded = true;
  });
  return loading;
}

export async function saveCustomTypes(list: CustomType[]): Promise<boolean> {
  const clean = parseCustomTypes({ types: $state.snapshot(list) });
  if (!(await window.api.writeLibraryData(CUSTOM_TYPES_FILE, { types: clean }))) return false;
  customTypes.list = clean;
  return true;
}

export const isCustomType = (id: string) => !TYPES[id] && customTypes.list.some((t) => t.id === id);
export const typeDef = (id: string): TypeDef => TYPES[id] ?? customTypes.list.find((t) => t.id === id) ?? typeOf(id);
// Все типы для выбора: встроенные, потом свои.
export const allTypes = (): { id: string; def: TypeDef; custom: boolean }[] => [
  ...Object.entries(TYPES).map(([id, def]) => ({ id, def, custom: false })),
  ...customTypes.list.map((t) => ({ id: t.id, def: t as TypeDef, custom: true })),
];

// Запись для экрана игроков: со своим типом — вместе с его описанием.
export function forPlayers(e: Entry): Entry {
  const { def: _, ...rest } = e;
  const t = customTypes.list.find((x) => x.id === e.type);
  // Поля типа — из $state: через IPC уходит только снимок.
  return t && !TYPES[e.type] ? { ...rest, def: { title: t.title, plural: t.plural, fields: $state.snapshot(t.fields) } } : rest;
}
