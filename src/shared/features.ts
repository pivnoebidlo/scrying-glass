// What the core can do for a game beyond the sheet: blocks of the right panel, layers of the players' screen, tools.
// A system lists the ones it uses (`uses`), so nothing in the core asks which game this is. A new feature of the core
// is one line here: the builder offers it to every system, marked as new for a pack saved in an older format
// (`since` > the pack's format), and the GM turns it on and republishes, without remaking the system.
// No imports: the pure core of the format.

export interface FeatureDef {
  // A tool of Tools with the same id belongs to the feature.
  id: string;
  // The pack format it appeared in.
  since: number;
}

export const FEATURES: FeatureDef[] = [
  { id: 'worldtime', since: 2 },
  { id: 'clocks', since: 2 },
  { id: 'aspects', since: 2 },
  { id: 'crew', since: 2 },
  { id: 'exploration', since: 2 },
  { id: 'factions', since: 2 },
  { id: 'names', since: 7 },
  { id: 'npc', since: 7 },
  { id: 'tavern', since: 7 },
  { id: 'settlement', since: 7 },
  { id: 'hooks', since: 7 },
];

// What the builder offers.
export const offeredFeatures = () => FEATURES;

// Features that appeared after this format: new for a pack saved in it.
export const newFeatures = (format = 1) => offeredFeatures().filter((f) => f.since > format);

// What to mark in the builder: new for this pack and not turned on yet.
export const freshFeatures = (format: number | undefined, uses: string[]) => newFeatures(format).filter((f) => !uses.includes(f.id));

// Packs of format 1 had no list: the game was known by its family. Only for them (the GM's edited copies, the files of
// the Community): a pack of a later format says what it uses.
const OLD_USES: Record<string, string[]> = {
  fate: ['worldtime', 'aspects'],
  fitd: ['worldtime', 'clocks', 'crew'],
  mausritter: ['exploration', 'factions'],
};
export const oldUses = (family: string) => OLD_USES[family] ?? ['worldtime'];
// And the types of compendium entries: they were in the core.
const OLD_TYPES: Record<string, unknown[]> = {
  fate: [{ id: 'skill', title: { en: 'Skill', ru: 'Навык' }, plural: { en: 'Skills', ru: 'Навыки' } }],
  fitd: [{ id: 'fability', title: { en: 'Special ability', ru: 'Особая способность' }, plural: { en: 'Special abilities', ru: 'Особые способности' }, fields: [{ key: 'category', title: { en: 'Whose', ru: 'Чья' }, kind: 'text' }] }],
  mausritter: [{ id: 'mspell', title: { en: 'Spell', ru: 'Заклинание' }, plural: { en: 'Spells', ru: 'Заклинания' }, fields: [{ key: 'recharge', title: { en: 'Recharge', ru: 'Перезарядка' }, kind: 'text' }] }],
};
export const oldEntryTypes = (family: string): unknown[] => OLD_TYPES[family] ?? [];
// The same for the rule of damage past health (TrackerSpec.overflow).
export const oldOverflow = (family: string) => (family === 'mausritter' ? 'str' : undefined);
