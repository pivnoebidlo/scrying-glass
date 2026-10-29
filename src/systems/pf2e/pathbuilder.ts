// Pathbuilder 2e as Pathfinder's importer of characters: its JSON export («Export JSON» — a file, or the page
// pathbuilder2e.com/json.php?id=<code> saved) → a character sheet. Pathbuilder gives attribute scores and proficiency
// bonuses (0, 2, 4, 6, 8 without the level); the totals are counted by the rules: proficiency + level (if trained) +
// the attribute modifier. Pure: the core reads it through the plugin.
import type { CardImporter } from '../importer';
import { t } from '../../shared/i18n';
import { ABILITIES, SIZES, type Ability, type Spellcasting, type Strike } from './stats';
import type { Pf2eCharacter } from './character';

type Build = {
  name?: string; class?: string; level?: number; ancestry?: string; heritage?: string; background?: string; keyability?: string;
  size?: number; languages?: string[]; abilities?: Record<string, unknown>; attributes?: Record<string, number>;
  proficiencies?: Record<string, number>; lores?: [string, number][]; feats?: unknown[][]; equipment?: unknown[][];
  weapons?: { display?: string; name?: string; attack?: number; die?: string; damageBonus?: number; damageType?: string; extraDamage?: string[]; prof?: string; runes?: string[]; str?: string }[];
  armor?: { display?: string; name?: string; worn?: boolean }[];
  money?: Record<string, number>; acTotal?: { acTotal?: number };
  spellCasters?: { name?: string; magicTradition?: string; spellcastingType?: string; ability?: string; proficiency?: number; perDay?: number[]; spells?: { spellLevel: number; list: string[] }[]; innate?: boolean }[];
  focus?: Record<string, Record<string, { focusSpells?: string[]; focusCantrips?: string[]; proficiency?: number; abilityBonus?: number }>>;
};

const buildOf = (j: unknown): Build | null => {
  const o = j && typeof j === 'object' ? (j as { build?: unknown }) : null;
  const b = o?.build as Build | undefined;
  return b && typeof b === 'object' && typeof b.class === 'string' && !!b.abilities && !!b.proficiencies ? b : null;
};

