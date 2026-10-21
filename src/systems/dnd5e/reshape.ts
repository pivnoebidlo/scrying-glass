// Reshaping a D&D stat block (Tools → Reshape a stat block): a base creature plus templates (age, build, people),
// ability changes and other weapons. Pure functions: the numbers that follow the abilities are recounted — saves,
// skills, passive Perception, initiative, hit points, AC by the armour worn, attack rolls, damage and save DCs in the
// texts of SRD blocks (2014 and 2024, English and Russian). Texts are not rewritten; a number not recognised stays.
import { ABILITIES, averageHp, mod, signed, type Ability, type Block, type Dnd5eStats, type Size, SKILL_ABILITY } from './stats';

type Lang = 'en' | 'ru';
const L = (lang: string): Lang => (lang === 'ru' ? 'ru' : 'en');
type Text = Record<Lang, string>;

// ---------- Templates ----------

export interface Template {
  id: string;
  group: 'age' | 'build' | 'people';
  name: Text;
  abilities?: Partial<Record<Ability, number>>;
  size?: Size;
  // Walking speed (feet).
  speed?: number;
  darkvision?: number;
  resistances?: string[];
  // Hit dice: a share of the base number (a child has half).
  hitDice?: number;
  // Proficiency in saves (added if missing).
  saves?: Ability[];
  skills?: string[];
  traits?: { name: Text; text: Text }[];
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
  {
    id: 'brute', group: 'build', name: tr('Brawny', 'Здоровяк'), abilities: { str: 2, con: 2 }, saves: ['str'], skills: ['athletics'],
  },
  {
    id: 'frail', group: 'build', name: tr('Frail', 'Хилый'), abilities: { str: -2, con: -2 },
  },
  {
    id: 'leader', group: 'build', name: tr('Leader', 'Главарь'), abilities: { cha: 2, int: 1 }, skills: ['intimidation'],
    reactions: [{
      name: tr('Parry', 'Парирование'),
      text: tr(
        'The creature adds 2 to its AC against one melee attack that would hit it. To do so, it must see the attacker and be wielding a melee weapon.',
        'Существо добавляет 2 к КД против одной рукопашной атаки, которая попала бы по нему. Для этого оно должно видеть атакующего и держать рукопашное оружие.',
      ),
    }],
  },
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

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);

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
export function reshape(base: Dnd5eStats, r: Reshape, lang: string, edition: '2014' | '2024'): Dnd5eStats {
  const l = L(lang);
  const tpls = r.templates.map(templateById).filter((x): x is Template => !!x);
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
  const dv = Math.max(0, ...tpls.map((t) => t.darkvision ?? 0));
  if (dv > (s.senses.darkvision ?? 0)) s.senses.darkvision = dv;
  for (const t of tpls) for (const x of t.resistances ?? []) if (!s.resistances.includes(x) && !s.immunities.includes(x)) s.resistances.push(x);
  const people = tpls.find((t) => t.subtype);
  if (people) {
    const sub = people.subtype![l];
    s.type = /\(.*\)/.test(s.type) ? s.type.replace(/\(.*\)/, `(${sub})`) : `${s.type} (${sub})`;
    const lang2 = people.language![l];
    if (!s.languages.includes(lang2)) s.languages = s.languages ? `${s.languages}, ${lang2}` : lang2;
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
  const dc = 8 + s.pb + mod(abilities.con);
  for (const t of tpls) {
    for (const x of t.traits ?? []) if (!s.traits.some((b) => b.name === x.name[l])) s.traits.push({ name: x.name[l], text: x.text[l].replace('{dc}', String(dc)) });
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
