// Generators in the control window: the files of the packages, the chosen generator of each family, its options and
// last results (remembered by the window). A result keeps table rows, so its text follows the interface language.
import { familyOf } from '../../../systems';
import { runGenerator, type Generator, type GeneratorFile, type GenOption, type GenOptions, type GenResult } from '../../../shared/generators';
import { die } from '../../../shared/dice';

const KEY = 'generators.state';

interface Saved {
  // The generator open, by family.
  open: Record<string, string>;
  options: Record<string, GenOptions>;
  results: Record<string, GenResult>;
}
function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
    return { open: v?.open ?? {}, options: v?.options ?? {}, results: v?.results ?? {} };
  } catch {
    return { open: {}, options: {}, results: {} };
  }
}

export const gen = $state({ ...load(), files: [] as GeneratorFile[] });
export const save = () => {
  try {
    const { open, options, results } = $state.snapshot(gen);
    localStorage.setItem(KEY, JSON.stringify({ open, options, results }));
  } catch {
    /* not remembered — not a problem */
  }
};

let listening = false;
export async function loadGenerators() {
  if (!listening) {
    listening = true;
    window.api.onCompendiumChanged(() => void loadGenerators());
  }
  gen.files = await window.api.listGenerators();
}

// The families that have generators, and the files of one.
export const generatorFamilies = () => [...new Set(gen.files.map((f) => familyOf(f.system)))];
export const filesOf = (family: string) => gen.files.filter((f) => familyOf(f.system) === family);

const keyOf = (f: GeneratorFile, g: Generator) => `${f.system}/${g.id}`;
export const optionsOf = (f: GeneratorFile, g: Generator): GenOptions => (gen.options[keyOf(f, g)] ??= Object.fromEntries((g.options ?? []).map((o) => [o.key, defaultOf(o)])));
const defaultOf = (o: GenOption) => o.default ?? (o.type === 'check' ? false : 0);
export const resultOf = (f: GeneratorFile, g: Generator): GenResult | undefined => gen.results[keyOf(f, g)];

export function rollNow(f: GeneratorFile, g: Generator) {
  gen.results[keyOf(f, g)] = runGenerator($state.snapshot(f) as GeneratorFile, g.id, $state.snapshot(optionsOf(f, g)) as GenOptions, die);
  save();
}
