// Свои расы и подрасы для покупки характеристик (правила 2014 года): лежат в библиотеке (pointbuy.json), общие
// для всех кампаний. Подрасу можно добавить и к встроенной расе («Эльф → Лесной»).
import { RACES_2014, type RaceDef, type Subrace } from '../../pointbuy';

export interface CustomSubrace extends Subrace {
  // К какой расе относится: встроенной (id из RACES_2014) или своей.
  parent: string;
}

interface Data {
  races: RaceDef[];
  subraces: CustomSubrace[];
}

export const custom = $state<Data & { loaded: boolean }>({ races: [], subraces: [], loaded: false });

let loading: Promise<void> | null = null;
export function loadRaces() {
  loading ??= window.api.readLibraryData('pointbuy.json').then((d) => {
    const data = (d ?? {}) as Partial<Data>;
    custom.races = Array.isArray(data.races) ? data.races : [];
    custom.subraces = Array.isArray(data.subraces) ? data.subraces : [];
    custom.loaded = true;
  });
  return loading;
}

let timer: ReturnType<typeof setTimeout> | undefined;
// Сохранить чуть позже: правки идут подряд (набор названия).
export function saveRaces() {
  clearTimeout(timer);
  timer = setTimeout(() => window.api.writeLibraryData('pointbuy.json', $state.snapshot({ races: custom.races, subraces: custom.subraces })), 400);
}

// Все расы для выбора: встроенные (со своими подрасами пользователя) и свои.
export function allRaces(): (RaceDef & { own: boolean })[] {
  const withSubs = (r: RaceDef, own: boolean) => ({ ...r, own, subraces: [...r.subraces, ...custom.subraces.filter((s) => s.parent === r.id)] });
  return [...RACES_2014.map((r) => withSubs(r, false)), ...custom.races.map((r) => withSubs(r, true))];
}

export const newId = () => 'c-' + crypto.randomUUID().slice(0, 8);
