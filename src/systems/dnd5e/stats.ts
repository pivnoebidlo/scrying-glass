// D&D 5e (редакции 2014 и 2024): блок характеристик карточки, подписи на разных языках, расчёты.
// Числа хранятся числами, названия из справочников — ключами ('stealth', 'fire', 'poisoned'),
// подписи подставляются по языку карточки. Неизвестное значение показывается как есть.
import type { CombatStats } from '../../shared/cards';

export const SYSTEMS = ['dnd5e-2014', 'dnd5e-2024'] as const;
export type Dnd5eSystem = (typeof SYSTEMS)[number];

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type Size = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
export type SpeedKind = 'walk' | 'fly' | 'swim' | 'climb' | 'burrow';
export type SenseKind = 'darkvision' | 'blindsight' | 'tremorsense' | 'truesight';

export interface Block {
  name: string;
  // Текст с простой разметкой: *курсив*, **жирный**, строки «- …» — список.
  text: string;
  // «Перезарядка 5–6», «3/день», «стоит 2 действия».
  uses?: string;
  // Для будущих бросков кнопкой.
  attack?: { bonus: number; damage: string[] };
}

export interface Dnd5eStats {
  // Обычно один размер; бывает «Средний или Маленький».
  size: Size[];
  type: string;
  alignment: string;
  ac: number;
  acNote?: string;
  hp: number;
  hpFormula?: string;
  speed: Partial<Record<SpeedKind, number>> & { hover?: boolean };
  // В 2024 указан явно. Если нет — модификатор Ловкости.
  initiative?: number;
  abilities: Record<Ability, number>;
  // Только спасброски с владением (итоговый бонус).
  saves: Partial<Record<Ability, number>>;
  skills: { skill: string; bonus: number }[];
  vulnerabilities: string[];
  resistances: string[];
  immunities: string[];
  conditionImmunities: string[];
  senses: Partial<Record<SenseKind, number>> & { passivePerception: number };
  languages: string;
  gear?: string;
  // Показатель опасности: 0.125, 0.25, 0.5, 1, …
  cr: number;
  xp: number;
  pb: number;
  traits: Block[];
  actions: Block[];
  bonusActions: Block[];
  reactions: Block[];
  legendary?: { intro: string; actions: Block[] };
}

// ---------- Расчёты ----------

export const mod = (score: number) => Math.floor((score - 10) / 2);
export const signed = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function crText(cr: number): string {
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  return String(cr);
}

export const initiativeOf = (s: Dnd5eStats) => s.initiative ?? mod(s.abilities.dex);

export function combatStats(s: Dnd5eStats): CombatStats {
  return { hp: s.hp, ac: s.ac, initiative: initiativeOf(s), hpFormula: s.hpFormula, xp: s.xp || xpFor(s.cr) };
}

// «Маленький или Средний». Размер пишется отдельно от типа: по-русски прилагательное пришлось бы
// согласовывать с родом типа («Маленькая фея», «Маленький гуманоид»).
export const sizeText = (s: Dnd5eStats, lang: string) => {
  const t = dict(lang);
  return s.size.map((x) => t.sizes[x] ?? x).join(` ${t.or} `);
};

// «Фея (гоблиноид) · ПО 1/4»
export const subtitle = (s: Dnd5eStats, lang: string) =>
  [s.type, `${dict(lang).crShort} ${crText(s.cr ?? 0)}`].filter(Boolean).join(' · ');

// ---------- Подписи ----------

type Labels = typeof en;

