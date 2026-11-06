// Cards of systems that were code and became packs: their stats are read into the pack's shape (a flat object by the
// pack's field keys). Forged in the Dark (code until 0.64): `actions` by name, stress as a number, trauma keys, five
// harm lines, armor as a flag, abilities and items as lists. The core does it when it reads a card; the file is
// rewritten in the new shape the next time the card is saved.
import type { Card } from './cards';

const TRAUMAS: Record<string, { en: string; ru: string }> = {
  cold: { en: 'Cold', ru: 'Холодный' },
  haunted: { en: 'Haunted', ru: 'Преследуемый' },
  obsessed: { en: 'Obsessed', ru: 'Одержимый' },
  paranoid: { en: 'Paranoid', ru: 'Параноик' },
  reckless: { en: 'Reckless', ru: 'Безрассудный' },
  soft: { en: 'Soft', ru: 'Мягкий' },
  unstable: { en: 'Unstable', ru: 'Неуравновешенный' },
  vicious: { en: 'Vicious', ru: 'Жестокий' },
};

interface OldFitd {
  playbook?: string;
  heritage?: string;
  background?: string;
  vice?: string;
  actions: Record<string, number>;
  stress?: number;
  traumas?: string[];
  harm: string[];
  armor?: boolean;
  abilities?: { name: string; text: string }[];
  items?: string[];
  tier?: number;
  coin?: number;
  stash?: number;
  xp?: number;
}

const isOldFitd = (s: unknown): s is OldFitd =>
  !!s && typeof s === 'object' && typeof (s as OldFitd).actions === 'object' && (s as OldFitd).actions !== null && Array.isArray((s as OldFitd).harm);

function fitdStats(s: OldFitd, lang: string): Record<string, unknown> {
  const out: Record<string, unknown> = {
    playbook: s.playbook ?? '',
    heritage: s.heritage ?? '',
    background: s.background ?? '',
    vice: s.vice ?? '',
    tier: s.tier ?? 0,
    stress: s.stress ?? 0,
    armor: s.armor ? 1 : 0,
    traumas: (s.traumas ?? []).map((k) => TRAUMAS[k]?.[lang === 'ru' ? 'ru' : 'en'] ?? k),
    abilities: (s.abilities ?? []).map((a) => ({ name: a.name, text: a.text })),
    items: s.items ?? [],
    coin: s.coin ?? 0,
    stash: s.stash ?? 0,
    xp: s.xp ?? 0,
  };
  for (const [a, n] of Object.entries(s.actions)) out[a] = n;
  s.harm.slice(0, 5).forEach((h, i) => (out[`harm${i + 1}`] = h));
  return out;
}

// Pathfinder 2e (code until 0.89): the pack's fields are added beside the old ones, nothing is taken away, so an older
// app still reads the same card with its own code.
const PF_WORDS = {
  en: { creature: 'Creature', melee: 'Melee', ranged: 'Ranged', plus: 'plus', dc: 'DC', attack: 'attack', constant: 'Constant', cantrips: 'Cantrips', rank: (n: number) => `Rank ${n}`, slots: (n: number) => `${n} slots`, size: { tiny: 'Tiny', sm: 'Small', med: 'Medium', lg: 'Large', huge: 'Huge', grg: 'Gargantuan' } as Record<string, string> },
  ru: { creature: 'Существо', melee: 'Ближний бой', ranged: 'Дальний бой', plus: 'плюс', dc: 'КС', attack: 'атака', constant: 'Постоянные', cantrips: 'Чары', rank: (n: number) => `Ранг ${n}`, slots: (n: number) => `ячеек: ${n}`, size: { tiny: 'Крошечный', sm: 'Маленький', med: 'Средний', lg: 'Большой', huge: 'Огромный', grg: 'Гигантский' } as Record<string, string> },
};
const PF_ACT: Record<string, string> = { '1': '◆', '2': '◆◆', '3': '◆◆◆', reaction: '⟲', free: '◇' };
const PF_RANKS = ['U', 'T', 'E', 'M', 'L'];
type PfRow = Record<string, unknown>;
const list = <T = PfRow>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
const isOldPf = (s: unknown): s is Record<string, any> => !!s && typeof s === 'object' && !('fort' in s) && typeof (s as { saves?: unknown }).saves === 'object';