const SKILLS: [string, Ability][] = [
  ['acrobatics', 'dex'], ['arcana', 'int'], ['athletics', 'str'], ['crafting', 'int'], ['deception', 'cha'], ['diplomacy', 'cha'],
  ['intimidation', 'cha'], ['medicine', 'wis'], ['nature', 'wis'], ['occultism', 'int'], ['performance', 'cha'], ['religion', 'wis'],
  ['society', 'int'], ['stealth', 'dex'], ['survival', 'wis'], ['thievery', 'dex'],
];
const DAMAGE: Record<string, string> = { B: 'bludgeoning', P: 'piercing', S: 'slashing' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function fromPathbuilder(j: unknown): Pf2eCharacter {
  const b = buildOf(j);
  if (!b) throw new Error(t('pf2e.pb.notExport'));
  const level = b.level ?? 1;
  const score = (a: Ability) => Number(b.abilities?.[a] ?? 10);
  const abilities = Object.fromEntries(ABILITIES.map((a) => [a, Math.floor((score(a) - 10) / 2)])) as Record<Ability, number>;
  const prof = (k: string) => b.proficiencies?.[k] ?? 0;
  const total = (p: number, a: Ability) => (p > 0 ? p + level : 0) + abilities[a];
  const attrs = b.attributes ?? {};
  const hp = (attrs['ancestryhp'] ?? 0) + (attrs['bonushp'] ?? 0) + ((attrs['classhp'] ?? 0) + abilities.con + (attrs['bonushpPerLevel'] ?? 0)) * level;
  const key = (ABILITIES as readonly string[]).includes(b.keyability ?? '') ? (b.keyability as Ability) : 'str';

  const skills = [
    ...SKILLS.map(([k, a]) => ({ name: cap(k), mod: total(prof(k), a), rank: prof(k) / 2 })),
    ...(b.lores ?? []).map(([name, p]) => ({ name: `${name} Lore`, mod: total(p, 'int'), rank: p / 2 })),
  ];
  const strikes: Strike[] = (b.weapons ?? []).map((w) => {
    const count = 1 + (w.str === 'striking' ? 1 : w.str === 'greaterStriking' ? 2 : w.str === 'majorStriking' ? 3 : 0);
    // «d1» (a blowgun) — just 1 a die.
    const dice = /^d\d+$/.test(w.die ?? '') ? (w.die === 'd1' ? String(count) : `${count}${w.die}`) : '';
    const bonus = w.damageBonus ?? 0;
    const formula = dice ? `${dice}${bonus ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''}` : '';
    return {
      name: w.display || w.name || '',
      ranged: /bow|sling|blowgun|dart|javelin|firearm|pistol|musket|arquebus/i.test(w.name ?? ''),
      bonus: w.attack ?? 0,
      traits: [],
      damage: [formula ? `{${formula}}` : '', DAMAGE[w.damageType ?? ''] ?? w.damageType ?? ''].filter(Boolean).join(' ') + (w.extraDamage?.length ? ` plus ${w.extraDamage.join(', ')}` : ''),
      effects: [],
    };
  });
  const spellcasting: Spellcasting[] = (b.spellCasters ?? []).map((c) => {
    const a = (ABILITIES as readonly string[]).includes(c.ability ?? '') ? (c.ability as Ability) : key;
    const p = c.proficiency ?? 0;
    const atk = (p > 0 ? p + level : 0) + abilities[a];
    return {
      name: `${c.name ?? ''} ${c.innate ? 'Innate' : cap(c.spellcastingType ?? '')} Spells`.replace(/\s+/g, ' ').trim(),
      dc: 10 + atk,
      attack: atk,
      ranks: (c.spells ?? [])
        .filter((s) => s.list.length)
        .sort((x, y) => y.spellLevel - x.spellLevel)
        .map((s) => ({ rank: s.spellLevel, ...(c.perDay?.[s.spellLevel] && s.spellLevel > 0 ? { slots: c.perDay[s.spellLevel] } : {}), spells: s.list })),
    };
  });
  // Focus spells: by tradition and attribute.
  for (const [tradition, byAttr] of Object.entries(b.focus ?? {})) {
    for (const [attr, f] of Object.entries(byAttr)) {
      const spells = [...(f.focusCantrips ?? []), ...(f.focusSpells ?? [])];
      if (!spells.length) continue;
      const a = (ABILITIES as readonly string[]).includes(attr) ? (attr as Ability) : key;
      const atk = ((f.proficiency ?? 0) > 0 ? (f.proficiency ?? 0) + level : 0) + abilities[a];
      spellcasting.push({ name: `${cap(tradition)} Focus Spells`, dc: 10 + atk, attack: atk, ranks: [{ rank: Math.max(1, Math.ceil(level / 2)), spells }] });
    }
  }
  const money = b.money ?? {};
  return {
    sheet: 'pf2e-character',
    level,
    ancestry: b.ancestry ?? '',
    heritage: b.heritage ?? '',
    background: b.background ?? '',
    class: b.class ?? '',
    keyAttribute: key,
    size: SIZES[b.size ?? 2] ?? 'med',
    languages: b.languages ?? [],
    abilities,
    hp,
    ac: b.acTotal?.acTotal ?? 10,
    perception: total(prof('perception'), 'wis'),
    saves: { fort: total(prof('fortitude'), 'con'), ref: total(prof('reflex'), 'dex'), will: total(prof('will'), 'wis') },
    classDC: 10 + total(prof('classDC'), key),
    speed: (attrs['speed'] ?? 25) + (attrs['speedBonus'] ?? 0),
    skills,
    strikes,
    spellcasting,
    feats: (b.feats ?? []).filter((f) => typeof f[0] === 'string').map((f) => ({ name: String(f[0]), type: String(f[2] ?? ''), level: Number(f[3] ?? 1) })),
    equipment: [
      ...(b.armor ?? []).map((a) => a.display || a.name || ''),
      ...(b.equipment ?? []).map((e) => `${e[0]}${Number(e[1]) > 1 ? ` ×${e[1]}` : ''}`),
    ].filter(Boolean),
    money: { pp: money['pp'] ?? 0, gp: money['gp'] ?? 0, sp: money['sp'] ?? 0, cp: money['cp'] ?? 0 },
  };
}

export const pathbuilderImporter: CardImporter = {
  id: 'pathbuilder',
  title: 'Pathbuilder 2e',
  short: 'Pathbuilder',
  get fileTitle() {
    return t('pf2e.pb.fileTitle');
  },
  get filter() {
    return t('pf2e.pb.filter');
  },
  detect: (j) => buildOf(j) !== null,
  read(j) {
    const stats = fromPathbuilder(j);
    const id = (j as { pathbuilderId?: unknown }).pathbuilderId;
    return { name: buildOf(j)!.name || t('pf2e.pb.unnamed'), system: 'pf2e', lang: 'en', stats, linkId: typeof id === 'string' || typeof id === 'number' ? String(id) : null, avatarUrl: null, warnings: [] };
  },
};
