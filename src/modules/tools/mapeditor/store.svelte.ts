// The map editor in the control window: the drafts of the adventure, the one open, its undo and redo, the tool. The
// draft is saved by itself a moment after every change.
import { store } from '../../../renderer/lib/store.svelte';
import { roleFolderHere, visibleIn } from '../../../shared/adventures';
import { roleNames } from '../../../shared/vault';
import type { Facing, PropKind } from '../mapgen/furnish';
import type { Layout } from '../mapgen/layout';
import { draftOf, MAP_DRAFT_SUFFIX, type BrushId } from './edit';

const UNDO = 100;

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
  selected = $state(-1);
  cell = $state(28);
  grid = $state(true);
  numbers = $state(true);
  undos = $state(0);
  redos = $state(0);
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
