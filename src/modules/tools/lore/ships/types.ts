// Ship generator: what the content of one language holds. Kinds pair across languages by index; the other lists are
// picked on their own.
export interface ShipKind {
  name: string;
  about: string;
  crew: [number, number];
}
export interface ShipContent {
  kinds: ShipKind[];
  // A name: an adjective agreeing with the noun («Чёрная Вдова»); English has one form. «The» is added by `nameOf`.
  adjectives: { m: string; f: string; n: string }[];
  nouns: { word: string; g: 'm' | 'f' | 'n' }[];
  nameOf(adjective: string, noun: string): string;
  captainTitle: string;
  moods: string[];
  cargo: string[];
  quirks: string[];
  secrets: string[];
  troubles: string[];
}
export const SHIP_PARTS = ['kind', 'name', 'captain', 'crew', 'cargo', 'quirk', 'secret', 'trouble'] as const;
