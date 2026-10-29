// D&D 5e as a system plugin: the 2024 and 2014 editions of one family.
import type { SystemDef } from '..';
import type { SystemPlugin } from '../plugin';
import * as statblock from './stats';
import * as character from './character';
import { dndTracker } from './tracker';

// Two shapes of stats: a stat block (monsters, NPCs) and a player character's sheet.
const dnd = (id: string, title: string, short: string): SystemDef => ({
  id,
  title,
  short,
  family: 'dnd5e',
  subtitle: (s, lang) => (character.isCharacter(s) ? character.characterSubtitle(s) : statblock.subtitle(s, lang)),
  rank: (s) => (character.isCharacter(s) ? character.totalLevel(s) : (s as statblock.Dnd5eStats).cr),
  combat: (s) => (character.isCharacter(s) ? character.characterCombat(s) : statblock.combatStats(s)),
  blank: (kind) => (kind === 'character' ? character.blankCharacter() : statblock.blankStats()),
  tracker: dndTracker,
  shape: { ofKind: (kind) => (kind === 'character' ? 'sheet' : 'block'), ofStats: (s) => (character.isCharacter(s) ? 'sheet' : 'block') },
});

export const dnd5ePlugin: SystemPlugin = {
  family: 'dnd5e',
  title: 'D&D 5e',
  systems: [dnd('dnd5e-2024', 'D&D 5e (2024)', '2024'), dnd('dnd5e-2014', 'D&D 5e (2014)', '2014')],
  // Adventures from before the choice of systems are D&D.
  legacy: 'dnd5e-2024',
};
