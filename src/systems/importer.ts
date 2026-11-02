// A system's importer of characters from another service (D&D: Long Story Short): it knows its export files and
// turns one into a card. The core does the rest (main/cards.ts): finds the card it updates — by the importer's key
// in `links` or by the name in that folder —, updates it (the old one to the trash) or makes a new one. Pure: the
// core reads it through the plugins (systems/plugins.ts).

// What came in an export: a player's character.
export interface ImportedCard {
  name: string;
  system: string;
  // The language of the card (none — Russian: LSS).
  lang?: string;
  stats: unknown;
  // The character's id in that service (`links[importer.id]` of the card): an import again updates the card.
  linkId: string | null;
  avatarUrl: string | null;
  // What could not be brought (LSS: spells kept as cards).
  warnings: string[];
}

export interface CardImporter {
  // The key in a card's `links` ('lss').
  id: string;
  // The service («Long Story Short»), its short name on buttons («LSS»), the file dialog's title and its filter.
  readonly title: string;
  readonly short: string;
  readonly fileTitle: string;
  readonly filter: string;
  detect(json: unknown): boolean;
  // table — the importer's data from the library (below), {} when none.
  read(json: unknown, table: Record<string, unknown>): ImportedCard;
  // The character's page in the service.
  url?(linkId: string): string;
  // Data the GM gathers for the importer (LSS: spell numbers → names): a file of the library, filled from files the
  // GM picks — collect finds what it needs in any JSON (nothing — null).
  table?: { file: string; readonly title: string; collect(json: unknown): Record<string, unknown> | null };
  // The GM's account in the service (LSS): the core signs in on the service's own page in a window with a saved
  // session of its own (main/accounts.ts) and then asks the service's API with the token — the table fills itself.
  account?: ImporterAccount;
}

export interface ImporterAccount {
  // The page to sign in on; the address its cookies belong to.
  login: string;
  cookieUrl: string;
  // The token from the session's cookies (null — not signed in).
  token(cookies: { name: string; value: string }[]): string | null;
  // Who is signed in: the address and the name from its answer.
  user?: { url: string; name(json: unknown): string | null };
  // Requests that bring what an export needs and the table lacks (answers go through table.collect).
  wanted?(json: unknown, table: Record<string, unknown>): string[];
  // Requests that bring the whole table (LSS: the Grimoire of both editions).
  everything?: string[];
}

// The GM's account as the window sees it: who, until when the token lives (ms; none — unknown).
export interface AccountStatus {
  signedIn: boolean;
  name?: string | null;
  until?: number;
}
