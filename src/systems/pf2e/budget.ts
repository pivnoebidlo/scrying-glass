// The encounter's threat by the XP budget (Pathfinder 2e, GM Core): a creature is worth XP by its level against the
// party's; the budget of a threat is for four heroes, more or fewer move it. Pure: the plaque and the tests use it.

export type Threat = 'trivial' | 'low' | 'moderate' | 'severe' | 'extreme' | 'beyond';
export const THREATS: Exclude<Threat, 'beyond'>[] = ['trivial', 'low', 'moderate', 'severe', 'extreme'];
const BUDGET: Record<Exclude<Threat, 'beyond'>, [number, number]> = {
  trivial: [40, 10],
  low: [60, 20],
  moderate: [80, 20],
  severe: [120, 30],
  extreme: [160, 40],
};
// Creature level − party level → XP (−4…+4); lower is worth nothing, higher is beyond the table.
const XP: Record<number, number> = { [-4]: 10, [-3]: 15, [-2]: 20, [-1]: 30, 0: 40, 1: 60, 2: 80, 3: 120, 4: 160 };

export const creatureXp = (level: number, party: number) => {
  const d = level - party;
  return d < -4 ? 0 : d > 4 ? null : XP[d]!;
};
export const budgetOf = (threat: Exclude<Threat, 'beyond'>, size: number) => BUDGET[threat][0] + (size - 4) * BUDGET[threat][1];

// The enemies' levels (null — unknown) against a party: XP, the threat and the budgets for this party.
export function threatOf(levels: (number | null)[], party: { size: number; level: number }) {
  const xps = levels.map((l) => (l === null ? 0 : creatureXp(l, party.level)));
  const beyond = xps.some((x) => x === null);
  const xp = xps.reduce<number>((a, x) => a + (x ?? 0), 0);
  const budgets = Object.fromEntries(THREATS.map((t) => [t, budgetOf(t, party.size)])) as Record<Exclude<Threat, 'beyond'>, number>;
  let threat: Threat = 'trivial';
  for (const t of THREATS) if (xp >= budgets[t]) threat = t;
  if (beyond || xp > budgets.extreme + (budgets.extreme - budgets.severe)) threat = 'beyond';
  const next = THREATS.find((t) => budgets[t] > xp);
  return { xp, threat, budgets, next: next ? budgets[next] : budgets.extreme, unknown: levels.filter((l) => l === null).length };
}
