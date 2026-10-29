// Long Story Short as D&D's importer of characters: the export file, the character's page, the spell table.
import { t } from '../../shared/i18n';
import type { CardImporter } from '../importer';
import { collectLssSpells, fromLss, isLssExport, type LssSpellTable } from './lss';

export const lssImporter: CardImporter = {
  id: 'lss',
  title: 'Long Story Short',
  short: 'LSS',
  get fileTitle() {
    return t('dnd.lss.fileTitle');
  },
  get filter() {
    return t('dnd.lss.filter');
  },
  detect: isLssExport,
  read(json, table) {
    if (!isLssExport(json)) throw new Error(t('dnd.lss.notExport'));
    const r = fromLss(json, table as LssSpellTable);
    return { name: r.name, system: r.system, stats: r.stats, linkId: r.lssId, avatarUrl: r.avatarUrl, warnings: r.warnings };
  },
  url: (id) => `https://longstoryshort.app/characters/digital/${id}/`,
  table: {
    // Not in the app's repository: it is LSS's data.
    file: 'lss-spells.json',
    get title() {
      return t('dnd.lss.tableTitle');
    },
    collect(json) {
      const found = collectLssSpells(json);
      return Object.keys(found).length ? found : null;
    },
  },
};
