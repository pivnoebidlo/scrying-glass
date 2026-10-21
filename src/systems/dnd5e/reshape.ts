// Reshaping a D&D stat block (Tools → Reshape a stat block): a base creature plus templates (age, build, people),
// ability changes and other weapons. Pure functions: the numbers that follow the abilities are recounted — saves,
// skills, passive Perception, initiative, hit points, AC by the armour worn, attack rolls, damage and save DCs in the
// texts of SRD blocks (2014 and 2024, English and Russian). Texts are not rewritten; a number not recognised stays.
import { ABILITIES, averageHp, mod, pbFor, signed, SIZES, SKILL_ABILITY, SPEEDS, xpFor, type Ability, type Block, type Dnd5eStats, type Size, type SpeedKind } from './stats';

type Lang = 'en' | 'ru';
const L = (lang: string): Lang => (lang === 'ru' ? 'ru' : 'en');
type Text = Record<Lang, string>;

// ---------- Templates ----------

export interface Template {
  id: string;
  // One template of a group at a time. Age — only for humanoids, people — for those without one (templateFits).
  // 'own' — the GM's templates (library): any number at once, for any creature.
  group: 'age' | 'build' | 'role' | 'people' | 'own';
  name: Text;
  abilities?: Partial<Record<Ability, number>>;
  size?: Size;
  // Walking speed (feet).
  speed?: number;
  darkvision?: number;
  // Other speeds: swim, fly, climb, burrow (the larger of the base's and this).
  speeds?: Partial<Record<Exclude<SpeedKind, 'walk'>, number>>;
  resistances?: string[];
  immunities?: string[];
  // Hit dice: a share of the base number (a child has half).
  hitDice?: number;
  // Proficiency in saves (added if missing).
  saves?: Ability[];
  skills?: string[];
  traits?: { name: Text; text: Text }[];
  actions?: { name: Text; text: Text }[];
  reactions?: { name: Text; text: Text }[];
  language?: Text;
  // The creature's subtype: «Humanoid (Dwarf)».
  subtype?: Text;
}

const tr = (en: string, ru: string): Text => ({ en, ru });

export const TEMPLATES: Template[] = [
  {
    id: 'child', group: 'age', name: tr('Child', 'Ребёнок'), abilities: { str: -4, con: -2 }, size: 'small', speed: 25, hitDice: 0.5,
  },
  { id: 'elder', group: 'age', name: tr('Elder', 'Старик'), abilities: { str: -2, dex: -2, con: -2, wis: 2 }, speed: 25 },
  { id: 'frail', group: 'build', name: tr('Frail', 'Хилый'), abilities: { str: -2, con: -2 } },
  {
    id: 'brute', group: 'build', name: tr('Brawny', 'Здоровяк'), abilities: { str: 2, con: 2 }, saves: ['str'], skills: ['athletics'],
  },
  {
    id: 'leader', group: 'role', name: tr('Leader', 'Главарь'), abilities: { cha: 2, int: 1 }, skills: ['intimidation'],
    traits: [{
      name: tr('Commanding Voice (1/Day)', 'Командный голос (1/день)'),
      text: tr(
        'As a bonus action, the creature rallies its allies: for 1 minute, each ally within 30 feet that can hear it adds 1d4 to its attack rolls and saving throws.',
        'Бонусным действием существо ободряет союзников: на 1 минуту каждый союзник в пределах 30 фт., который его слышит, добавляет 1к4 к броскам атаки и спасброскам.',
      ),
    }],
  },
  {
    id: 'veteran', group: 'role', name: tr('Seasoned fighter', 'Бывалый боец'), abilities: { str: 2, con: 1 }, saves: ['str', 'con'], skills: ['athletics'],
    reactions: [{
      name: tr('Parry', 'Парирование'),
      text: tr(
        'The creature adds 2 to its AC against one melee attack that would hit it. To do so, it must see the attacker and be wielding a melee weapon.',
        'Существо добавляет 2 к КД против одной рукопашной атаки, которая попала бы по нему. Для этого оно должно видеть атакующего и держать рукопашное оружие.',
      ),
    }],
  },
  {
    id: 'skulker', group: 'role', name: tr('Skulker', 'Ловкач'), abilities: { dex: 2, int: 1 }, skills: ['stealth', 'sleight-of-hand'],
    traits: [{
      name: tr('Cunning Action', 'Хитрое действие'),
      text: tr('On each of its turns, the creature can take the Dash, Disengage, or Hide action as a bonus action.', 'В каждый свой ход существо может бонусным действием совершить действие Рывок, Отход или Засада.'),
    }],
  },
  {
    id: 'healer', group: 'role', name: tr('Healer', 'Целитель'), abilities: { wis: 2 }, skills: ['medicine', 'religion'],
    actions: [{
      name: tr('Healing Touch (3/Day)', 'Целебное касание (3/день)'),
      text: tr('The creature touches another creature, which regains 2d8 + {wis} hit points.', 'Существо касается другого существа, и то восстанавливает 2к8 + {wis} хитов.'),
    }],
  },
  {
    id: 'sage', group: 'role', name: tr('Sage', 'Мудрец'), abilities: { int: 2, wis: 1 }, skills: ['arcana', 'history'],
  },
  { id: 'human', group: 'people', name: tr('Human', 'Человек'), subtype: tr('Human', 'человек') },
  {
    id: 'dwarf', group: 'people', name: tr('Dwarf', 'Дварф'), abilities: { con: 2 }, speed: 25, darkvision: 60, resistances: ['poison'],
    subtype: tr('Dwarf', 'дварф'), language: tr('Dwarvish', 'Дварфийский'),
    traits: [{
      name: tr('Dwarven Resilience', 'Дварфийская стойкость'),
      text: tr('The dwarf has advantage on saving throws against being poisoned.', 'Дварф совершает с преимуществом спасброски от отравления.'),
    }],
  },
  {
    id: 'elf', group: 'people', name: tr('Elf', 'Эльф'), abilities: { dex: 2 }, darkvision: 60, skills: ['perception'],
    subtype: tr('Elf', 'эльф'), language: tr('Elvish', 'Эльфийский'),
    traits: [{
      name: tr('Fey Ancestry', 'Наследие фей'),
      text: tr("The elf has advantage on saving throws against being charmed, and magic can't put it to sleep.", 'Эльф совершает с преимуществом спасброски от очарования, и магия не может его усыпить.'),
    }],
  },
  {
    id: 'halfling', group: 'people', name: tr('Halfling', 'Полурослик'), abilities: { dex: 2 }, size: 'small', speed: 25,
    subtype: tr('Halfling', 'полурослик'), language: tr('Halfling', 'Язык полуросликов'),
    traits: [
      {
        name: tr('Lucky', 'Везучий'),
        text: tr('When the halfling rolls a 1 on a d20, it can reroll the die and must use the new roll.', 'Когда у полурослика на к20 выпадает 1, он может перебросить кость и должен использовать новый результат.'),
      },
      { name: tr('Brave', 'Храбрый'), text: tr('The halfling has advantage on saving throws against being frightened.', 'Полурослик совершает с преимуществом спасброски от испуга.') },
    ],
  },
  {
    id: 'gnome', group: 'people', name: tr('Gnome', 'Гном'), abilities: { int: 2 }, size: 'small', speed: 25, darkvision: 60,
    subtype: tr('Gnome', 'гном'), language: tr('Gnomish', 'Гномий'),
    traits: [{
      name: tr('Gnome Cunning', 'Гномья хитрость'),
      text: tr('The gnome has advantage on Intelligence, Wisdom, and Charisma saving throws against magic.', 'Гном совершает с преимуществом спасброски Интеллекта, Мудрости и Харизмы от магии.'),
    }],
  },
  {
    id: 'orc', group: 'people', name: tr('Orc', 'Орк'), abilities: { str: 2, con: 1 }, darkvision: 60, skills: ['intimidation'],
    subtype: tr('Orc', 'орк'), language: tr('Orc', 'Орочий'),
    traits: [{
      name: tr('Relentless Endurance (1/Day)', 'Неутомимая стойкость (1/день)'),
      text: tr('When the orc is reduced to 0 hit points but not killed outright, it can drop to 1 hit point instead.', 'Когда хиты орка опускаются до 0, но он не убит сразу, его хиты вместо этого опускаются до 1.'),
    }],
  },
  {
    id: 'tiefling', group: 'people', name: tr('Tiefling', 'Тифлинг'), abilities: { cha: 2, int: 1 }, darkvision: 60, resistances: ['fire'],
    subtype: tr('Tiefling', 'тифлинг'), language: tr('Infernal', 'Инфернальный'),
  },
  {
    id: 'dragonborn', group: 'people', name: tr('Dragonborn', 'Драконорождённый'), abilities: { str: 2, cha: 1 }, resistances: ['fire'],
    subtype: tr('Dragonborn', 'драконорождённый'), language: tr('Draconic', 'Драконий'),
    traits: [{
      name: tr('Draconic Ancestry', 'Драконье происхождение'),
      text: tr(
        'The dragonborn breathes fire in a 15-foot cone once per short rest: each creature there makes a Dexterity saving throw (DC {dc}), taking 2d6 fire damage on a failure or half as much on a success.',
        'Раз за короткий отдых драконорождённый выдыхает огонь конусом 15 фт.: каждое существо в нём совершает спасбросок Ловкости (СЛ {dc}), получая 2к6 урона огнём при провале или половину при успехе.',
      ),
    }],
  },
];

