// Сложность боя или заготовки: кто герои и какого они уровня, сколько опыта у противников. Чистые функции —
// карточки и партию приключения подставляет окно (ui/Difficulty.svelte).
import { partyBudget, rate, type Budget, type Rating } from '../../systems/dnd5e/difficulty';
import type { Combatant } from './types';

// Что известно о карточке участника: уровень персонажа игрока или опыт монстра.
export interface CardInfo {
  level?: number;
  xp?: number;
}

export interface Hero {
  name: string;
  // null — уровень неизвестен (нет карточки с листом), берётся уровень партии из настроек.
  level: number | null;
}

export interface Analysis {
  heroes: Hero[];
  // Откуда партия: из боя или из приключения (заготовка без героев), или из настроек (героев нигде нет).
  partyFrom: 'fight' | 'adventure' | 'settings';
  levels: number[];
  xp: number;
  // Противники без опыта (добавлены вручную, без карточки).
  unknown: string[];
  budget: Budget;
  rating: Rating;
}

export function analyze(
  list: Combatant[],
  info: (c: Combatant) => CardInfo | undefined,
  adventureParty: Hero[],
  fallback: { size: number; level: number },
): Analysis {
  // Герой в бою без карточки (добавлен вручную) — уровень по имени из листов приключения.
  const byName = (name: string) => adventureParty.find((h) => h.name.trim().toLowerCase() === name.trim().toLowerCase())?.level ?? null;
  const inFight = list.filter((c) => c.side === 'party').map((c) => ({ name: c.name, level: info(c)?.level ?? byName(c.name) }));
  const partyFrom = inFight.length ? 'fight' : adventureParty.length ? 'adventure' : 'settings';
  const heroes: Hero[] =
    partyFrom === 'fight'
      ? inFight
      : partyFrom === 'adventure'
        ? adventureParty
        : Array.from({ length: fallback.size }, (_, i) => ({ name: `Герой ${i + 1}`, level: fallback.level }));
  const levels = heroes.map((h) => h.level ?? fallback.level);

  let xp = 0;
  const unknown: string[] = [];
  for (const c of list) {
    if (c.side !== 'enemy') continue;
    const x = info(c)?.xp;
    if (x === undefined) unknown.push(c.name);
    else xp += x;
  }
  const budget = partyBudget(levels);
  return { heroes, partyFrom, levels, xp, unknown, budget, rating: rate(xp, budget) };
}
