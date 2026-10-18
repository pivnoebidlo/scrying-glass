// Settlement generator: what the content of one language holds (content/<lang>.ts) and what a settlement is.
export const SIZES = ['hamlet', 'village', 'town', 'city'] as const;
export type Size = (typeof SIZES)[number];

export interface SettlementContent {
  // A settlement name (each language builds its own).
  name: (r: () => number) => string;
  governments: Record<Size, string[]>;
  defenses: Record<Size, string[]>;
  impressions: Record<Size, string[]>;
  knownFor: string[];
  // {person} — the first notable person's name.
  troubles: string[];
  // Places of a village and of a town (a town and a city get both); the tavern comes first, «{name}».
  smallPlaces: string[];
  bigPlaces: string[];
  tavern: string;
}

export interface Person {
  name: string;
  race: string;
  gender: 'male' | 'female';
  occupation: string;
  trait: string;
}

export interface Settlement {
  size: Size;
  name: string;
  population: number;
  // Races of the people, the main one first.
  races: string[];
  government: string;
  defense: string;
  impression: string;
  knownFor: string[];
  trouble: string;
  tavern: string;
  places: string[];
  people: Person[];
}

export const SETTLEMENT_PARTS = ['name', 'overview', 'knownFor', 'trouble', 'places', 'people'] as const;
export type SettlementPart = (typeof SETTLEMENT_PARTS)[number];