export const templateById = (id: string, own: Template[] = []) => TEMPLATES.find((t) => t.id === id) ?? own.find((t) => t.id === id);

// A dwarf medusa or a child dragon make no sense: ages are for humanoids, peoples — see peopleFits.
export const isHumanoid = (s: Dnd5eStats) => /humanoid|гуманоид/i.test(s.type);

// The subtype in brackets: «Humanoid (goblinoid)» → «goblinoid».
const subtypeOf = (s: Dnd5eStats) => /\(([^)]*)\)/.exec(s.type)?.[1]?.trim().toLowerCase() ?? '';
// Subtypes that are not a people of their own: none, any race, a class (2024 Russian SRD), or one of our peoples.
const OPEN_SUBTYPES = ['', 'any race', 'любая раса', 'wizard', 'cleric', 'druid', 'priest', 'волшебник', 'жрец', 'друид'];
const CLASS_SUBTYPES = OPEN_SUBTYPES.slice(4);
// A people can be given to a humanoid with no people of its own: a goblin or a kobold stays what it is.
export function peopleFits(s: Dnd5eStats): boolean {
  if (!isHumanoid(s)) return false;
  const sub = subtypeOf(s);
  return OPEN_SUBTYPES.includes(sub) || TEMPLATES.some((t) => t.subtype && (t.subtype.en.toLowerCase() === sub || t.subtype.ru.toLowerCase() === sub));
}
export const templateFits = (t: Template, s: Dnd5eStats) => (t.group === 'people' ? peopleFits(s) : t.group === 'age' ? isHumanoid(s) : true);

// ---------- The GM's templates ----------

// A template of the GM, as kept in the library (reshape-templates.json): one language — the one it was written in.
export interface OwnTemplate {
  id: string;
  name: string;
  abilities?: Partial<Record<Ability, number>>;
  size?: Size;
  speed?: number;
  speeds?: Template['speeds'];
  darkvision?: number;
  resistances?: string[];
  immunities?: string[];
  saves?: Ability[];
  skills?: string[];
  blocks?: { list: 'traits' | 'actions' | 'reactions'; name: string; text: string }[];
  language?: string;
  subtype?: string;
}

