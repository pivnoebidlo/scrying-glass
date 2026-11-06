// Pathfinder 2e is a pack (content/pf2e-core/): only what a pack can't describe stays code here — reading a Pathbuilder
// export, and what of a sheet the phone links to the compendium. The name is Paizo's trademark, used under their
// Community Use Policy; the rules come under the ORC License (shared/about.ts CREDITS).
import type { SystemPlugin } from '../plugin';
import { t } from '../../shared/i18n';
import { pathbuilderImporter } from './pathbuilder';

export const pf2ePlugin: SystemPlugin = {
  family: 'pf2e',
  get title() {
    return t('pf2e.title');
  },
  systems: [],
  sheetEntries: ['pf2e-spell', 'pf2e-feat', 'pf2e-action', 'pf2e-ability'],
  content: ['pf2e-core'],
  importers: [pathbuilderImporter],
};
