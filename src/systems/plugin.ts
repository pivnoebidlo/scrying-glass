// A role-playing system brought by code, as modules are: the systems (editions) of one family and what they add to
// the core. Shared part — pure, read by the core and by the windows; the windows' part (views, editors, tools…) is
// `SystemUi` in systems/ui.ts. The core knows no system by name: it asks the plugins (systems/plugins.ts).
// Systems described by packs (systems/packs.ts) need no plugin; a plugin may add to a pack's family later.
import type { SystemDef } from '.';
import type { FieldValue, TypeDef } from '../shared/entrytypes';
import type { CardImporter } from './importer';

export interface SystemPlugin {
  // The family: editions of one game (D&D 5e 2014 and 2024).
  family: string;
  readonly title: string;
  // Its systems, in the order of choice (the first one is the default of the family).
  systems: SystemDef[];
  // The system of data made before the systems existed (old adventures and initiative): one plugin may claim it.
  legacy?: string;
  // Types of compendium entries of the family (spells, items…) and the line under an entry's title by type.
  entryTypes?: Record<string, TypeDef>;
  entrySubtitle?: Record<string, (fields: Record<string, FieldValue>) => string>;
  // Importers of characters from other services (D&D: Long Story Short).
  importers?: CardImporter[];
}