const same = (x: string): Text => ({ en: x, ru: x });
export function ownTemplate(o: OwnTemplate): Template {
  const blocks = (list: string) => (o.blocks ?? []).filter((b) => b.list === list && b.name.trim()).map((b) => ({ name: same(b.name.trim()), text: same(b.text) }));
  return {
    id: o.id,
    group: 'own',
    name: same(o.name),
    ...(o.abilities ? { abilities: o.abilities } : {}),
    ...(o.size ? { size: o.size } : {}),
    ...(o.speed ? { speed: o.speed } : {}),
    ...(o.speeds ? { speeds: o.speeds } : {}),
    ...(o.darkvision ? { darkvision: o.darkvision } : {}),
    ...(o.resistances?.length ? { resistances: o.resistances } : {}),
    ...(o.immunities?.length ? { immunities: o.immunities } : {}),
    ...(o.saves?.length ? { saves: o.saves } : {}),
    ...(o.skills?.length ? { skills: o.skills } : {}),
    traits: blocks('traits'),
    actions: blocks('actions'),
    reactions: blocks('reactions'),
    ...(o.language?.trim() ? { language: same(o.language.trim()) } : {}),
    ...(o.subtype?.trim() ? { subtype: same(o.subtype.trim()) } : {}),
  };
}

// The library file as read: every field may be anything.
type Raw = { [K in keyof OwnTemplate]?: unknown };
type RawBlock = { list?: unknown; name?: unknown; text?: unknown };

// The library file, checked: anything odd is dropped rather than trusted.
export function parseOwnTemplates(data: unknown): OwnTemplate[] {
  const list = (data as { templates?: unknown } | null)?.templates;
  if (!Array.isArray(list)) return [];
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined);
  const out: OwnTemplate[] = [];
  for (const x of list as (Raw | null)[]) {
    if (!x || typeof x.id !== 'string' || typeof x.name !== 'string') continue;
    const abilities = Object.fromEntries(ABILITIES.map((a) => [a, num((x.abilities as Partial<Record<string, unknown>> | undefined)?.[a])]).filter(([, v]) => v));
    const speeds = Object.fromEntries(SPEEDS.filter((k) => k !== 'walk').map((k) => [k, num((x.speeds as Partial<Record<string, unknown>> | undefined)?.[k])]).filter(([, v]) => v));
    const blocks = Array.isArray(x.blocks)
      ? ((x.blocks as (RawBlock | null)[]).filter((b) => b && ['traits', 'actions', 'reactions'].includes(b.list as string) && typeof b.name === 'string' && typeof b.text === 'string') as OwnTemplate['blocks'])
      : [];
    out.push({
      id: x.id,
      name: x.name,
      abilities,
      ...(SIZES.includes(x.size as Size) ? { size: x.size as Size } : {}),
      ...(num(x.speed) ? { speed: num(x.speed) } : {}),
      speeds,
      ...(num(x.darkvision) ? { darkvision: num(x.darkvision) } : {}),
      resistances: strs(x.resistances) ?? [],
      immunities: strs(x.immunities) ?? [],
      saves: (strs(x.saves) ?? []).filter((a): a is Ability => (ABILITIES as string[]).includes(a)),
      skills: (strs(x.skills) ?? []).filter((k) => k in SKILL_ABILITY),
      blocks,
      ...(typeof x.language === 'string' ? { language: x.language } : {}),
      ...(typeof x.subtype === 'string' ? { subtype: x.subtype } : {}),
    });
  }
  return out;
}

// ---------- Weapons (SRD) ----------

export interface Weapon {
  id: string;
  name: Text;
  dice: string;
  type: 'bludgeoning' | 'piercing' | 'slashing';
  kind: 'melee' | 'ranged';
  finesse?: boolean;
  reach?: boolean;
  // Thrown weapons and ranged ones: normal / long range.
  range?: [number, number];
  // Two hands: the die then.
  versatile?: string;
}

const w = (id: string, en: string, ru: string, dice: string, type: Weapon['type'], extra: Partial<Weapon> = {}): Weapon => ({
  id, name: { en, ru }, dice, type, kind: 'melee', ...extra,
});

