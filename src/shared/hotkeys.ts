// Hotkeys: every shortcut of the app in one list — the settings section «Hotkeys» shows it, hints on buttons take
// their keys from it (hint), handlers check a key press against it (matches). A shortcut marked `edit` the GM can
// change (settings.hotkeys in settings.json → vault.hotkeys → setHotkeys); the others are listed for reference — to
// make one changeable, its handler goes through matches() and it gets `edit`.
//
// A combo is a string: modifiers and a key joined by «+» — «Mod+K», «Mod+Shift+A», «Mod+ArrowRight», «Space»,
// «Escape». Mod — ⌘ in macOS, Ctrl elsewhere. The key is by its place on the keyboard (KeyboardEvent.code), so the
// layout (Russian, say) does not matter. Mouse «keys» (Click, Wheel, MiddleDrag) are only described.
import { t } from './i18n';

export type HotkeyGroup = 'app' | 'screen' | 'music' | 'search' | 'edit' | 'maps' | 'notes' | 'view' | 'markdown' | 'telegram' | 'tools' | 'dice';
export const HOTKEY_GROUPS: HotkeyGroup[] = ['app', 'screen', 'music', 'search', 'view', 'edit', 'markdown', 'telegram', 'maps', 'notes', 'tools', 'dice'];

export interface HotkeyDef {
  id: string;
  group: HotkeyGroup;
  combo: string;
  // The GM can change it (its handler checks matches()).
  edit?: boolean;
  // A row of keys 1…range: «Mod+1» → «⌘1 … ⌘9»; the GM changes the modifiers of the whole row (sceneOf).
  range?: string;
}

export const HOTKEYS: HotkeyDef[] = [
  { id: 'settings', group: 'app', combo: 'Mod+,', edit: true },
  { id: 'settingsSections', group: 'app', combo: 'ArrowUp ArrowDown' },
  { id: 'search', group: 'search', combo: 'Mod+K', edit: true },
  { id: 'blackout', group: 'screen', combo: 'Mod+B', edit: true },
  { id: 'scene', group: 'screen', combo: 'Mod+1', range: '9', edit: true },
  { id: 'closeScreen', group: 'screen', combo: 'Escape' },
  { id: 'playPause', group: 'music', combo: 'Mod+P', edit: true },
  { id: 'nextTrack', group: 'music', combo: 'Mod+ArrowRight', edit: true },
  { id: 'prevTrack', group: 'music', combo: 'Mod+ArrowLeft', edit: true },
  { id: 'volumeUp', group: 'music', combo: 'Mod+ArrowUp', edit: true },
  { id: 'volumeDown', group: 'music', combo: 'Mod+ArrowDown', edit: true },
  { id: 'ambience', group: 'music', combo: 'Mod+Shift+A', edit: true },
  { id: 'searchPeek', group: 'search', combo: 'Enter' },
  { id: 'searchTab', group: 'search', combo: 'Mod+Enter' },
  { id: 'listMove', group: 'search', combo: 'ArrowUp ArrowDown' },
  { id: 'close', group: 'view', combo: 'Escape' },
  { id: 'imagePrev', group: 'view', combo: 'ArrowLeft ArrowRight' },
  { id: 'imageCopy', group: 'view', combo: 'Mod+C' },
  { id: 'paste', group: 'view', combo: 'Mod+V' },
  { id: 'save', group: 'edit', combo: 'Mod+S' },
  { id: 'journalPreview', group: 'edit', combo: 'Mod+E' },
  { id: 'bold', group: 'markdown', combo: 'Mod+B' },
  { id: 'italic', group: 'markdown', combo: 'Mod+I' },
  { id: 'strike', group: 'markdown', combo: 'Mod+Shift+X' },
  { id: 'quote', group: 'markdown', combo: 'Mod+Shift+.' },
  { id: 'indent', group: 'markdown', combo: 'Tab' },
  { id: 'outdent', group: 'markdown', combo: 'Shift+Tab' },
  { id: 'continue', group: 'markdown', combo: 'Enter' },
  { id: 'underline', group: 'telegram', combo: 'Mod+U' },
  { id: 'mono', group: 'telegram', combo: 'Mod+Shift+M' },
  { id: 'spoiler', group: 'telegram', combo: 'Mod+Shift+P' },
  { id: 'send', group: 'telegram', combo: 'Enter' },
  { id: 'mapPan', group: 'maps', combo: 'Space' },
  { id: 'mapPanMouse', group: 'maps', combo: 'MiddleDrag' },
  { id: 'mapZoom', group: 'maps', combo: 'Wheel' },
  { id: 'mapUndo', group: 'maps', combo: 'Mod+Z' },
  { id: 'mapDelete', group: 'maps', combo: 'Delete' },
  { id: 'noteUndo', group: 'notes', combo: 'Mod+Z' },
  { id: 'noteDelete', group: 'notes', combo: 'Delete' },
  { id: 'noteStop', group: 'notes', combo: 'Escape' },
  { id: 'noteSize', group: 'notes', combo: 'Wheel' },
  { id: 'noteRotate', group: 'notes', combo: 'Shift+Wheel' },
  { id: 'generate', group: 'tools', combo: 'Space' },
  { id: 'advantage', group: 'dice', combo: 'Shift+Click' },
  { id: 'disadvantage', group: 'dice', combo: 'Alt+Click' },
  { id: 'critical', group: 'dice', combo: 'Shift+Click' },
];
const byId = new Map(HOTKEYS.map((h) => [h.id, h]));

