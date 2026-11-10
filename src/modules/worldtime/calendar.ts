// The calendar of a game world: months of their own length, a week, the year of day 1, moons and holidays. The core
// counts only days (types.ts): a calendar names them. Pure functions; the GM writes it as text, a line a month.

export interface Month {
  name: string;
  days: number;
  // The form in a date, if the language wants one: «января» for «Январь» (15 января).
  of?: string;
}
export interface Moon {
  name: string;
  // Days from one full moon to the next (may be fractional: 29.53).
  cycle: number;
  // Days into the cycle on day 1 (0 — new moon).
  offset: number;
}
export interface Holiday {
  // 0-based month, 1-based day.
  month: number;
  day: number;
  name: string;
}
export interface Calendar {
  months: Month[];
  weekdays?: string[];
  // Day 1 of the game: its year, month (0-based) and day of the month.
  year: number;
  month: number;
  day: number;
  // After the year: «DR», «A.D.», «от Основания».
  era?: string;
  moons?: Moon[];
  holidays?: Holiday[];
}

export interface WorldDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  // The month as it stands in a date.
  monthOf: string;
  weekday: string | null;
  holidays: string[];
  moons: { name: string; phase: MoonPhase }[];
}

export const PHASES = ['new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'full', 'waningGibbous', 'lastQuarter', 'waningCrescent'] as const;
export type MoonPhase = (typeof PHASES)[number];
export const PHASE_ICON: Record<MoonPhase, string> = {
  new: '🌑',
  waxingCrescent: '🌒',
  firstQuarter: '🌓',
  waxingGibbous: '🌔',
  full: '🌕',
  waningGibbous: '🌖',
  lastQuarter: '🌗',
  waningCrescent: '🌘',
};

const MAX_MONTHS = 40;
const MAX_DAYS = 400;
const MAX_LIST = 60;
const clean = (s: unknown, n = 60) => (typeof s === 'string' ? s.trim().slice(0, n) : '');
const int = (x: unknown, lo: number, hi: number, d: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : d);

// Only what makes sense: a calendar may come from a stranger's adventure file. None — no calendar.
export function validCalendar(x: unknown): Calendar | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const months = (Array.isArray(o['months']) ? o['months'] : [])
    .slice(0, MAX_MONTHS)
    .flatMap((m) => {
      const r = m as Record<string, unknown> | null;
      const name = clean(r?.['name']);
      const days = int(r?.['days'], 1, MAX_DAYS, 0);
      const of = clean(r?.['of']);
      return name && days ? [{ name, days, ...(of && of !== name ? { of } : {}) }] : [];
    });
  if (!months.length) return null;
  const month = int(o['month'], 0, months.length - 1, 0);
  const weekdays = (Array.isArray(o['weekdays']) ? o['weekdays'] : []).map((w) => clean(w, 30)).filter(Boolean).slice(0, 20);
  const moons = (Array.isArray(o['moons']) ? o['moons'] : []).slice(0, 8).flatMap((m) => {
    const r = m as Record<string, unknown> | null;
    const name = clean(r?.['name']);
    const cycle = typeof r?.['cycle'] === 'number' && r['cycle'] >= 1 && r['cycle'] <= 1000 ? r['cycle'] : 0;
    const offset = typeof r?.['offset'] === 'number' && Number.isFinite(r['offset']) ? r['offset'] : 0;
    return name && cycle ? [{ name, cycle, offset }] : [];
  });
  const holidays = (Array.isArray(o['holidays']) ? o['holidays'] : []).slice(0, MAX_LIST).flatMap((h) => {
    const r = h as Record<string, unknown> | null;
    const name = clean(r?.['name'], 80);
    const m = int(r?.['month'], 0, months.length - 1, -1);
    // A day the month does not have is dropped, not moved.
    const raw = r?.['day'];
    const d = m >= 0 && typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= months[m]!.days ? raw : 0;
    return name && m >= 0 && d ? [{ month: m, day: d, name }] : [];
  });
  const era = clean(o['era'], 30);
  return {
    months,
    year: int(o['year'], -999999, 999999, 1),
    month,
    day: int(o['day'], 1, months[month]!.days, 1),
    ...(weekdays.length ? { weekdays } : {}),
    ...(era ? { era } : {}),
    ...(moons.length ? { moons } : {}),
    ...(holidays.length ? { holidays } : {}),
  };
}