export const WEAPONS: Weapon[] = [
  w('club', 'Club', 'Дубинка', '1d4', 'bludgeoning'),
  w('dagger', 'Dagger', 'Кинжал', '1d4', 'piercing', { finesse: true, range: [20, 60] }),
  w('greatclub', 'Greatclub', 'Палица', '1d8', 'bludgeoning'),
  w('handaxe', 'Handaxe', 'Ручной топор', '1d6', 'slashing', { range: [20, 60] }),
  w('javelin', 'Javelin', 'Метательное копьё', '1d6', 'piercing', { range: [30, 120] }),
  w('light-hammer', 'Light Hammer', 'Лёгкий молот', '1d4', 'bludgeoning', { range: [20, 60] }),
  w('mace', 'Mace', 'Булава', '1d6', 'bludgeoning'),
  w('quarterstaff', 'Quarterstaff', 'Боевой посох', '1d6', 'bludgeoning', { versatile: '1d8' }),
  w('sickle', 'Sickle', 'Серп', '1d4', 'slashing'),
  w('spear', 'Spear', 'Копьё', '1d6', 'piercing', { range: [20, 60], versatile: '1d8' }),
  w('light-crossbow', 'Light Crossbow', 'Лёгкий арбалет', '1d8', 'piercing', { kind: 'ranged', range: [80, 320] }),
  w('dart', 'Dart', 'Дротик', '1d4', 'piercing', { kind: 'ranged', finesse: true, range: [20, 60] }),
  w('shortbow', 'Shortbow', 'Короткий лук', '1d6', 'piercing', { kind: 'ranged', range: [80, 320] }),
  w('sling', 'Sling', 'Праща', '1d4', 'bludgeoning', { kind: 'ranged', range: [30, 120] }),
  w('battleaxe', 'Battleaxe', 'Боевой топор', '1d8', 'slashing', { versatile: '1d10' }),
  w('flail', 'Flail', 'Цеп', '1d8', 'bludgeoning'),
  w('glaive', 'Glaive', 'Глефа', '1d10', 'slashing', { reach: true }),
  w('greataxe', 'Greataxe', 'Секира', '1d12', 'slashing'),
  w('greatsword', 'Greatsword', 'Двуручный меч', '2d6', 'slashing'),
  w('halberd', 'Halberd', 'Алебарда', '1d10', 'slashing', { reach: true }),
  w('longsword', 'Longsword', 'Длинный меч', '1d8', 'slashing', { versatile: '1d10' }),
  w('maul', 'Maul', 'Молот', '2d6', 'bludgeoning'),
  w('morningstar', 'Morningstar', 'Моргенштерн', '1d8', 'piercing'),
  w('pike', 'Pike', 'Пика', '1d10', 'piercing', { reach: true }),
  w('rapier', 'Rapier', 'Рапира', '1d8', 'piercing', { finesse: true }),
  w('scimitar', 'Scimitar', 'Скимитар', '1d6', 'slashing', { finesse: true }),
  w('shortsword', 'Shortsword', 'Короткий меч', '1d6', 'piercing', { finesse: true }),
  w('trident', 'Trident', 'Трезубец', '1d8', 'piercing', { range: [20, 60], versatile: '1d10' }),
  w('war-pick', 'War Pick', 'Боевая кирка', '1d8', 'piercing'),
  w('warhammer', 'Warhammer', 'Боевой молот', '1d8', 'bludgeoning', { versatile: '1d10' }),
  w('whip', 'Whip', 'Кнут', '1d4', 'slashing', { finesse: true, reach: true }),
  w('hand-crossbow', 'Hand Crossbow', 'Ручной арбалет', '1d6', 'piercing', { kind: 'ranged', range: [30, 120] }),
  w('heavy-crossbow', 'Heavy Crossbow', 'Тяжёлый арбалет', '1d10', 'piercing', { kind: 'ranged', range: [100, 400] }),
  w('longbow', 'Longbow', 'Длинный лук', '1d8', 'piercing', { kind: 'ranged', range: [150, 600] }),
];

export const weaponById = (id: string) => WEAPONS.find((x) => x.id === id);

// ---------- Recounting ----------

export interface Reshape {
  templates: string[];
  // Changes by hand on top of the templates.
  abilities: Partial<Record<Ability, number>>;
  // Weapons in place of attack blocks: key — `list:index` (attackBlocks), value — weapon id.
  weapons: Record<string, string>;
  // Another challenge rating: the creature made stronger or weaker (empower).
  cr?: number;
  // Weapons added: as an attack (and in the gear) or only carried.
  added?: { weapon: string; attack: boolean }[];
  // Other things carried, as written: «rope, a lantern».
  gear?: string;
}
export const NO_RESHAPE: Reshape = { templates: [], abilities: {}, weapons: {} };

const LISTS = ['traits', 'actions', 'bonusActions', 'reactions'] as const;
type ListKey = (typeof LISTS)[number];

// An attack roll in a block's text: «+4 to hit», «Attack Roll: +4», «+4 к попаданию», «атака:* +4».
const TO_HIT = /((?:Attack Roll|атака)[^+−\-\d]{0,4}|)([+−-]\d+)(\s*(?:to hit|к попаданию)|)/i;
const isAttackText = (text: string) => /Weapon Attack|Attack Roll|атака оружием|атака:\*/i.test(text) && !/Spell|заклинани/i.test(text.split(/[.:]/)[0] ?? '');
// «5 (1d6 + 2)», «2 (1к4)».
const DAMAGE = /(\d+) \((\d+)([dк])(\d+)(?: ([+−-]) (\d+))?\)/g;

const num = (s: string) => Number(s.replace('−', '-'));
const signedText = (n: number, lang: Lang) => (lang === 'en' ? (n >= 0 ? `+${n}` : `-${-n}`) : signed(n));

// The weapon attacks of a stat block, for the weapon pickers: key, name and list.
export function attackBlocks(s: Dnd5eStats): { key: string; name: string }[] {
  const out: { key: string; name: string }[] = [];
  for (const list of LISTS) {
    s[list].forEach((b, i) => {
      if (b.attack || isAttackText(b.text)) out.push({ key: `${list}:${i}`, name: b.name });
    });
  }
  return out;
}

// Which ability a weapon attack uses: the one whose modifier is the damage bonus (ranged — Dexterity first).
function attackAbility(b: Block, old: Record<Ability, number>): Ability {
  const ranged = /Ranged|Дальнобойн/i.test(b.text) && !/Melee|Рукопашн/i.test(b.text);
  const first: Ability = ranged ? 'dex' : 'str';
  const other: Ability = ranged ? 'str' : 'dex';
  DAMAGE.lastIndex = 0;
  const m = DAMAGE.exec(b.text);
  const k = m && m[6] ? num(`${m[5]}${m[6]}`) : 0;
  if (mod(old[first]) === k) return first;
  if (mod(old[other]) === k) return other;
  return first;
}

const avgOf = (n: number, die: number, k: number) => Math.max(1, Math.floor((n * (die + 1)) / 2) + k);

