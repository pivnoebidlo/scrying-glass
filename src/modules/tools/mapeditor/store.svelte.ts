// The map editor in the control window: the drafts of the adventure, the one open, its undo and redo, the tool. The
// draft is saved by itself a moment after every change.
import { flushSync } from 'svelte';
import { store } from '../../../renderer/lib/store.svelte';
import { roleFolderHere, visibleIn } from '../../../shared/adventures';
import { roleNames } from '../../../shared/vault';
import type { Facing, PropKind } from '../mapgen/furnish';
import type { Layout } from '../mapgen/layout';
import { draftOf, MAP_DRAFT_SUFFIX, type BrushId } from './edit';

const UNDO = 100;
// The size of a cell on screen: the least, the most, «100 %».
export const CELL_MIN = 6;
export const CELL_MAX = 72;
export const CELL_BASE = 28;
const clampCell = (c: number) => Math.min(CELL_MAX, Math.max(CELL_MIN, c));

class Editor {
  drafts = $state<string[]>([]);
  path = $state<string | null>(null);
  layout = $state.raw<Layout | null>(null);
  // 'brush' paints cells, 'place' puts the chosen thing down, 'select' picks, moves and turns things.
  mode = $state<'brush' | 'place' | 'select'>('brush');
  brush = $state<BrushId>('floor');
  size = $state(1);
  prop = $state<PropKind | null>(null);
  face = $state<Facing>(0);
  // The colour of things put down (null — a random one).
  tint = $state<number | null>(null);
  // The things picked (the last one is the one the colour and the stretching corner belong to).
  picked = $state<number[]>([]);
  get selected() {
    return this.picked.at(-1) ?? -1;
  }
  set selected(i: number) {
    this.picked = i >= 0 ? [i] : [];
  }
  // Looking, not editing: the mouse drags the map about.
  viewing = $state(false);
  cell = $state(28);
  grid = $state(true);
  numbers = $state(true);
  undos = $state(0);
  redos = $state(0);
  // The scrolling box the map lies in (MapEditor sets it): zooming keeps the point under the cursor in place.
  viewport: HTMLElement | null = null;
  // Where a pinch is heading: small steps of the trackpad add up before the whole cell changes.
  private goal = CELL_BASE;
  private past: Layout[] = [];
  private future: Layout[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  get title() {
    const p = this.path ?? '';
    return p.slice(p.lastIndexOf('/') + 1).replace(new RegExp(`${MAP_DRAFT_SUFFIX.replace('.', '\\.')}$`, 'i'), '');
  }

  // The drafts the current adventure sees (its own and the vault's common ones).
  async refresh() {
    const all = await window.api.listMapDrafts();
    this.drafts = all.filter((p) => visibleIn(store.state.adventures, p));
  }

  async open(path: string) {
    await this.flush();
    const d = await window.api.readMapDraft(path);
    if (!d) return;
    this.path = path;
    this.layout = d.layout;
    this.past = [];
    this.future = [];
    this.undos = this.redos = 0;
    this.selected = -1;
  }

  // Where a new draft goes: the maps folder of the current adventure (made if missing).
  folder(): string {
    const { tree } = store.state.vault;
    const found = tree ? roleFolderHere(tree, store.state.adventures, 'maps') : null;
    if (found) return found.path;
    const adv = store.state.adventures.current;
    return `${adv ? `${adv}/` : ''}${roleNames().maps[0]}`;
  }

  async create(title: string, layout: Layout) {
    await this.flush();
    const path = await window.api.createMapDraft(this.folder(), title, draftOf(layout));
    if (!path) return false;
    await this.refresh();
    await this.open(path);
    return true;
  }

  async rename(title: string) {
    if (!this.path || !title.trim() || title.trim() === this.title) return;
    await this.flush();
    const next = await window.api.renameMapDraft(this.path, title.trim());
    if (next) {
      this.path = next;
      await this.refresh();
    }
  }

  async remove() {
    if (!this.path) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    await window.api.deleteMapDraft(this.path);
    this.path = null;
    this.layout = null;
    await this.refresh();
  }

  // Zoom to `next` around a point of the window (none — the middle of the view).
  zoomTo(next: number, at?: { x: number; y: number }) {
    const cell = clampCell(Math.round(next));
    const box = this.viewport;
    const stack = box?.querySelector<HTMLElement>('.stack');
    if (cell === this.cell) return;
    if (!box || !stack) {
      this.cell = cell;
      return;
    }
    const b = box.getBoundingClientRect();
    const p = at ?? { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    const r = stack.getBoundingClientRect();
    const mx = (p.x - r.left) / this.cell;
    const my = (p.y - r.top) / this.cell;
    flushSync(() => (this.cell = cell));
    const r2 = stack.getBoundingClientRect();
    box.scrollLeft += r2.left + mx * cell - p.x;
    box.scrollTop += r2.top + my * cell - p.y;
  }
  zoomBy(k: number, at?: { x: number; y: number }) {
    this.goal = this.cell;
    this.zoomTo(Math.abs(this.cell * k - this.cell) < 1 ? this.cell + Math.sign(k - 1) : this.cell * k, at);
  }
  // A pinch of the trackpad or the wheel with ⌘ / Ctrl: smooth, around the cursor.
  wheelZoom(e: WheelEvent) {
    if (Math.abs(this.goal - this.cell) >= 1) this.goal = this.cell;
    const d = Math.max(-40, Math.min(40, e.deltaY * (e.deltaMode === 1 ? 16 : 1)));
    this.goal = clampCell(this.goal * Math.exp(-d * 0.012));
    this.zoomTo(this.goal, { x: e.clientX, y: e.clientY });
  }
  // The whole map in view, in the middle.
  fit() {
    const box = this.viewport;
    if (!box || !this.layout) return;
    const cell = clampCell(Math.floor(Math.min((box.clientWidth - 48) / this.layout.w, (box.clientHeight - 48) / this.layout.h)));
    flushSync(() => (this.cell = cell));
    this.goal = cell;
    this.centre();
  }
  centre() {
    const box = this.viewport;
    if (!box) return;
    box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2;
    box.scrollTop = (box.scrollHeight - box.clientHeight) / 2;
  }

  // A change: the layout before goes to undo (one per stroke: `merge` — the same stroke goes on).
  change(next: Layout, merge = false) {
    if (!this.layout || next === this.layout) return;
    if (!merge) {
      this.past.push(this.layout);
      if (this.past.length > UNDO) this.past.shift();
      this.future = [];
    }
    this.layout = next;
    this.undos = this.past.length;
    this.redos = 0;
    this.saveSoon();
  }
  undo() {
    const prev = this.past.pop();
    if (!prev || !this.layout) return;
    this.future.push(this.layout);
    this.layout = prev;
    this.selected = -1;
    this.undos = this.past.length;
    this.redos = this.future.length;
    this.saveSoon();
  }
  redo() {
    const next = this.future.pop();
    if (!next || !this.layout) return;
    this.past.push(this.layout);
    this.layout = next;
    this.selected = -1;
    this.undos = this.past.length;
    this.redos = this.future.length;
    this.saveSoon();
  }

  private saveSoon() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 600);
  }
  async flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.path && this.layout) await window.api.writeMapDraft(this.path, draftOf(this.layout));
  }
}

export const editor = new Editor();
