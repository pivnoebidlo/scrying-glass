// The system builder's state: the pack being edited (a copy — the saved one changes only on «Save»), what is selected
// in it, the preview's values. The packs themselves come with the state (vault.systems); the core writes them.
import { t } from '../../../renderer/lib/i18n.svelte';
import { openTab } from '../../../renderer/lib/nav';
import { store } from '../../../renderer/lib/store.svelte';
import { keyFrom } from '../../../shared/compendium';
import { getLang } from '../../../shared/i18n';
import { blankPack, blankStats, loc, type PackStats, type SystemPack } from '../../../shared/syspack';
import { systems } from '../../../systems';
import { ui as tools } from '../ui/ui.svelte';
import { fromTemplate, type TemplateId } from './templates';

// The steps of the builder (its tabs) and, on the sheet step, the chosen section or field.
export type Step = 'about' | 'sheet' | 'tracker' | 'compendium' | 'trial';
export type Selection = { kind: 'none' } | { kind: 'section'; s: number } | { kind: 'field'; s: number; f: number };

export const builder = $state({
  draft: null as SystemPack | null,
  // The id the draft was saved under (null — never saved); a built-in pack is read only.
  was: null as string | null,
  readonly: false,
  saved: '',
  step: 'sheet' as Step,
  sel: { kind: 'none' } as Selection,
  previewKind: 'character' as 'monster' | 'npc' | 'character',
  previewStats: {} as PackStats,
  status: '',
  error: '',
});

const snapshot = (p: SystemPack | null) => JSON.stringify(p);
export const isDirty = () => !builder.readonly && !!builder.draft && snapshot($state.snapshot(builder.draft) as SystemPack) !== builder.saved;
export const packs = () => store.state.vault.systems ?? [];

// An id nobody has: from the name, «-2», «-3»… if taken (built-in systems too).
export function freeId(title: string, except?: string | null): string {
  const base = (keyFrom(title).replace(/_/g, '-').replace(/-+/g, '-').slice(0, 28) || 'system').replace(/^[^a-z]+/, 's-');
  const taken = (id: string) => id !== except && (systems.some((s) => s.id === id) || packs().some((p) => p.id === id));
  let id = base.length >= 2 ? base : `${base}-sys`;
  for (let i = 2; taken(id); i++) id = `${base}-${i}`;
  return id;
}

// A key for a new field or section that isn't in the pack yet.
export function freeKey(title: string, taken: Set<string>): string {
  const base = (keyFrom(title) || 'field').slice(0, 28);
  let key = base;
  for (let i = 2; taken.has(key); i++) key = `${base}_${i}`;
  return key;
}

function load(p: SystemPack, was: string | null, readonly: boolean) {
  const { own: _own, ...clean } = structuredClone($state.snapshot(p) as SystemPack);
  builder.draft = clean;
  builder.was = was;
  builder.readonly = readonly;
  builder.saved = was ? snapshot(clean) : '';
  // A new system starts from what it is; a saved one — from its sheet.
  builder.step = was || readonly ? 'sheet' : 'about';
  builder.sel = clean.sections[0]?.fields.length ? { kind: 'field', s: 0, f: 0 } : { kind: 'none' };
  builder.previewStats = blankStats(clean, builder.previewKind);
  builder.status = '';
  builder.error = '';
}

// Open the builder (from the settings too): on a system of the GM's own or a built-in one (read only), or empty.
export function openBuilder(id?: string) {
  const p = id ? packs().find((x) => x.id === id) : undefined;
  if (p) load(p, p.own ? p.id : null, !p.own);
  tools.tool = 'systems';
  tools.note = null;
  openTab('tools');
}

export function pickSystem(id: string) {
  const p = packs().find((x) => x.id === id);
  if (p) load(p, p.own ? p.id : null, !p.own);
}

// A new system: blank or from a template of a kind of game (templates.ts).
export function newSystem(template: TemplateId = 'blank') {
  const title = t('sb.newTitle');
  load(template === 'blank' ? blankPack(freeId(title), title) : fromTemplate(template, freeId(title), title), null, false);
  builder.saved = '';
}

export function copySystem() {
  const d = builder.draft;
  if (!d) return;
  const title = t('sb.copyOf', { name: loc(d.title, getLang()) });
  load({ ...d, id: freeId(title), title, release: 1 }, null, false);
}

// The core's `syspack:<what>` in words.
export function packError(e: unknown): string {
  const m = /syspack:([a-z-]+)(?::(.+))?/.exec(String(e));
  if (!m) return String(e).replace(/^Error: (Error invoking remote method '[^']+': )?(Error: )?/, '');
  const code = m[1]!;
  const key = `sb.err.${code}`;
  const text = t(key as never, { key: m[2] ?? '', code });
  return text === key ? t('sb.err.other', { code: `${code}${m[2] ? `: ${m[2]}` : ''}` }) : text;
}

export async function saveSystem() {
  const d = builder.draft;
  if (!d || builder.readonly) return;
  builder.error = '';
  try {
    const plain = $state.snapshot(d) as SystemPack;
    const id = await window.api.saveSystem(plain, builder.was ?? undefined);
    builder.was = id;
    builder.saved = snapshot(plain);
    builder.status = t('sb.saved');
    setTimeout(() => builder.status === t('sb.saved') && (builder.status = ''), 3000);
  } catch (e) {
    builder.error = packError(e);
  }
}

export async function deleteSystem() {
  const d = builder.draft;
  if (!d || !builder.was || !confirm(t('sb.deleteAsk', { name: loc(d.title, getLang()) }))) return;
  if (await window.api.deleteSystem(builder.was)) {
    builder.draft = null;
    builder.was = null;
  }
}

export async function importSystem() {
  builder.error = '';
  try {
    const id = await window.api.importSystem();
    if (id) setTimeout(() => pickSystem(id), 300);
  } catch (e) {
    builder.error = packError(e);
  }
}