// A block's attack and damage recounted for a changed modifier (d) of the ability it uses.
function shiftAttack(b: Block, d: number, lang: Lang): Block {
  if (!d) return b;
  let text = b.text.replace(TO_HIT, (_all, pre: string, n: string, post: string) => `${pre}${signedText(num(n) + d, lang)}${post}`);
  let firstK: number | null = null;
  let i = 0;
  text = text.replace(DAMAGE, (all, _avg: string, n: string, dch: string, die: string, sign?: string, k?: string) => {
    const oldK = k ? num(`${sign}${k}`) : 0;
    // The first damage carries the ability's modifier; later ones only when they carry the same (two-handed).
    if (i++ === 0) firstK = oldK;
    else if (oldK !== firstK || !k) return all;
    const nk = oldK + d;
    const mk = nk ? ` ${nk > 0 ? '+' : lang === 'en' ? '-' : '−'} ${Math.abs(nk)}` : '';
    return `${avgOf(Number(n), Number(die), nk)} (${n}${dch}${die}${mk})`;
  });
  const attack = b.attack
    ? {
        bonus: b.attack.bonus + d,
        damage: b.attack.damage.map((x, j) => (j === 0 ? shiftDice(x, d) : x)),
      }
    : undefined;
  return { ...b, text, ...(attack ? { attack } : {}) };
}

// «1d6+2» with 2 more → «1d6+4».
function shiftDice(x: string, d: number): string {
  const m = /^(\d+[dк]\d+)(?:([+−-])(\d+))?$/.exec(x.replace(/\s+/g, ''));
  if (!m) return x;
  const k = (m[3] ? num(`${m[2]}${m[3]}`) : 0) + d;
  return `${m[1]}${k ? (k > 0 ? `+${k}` : `-${-k}`) : ''}`;
}

// A save DC in a text («DC 12», «СЛ 12»): recounted when exactly one ability gives it (8 + PB + modifier).
function shiftDcs(text: string, pb: number, old: Record<Ability, number>, dm: Record<Ability, number>): string {
  return text.replace(/(^|[^\p{L}])(DC|СЛ) (\d+)/gu, (all, pre: string, word: string, n: string) => {
    const dc = Number(n);
    const from = ABILITIES.filter((a) => 8 + pb + mod(old[a]) === dc);
    const a = from.length === 1 ? from[0]! : null;
    return a && dm[a] ? `${pre}${word} ${dc + dm[a]}` : all;
  });
}

// The armour named in the AC note or the gear: heavy — no Dexterity, medium — up to +2, else — all of it.
const HEAVY = /ring mail|chain mail|splint|plate|колечн|кольчуга(?! рубах)|кольчужный доспех|наборн|латы|латный/i;
const MEDIUM = /hide|chain shirt|scale|breastplate|half plate|шкурн|кольчужная рубах|чешуйчат|кираса|полулат/i;
function armourDex(s: Dnd5eStats): number {
  const text = `${s.acNote ?? ''} ${s.gear ?? ''}`;
  if (HEAVY.test(text)) return 0;
  if (MEDIUM.test(text)) return 2;
  return Infinity;
}

const HIT_DIE: Record<Size, number> = { tiny: 4, small: 6, medium: 8, large: 10, huge: 12, gargantuan: 20 };

// A weapon as an attack block in the card's language and edition.
export function weaponBlock(wp: Weapon, s: Dnd5eStats, lang: string, edition: '2014' | '2024'): Block {
  const l = L(lang);
  const ab: Ability = wp.kind === 'ranged' ? 'dex' : wp.finesse && s.abilities.dex > s.abilities.str ? 'dex' : 'str';
  const m = mod(s.abilities[ab]);
  const bonus = s.pb + m;
  const dmg = (dice: string) => {
    const [n, die] = dice.split('d').map(Number) as [number, number];
    const mk = m ? ` ${m > 0 ? '+' : l === 'en' ? '-' : '−'} ${Math.abs(m)}` : '';
    return `${avgOf(n, die, m)} (${n}${l === 'ru' && edition === '2014' ? 'к' : 'd'}${die}${mk})`;
  };
  const thrown = wp.kind === 'melee' && wp.range;
  const reach = wp.reach ? 10 : 5;
  const type = DAMAGE_TYPE[wp.type][l];
  const range = wp.range ? `${wp.range[0]}/${wp.range[1]}` : '';
  let text: string;
  if (l === 'en') {
    const kind = thrown ? 'Melee or Ranged' : wp.kind === 'ranged' ? 'Ranged' : 'Melee';
    const where = thrown ? `reach ${reach} ft. or range ${range} ft.` : wp.kind === 'ranged' ? `range ${range} ft.` : `reach ${reach} ft.`;
    const typeEn = edition === '2014' ? type : type.charAt(0).toUpperCase() + type.slice(1);
    const two = wp.versatile ? ` or ${dmg(wp.versatile)} ${typeEn} damage if used with two hands` : '';
    text =
      edition === '2014'
        ? `${kind} Weapon Attack: ${signedText(bonus, l)} to hit, ${where}, one target. Hit: ${dmg(wp.dice)} ${typeEn} damage${two}.`
        : `${kind} Attack Roll: ${signedText(bonus, l)}, ${where} Hit: ${dmg(wp.dice)} ${typeEn} damage${two}.`;
  } else {
    const kind = thrown ? 'Рукопашная или дальнобойная атака' : wp.kind === 'ranged' ? 'Дальнобойная атака' : 'Рукопашная атака';
    const ft = edition === '2014' ? 'фт.' : 'футов';
    const where = thrown
      ? `досягаемость ${reach} ${ft} или ${edition === '2014' ? 'дальность' : 'дистанция'} ${range} ${ft}`
      : wp.kind === 'ranged'
        ? `${edition === '2014' ? 'дальность' : 'дистанция'} ${range} ${ft}`
        : `досягаемость ${reach} ${ft}`;
    const two = wp.versatile ? ` или ${dmg(wp.versatile)} ${type} урона при использовании двумя руками` : '';
    text =
      edition === '2014'
        ? `*${kind} оружием:* ${signedText(bonus, l)} к попаданию, ${where}, одна цель. *Попадание:* ${dmg(wp.dice)} ${type} урона${two}.`
        : `*${kind}:* ${signedText(bonus, l)}, ${where}. ${dmg(wp.dice)} ${type} урона${two}.`;
  }
  const plain = (dice: string) => `${dice}${m ? (m > 0 ? `+${m}` : `${m}`) : ''}`;
  return { name: wp.name[l], text, attack: { bonus, damage: [plain(wp.dice), ...(wp.versatile ? [plain(wp.versatile)] : [])] } };
}