export function pf2eFields(s: Record<string, any>, lang: string): Record<string, unknown> {
  const w = PF_WORDS[lang === 'ru' ? 'ru' : 'en'];
  const hero = s['sheet'] === 'pf2e-character';
  const features = (rows: unknown) => list(rows).map((f) => ({ ...f, act: PF_ACT[String(f['actions'])] ?? '', text: String(f['text'] ?? '').replace(/ --- /g, '\n\n---\n\n') }));
  const spells = list<any>(s['spellcasting']).map((sc) => {
    const head = `**${sc.name}** ${w.dc} ${sc.dc}${sc.attack !== null && sc.attack !== undefined ? `, ${w.attack} {1d20${sc.attack < 0 ? '' : '+'}${sc.attack}}` : ''}`;
    const ranks = list<any>(sc.ranks).map((r) => `**${r.constant ? `${w.constant} (${w.rank(r.rank)})` : r.rank === 0 ? w.cantrips : w.rank(r.rank)}**${r.slots ? ` (${w.slots(r.slots)})` : ''} ${list<string>(r.spells).map((x) => `[[${x}]]`).join(', ')}`);
    return `${head}; ${ranks.join('; ')}`;
  });
  const levels = [...new Set(list<any>(s['feats']).map((f) => f.level))].sort((a, b) => a - b);
  return {
    ...s,
    ...(hero ? {} : { class: w.creature }),
    ...(s['hpNote'] ? { hp_note: s['hpNote'] } : {}),
    class_dc: s['classDC'] ?? 0,
    badges: hero ? [] : [...(s['rarity'] && s['rarity'] !== 'common' ? [s['rarity']] : []), w.size[s['size']] ?? s['size'], ...list<string>(s['traits'])],
    ...Object.fromEntries(['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => [k, s['abilities']?.[k] ?? 0])),
    fort: s['saves']?.fort ?? 0,
    ref: s['saves']?.ref ?? 0,
    will: s['saves']?.will ?? 0,
    ...(s['saves']?.note ? { save_note: s['saves'].note } : {}),
    skills: list(s['skills']).map((x) => (typeof x['rank'] === 'number' ? { ...x, prof: PF_RANKS[x['rank']] ?? '' } : x)),
    strikes: list<any>(s['strikes']).map((x) => ({ ...x, kind: x.ranged ? w.ranged : w.melee, act: '◆', map: list<string>(x.traits).includes('agile') ? 4 : 5, plus: list(x.effects).length ? `${w.plus} ${list(x.effects).join(', ')}` : '' })),
    interaction: features(s['interaction']),
    defensive: features(s['defensive']),
    offensive: features(s['offensive']),
    spell_text: spells.join('\n\n'),
    ...(hero
      ? {
          feat_text: levels.map((l) => `**${l}** ${list<any>(s['feats']).filter((f) => f.level === l).map((f) => `[[${f.name}]]`).join(', ')}`).join('\n\n'),
          pp: s['money']?.pp ?? 0,
          gp: s['money']?.gp ?? 0,
          sp: s['money']?.sp ?? 0,
          cp: s['money']?.cp ?? 0,
        }
      : {}),
  };
}

export function upgradeCard<C extends Card>(c: C): C {
  if (c.system === 'fitd' && isOldFitd(c.stats)) return { ...c, stats: fitdStats(c.stats, c.lang) };
  if (c.system === 'pf2e' && isOldPf(c.stats)) return { ...c, stats: pf2eFields(c.stats, c.lang) };
  return c;
}
