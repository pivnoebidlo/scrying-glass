// Карты: какая на экране игроков, туман войны, область обзора, сетка.
import { GRID_SHAPES } from './grid';
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles } from '../../shared/vault';
import { dataOf } from './data';
import type { FogOp, Grid, MapData, MapPin, MapsState, MapToken, MapView } from './types';

// Туман хранится операциями, но не бесконечно: самые старые сворачивать нечем, поэтому просто ограничиваем.
const MAX_OPS = 2000;

const withMap = (s: MapsState, path: string, fn: (d: MapData) => MapData): MapsState => ({
  ...s,
  maps: { ...s.maps, [path]: fn(dataOf(s, path)) },
});

const clampView = (v: MapView): MapView => {
  const w = Math.min(Math.max(v.w, 0.02), 4);
  const h = Math.min(Math.max(v.h, 0.02), 4);
  return { x: v.x, y: v.y, w, h };
};

// Дробная часть: сдвиг сетки на целую клетку ничего не меняет.
const frac = (v: number) => Math.round((((v % 1) + 1) % 1) * 1000) / 1000;

// Убирает карты, файлов которых больше нет в хранилище.
function prune(s: MapsState, ctx: ModuleContext): MapsState {
  const tree = ctx.vault.tree;
  if (!tree) return s;
  const exists = new Set(allFiles(tree, 'image').map((f) => f.path));
  const gone = Object.keys(s.maps).filter((p) => !exists.has(p));
  if (!gone.length && (!s.current || exists.has(s.current))) return s;
  const maps = { ...s.maps };
  for (const p of gone) delete maps[p];
  return { ...s, maps, current: s.current && exists.has(s.current) ? s.current : null };
}

// Карты из сохранений до меток и жетонов.
const withPins = (s: MapsState): MapsState =>
  Object.values(s.maps).every((d) => d.pins && d.tokens)
    ? s
    : { ...s, maps: Object.fromEntries(Object.entries(s.maps).map(([p, d]) => [p, { ...d, pins: d.pins ?? [], tokens: d.tokens ?? [] }])) };

const initialState: MapsState = { current: null, maps: {}, defaultFog: 'hidden', pinSize: 1 };

export default defineModule({
  id: 'maps',
  persist: true,
  initialState,

  init: (s, ctx) => prune(withPins(s), ctx),
  onTreeChange: prune,

  actions: {
    // Подготовить карту к работе (создать данные), не показывая игрокам.
    open(s, { path }: { path: string }) {
      return s.maps[path] ? s : withMap(s, path, (d) => d);
    },

    show(s, { path }: { path: string }) {
      return { ...withMap(s, path, (d) => d), current: path };
    },

    clear(s) {
      return { ...s, current: null };
    },

    addFog(s, { path, op }: { path: string; op: FogOp }) {
      return withMap(s, path, (d) => ({ ...d, fog: { ...d.fog, ops: [...d.fog.ops, op].slice(-MAX_OPS) } }));
    },

    undoFog(s, { path }: { path: string }) {
      return withMap(s, path, (d) => ({ ...d, fog: { ...d.fog, ops: d.fog.ops.slice(0, -1) } }));
    },

    // Скрыть или открыть всю карту (история тумана при этом начинается заново).
    resetFog(s, { path, base }: { path: string; base: 'hidden' | 'revealed' }) {
      return withMap(s, path, (d) => ({ ...d, fog: { base, ops: [] } }));
    },

    setView(s, { path, view }: { path: string; view: MapView }) {
      return withMap(s, path, (d) => ({ ...d, view: clampView(view) }));
    },

    setGrid(s, { path, grid }: { path: string; grid: Partial<Grid> }) {
      return withMap(s, path, (d) => ({
        ...d,
        grid: {
          ...d.grid,
          ...grid,
          cells: Math.min(200, Math.max(2, grid.cells ?? d.grid.cells)),
          ox: frac(grid.ox ?? d.grid.ox ?? 0),
          oy: frac(grid.oy ?? d.grid.oy ?? 0),
          ...(grid.shape !== undefined ? { shape: GRID_SHAPES.includes(grid.shape) ? grid.shape : 'square' } : {}),
          ...(grid.width !== undefined ? { width: Math.min(8, Math.max(0.5, grid.width)) } : {}),
          ...(grid.alpha !== undefined ? { alpha: Math.min(1, Math.max(0.05, grid.alpha)) } : {}),
          ...(grid.color !== undefined ? { color: /^#[0-9a-f]{6}$/i.test(grid.color) ? grid.color : (d.grid.color ?? '#000000') } : {}),
        },
      }));
    },

    addPin(s, { path, pin }: { path: string; pin: MapPin }) {
      return withMap(s, path, (d) => ({ ...d, pins: [...d.pins, pin] }));
    },

    updatePin(s, { path, id, changes }: { path: string; id: string; changes: Partial<Omit<MapPin, 'id'>> }) {
      return withMap(s, path, (d) => ({ ...d, pins: d.pins.map((p) => (p.id === id ? { ...p, ...changes } : p)) }));
    },

    removePin(s, { path, id }: { path: string; id: string }) {
      return withMap(s, path, (d) => ({ ...d, pins: d.pins.filter((p) => p.id !== id) }));
    },

    addTokens(s, { path, tokens }: { path: string; tokens: MapToken[] }) {
      return withMap(s, path, (d) => ({ ...d, tokens: [...d.tokens, ...tokens] }));
    },

    updateToken(s, { path, id, changes }: { path: string; id: string; changes: Partial<Omit<MapToken, 'id'>> }) {
      return withMap(s, path, (d) => ({ ...d, tokens: d.tokens.map((t) => (t.id === id ? { ...t, ...changes } : t)) }));
    },

    // Без id — убрать все жетоны карты.
    removeToken(s, { path, id }: { path: string; id?: string }) {
      return withMap(s, path, (d) => ({ ...d, tokens: id ? d.tokens.filter((t) => t.id !== id) : [] }));
    },

    setTokenScale(s, { path, value }: { path: string; value: number }) {
      return withMap(s, path, (d) => ({ ...d, tokenScale: Math.min(4, Math.max(0.25, value)) }));
    },

    setDefaultFog(s, { value }: { value: 'hidden' | 'revealed' }) {
      return { ...s, defaultFog: value };
    },

    setPinSize(s, { value }: { value: number }) {
      return { ...s, pinSize: Math.min(3, Math.max(0.5, value)) };
    },
  },
});