// ---------- The GM's own combos ----------

let own: Record<string, string> = {};
// The windows make reading a combo reactive (as trackLang does for t): hints follow a change at once.
let track = () => {};
export const trackHotkeys = (f: () => void) => (track = f);
// Only changeable shortcuts and combos that parse; returns what is kept.
export function setHotkeys(map: Record<string, string> | null | undefined): Record<string, string> {
  own = Object.fromEntries(Object.entries(map ?? {}).filter(([id, c]) => byId.get(id)?.edit && typeof c === 'string' && isCombo(c)));
  return own;
}
export const comboFor = (id: string) => (track(), own[id] ?? byId.get(id)?.combo ?? '');
export const isChanged = (id: string) => (track(), id in own);

// ---------- Keys ----------

const MODS = ['Mod', 'Alt', 'Shift'] as const;
// Keys a combo may end with: letters, digits, F1–F24, arrows, editing keys, punctuation (see keyOf).
const KEY = /^([A-Z0-9]|F\d{1,2}|Arrow(Up|Down|Left|Right)|Space|Enter|Escape|Tab|Delete|Backspace|Home|End|PageUp|PageDown|Insert|[,./;'[\]\\\-=`])$/;
export const isCombo = (c: string) => {
  const parts = c.split('+');
  const key = parts.pop()!;
  return KEY.test(key) && parts.every((p) => (MODS as readonly string[]).includes(p));
};

export const isMac = (): boolean =>
  typeof process !== 'undefined' && process.platform ? process.platform === 'darwin' : typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent);

// The key of a press by its place: KeyK → K, Digit1 → 1, Comma → «,»; the rest — as the code (ArrowUp, Space, F5…).
const PUNCT: Record<string, string> = {
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Minus: '-', Equal: '=', Backquote: '`',
};
export function keyOf(code: string): string {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^Numpad\d$/.test(code)) return code.slice(6);
  return PUNCT[code] ?? code;
}

type KeyPress = Pick<KeyboardEvent, 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>;

// The combo of a key press («Mod+Shift+A»); a press of a modifier alone — null. ⌘ and Ctrl are both Mod (see matches).
export function comboOf(e: KeyPress): string | null {
  if (/^(Meta|Control|Alt|Shift|OS)(Left|Right)?$/.test(e.code)) return null;
  return [(e.metaKey || e.ctrlKey) && 'Mod', e.altKey && 'Alt', e.shiftKey && 'Shift', keyOf(e.code)].filter(Boolean).join('+');
}

// The press is this shortcut. As before, ⌘ and Ctrl both count as Mod in macOS (the habit of both kinds of keyboards).
export function matches(e: KeyPress, id: string): boolean {
  const want = comboFor(id).split('+');
  const key = want.pop();
  if (keyOf(e.code) !== key) return false;
  const mod = e.metaKey || e.ctrlKey;
  return (
    want.includes('Mod') === mod &&
    want.includes('Alt') === e.altKey &&
    want.includes('Shift') === e.shiftKey
  );
}

// A row of digits (the scenes): the number pressed with the row's modifiers, 1…9; otherwise null.
export function rowNumber(e: KeyPress, id: string): number | null {
  const h = byId.get(id);
  if (!h?.range) return null;
  const digit = Number(keyOf(e.code));
  if (!Number.isInteger(digit) || digit < 1 || digit > Number(h.range)) return null;
  // Not {...e}: a KeyboardEvent keeps its fields on the prototype, a spread would lose them.
  return matches({ code: 'Digit1', metaKey: e.metaKey, ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey }, id) ? digit : null;
}

// Every combo a shortcut takes: one, or the whole row (Mod+1 … Mod+9).
export function combosOf(id: string, combo = comboFor(id)): string[] {
  const h = byId.get(id);
  if (!h?.range) return [combo];
  const head = combo.replace(/\d$/, '');
  return Array.from({ length: Number(h.range) }, (_, i) => `${head}${i + 1}`);
}