const DAMAGE_TYPE: Record<Weapon['type'], Text> = {
  bludgeoning: tr('bludgeoning', 'Дробящего'),
  piercing: tr('piercing', 'Колющего'),
  slashing: tr('slashing', 'Рубящего'),
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The reshaped stat block. lang and edition — the card's (texts of templates and weapons are written in them).
// own — the GM's templates (ownTemplate), found by id like the built-in ones.
export function reshape(base: Dnd5eStats, r: Reshape, lang: string, edition: '2014' | '2024', own: Template[] = []): Dnd5eStats {
  const l = L(lang);
  const tpls = r.templates.map((id) => templateById(id, own)).filter((x): x is Template => !!x && templateFits(x, base));
  const s: Dnd5eStats = structuredClone(base);
  const old = base.abilities;

  // Abilities: templates, then the hand-made changes.
  const abilities = { ...old };
  for (const a of ABILITIES) {
    const d = tpls.reduce((sum, t) => sum + (t.abilities?.[a] ?? 0), 0) + (r.abilities[a] ?? 0);
    abilities[a] = Math.min(30, Math.max(1, old[a] + d));
  }
  s.abilities = abilities;
  const dm = Object.fromEntries(ABILITIES.map((a) => [a, mod(abilities[a]) - mod(old[a])])) as Record<Ability, number>;

  // Proficiencies a template adds (a save or a skill not there yet: PB + modifier).
  for (const t of tpls) {
    for (const a of t.saves ?? []) if (s.saves[a] === undefined) s.saves[a] = base.pb + mod(old[a]);
    for (const k of t.skills ?? []) if (!s.skills.some((x) => x.skill === k)) s.skills.push({ skill: k, bonus: base.pb + mod(old[SKILL_ABILITY[k] ?? 'wis']) });
  }
  for (const a of ABILITIES) if (s.saves[a] !== undefined) s.saves[a] = s.saves[a]! + dm[a];
  s.skills = s.skills.map((x) => ({ ...x, bonus: x.bonus + dm[SKILL_ABILITY[x.skill] ?? 'wis'] }));
  // Passive Perception: 10 + Perception, or + Wisdom without the skill.
  const perception = (st: Dnd5eStats) => st.skills.find((x) => x.skill === 'perception')?.bonus ?? mod(st.abilities.wis);
  s.senses = { ...s.senses, passivePerception: base.senses.passivePerception + perception(s) - perception(base) };
  if (s.initiative !== undefined) s.initiative += dm.dex;

  // Size, speed, senses, resistances, subtype, languages.
  const size = [...tpls].reverse().find((t) => t.size)?.size;
  if (size) s.size = [size];
  const speed = tpls.filter((t) => t.speed).map((t) => t.speed!);
  if (speed.length) s.speed = { ...s.speed, walk: Math.min(s.speed.walk ?? 30, ...speed) };
  for (const t of tpls) for (const [k, v] of Object.entries(t.speeds ?? {}) as [SpeedKind, number][]) if (v > (s.speed[k] ?? 0)) s.speed = { ...s.speed, [k]: v };
  const dv = Math.max(0, ...tpls.map((t) => t.darkvision ?? 0));
  if (dv > (s.senses.darkvision ?? 0)) s.senses.darkvision = dv;
  for (const t of tpls) for (const x of t.immunities ?? []) if (!s.immunities.includes(x)) s.immunities.push(x);
  s.resistances = s.resistances.filter((x) => !s.immunities.includes(x));
  for (const t of tpls) for (const x of t.resistances ?? []) if (!s.resistances.includes(x) && !s.immunities.includes(x)) s.resistances.push(x);
  // The subtype — of a people (or a GM's template) given to a humanoid without one; languages — from any template.
  const people = peopleFits(base) ? tpls.find((t) => t.subtype) : undefined;
  if (people) {
    const sub = people.subtype![l];
    // A class in brackets stays: «Гуманоид (волшебник, дварф)».
    const keep = CLASS_SUBTYPES.includes(subtypeOf(base));
    s.type = /\(.*\)/.test(s.type) ? s.type.replace(/\((.*)\)/, (_m, x: string) => `(${keep ? `${x}, ${sub}` : sub})`) : `${s.type} (${sub})`;
  }
  for (const t of tpls) {
    const lang2 = t.language?.[l];
    if (lang2 && !s.languages.includes(lang2)) s.languages = s.languages ? `${s.languages}, ${lang2}` : lang2;
  }

  // Hit points: the formula's dice by size (a share for a child), Constitution on each die.
  const hf = /^(\d+)([dк])(\d+)/.exec((base.hpFormula ?? '').replace(/\s+/g, ''));
  if (hf) {
    const share = tpls.reduce((x, t) => x * (t.hitDice ?? 1), 1);
    const n = Math.max(1, Math.round(Number(hf[1]) * share));
    const die = size ? HIT_DIE[size] : Number(hf[3]);
    const k = n * mod(abilities.con);
    s.hpFormula = `${n}${hf[2]}${die}${k ? (k > 0 ? `+${k}` : `-${-k}`) : ''}`;
    s.hp = averageHp(s.hpFormula) ?? s.hp;
  }

  // AC: Dexterity as far as the armour lets it.
  const cap = armourDex(base);
  s.ac = base.ac - Math.min(mod(old.dex), cap) + Math.min(mod(abilities.dex), cap);

  // Blocks: weapon attacks follow their ability, save DCs — theirs; template traits and reactions are added.
  const swaps: [string, string][] = [];
  for (const list of LISTS) {
    s[list] = s[list].map((b, i) => {
      const key = `${list}:${i}`;
      const wp = r.weapons[key] ? weaponById(r.weapons[key]!) : undefined;
      if (wp) {
        const nb = weaponBlock(wp, s, l, edition);
        swaps.push([b.name, nb.name]);
        return nb;
      }
      let nb = b.attack || isAttackText(b.text) ? shiftAttack(b, dm[attackAbility(b, old)], l) : b;
      nb = { ...nb, text: shiftDcs(nb.text, base.pb, old, dm) };
      return nb;
    });
  }
  // The new weapon's name where the old one was named (multiattack, gear).
  for (const [from, to] of swaps) {
    const re = new RegExp(`(^|[^\\p{L}])${escapeRe(from)}(?=[^\\p{L}]|$)`, 'giu');
    for (const list of LISTS) s[list] = s[list].map((b) => ({ ...b, text: b.text.replace(re, (_m, pre: string) => `${pre}${to}`) }));
    if (s.gear) s.gear = s.gear.replace(re, (_m, pre: string) => `${pre}${/^\p{Lu}/u.test(from) ? to : to.toLowerCase()}`);
  }
  // Added weapons and things carried.
  const carried: string[] = [];
  for (const a of r.added ?? []) {
    const wp = weaponById(a.weapon);
    if (!wp) continue;
    if (a.attack) s.actions.push(weaponBlock(wp, s, l, edition));
    carried.push(wp.name[l]);
  }
  if (r.gear?.trim()) carried.push(r.gear.trim());
  if (carried.length) {
    const more = s.gear ? carried.map((x) => x.charAt(0).toLowerCase() + x.slice(1)) : carried;
    s.gear = [s.gear, ...more].filter(Boolean).join(', ');
  }
  const dc = 8 + s.pb + mod(abilities.con);
  for (const t of tpls) {
    for (const x of t.traits ?? []) if (!s.traits.some((b) => b.name === x.name[l])) s.traits.push({ name: x.name[l], text: x.text[l].replace('{dc}', String(dc)) });
    for (const x of t.actions ?? []) if (!s.actions.some((b) => b.name === x.name[l])) s.actions.push({ name: x.name[l], text: x.text[l].replace('{wis}', String(Math.max(0, mod(abilities.wis)))) });
    for (const x of t.reactions ?? []) if (!s.reactions.some((b) => b.name === x.name[l])) s.reactions.push({ name: x.name[l], text: x.text[l] });
  }

  // Spellcasting with its own numbers follows its ability.
  if (s.spellcasting) {
    const d = dm[s.spellcasting.ability];
    s.spellcasting = {
      ...s.spellcasting,
      ...(s.spellcasting.dc !== undefined ? { dc: s.spellcasting.dc + d } : {}),
      ...(s.spellcasting.attack !== undefined ? { attack: s.spellcasting.attack + d } : {}),
    };
  }
  return r.cr !== undefined && r.cr !== base.cr ? empower(s, r.cr, l) : s;
}

// ---------- Power by challenge rating ----------

// Typical numbers of a creature by CR: AC, hit points, attack bonus, damage of one hit, save DC. Our own table: the
// medians of the SRD 5.1 and 5.2.1 creatures, smoothed so that each grows with CR.
const BY_CR: Record<number, [ac: number, hp: number, atk: number, dmg: number, dc: number]> = {
  0: [11, 3, 2, 2, 10], 0.125: [12, 9, 3, 4, 11], 0.25: [12, 13, 4, 5, 11], 0.5: [12, 22, 4, 6, 11],
  1: [13, 28, 4, 7, 12], 2: [13, 45, 5, 9, 12], 3: [14, 60, 5, 10, 13], 4: [14, 80, 6, 12, 13],
  5: [15, 100, 7, 13, 14], 6: [15, 114, 7, 14, 14], 7: [16, 126, 7, 15, 15], 8: [16, 138, 8, 15, 15],
  9: [17, 155, 9, 16, 16], 10: [17, 175, 9, 17, 16], 11: [17, 190, 10, 18, 17], 12: [17, 200, 10, 18, 17],
  13: [18, 210, 10, 18, 18], 14: [18, 220, 11, 19, 18], 15: [18, 230, 11, 19, 18], 16: [19, 240, 12, 20, 19],
  17: [19, 256, 13, 21, 20], 18: [19, 265, 13, 21, 20], 19: [19, 275, 14, 22, 20], 20: [20, 330, 14, 23, 21],
  21: [21, 340, 15, 24, 22], 22: [21, 420, 15, 25, 22], 23: [22, 480, 16, 26, 23], 24: [22, 545, 17, 27, 24],
  25: [23, 580, 17, 28, 24], 26: [23, 620, 18, 30, 24], 27: [24, 650, 18, 32, 25], 28: [24, 670, 18, 34, 25],
  29: [25, 680, 19, 35, 25], 30: [25, 690, 19, 36, 26],
};
export const POWER_CRS = Object.keys(BY_CR).map(Number).sort((a, b) => a - b);
const row = (cr: number) => BY_CR[cr] ?? BY_CR[POWER_CRS.reduce((best, x) => (Math.abs(x - cr) < Math.abs(best - cr) ? x : best), 0)]!;

const DICE = [4, 6, 8, 10, 12];
// Dice for a new average: the same die with more or fewer of them, or a neighbouring die when that fits better.
function scaleDice(n: number, die: number, ratio: number): [number, number] {
  const target = (n * (die + 1) * ratio) / 2;
  let best: [number, number] = [n, die];
  let err = Infinity;
  for (const d of DICE.includes(die) ? DICE : [die]) {
    const m = Math.max(1, Math.round(target / ((d + 1) / 2)));
    const e = Math.abs((m * (d + 1)) / 2 - target) + (d === die ? 0 : 0.75);
    if (e < err) [best, err] = [[m, d], e];
  }
  return best;
}

// The stat block made as strong as a creature of another CR: proficiency by the rules; AC, hit points, attack
// bonuses, damage and DCs move as much as the typical numbers move between the two CRs.
export function empower(s0: Dnd5eStats, cr: number, lang: Lang): Dnd5eStats {
  const s: Dnd5eStats = structuredClone(s0);
  const [a0, h0, t0, d0, c0] = row(s0.cr);
  const [a1, h1, t1, d1, c1] = row(cr);
  const dPb = pbFor(cr) - s0.pb;
  const dAtk = t1 - t0;
  const dDc = c1 - c0;
  s.cr = cr;
  s.xp = xpFor(cr);
  s.pb = pbFor(cr);
  s.ac = Math.max(5, s0.ac + (a1 - a0));
  for (const a of ABILITIES) if (s.saves[a] !== undefined) s.saves[a] = s.saves[a]! + dPb;
  s.skills = s.skills.map((x) => ({ ...x, bonus: x.bonus + dPb }));
  if (s.skills.some((x) => x.skill === 'perception')) s.senses = { ...s.senses, passivePerception: s.senses.passivePerception + dPb };
  // Hit points: more or fewer hit dice; Constitution stays on each.
  const hf = /^(\d+)([dк])(\d+)/.exec((s0.hpFormula ?? '').replace(/\s+/g, ''));
  if (hf) {
    // As many hit points more as a typical creature of that CR has more (a ratio would blow up a tiny base).
    const dieAvg = (Number(hf[3]) + 1) / 2 + mod(s.abilities.con);
    const n = Math.max(1, Math.round((s0.hp + h1 - h0) / Math.max(1, dieAvg)));
    const k = n * mod(s.abilities.con);
    s.hpFormula = `${n}${hf[2]}${hf[3]}${k ? (k > 0 ? `+${k}` : `-${-k}`) : ''}`;
    s.hp = averageHp(s.hpFormula) ?? s.hp;
  } else s.hp = Math.max(1, s0.hp + h1 - h0);
  const minus = lang === 'en' ? '-' : '−';
  for (const list of LISTS) {
    s[list] = s[list].map((b) => {
      // The first damage of a block grows by as much as a typical hit does; the others in the same proportion.
      let ratio = 1;
      let first = true;
      let text = b.text.replace(DAMAGE, (_all, _avg: string, n: string, dch: string, die: string, sign?: string, k?: string) => {
        const kk = k ? num(`${sign}${k}`) : 0;
        if (first) {
          first = false;
          const now = (Number(n) * (Number(die) + 1)) / 2;
          ratio = Math.max(0.1, (now + d1 - d0) / now);
        }
        const [m, d] = scaleDice(Number(n), Number(die), ratio);
        return `${avgOf(m, d, kk)} (${m}${dch}${d}${kk ? ` ${kk > 0 ? '+' : minus} ${Math.abs(kk)}` : ''})`;
      });
      const attack = b.attack || isAttackText(b.text);
      if (attack) text = text.replace(TO_HIT, (_all, pre: string, n: string, post: string) => `${pre}${signedText(num(n) + dAtk, lang)}${post}`);
      text = text.replace(/(^|[^\p{L}])(DC|СЛ) (\d+)/gu, (_all, pre: string, word: string, n: string) => `${pre}${word} ${Number(n) + dDc}`);
      const atk = b.attack && {
        bonus: b.attack.bonus + dAtk,
        damage: b.attack.damage.map((x) => {
          const m = /^(\d+)([dк])(\d+)(.*)$/.exec(x.replace(/\s+/g, ''));
          if (!m) return x;
          const [n, d] = scaleDice(Number(m[1]), Number(m[3]), ratio);
          return `${n}${m[2]}${d}${m[4]}`;
        }),
      };
      return { ...b, text, ...(atk ? { attack: atk } : {}) };
    });
  }
  if (s.spellcasting) {
    s.spellcasting = {
      ...s.spellcasting,
      ...(s.spellcasting.dc !== undefined ? { dc: s.spellcasting.dc + dDc } : {}),
      ...(s.spellcasting.attack !== undefined ? { attack: s.spellcasting.attack + dAtk } : {}),
    };
  }
  return s;
}

// What changed, for the list beside the preview: the main numbers and attacks.
export interface Change {
  what: string;
  from: string;
  to: string;
}
export function changesOf(a: Dnd5eStats, b: Dnd5eStats, label: (key: string) => string, size: (s: Size) => string = (x) => x): Change[] {
  const out: Change[] = [];
  const push = (what: string, x: string | number, y: string | number) => String(x) !== String(y) && out.push({ what, from: String(x), to: String(y) });
  const crs = (c: number) => (c === 0.125 ? '1/8' : c === 0.25 ? '1/4' : c === 0.5 ? '1/2' : String(c));
  push(label('cr'), crs(a.cr), crs(b.cr));
  push(label('size'), a.size.map(size).join('/'), b.size.map(size).join('/'));
  push(label('ac'), a.ac, b.ac);
  push(label('hp'), `${a.hp} (${a.hpFormula ?? ''})`, `${b.hp} (${b.hpFormula ?? ''})`);
  push(label('speed'), a.speed.walk ?? 0, b.speed.walk ?? 0);
  for (const k of ABILITIES) push(label(k), a.abilities[k], b.abilities[k]);
  push(label('pp'), a.senses.passivePerception, b.senses.passivePerception);
  const atk = (s: Dnd5eStats) => LISTS.flatMap((l) => s[l]).filter((x) => x.attack).map((x) => `${x.name} ${signed(x.attack!.bonus)} (${x.attack!.damage.join(' / ')})`);
  const [x, y] = [atk(a), atk(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) push(label('attack'), x[i] ?? '—', y[i] ?? '—');
  return out;
}
