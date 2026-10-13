// Состояние интерфейса инициативы в окне управления: что открыто — текущий бой (null) или заготовка (её id).
import type { InitiativeState } from '../types';

export const ui = $state<{ encounter: string | null }>({ encounter: null });

// «Бой 1», «Бой 2», … — название новой заготовки, его можно сразу поменять в редакторе.
export function newEncounterName(s: InitiativeState): string {
  const taken = new Set(s.encounters.map((e) => e.name));
  let n = s.encounters.length + 1;
  while (taken.has(`Бой ${n}`)) n++;
  return `Бой ${n}`;
}
