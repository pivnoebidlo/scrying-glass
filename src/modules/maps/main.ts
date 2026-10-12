// Карты: какая на экране игроков, туман войны, область обзора, сетка.
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles } from '../../shared/vault';
import { dataOf } from './data';
import type { FogOp, Grid, MapData, MapsState, MapView } from './types';

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

const initialState: MapsState = { current: null, maps: {}, defaultFog: 'hidden' };

export default defineModule({
  id: 'maps',
  persist: true,
  initialState,

  init: prune,
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
        grid: { ...d.grid, ...grid, cells: Math.min(200, Math.max(2, grid.cells ?? d.grid.cells)) },
      }));
    },

    setDefaultFog(s, { value }: { value: 'hidden' | 'revealed' }) {
      return { ...s, defaultFog: value };
    },
  },
});

