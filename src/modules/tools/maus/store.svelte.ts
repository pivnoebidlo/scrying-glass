// Mausritter tables in the control window: the chosen table, its options and the last result of each (remembered by
// the window). A result keeps table rows, so its text follows the interface language.
import { DEFAULT_OPTIONS, generate, type Kind, type Options, type Result } from './generate';

const KEY = 'mausTables.state';

interface Saved {
  kind: Kind;
  opts: Options;
  results: Partial<Record<Kind, Result>>;
}
function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
    return { kind: v?.kind ?? 'settlement', opts: { ...DEFAULT_OPTIONS, ...v?.opts }, results: v?.results ?? {} };
  } catch {
    return { kind: 'settlement', opts: { ...DEFAULT_OPTIONS }, results: {} };
  }
}

export const mt = $state(load());
export const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(mt)));
  } catch {
    /* not remembered — not a problem */
  }
};

export function rollNow() {
  mt.results[mt.kind] = generate(mt.kind, $state.snapshot(mt.opts) as Options);
  save();
}
