// Колдовство в статблоке (Dnd5eStats.spellcasting): характеристика, СЛ и бонус атаки (по умолчанию — от
// характеристики и бонуса мастерства) и группы заклинаний. Показывается как особенность (2014) или действие (2024)
// в духе SRD: «Заговоры (неограниченно): *Свет*, *Священное пламя*» — курсивные названия статблок делает
// ссылками на справочник. parseSpellcasting переносит в эту форму колдовство, записанное текстом (как в SRD).
import { mod, type Ability, type Block, type Dnd5eStats } from './stats';

export type SpellGroup =
  | { kind: 'cantrips'; spells: string[] }
  | { kind: 'will'; spells: string[] }
  // «1/день» (each — «каждое»).
  | { kind: 'day'; times: number; each: boolean; spells: string[] }
  // «1-й уровень (3 ячейки)».
  | { kind: 'level'; level: number; slots?: number; spells: string[] };

export interface Spellcasting {
  // Своё название: «Врождённое колдовство». Нет — по языку и редакции.
  name?: string;
  // Где показывать: особенность (как в 2014) или действие (как в 2024).
  where: 'traits' | 'actions';
  ability: Ability;
  // Нет — 8 + БМ + модификатор / БМ + модификатор.
  dc?: number;
  attack?: number;
  // Дополнение к первой строке: «Не требует материальных компонентов».
  note?: string;
  groups: SpellGroup[];
}

export const GROUP_KINDS = ['cantrips', 'will', 'day', 'level'] as const;

export const spellDc = (s: Dnd5eStats, sc: Spellcasting) => sc.dc ?? 8 + s.pb + mod(s.abilities[sc.ability]);
export const spellAttack = (s: Dnd5eStats, sc: Spellcasting) => sc.attack ?? s.pb + mod(s.abilities[sc.ability]);

const ABILITY_NAMES: Record<'ru' | 'en', Record<Ability, string>> = {
  ru: { str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма' },
  en: { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' },
};

// 1 ячейка, 2 ячейки, 5 ячеек.
const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10;
  const b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};
const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);

export function groupLabel(g: SpellGroup, lang: string): string {
  const ru = lang === 'ru';
  switch (g.kind) {
    case 'cantrips':
      return ru ? 'Заговоры (неограниченно)' : 'Cantrips (at will)';
    case 'will':
      return ru ? 'По желанию' : 'At will';
    case 'day':
      return ru ? `${g.times}/день${g.each ? ' каждое' : ''}` : `${g.times}/day${g.each ? ' each' : ''}`;
    case 'level': {
      const slots = g.slots ? (ru ? ` (${g.slots} ${plural(g.slots, 'ячейка', 'ячейки', 'ячеек')})` : ` (${g.slots} slot${g.slots === 1 ? '' : 's'})`) : '';
      return ru ? `${g.level}-й уровень${slots}` : `${ordinal(g.level)} level${slots}`;
    }
  }
}

export const defaultSpellName = (lang: string, system: string) =>
  lang === 'ru' ? (system === 'dnd5e-2024' ? 'Сотворение заклинаний' : 'Использование заклинаний') : 'Spellcasting';

// Особенность или действие для статблока: первая строка — характеристика, СЛ и атака; дальше — список групп.
export function spellBlock(s: Dnd5eStats, sc: Spellcasting, lang: string, system: string): Block {
  const ru = lang === 'ru';
  const dc = spellDc(s, sc);
  const atk = spellAttack(s, sc);
  const sign = atk >= 0 ? `+${atk}` : `−${-atk}`;
  const ability = ABILITY_NAMES[ru ? 'ru' : 'en'][sc.ability];
  const head = ru
    ? `Заклинательная характеристика — ${ability} (СЛ спасброска ${dc}, ${sign} к атаке заклинаниями).`
    : `Spellcasting ability: ${ability} (spell save DC ${dc}, ${sign} to hit with spell attacks).`;
  const note = sc.note?.trim() ? ` ${sc.note.trim()}` : '';
  const lines = sc.groups
    .filter((g) => g.spells.length)
    .map((g) => `- **${groupLabel(g, lang)}:** ${g.spells.map((x) => `*${x.replace(/\*/g, '')}*`).join(', ')}`);
  return {
    name: sc.name?.trim() || defaultSpellName(lang, system),
    text: [head + note, ...(lines.length ? ['', ...lines] : [])].join('\n'),
    attack: { bonus: atk, damage: [] },
  };
}

