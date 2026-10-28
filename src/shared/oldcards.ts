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

export function upgradeCard<C extends Card>(c: C): C {
  if (c.system === 'fitd' && isOldFitd(c.stats)) return { ...c, stats: fitdStats(c.stats, c.lang) };
  return c;
}