export const yearLength = (c: Calendar) => c.months.reduce((n, m) => n + m.days, 0);

// Day 1 of the game is the calendar's start; day N is N − 1 days later.
export function dateOf(c: Calendar, gameDay: number): WorldDate {
  const len = yearLength(c);
  const before = c.months.slice(0, c.month).reduce((n, m) => n + m.days, 0) + c.day - 1;
  const index = before + Math.max(1, Math.floor(gameDay)) - 1;
  const year = c.year + Math.floor(index / len);
  let rest = index % len;
  let month = 0;
  while (rest >= c.months[month]!.days) rest -= c.months[month++]!.days;
  const day = rest + 1;
  const elapsed = Math.max(1, Math.floor(gameDay)) - 1;
  return {
    year,
    month,
    day,
    monthName: c.months[month]!.name,
    monthOf: c.months[month]!.of ?? c.months[month]!.name,
    weekday: c.weekdays?.length ? c.weekdays[elapsed % c.weekdays.length]! : null,
    holidays: (c.holidays ?? []).filter((h) => h.month === month && h.day === day).map((h) => h.name),
    moons: (c.moons ?? []).map((m) => ({ name: m.name, phase: phaseOf(m, elapsed) })),
  };
}

// Eight phases, each centred on its moment: the full moon is the middle of the cycle.
export function phaseOf(m: Moon, elapsed: number): MoonPhase {
  const at = ((((elapsed + m.offset) % m.cycle) + m.cycle) % m.cycle) / m.cycle;
  return PHASES[Math.floor(at * 8 + 0.5) % 8]!;
}

// «12 Flamerule 1492 DR».
export const dateText = (c: Calendar, d: WorldDate) => `${d.day} ${d.monthOf} ${d.year}${c.era ? ` ${c.era}` : ''}`;

// ---- Text, as the GM writes it ----
const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const parts = (line: string) => line.split('|').map((p) => p.trim());
const number = (s: string | undefined) => (s === undefined || s === '' ? NaN : Number(s.replace(',', '.')));

// «Hammer | 30» a line; «Январь / января | 31» — with the form in a date.
export const monthsOfText = (text: string): Month[] =>
  lines(text).flatMap((l) => {
    const [names, days] = parts(l);
    const [name, of] = (names ?? '').split('/').map((x) => x.trim());
    const n = Math.round(number(days));
    return name && n >= 1 ? [{ name, days: Math.min(n, MAX_DAYS), ...(of && of !== name ? { of } : {}) }] : [];
  });
export const textOfMonths = (months: Month[]) => months.map((m) => `${m.name}${m.of ? ` / ${m.of}` : ''} | ${m.days}`).join('\n');

// «Selûne | 30 | 0» a line: name, cycle, days into it on day 1.
export const moonsOfText = (text: string): Moon[] =>
  lines(text).flatMap((l) => {
    const [name, cycle, offset] = parts(l);
    const c = number(cycle);
    const o = number(offset);
    return name && c >= 1 ? [{ name, cycle: c, offset: Number.isFinite(o) ? o : 0 }] : [];
  });
export const textOfMoons = (moons: Moon[]) => moons.map((m) => `${m.name} | ${m.cycle} | ${m.offset}`).join('\n');

// «Midwinter | Hammer | 30» a line: the month by name or number (1, 2, …).
export function holidaysOfText(text: string, months: Month[]): Holiday[] {
  return lines(text).flatMap((l) => {
    const [name, month, day] = parts(l);
    const byName = months.findIndex((m) => m.name.toLowerCase() === (month ?? '').toLowerCase());
    const m = byName >= 0 ? byName : Math.round(number(month)) - 1;
    const d = Math.round(number(day));
    return name && months[m] && d >= 1 && d <= months[m]!.days ? [{ name, month: m, day: d }] : [];
  });
}
export const textOfHolidays = (holidays: Holiday[], months: Month[]) => holidays.map((h) => `${h.name} | ${months[h.month]?.name ?? h.month + 1} | ${h.day}`).join('\n');
