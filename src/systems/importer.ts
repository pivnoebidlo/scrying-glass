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
}
