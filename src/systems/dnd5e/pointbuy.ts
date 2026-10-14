// Покупка характеристик (SRD 5.1 и 5.2.1, CC BY 4.0): каждая характеристика от 8 до 15 до бонусов, 27 очков,
// цена 8–13 — по очку за ступень, 14 и 15 — по два. Бонусы: в правилах 2024 года — от предыстории (+2 и +1 или
// +1 к трём), в правилах 2014 года — от расы. Здесь же — проверка готового персонажа: какие бонусы он мог взять.
import { ABILITIES, type Ability } from './stats';

export type Scores = Record<Ability, number>;

export const ABILITY_TITLES: Record<Ability, string> = {
  str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма',
};

const COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
// Цена вне 8–15 (домашние правила с другими пределами): ниже 8 — минус очко за ступень, выше 15 — по два.
export const costOf = (score: number) => COST[score] ?? (score < 8 ? score - 8 : 9 + (score - 15) * 2);

export interface Rules {
  budget: number;
  min: number;
  max: number;
}
export const STANDARD_RULES: Rules = { budget: 27, min: 8, max: 15 };
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const zero = (): Scores => ({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
export const spent = (base: Scores) => ABILITIES.reduce((n, a) => n + costOf(base[a]), 0);
export const isStandardArray = (base: Scores) => [...ABILITIES.map((a) => base[a])].sort((x, y) => y - x).join() === STANDARD_ARRAY.join();

// Расы SRD 5.1 (правила 2014 года): постоянные бонусы и сколько «+1 на выбор» (полуэльф: +1 к двум другим).
export interface Race {
  title: string;
  fixed: Partial<Scores>;
  choose?: { count: number; except: Ability[] };
}
export const RACES_2014: Record<string, Race> = {
  hilldwarf: { title: 'Холмовой дварф', fixed: { con: 2, wis: 1 } },
  mountaindwarf: { title: 'Горный дварф', fixed: { con: 2, str: 2 } },
  highelf: { title: 'Высший эльф', fixed: { dex: 2, int: 1 } },
  lightfoot: { title: 'Легконогий полурослик', fixed: { dex: 2, cha: 1 } },
  stout: { title: 'Коренастый полурослик', fixed: { dex: 2, con: 1 } },
  human: { title: 'Человек', fixed: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 } },
  dragonborn: { title: 'Драконорождённый', fixed: { str: 2, cha: 1 } },
  rockgnome: { title: 'Скальный гном', fixed: { int: 2, con: 1 } },
  halfelf: { title: 'Полуэльф', fixed: { cha: 2 }, choose: { count: 2, except: ['cha'] } },
  halforc: { title: 'Полуорк', fixed: { str: 2, con: 1 } },
  tiefling: { title: 'Тифлинг', fixed: { cha: 2, int: 1 } },
};

// Все допустимые наборы бонусов: «2024» — +2 и +1 к разным или +1 к трём; раса 2014 года — её бонусы
// (с «+1 на выбор» — все варианты выбора).
export function bonusOptions(mode: '2024' | { race: string }): Scores[] {
  const out: Scores[] = [];
  if (mode === '2024') {
    for (const a of ABILITIES) for (const b of ABILITIES) if (a !== b) out.push({ ...zero(), [a]: 2, [b]: 1 });
    for (let i = 0; i < 6; i++)
      for (let j = i + 1; j < 6; j++)
        for (let k = j + 1; k < 6; k++) out.push({ ...zero(), [ABILITIES[i]!]: 1, [ABILITIES[j]!]: 1, [ABILITIES[k]!]: 1 });
    return out;
  }
  const race = RACES_2014[mode.race];
  if (!race) return [zero()];
  const base = { ...zero(), ...race.fixed };
  if (!race.choose) return [base];
  const free = ABILITIES.filter((a) => !race.choose!.except.includes(a));
  const pick = (from: number, left: number, acc: Scores) => {
    if (!left) return void out.push(acc);
    for (let i = from; i < free.length; i++) pick(i + 1, left - 1, { ...acc, [free[i]!]: acc[free[i]!] + 1 });
  };
  pick(0, race.choose.count, base);
  return out;
}

export interface Problem {
  ability?: Ability;
  text: string;
}

export interface Check {
  bonus: Scores;
  base: Scores;
  spent: number;
  problems: Problem[];
}

// Что не так с распределением: характеристика вне пределов до бонусов или потрачено больше бюджета.
export function problemsOf(base: Scores, rules: Rules): Problem[] {
  const p: Problem[] = [];
  for (const a of ABILITIES) {
    if (base[a] > rules.max) p.push({ ability: a, text: `${ABILITY_TITLES[a]} ${base[a]} до бонусов — больше ${rules.max}` });
    if (base[a] < rules.min) p.push({ ability: a, text: `${ABILITY_TITLES[a]} ${base[a]} до бонусов — меньше ${rules.min}` });
  }
  const n = spent(base);
  if (n > rules.budget) p.push({ text: `Потрачено ${n} очков из ${rules.budget}` });
  return p;
}

// Проверка готовых итоговых значений: перебрать допустимые бонусы и найти лучший вариант — законный и с
// наибольшей тратой (обычно ровно весь бюджет), а если законного нет — с наименьшим числом нарушений.
// extra — прочие увеличения (уровни, черты), вычитаются до бонусов.
export function checkFinal(final: Scores, extra: Scores, mode: '2024' | { race: string }, rules: Rules): Check {
  let best: Check | null = null;
  const score = (c: Check) => (c.problems.length ? -1000 * c.problems.length - Math.abs(c.spent - rules.budget) : c.spent);
  for (const bonus of bonusOptions(mode)) {
    const base = { ...zero() };
    for (const a of ABILITIES) base[a] = final[a] - extra[a] - bonus[a];
    const c = { bonus, base, spent: spent(base), problems: problemsOf(base, rules) };
    if (!best || score(c) > score(best)) best = c;
  }
  return best!;
}
