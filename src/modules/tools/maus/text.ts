// A result of the Mausritter tables in words: the cells in the interface language, the labels, Markdown for the
// journal and the clipboard.
import { t } from '../../../shared/i18n';
import { NAMES } from '../mouse/content';
import type { Cell, Hireling, Line, Result } from './generate';
import { ATTR_SHORT } from '../../../systems/mausritter/stats';
import { SRD_TABLES } from './srd';

export type TablesLang = 'en' | 'ru';
export const tablesLang = (lang: string): TablesLang => (lang === 'ru' ? 'ru' : 'en');

// A cell as text; «**Hostile.** How…» keeps its Markdown.
export function cellText(c: Cell, lang: TablesLang): string {
  const row = SRD_TABLES[lang][c.table]!.rows[c.row]!;
  return row[c.col ?? row.length - 1] ?? '';
}
export const plain = (s: string) => s.replace(/\*\*/g, '');

export function lineText(l: Line, lang: TablesLang): string {
  const parts = l.cells.map((c) => cellText(c, lang));
  if (l.join === 'name') return parts.map((p, i) => (i ? p.replace(/^-/, '').toLowerCase() : p)).join('');
  if (l.join === 'comma') return parts.length === 3 ? `${parts[0]} ${parts[1]} · ${parts[2]}` : parts.join(', ');
  if (l.extra?.key === 'mouseName') return NAMES[lang][Number(l.extra.params?.['i'] ?? 0)] ?? '';
  if (l.extra?.key === 'hireling') {
    const h = l.extra.params as unknown as Hireling;
    return `${NAMES[lang][h.name]} (${parts[0]!.toLowerCase()}) — ${t('maus.hp')} ${h.hp}, ${ATTR_SHORT.str} ${h.str}, ${ATTR_SHORT.dex} ${h.dex}, ${ATTR_SHORT.wil} ${h.wil}`;
  }
  return parts.join(' — ');
}

export const labelOf = (l: Line) => t(`mt.l.${l.label}` as never);
// «d6: 4» → «к6: 4» in Russian.
export const rollText = (s: string | undefined, lang: TablesLang) => (s && lang === 'ru' ? s.replace(/(^|[^a-z])d(\d)/g, '$1к$2').replace(/2d6↓/, '2к6↓') : (s ?? ''));
export const extraText = (l: Line) => (l.extra && l.extra.key !== 'mouseName' && l.extra.key !== 'hireling' ? t(`mt.x.${l.extra.key}` as never, l.extra.params as never) : '');

export function resultMarkdown(r: Result, lang: TablesLang): string {
  const out: string[] = [`## ${t(`mt.kind.${r.kind}` as never)}`, ''];
  const add = (l: Line, indent: string) => {
    const x = extraText(l);
    out.push(`${indent}- **${labelOf(l)}:** ${lineText(l, lang)}${x ? ` (${x})` : ''}`);
    for (const s of l.sub ?? []) add(s, indent + '  ');
  };
  for (const l of r.lines) add(l, '');
  return out.join('\n');
}
