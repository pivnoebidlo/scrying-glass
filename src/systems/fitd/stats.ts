// Forged in the Dark (the Blades in the Dark SRD, CC BY 3.0): one card for the players' scoundrels and for NPCs.
// Twelve actions rated 0–4 under three attributes, stress 0–9, traumas, harm in three levels, special abilities.
import type { CardKind, CombatStats } from '../../shared/cards';
import { labels } from '../../shared/i18n';

export const ATTRIBUTES = ['insight', 'prowess', 'resolve'] as const;
export type FitdAttribute = (typeof ATTRIBUTES)[number];
export const ACTIONS: Record<FitdAttribute, readonly string[]> = {
  insight: ['hunt', 'study', 'survey', 'tinker'],
  prowess: ['finesse', 'prowl', 'skirmish', 'wreck'],
  resolve: ['attune', 'command', 'consort', 'sway'],
};
export type FitdAction = string;
export const ALL_ACTIONS = ATTRIBUTES.flatMap((a) => ACTIONS[a]);

export const ATTRIBUTE_TITLES = labels([...ATTRIBUTES], 'fitd.attr');
export const ACTION_TITLES = labels(ALL_ACTIONS, 'fitd.action');

export const TRAUMAS = ['cold', 'haunted', 'obsessed', 'paranoid', 'reckless', 'soft', 'unstable', 'vicious'] as const;
export const TRAUMA_TITLES: Record<string, string> = labels([...TRAUMAS], 'fitd.trauma');

export const MAX_DOTS = 4;
export const MAX_STRESS = 9;
export const MAX_TRAUMA = 4;
// Harm: two lesser (−1d… or less effect), two moderate (−1d), one severe (needs help); fatal is beyond.
export const HARM_LEVELS = [1, 1, 2, 2, 3];
export const HARM_TITLES: Record<number, string> = labels([1, 2, 3], 'fitd.harm');

export interface FitdAbility {
  name: string;
  text: string;
}

export interface FitdStats {
  // Playbook (a character's role) or what an NPC is: "Cutter", "Bluecoat lieutenant".
  playbook: string;
  heritage: string;
  background: string;
  vice: string;
  actions: Record<string, number>;
  stress: number;
  traumas: string[];
  // Five harm lines (see HARM_LEVELS), empty — none.
  harm: string[];
  armor: boolean;
  abilities: FitdAbility[];
  items: string[];
  // NPCs: quality (tier) 0–5, the drive and what they want. Characters leave it at 0.
  tier: number;
  coin: number;
  stash: number;
  xp: number;
}

export function blankStats(kind?: CardKind): FitdStats {
  return {
    playbook: '',
    heritage: '',
    background: '',
    vice: '',
    actions: Object.fromEntries(ALL_ACTIONS.map((a) => [a, 0])),
    stress: 0,
    traumas: [],
    harm: ['', '', '', '', ''],
    armor: false,
    abilities: [],
    items: [],
    tier: kind === 'character' ? 0 : 1,
    coin: 0,
    stash: 0,
    xp: 0,
  };
}

export const isFitd = (s: unknown): s is FitdStats =>
  !!s && typeof s === 'object' && typeof (s as FitdStats).actions === 'object' && Array.isArray((s as FitdStats).harm) && 'stress' in (s as object);

export const dots = (s: FitdStats, action: string) => Math.max(0, Math.min(MAX_DOTS, s.actions[action] ?? 0));

// An attribute's rating: how many of its actions have at least one dot.
export const attributeRating = (s: FitdStats, attr: FitdAttribute) => ACTIONS[attr].filter((a) => dots(s, a) > 0).length;

export const subtitle = (s: FitdStats) => [s.playbook, s.heritage].filter(Boolean).join(', ');

// For sorting: the tier of an NPC, otherwise the total of the action dots.
export const rank = (s: FitdStats) => (s.tier ? s.tier : ALL_ACTIONS.reduce((n, a) => n + dots(s, a), 0));

// In the tracker: the stress line and the harm lines (no hit points or order).
export const combatStats = (s: FitdStats): CombatStats => ({
  hp: null,
  ac: null,
  initiative: 0,
  stress: [{ id: 'stress', boxes: MAX_STRESS }],
  consequences: HARM_LEVELS,
});
