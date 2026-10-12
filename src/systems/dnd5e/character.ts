// D&D 5e: лист персонажа игрока (карточка вида «character»). Справка для мастера, а не живое состояние:
// текущие хиты, потраченные ячейки и состояния живут в трекере инициативы и на игре.
import type { CombatStats } from '../../shared/cards';
import { mod, type Ability, type Size } from './stats';

export interface CharacterClass {
  name: string;
  subclass?: string;
  level: number;
}

export interface CharacterAttack {
  name: string;
  // «+5», «+3 (СЛ 13)» — как записано в листе.
  bonus: string;
  damage: string;
  notes?: string;
}

export interface Dnd5eCharacter {
  player?: string;
  classes: CharacterClass[];
  race: string;
  background: string;
  alignment: string;
  xp?: number;
  size?: Size;
  // Внешность коротко: возраст, рост, вес, глаза, кожа, волосы.
  details?: Partial<Record<'age' | 'height' | 'weight' | 'eyes' | 'skin' | 'hair', string>>;

  abilities: Record<Ability, number>;
  // Спасброски с владением.
  saves: Ability[];
  // Навыки: 1 — владение, 2 — компетентность.
  skills: Record<string, 1 | 2>;
  // Бонус мастерства, если не по уровню.
  pb?: number;
  inspiration?: boolean;

  ac: number;
  hpMax: number;
  // Кость хитов: «1d8».
  hitDie?: string;
  speed: number;
  // Бонус инициативы, если он не равен модификатору Ловкости.
  initiative?: number;

  attacks: CharacterAttack[];

  spellcasting?: {
    ability: Ability;
    // Если не указаны — считаются: 8 + БМ + мод, БМ + мод.
    dc?: number;
    attack?: number;
    // Ячейки по уровням заклинаний: { 1: 4, 2: 2 }.
    slots: Record<string, number>;
    // Списки заклинаний по уровням (0 — заговоры), текст с разметкой.
    spells: Record<string, string>;
  };

  coins?: Partial<Record<'cp' | 'sp' | 'ep' | 'gp' | 'pp', number>>;

  // Тексты листа с разметкой (как в карточках): умения, черты, владения, снаряжение, личность и т. д.
  text: Partial<Record<CharacterText, string>>;
  // Свои заметки с заголовками.
  notes?: { title: string; text: string }[];
}

export const CHARACTER_TEXTS = [
  'features', 'traits', 'proficiencies', 'equipment', 'attacks',
  'personality', 'ideals', 'bonds', 'flaws', 'appearance', 'background', 'allies', 'quests',
] as const;
export type CharacterText = (typeof CHARACTER_TEXTS)[number];

export const isCharacter = (s: unknown): s is Dnd5eCharacter => !!s && typeof s === 'object' && 'classes' in s;

export const totalLevel = (c: Dnd5eCharacter) => c.classes.reduce((n, x) => n + (x.level || 0), 0) || 1;
// Бонус мастерства по уровню персонажа: +2 на 1–4, +3 на 5–8, …
export const characterPb = (c: Dnd5eCharacter) => c.pb ?? 2 + Math.floor((totalLevel(c) - 1) / 4);
export const characterInitiative = (c: Dnd5eCharacter) => c.initiative ?? mod(c.abilities.dex);

export const skillBonus = (c: Dnd5eCharacter, skill: string, ability: Ability) =>
  mod(c.abilities[ability]) + (c.skills[skill] ?? 0) * characterPb(c);

export const saveBonus = (c: Dnd5eCharacter, a: Ability) => mod(c.abilities[a]) + (c.saves.includes(a) ? characterPb(c) : 0);

export function characterCombat(c: Dnd5eCharacter): CombatStats {
  return { hp: c.hpMax, ac: c.ac, initiative: characterInitiative(c) };
}

// «Жрец 3 · Человек» / «Жрец 3 / Воин 1 · Человек»
export function characterSubtitle(c: Dnd5eCharacter): string {
  const classes = c.classes.map((x) => `${x.name}${x.subclass ? ` (${x.subclass})` : ''} ${x.level}`).join(' / ');
  return [classes, c.race].filter(Boolean).join(' · ');
}

export function blankCharacter(): Dnd5eCharacter {
  return {
    classes: [{ name: '', level: 1 }], race: '', background: '', alignment: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saves: [], skills: {}, ac: 10, hpMax: 8, speed: 30, attacks: [], text: {},
  };
}
