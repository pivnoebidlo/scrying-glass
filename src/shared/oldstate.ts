// Names of modules from older versions. Modules are named for what they do; these two were named for a game until
// 0.95, and a saved state, a pack or the trash can still carry the old names.
const RENAMED: Record<string, string> = { fate: 'aspects', mausritter: 'factions' };

export const moduleId = (id: string) => RENAMED[id] ?? id;

// A saved state.json: old keys move to the new names. A key already under the new name wins.
export function renamedModules(saved: Record<string, unknown>): Record<string, unknown> {
  const out = { ...saved };
  for (const [from, to] of Object.entries(RENAMED)) {
    if (from in out && !(to in out)) out[to] = out[from];
    delete out[from];
  }
  return out;
}

// The adventure's slice of the factions module in a pack or a trash entry; `mausritter` is its name up to 0.94.
export interface FactionSlices<T> {
  factions?: T;
  mausritter?: T;
}
export const factionsOf = <T>(data: FactionSlices<T>) => data.factions ?? data.mausritter;

// For a pack: versions up to 0.94 read only the old key.
export const factionsSlice = <T>(value: T) => ({ factions: value, mausritter: value });
