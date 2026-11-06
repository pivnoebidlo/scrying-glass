// The threat of a fight by an XP budget: a creature is worth XP by its level against the party's, a threat is a budget
// for a party of `party` heroes, more or fewer move it. Data, not a game: a system says its numbers. Pure.
import type { Loc } from './syspack';

export interface ThreatLevel {
  title: Loc;
  // The budget for `party` heroes and what each hero more or less moves it by.
  base: number;
  extra: number;
}
export interface ThreatSpec {
  party: number;
  // Creature's level − party's level → XP. Below the table — nothing, above — past every budget.
  xp: Record<string, number>;
  // From the least threat to the worst.
  levels: ThreatLevel[];
  beyond?: Loc;
}

const diffs = (s: ThreatSpec) => Object.keys(s.xp).map(Number);

export function creatureXp(s: ThreatSpec, level: number, party: number) {
  const d = level - party;
  if (d < Math.min(...diffs(s))) return 0;
  if (d > Math.max(...diffs(s))) return null;
  return s.xp[String(d)] ?? 0;
}
export const budgetOf = (s: ThreatSpec, l: ThreatLevel, size: number) => l.base + (size - s.party) * l.extra;

// The enemies' levels (null — unknown) against a party. `level` — the index in `levels`, 'beyond' past them all.
export function threatOf(s: ThreatSpec, levels: (number | null)[], party: { size: number; level: number }) {
  const xps = levels.map((l) => (l === null ? 0 : creatureXp(s, l, party.level)));
  const xp = xps.reduce<number>((a, x) => a + (x ?? 0), 0);
  const budgets = s.levels.map((l) => budgetOf(s, l, party.size));
  let level: number | 'beyond' = 0;
  budgets.forEach((b, i) => {
    if (xp >= b) level = i;
  });
  const [top, below] = [budgets.at(-1) ?? 0, budgets.at(-2) ?? 0];
  if (xps.some((x) => x === null) || xp > top + (top - below)) level = 'beyond';
  const next = budgets.find((b) => b > xp) ?? top;
  return { xp, level, budgets, next, unknown: levels.filter((l) => l === null).length };
}

// Written by hand in the builder: «-4 | 10» and «Low | 60 | 20».
export const xpText = (s: ThreatSpec | undefined) => Object.entries(s?.xp ?? {}).sort((a, b) => Number(a[0]) - Number(b[0])).map(([d, x]) => `${d} | ${x}`).join('\n');
export function xpOfText(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of text.split('\n')) {
    const [d, x] = line.split('|').map((v) => Number(v.trim().replace('−', '-')));
    if (Number.isInteger(d) && Number.isFinite(x)) out[String(d)] = x!;
  }
  return out;
}

export function threatOfRaw(x: unknown, loc: (v: unknown) => Loc | null): ThreatSpec | null {
  if (typeof x !== 'object' || x === null) return null;
  const r = x as Record<string, unknown>;
  const xp = typeof r['xp'] === 'object' && r['xp'] !== null ? Object.entries(r['xp']).filter(([d, v]) => Number.isInteger(Number(d)) && typeof v === 'number') : [];
  const levels = (Array.isArray(r['levels']) ? r['levels'] : []).flatMap((l) => {
    const t = typeof l === 'object' && l !== null ? (l as Record<string, unknown>) : {};
    const title = loc(t['title']);
    return title && typeof t['base'] === 'number' && typeof t['extra'] === 'number' ? [{ title, base: t['base'], extra: t['extra'] }] : [];
  });
  if (!xp.length || !levels.length || typeof r['party'] !== 'number' || r['party'] < 1) return null;
  const beyond = loc(r['beyond']);
  return { party: r['party'], xp: Object.fromEntries(xp) as Record<string, number>, levels: levels.slice(0, 8), ...(beyond ? { beyond } : {}) };
}