// ---------- Labels ----------

const MAC_MOD: Record<string, string> = { Mod: '⌘', Alt: '⌥', Shift: '⇧' };
const KEY_LABEL: Record<string, string> = {
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc', Delete: 'Delete', Backspace: '⌫', Enter: 'Enter', Tab: 'Tab',
};
const keyLabel = (k: string) => KEY_LABEL[k] ?? (['Space', 'Click', 'Wheel', 'MiddleDrag'].includes(k) ? t(`hk.key.${k}` as never) : k);

// «⌘⇧A» in macOS, «Ctrl+Shift+A» elsewhere; several keys (a space between) — «← →».
export function comboLabel(combo: string, mac = isMac()): string {
  return combo
    .split(' ')
    .map((one) => {
      const parts = one.split('+');
      const key = keyLabel(parts.pop()!);
      const mouse = ['Click', 'Wheel', 'MiddleDrag'].includes(one.split('+').at(-1)!);
      if (mac && !mouse) return parts.map((m) => MAC_MOD[m] ?? m).join('') + key;
      return [...parts.map((m) => (m === 'Mod' ? (mac ? '⌘' : 'Ctrl') : m === 'Alt' && mac ? '⌥' : m)), key].join(mac ? ' + ' : '+');
    })
    .join(' ');
}

export const hotkeyLabel = (id: string) => {
  const h = byId.get(id);
  if (!h) return '';
  const first = comboLabel(comboFor(id));
  return h.range ? `${first} … ${comboLabel(comboFor(id).replace(/\d$/, h.range))}` : first;
};

// A button's hint with its shortcut, one look everywhere: «Search · ⌘K».
export const hint = (label: string, id: string) => `${label} · ${hotkeyLabel(id)}`;

// The modifier as a text prefix for hints written by hand: «⌘» or «Ctrl+».
export const modKey = () => (isMac() ? '⌘' : 'Ctrl+');

// For the app menu (Electron): «Mod+,» → «CmdOrCtrl+,».
export const accelerator = (id: string) =>
  comboFor(id)
    .split('+')
    .map((p) => (p === 'Mod' ? 'CmdOrCtrl' : p === 'ArrowUp' ? 'Up' : p === 'ArrowDown' ? 'Down' : p === 'ArrowLeft' ? 'Left' : p === 'ArrowRight' ? 'Right' : p))
    .join('+');

// ---------- Checks for a new combo ----------

// Taken by the system or by text editing everywhere: copy, paste, undo, select all, quit, close, hide, minimize.
// Also the View menu: reload, developer tools, zoom.
const RESERVED = ['Mod+C', 'Mod+V', 'Mod+X', 'Mod+Z', 'Mod+Shift+Z', 'Mod+A', 'Mod+Q', 'Mod+W', 'Mod+H', 'Mod+M', 'Mod+R', 'Mod+Shift+R', 'Mod+Alt+I', 'Mod+Shift+I', 'Mod+=', 'Mod+-', 'Mod+0'];

export type ComboProblem = { kind: 'bare' } | { kind: 'reserved' } | { kind: 'taken'; by: string } | { kind: 'digit' };

// Why a combo cannot be a shortcut: no modifier (it would fire while typing; F1–F12 may go alone), the system's own,
// or another changeable shortcut has it. null — fine.
// A row (the scenes) takes a modifier with a digit, and is checked as all its combos.
export function comboProblem(id: string, combo: string): ComboProblem | null {
  const parts = combo.split('+');
  const key = parts.at(-1)!;
  if (byId.get(id)?.range && !/^\d$/.test(key)) return { kind: 'digit' };
  if (!parts.some((p) => p === 'Mod' || p === 'Alt') && !/^F\d{1,2}$/.test(key)) return { kind: 'bare' };
  const mine = combosOf(id, combo);
  if (mine.some((c) => RESERVED.includes(c))) return { kind: 'reserved' };
  const other = HOTKEYS.find((h) => h.id !== id && h.edit && combosOf(h.id).some((c) => mine.includes(c)));
  return other ? { kind: 'taken', by: other.id } : null;
}

// What to keep for a pressed combo: a row keeps its first key (⌥7 → ⌥1 — the row ⌥1 … ⌥9).
export const normalizeCombo = (id: string, combo: string) => (byId.get(id)?.range ? combo.replace(/\d$/, '1') : combo);

// Shortcuts of text fields and other places that have this combo too (a warning, not a ban: the shortcut does not
// fire while the cursor is in a text field).
export const alsoUsedBy = (id: string, combo: string) => {
  const mine = combosOf(id, combo);
  return HOTKEYS.filter((h) => h.id !== id && !h.edit && mine.includes(h.combo)).map((h) => h.id);
};
