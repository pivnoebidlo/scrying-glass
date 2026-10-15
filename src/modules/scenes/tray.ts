// Подборка правой панели: фоны, карты, портреты и раздатка, накиданные под рукой, — щелчок выводит на экран и
// убирает. У каждой сцены своя подборка; без включённой сцены — общая подборка приключения (ключ — папка,
// '' — всё хранилище). Всё, что выводится на экран, попадает в текущую подборку само (`addShown`).
import type { AdventuresState } from '../../shared/adventures';
import type { Scene, SceneContent, ScenesState } from './types';
import { scenesFor } from './types';

// music — плейлисты (папки) и отдельные треки; encounters — id заготовок боёв, остальное — пути файлов.
export type TrayPart = 'background' | 'map' | 'portraits' | 'handout' | 'music' | 'encounters';
export const TRAY_PARTS: TrayPart[] = ['background', 'map', 'portraits', 'handout', 'music', 'encounters'];
const FILE_PARTS: TrayPart[] = ['background', 'map', 'portraits', 'handout', 'music'];

export type Tray = Record<TrayPart, string[]>;
export const emptyTray = (): Tray => ({ background: [], map: [], portraits: [], handout: [], music: [], encounters: [] });
// Подборки до музыки и боёв — без этих частей.
const full = (t: Partial<Tray> | undefined): Tray => ({ ...emptyTray(), ...t });

// Что сейчас на экране игроков — по частям подборки. Только нужное из состояния, чтобы работало и в ядре.
export interface ScreenNow {
  scene: { background: string | null };
  maps: { current: string | null };
  portraits: { onScreen: string[] };
  handouts: { current: string | null };
  music: { playing: boolean; playlist: string | null };
  initiative: { combatants: { encounter?: string }[] };
}
export function shown(app: ScreenNow): Tray {
  const one = (p: string | null) => (p ? [p] : []);
  return {
    background: one(app.scene.background),
    map: one(app.maps.current),
    portraits: [...app.portraits.onScreen],
    handout: one(app.handouts.current),
    music: app.music.playing ? one(app.music.playlist) : [],
    encounters: [...new Set(app.initiative.combatants.map((c) => c.encounter).filter((e): e is string => !!e))],
  };
}

// Подборка сцены по её содержимому: так начинается подборка новой сцены и сцен из прежних версий.
export function trayOf(c: SceneContent): Tray {
  const one = (p: string | null) => (p ? [p] : []);
  return { ...emptyTray(), background: one(c.background.path), map: one(c.map.path), portraits: [...c.portraits.paths], handout: one(c.handout.path), music: one(c.music.playlist) };
}

// Чья подборка сейчас в панели: включённой сцены (если она видна в текущем приключении) или приключения.
export type TrayOwner = { scene: string } | { adventure: string };
export function trayOwner(s: ScenesState, adv: AdventuresState): TrayOwner {
  if (s.active && scenesFor(s, adv).some((x) => x.id === s.active)) return { scene: s.active };
  return { adventure: adv.current ?? '' };
}

export function currentTray(s: ScenesState, adv: AdventuresState): Tray {
  const o = trayOwner(s, adv);
  const t = 'scene' in o ? s.scenes.find((x) => x.id === o.scene)?.tray : s.trays?.[o.adventure];
  return full(t);
}

// Есть ли что-то в текущей подборке (блок правой панели тогда не сворачивается в «нет»).
export const inTray = (app: { scenes: ScenesState; adventures: AdventuresState }, part: TrayPart) =>
  currentTray(app.scenes, app.adventures)[part].length > 0;

// Поменять подборку (чью — окно знает: trayOwner).
export function editTray(s: ScenesState, o: TrayOwner, fn: (t: Tray) => Tray): ScenesState {
  if ('scene' in o) {
    return { ...s, scenes: s.scenes.map((x): Scene => (x.id === o.scene ? { ...x, tray: fn(full(x.tray)) } : x)) };
  }
  return { ...s, trays: { ...s.trays, [o.adventure]: fn(full(s.trays?.[o.adventure])) } };
}

// Объединить подборки (новая сцена из подборки и того, что на экране).
export function merge(a: Tray, b: Tray): Tray {
  for (const part of TRAY_PARTS) a = addTo(a, part, b[part]);
  return a;
}

export function addTo(t: Tray, part: TrayPart, paths: string[]): Tray {
  const more = paths.filter((p, i) => p && !t[part].includes(p) && paths.indexOf(p) === i);
  return more.length ? { ...t, [part]: [...t[part], ...more] } : t;
}

export const removeFrom = (t: Tray, part: TrayPart, path: string): Tray =>
  t[part].includes(path) ? { ...t, [part]: t[part].filter((p) => p !== path) } : t;

// Новое на экране (было не показано — стало) — в подборку.
export function addShown(t: Tray, before: ScreenNow, after: ScreenNow): Tray {
  const was = shown(before);
  const now = shown(after);
  for (const part of TRAY_PARTS) t = addTo(t, part, now[part].filter((p) => !was[part].includes(p)));
  return t;
}

// Убрать из подборок пути, которых больше нет (keep — путь существует или он вне хранилища).
export function pruneTrays(s: ScenesState, keep: (path: string) => boolean): ScenesState {
  let changed = false;
  const clean = (old: Tray): Tray => {
    const t = full(old);
    const next = { ...t, ...Object.fromEntries(FILE_PARTS.map((p) => [p, t[p].filter(keep)])) } as Tray;
    if (FILE_PARTS.some((p) => next[p].length !== t[p].length)) {
      changed = true;
      return next;
    }
    return t;
  };
  const scenes = s.scenes.map((x) => (x.tray ? { ...x, tray: clean(x.tray) } : x));
  const trays = Object.fromEntries(Object.entries(s.trays ?? {}).map(([k, t]) => [k, clean(t)]));
  return changed ? { ...s, scenes, trays } : s;
}
