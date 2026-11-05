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
  // The importer's data (LSS: spell numbers → names): a file of the library, filled by the GM's account (below) —
  // collect finds what it needs in the service's answers (nothing — null).
  // aliases — the service's own names of compendium entries → the name to find them by.
  table?: { file: string; collect(json: unknown): Record<string, unknown> | null; aliases?(table: Record<string, unknown>): Record<string, string> };
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
  // Characters straight from the account, without an export file: the GM's own ones and a player's by a link.
  characters?: AccountCharacters;
}

export interface AccountCharacters {
  // The GM's characters (one request) and one character by its id.
  list: string;
  item(id: string): string;
  // The id in a link to the character's page (or the bare id); null — not a link of this service.
  idOf(link: string): string | null;
  // An example link for the field's placeholder.
  example: string;
  // The rows of the list's answer; `raw` — the character as the API gave it.
  rows(json: unknown): (AccountCharacter & { raw: unknown })[];
  // A character from the API as an export file `detect` / `read` know; null — not a character.
  asExport(json: unknown): unknown;
}

// A row of the GM's list in the import window. `card` — the GM has a card of this character already.
export interface AccountCharacter {
  id: string;
  name: string;
  subtitle: string;
  card?: boolean;
}

// The GM's account as the window sees it: who, until when the token lives (ms; none — unknown).
export interface AccountStatus {
  signedIn: boolean;
  name?: string | null;
  until?: number;
}
