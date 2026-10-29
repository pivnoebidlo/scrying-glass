// Pathfinder 2e (remaster) as a system plugin. The name is Paizo's trademark, used under their Community Use Policy;
// the rules come under the ORC License (shared/about.ts CREDITS).
import type { SystemDef } from '..';
import type { SystemPlugin } from '../plugin';
import { t } from '../../shared/i18n';
import { blankStats, combatStats, subtitle, type Pf2eStats } from './stats';
import { blankCharacter, characterCombat, characterSubtitle, isCharacter } from './character';
import { pathbuilderImporter } from './pathbuilder';
import { pf2eTracker } from './tracker';
import { ENTRY_SUBTITLES, ENTRY_TYPES } from './entries';

const pf2e: SystemDef = {
  id: 'pf2e',
  get title() {
    return t('pf2e.title');
  },
  family: 'pf2e',
  get about() {
    return t('pf2e.about');
  },
  // Two shapes of stats: a creature's stat block and a player character's sheet.
  subtitle: (s) => (isCharacter(s) ? characterSubtitle(s, t('pf2e.sh.level')) : subtitle(s as Pf2eStats, (k) => t(`pf2e.${k}` as never))),
  rank: (s) => (s as { level: number }).level,
  combat: (s) => (isCharacter(s) ? characterCombat(s) : combatStats(s as Pf2eStats)),
  blank: (kind) => (kind === 'character' ? blankCharacter() : blankStats()),
  tracker: pf2eTracker,
  shape: { ofKind: (kind) => (kind === 'character' ? 'sheet' : 'block'), ofStats: (s) => (isCharacter(s) ? 'sheet' : 'block') },
};

export const pf2ePlugin: SystemPlugin = {
  family: 'pf2e',
  get title() {
    return t('pf2e.title');
  },
  systems: [pf2e],
  entryTypes: ENTRY_TYPES,
  entrySubtitle: ENTRY_SUBTITLES,
  // Monster Core creatures, Player Core conditions, spells, actions (content/pf2e-core/).
  content: ['pf2e-core'],
  importers: [pathbuilderImporter],
};
