// Long Story Short as D&D's importer of characters: the export file, the character's page, the spell table.
import { t } from '../../shared/i18n';
import type { CardImporter } from '../importer';
import { collectLssSpells, fromLss, isLssExport, LSS_API, lssEverything, lssWanted, type LssSpellTable } from './lss';

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
    collect(json) {
      const found = collectLssSpells(json);
      return Object.keys(found).length ? found : null;
    },
  },
  account: {
    login: 'https://longstoryshort.app/',
    cookieUrl: 'https://longstoryshort.app/',
    // The site keeps its JWT in the cookie, in quotes.
    token: (cookies) => {
      const v = cookies.find((c) => c.name === 'lss-jwt')?.value;
      return v ? decodeURIComponent(v).replace(/^"|"$/g, '') || null : null;
    },
    user: {
      url: `${LSS_API}/auth/user/`,
      name: (json) => {
        const u = json as { name?: unknown; email?: unknown } | null;
        return typeof u?.name === 'string' && u.name ? u.name : typeof u?.email === 'string' ? u.email : null;
      },
    },
    wanted: (json, table) => lssWanted(json, table as LssSpellTable),
    get everything() {
      return lssEverything();
    },
  },
};
