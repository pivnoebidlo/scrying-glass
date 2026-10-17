// Tavern generator: what the content of one language holds (content/<lang>.ts) and what a generated tavern is.
// The content is written for the app; prices follow the SRD "Food, Drink, and Lodging" table.

export const TAVERN_TYPES = ['tavern', 'inn', 'roadside', 'harbor', 'den', 'winehouse'] as const;
export type TavernType = (typeof TAVERN_TYPES)[number];
// D&D lifestyles: the price level of the place.
export const WEALTH = ['squalid', 'poor', 'modest', 'comfortable', 'wealthy', 'aristocratic'] as const;
export type Wealth = (typeof WEALTH)[number];
export type Crowd = 'quiet' | 'usual' | 'packed';
export type Lodging = 'auto' | 'yes' | 'no';
export type Wonders = 'none' | 'rare' | 'often';

export type NounGender = 'm' | 'f' | 'n';
// A word that agrees with a noun's gender (Russian adjectives); in English all three are the same.
export type Agreeing = Record<NounGender, string>;
// A word in both genders of a person (Russian «трактирщик» / «трактирщица»).
export type Gendered = { male: string; female: string };

export interface TavernContent {
  // Name: «{adjective} {noun}» or «{noun} and {noun2}» ({Noun} — with a capital letter); the sign shows the noun.
  name: { adjectiveNoun: string; nounAndNoun: string };
  adjectives: Agreeing[];
  nouns: { word: string; gender: NounGender; sign: string }[];
  signStates: string[];
  // Read-aloud description: outside (by type), inside, smell, sound (by crowd), a wonder.
  exterior: Record<TavernType, string[]>;
  interior: string[];
  smell: string[];
  sound: Record<Crowd, string[]>;
  wonders: string[];
  // People. Traits, catchphrases and doings are written so that they fit any gender.
  traits: string[];
  catchphrases: string[];
  ownerSecrets: string[];
  ownerTitle: Gendered;
  staff: Gendered[];
  occupations: Gendered[];
  doings: string[];
  patronSecrets: string[];
  // Menu: base price in copper at a modest place; an item appears from its wealth level up.
  drinks: MenuItem[];
  food: MenuItem[];
  // Rooms by lifestyle (the SRD lodging price per day).
  rooms: Record<Wealth, string>;
  services: string[];
  // Placeholders: {owner}, {staff}, {patron}, {patron2} — names of this tavern's people.
  events: string[];
  rumors: string[];
  requests: string[];
  secrets: string[];
  // Coins: «{n} cp».
  coins: { gp: string; sp: string; cp: string };
}

export interface MenuItem {
  name: string;
  price: number;
  from: Wealth;
}

export interface Person {
  name: string;
  race: string;
  gender: 'male' | 'female';
  // Role: trade of a patron, position of a staff member, «owner».
  role: string;
  trait?: string;
  catchphrase?: string;
  doing?: string;
  secret?: string;
}

export interface Tavern {
  type: TavernType;
  wealth: Wealth;
  name: string;
  sign: string;
  intro: string;
  wonder?: string;
  owner: Person;
  staff: Person[];
  patrons: Person[];
  menu: { name: string; price: string; kind: 'drink' | 'food' }[];
  rooms: { name: string; price: string }[];
  services: string[];
  // An index into the event templates: the text takes the names of the current people.
  event: number;
  rumors: string[];
  request: number;
  secret: string;
}

// Parts that can be rerolled or pinned one by one.
export const TAVERN_PARTS = ['name', 'intro', 'owner', 'staff', 'patrons', 'menu', 'rooms', 'event', 'rumors', 'request', 'secret'] as const;
export type TavernPart = (typeof TAVERN_PARTS)[number];

export interface TavernOptions {
  type: TavernType;
  wealth: Wealth;
  crowd: Crowd;
  lodging: Lodging;
  wonders: Wonders;
}