// Новое колдовство: заклинательная характеристика — самая высокая из ментальных.
export function newSpellcasting(s: Dnd5eStats, system: string): Spellcasting {
  const ability = (['int', 'wis', 'cha'] as const).reduce((a, b) => (s.abilities[b] > s.abilities[a] ? b : a));
  return { where: system === 'dnd5e-2024' ? 'actions' : 'traits', ability, groups: [{ kind: 'cantrips', spells: [] }] };
}

// ---------- Колдовство, записанное текстом (SRD и свои карточки прошлых версий) ----------

const SPELLCASTING_NAME = /^(spellcasting|innate spellcasting|использование заклинаний|сотворение заклинаний|врождённое колдовство|врожденное колдовство|колдовство)/i;
export const looksLikeSpellcasting = (b: Block) => SPELLCASTING_NAME.test(b.name.trim());

const ABILITY_WORDS: [RegExp, Ability][] = [
  [/интеллект|intelligence/i, 'int'],
  [/мудрост|wisdom/i, 'wis'],
  [/харизм|charisma/i, 'cha'],
  [/телосложени|constitution/i, 'con'],
  [/ловкост|dexterity/i, 'dex'],
  [/сил[аыу](?![а-яё])|strength/i, 'str'],
];

// Группа без списка (Omit для каждого варианта по отдельности).
type GroupHead = SpellGroup extends infer G ? (G extends SpellGroup ? Omit<G, 'spells'> : never) : never;

function groupOf(label: string): GroupHead | null {
  const l = label.toLowerCase();
  if (/заговор|cantrip/.test(l)) return { kind: 'cantrips' };
  if (/по желанию|неогранич|at will/.test(l)) return { kind: 'will' };
  const day = /(\d+)\s*\/\s*(?:день|day)/.exec(l);
  if (day) return { kind: 'day', times: Number(day[1]), each: /кажд|each/.test(l) };
  const lvl = /(\d+)\s*(?:-?[йгяе]|st|nd|rd|th)?\s*(?:уровень|уровня|level)/.exec(l);
  if (lvl) {
    const slots = /(\d+)\s*(?:ячейк|ячеек|slot)/.exec(l);
    return { kind: 'level', level: Number(lvl[1]), ...(slots ? { slots: Number(slots[1]) } : {}) };
  }
  return null;
}

// Разобрать текст особенности «Использование заклинаний». null — групп заклинаний не нашлось.
export function parseSpellcasting(b: Block, where: Spellcasting['where'], s: Dnd5eStats): Spellcasting | null {
  const text = b.text;
  const groups: SpellGroup[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^\s*[-•*]\s+/, '').trim();
    const i = line.indexOf(':');
    // Подпись группы короткая; длинная строка с двоеточием — вступление («…подготовлены заклинания жреца:»).
    if (i < 0 || i > 60) continue;
    const g = groupOf(line.slice(0, i).replace(/\*/g, ''));
    if (!g) continue;
    const spells = line
      .slice(i + 1)
      .replace(/^\s*\*\*\s*/, '')
      .split(/,(?![^(]*\))/)
      .map((x) => x.replace(/\*/g, '').replace(/\s*\([^)]*\)\s*$/, '').trim())
      .filter(Boolean);
    groups.push({ ...g, spells } as SpellGroup);
  }
  if (!groups.length) return null;
  const head = text.split('\n')[0] ?? '';
  const ability = ABILITY_WORDS.find(([re]) => re.test(head))?.[1] ?? newSpellcasting(s, '').ability;
  const sc: Spellcasting = { where, ability, groups };
  const dc = /(?:(?<![А-Яа-яЁё])СЛ[^\d]{0,40}|\bDC\s*)(\d+)/.exec(head);
  const atk = /([+−-]\s*\d+)\s*(?:к попаданию|к атаке|to hit)/i.exec(head);
  if (dc) sc.dc = Number(dc[1]);
  if (atk) sc.attack = Number(atk[1]!.replace(/\s/g, '').replace('−', '-'));
  // Совпадает с расчётом — не храним: поменяют характеристику, и числа пересчитаются.
  if (sc.dc === spellDc(s, { ...sc, dc: undefined })) delete sc.dc;
  if (sc.attack === spellAttack(s, { ...sc, attack: undefined })) delete sc.attack;
  if (/материальн|material/i.test(head)) sc.note = /[а-яё]/i.test(head) ? 'Не требует материальных компонентов.' : 'Requires no Material components.';
  if (!SPELLCASTING_NAME.test(b.name.trim()) || /врожд|innate/i.test(b.name)) sc.name = b.name.trim();
  return sc;
}
