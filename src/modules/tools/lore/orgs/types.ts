// Guild and cult generator: what the content of one language holds. Trades and entities pair across languages by
// index (each brings its own names, goals, rites); the other lists are picked on their own.
export const ORG_KINDS = ['guild', 'cult'] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export interface Trade {
  trade: string;
  names: string[];
  goals: string[];
  offers: string[];
}
export interface Entity {
  entity: string;
  names: string[];
  rites: string[];
}
export interface OrgContent {
  trades: Trade[];
  entities: Entity[];
  leaderTitle: { guild: string; cult: string };
  seats: string[];
  customs: string[];
  rivals: string[];
  guildSecrets: string[];
  signs: string[];
  fronts: string[];
  members: string[];
  cultGoals: string[];
  cultSecrets: string[];
  omens: string[];
}
export const GUILD_PARTS = ['what', 'leader', 'seat', 'goal', 'custom', 'rival', 'secret', 'sign', 'offer'] as const;
export const CULT_PARTS = ['what', 'leader', 'front', 'rite', 'sign', 'members', 'goal', 'secret', 'omens'] as const;