const en = {
  or: 'or',
  feet: 'ft.',
  hover: 'hover',
  crShort: 'CR',
  sizes: { tiny: 'Tiny', small: 'Small', medium: 'Medium', large: 'Large', huge: 'Huge', gargantuan: 'Gargantuan' } as Record<string, string>,
  abilities: { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' } as Record<Ability, string>,
  speed: { walk: '', fly: 'Fly', swim: 'Swim', climb: 'Climb', burrow: 'Burrow' } as Record<SpeedKind, string>,
  senses: { darkvision: 'Darkvision', blindsight: 'Blindsight', tremorsense: 'Tremorsense', truesight: 'Truesight' } as Record<SenseKind, string>,
  passive: 'Passive Perception',
  skills: {
    acrobatics: 'Acrobatics', 'animal-handling': 'Animal Handling', arcana: 'Arcana', athletics: 'Athletics',
    deception: 'Deception', history: 'History', insight: 'Insight', intimidation: 'Intimidation',
    investigation: 'Investigation', medicine: 'Medicine', nature: 'Nature', perception: 'Perception',
    performance: 'Performance', persuasion: 'Persuasion', religion: 'Religion', 'sleight-of-hand': 'Sleight of Hand',
    stealth: 'Stealth', survival: 'Survival',
  } as Record<string, string>,
  damage: {
    acid: 'Acid', bludgeoning: 'Bludgeoning', cold: 'Cold', fire: 'Fire', force: 'Force', lightning: 'Lightning',
    necrotic: 'Necrotic', piercing: 'Piercing', poison: 'Poison', psychic: 'Psychic', radiant: 'Radiant',
    slashing: 'Slashing', thunder: 'Thunder',
  } as Record<string, string>,
  conditions: {
    blinded: 'Blinded', charmed: 'Charmed', deafened: 'Deafened', exhaustion: 'Exhaustion', frightened: 'Frightened',
    grappled: 'Grappled', incapacitated: 'Incapacitated', invisible: 'Invisible', paralyzed: 'Paralyzed',
    petrified: 'Petrified', poisoned: 'Poisoned', prone: 'Prone', restrained: 'Restrained', stunned: 'Stunned',
    unconscious: 'Unconscious',
  } as Record<string, string>,
  ac: 'Armor Class',
  hp: 'Hit Points',
  speedLabel: 'Speed',
  initiative: 'Initiative',
  mod: 'Mod',
  save: 'Save',
  saves: 'Saving Throws',
  skillsLabel: 'Skills',
  vulnerabilities: 'Vulnerabilities',
  resistances: 'Resistances',
  immunities: 'Immunities',
  conditionImmunities: 'Condition Immunities',
  sensesLabel: 'Senses',
  languages: 'Languages',
  gear: 'Gear',
  cr: 'Challenge',
  xp: 'XP',
  pb: 'PB',
  traits: 'Traits',
  actions: 'Actions',
  bonusActions: 'Bonus Actions',
  reactions: 'Reactions',
  legendary: 'Legendary Actions',
};

const ru: Labels = {
  or: 'или',
  feet: 'фт.',
  hover: 'парит',
  crShort: 'ПО',
  sizes: { tiny: 'Крошечный', small: 'Маленький', medium: 'Средний', large: 'Большой', huge: 'Огромный', gargantuan: 'Громадный' },
  abilities: { str: 'СИЛ', dex: 'ЛОВ', con: 'ТЕЛ', int: 'ИНТ', wis: 'МДР', cha: 'ХАР' },
  speed: { walk: '', fly: 'полёт', swim: 'плавание', climb: 'лазание', burrow: 'копание' },
  senses: { darkvision: 'тёмное зрение', blindsight: 'слепое зрение', tremorsense: 'чувство вибрации', truesight: 'истинное зрение' },
  passive: 'пассивная Внимательность',
  skills: {
    acrobatics: 'Акробатика', 'animal-handling': 'Уход за животными', arcana: 'Магия', athletics: 'Атлетика',
    deception: 'Обман', history: 'История', insight: 'Проницательность', intimidation: 'Запугивание',
    investigation: 'Анализ', medicine: 'Медицина', nature: 'Природа', perception: 'Внимательность',
    performance: 'Выступление', persuasion: 'Убеждение', religion: 'Религия', 'sleight-of-hand': 'Ловкость рук',
    stealth: 'Скрытность', survival: 'Выживание',
  },
  damage: {
    acid: 'кислота', bludgeoning: 'дробящий', cold: 'холод', fire: 'огонь', force: 'силовое поле',
    lightning: 'электричество', necrotic: 'некротическая энергия', piercing: 'колющий', poison: 'яд',
    psychic: 'психическая энергия', radiant: 'излучение', slashing: 'рубящий', thunder: 'звук',
  },
  conditions: {
    blinded: 'ослеплённый', charmed: 'очарованный', deafened: 'оглохший', exhaustion: 'истощение',
    frightened: 'испуганный', grappled: 'схваченный', incapacitated: 'недееспособный', invisible: 'невидимый',
    paralyzed: 'парализованный', petrified: 'окаменевший', poisoned: 'отравленный', prone: 'сбитый с ног',
    restrained: 'опутанный', stunned: 'ошеломлённый', unconscious: 'бессознательный',
  },
  ac: 'Класс доспеха',
  hp: 'Хиты',
  speedLabel: 'Скорость',
  initiative: 'Инициатива',
  mod: 'Мод',
  save: 'Спас',
  saves: 'Спасброски',
  skillsLabel: 'Навыки',
  vulnerabilities: 'Уязвимости',
  resistances: 'Сопротивления',
  immunities: 'Иммунитеты',
  conditionImmunities: 'Иммунитет к состояниям',
  sensesLabel: 'Чувства',
  languages: 'Языки',
  gear: 'Снаряжение',
  cr: 'Опасность',
  xp: 'ОО',
  pb: 'БМ',
  traits: 'Особенности',
  actions: 'Действия',
  bonusActions: 'Бонусные действия',
  reactions: 'Реакции',
  legendary: 'Легендарные действия',
};

export const dict = (lang: string): Labels => (lang === 'ru' ? ru : en);

// ---------- Для редактора ----------

export const SIZES: Size[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
export const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const SPEEDS: SpeedKind[] = ['walk', 'fly', 'swim', 'climb', 'burrow'];
export const SENSES: SenseKind[] = ['darkvision', 'blindsight', 'tremorsense', 'truesight'];

// Опыт за показатель опасности.
const XP: Record<number, number> = {
  0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900,
  9: 5000, 10: 5900, 11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000,
  19: 22000, 20: 25000, 21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000,
  28: 120000, 29: 135000, 30: 155000,
};
export const CRS = Object.keys(XP).map(Number).sort((a, b) => a - b);
export const xpFor = (cr: number) => XP[cr] ?? 0;
// Бонус мастерства: +2 до ПО 4, дальше +1 за каждые 4 ступени.
export const pbFor = (cr: number) => (cr < 5 ? 2 : Math.min(9, 2 + Math.ceil((cr - 4) / 4)));

// Средние хиты по формуле: «3d6» -> 10, «19d12+133» -> 256. null — формула не разобрана.
export function averageHp(formula: string): number | null {
  const m = /^(\d+)[dк](\d+)(?:([+\-−])(\d+))?$/i.exec(formula.replace(/\s+/g, ''));
  if (!m) return null;
  const avg = Math.floor((Number(m[1]) * (Number(m[2]) + 1)) / 2);
  const k = m[4] ? Number(m[4]) : 0;
  return Math.max(1, m[3] === '+' ? avg + k : avg - k);
}

export function blankStats(): Dnd5eStats {
  return {
    size: ['medium'], type: '', alignment: '', ac: 10, hp: 10, hpFormula: '', speed: { walk: 30 },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saves: {}, skills: [], vulnerabilities: [], resistances: [], immunities: [], conditionImmunities: [],
    senses: { passivePerception: 10 }, languages: '', cr: 0, xp: 10, pb: 2,
    traits: [], actions: [], bonusActions: [], reactions: [],
  };
}

// Какой характеристикой проверяется навык (для бонуса по умолчанию).
export const SKILL_ABILITY: Record<string, Ability> = {
  acrobatics: 'dex', 'animal-handling': 'wis', arcana: 'int', athletics: 'str', deception: 'cha', history: 'int',
  insight: 'wis', intimidation: 'cha', investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', 'sleight-of-hand': 'dex', stealth: 'dex', survival: 'wis',
};
