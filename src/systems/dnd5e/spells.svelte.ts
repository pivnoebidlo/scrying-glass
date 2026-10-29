// The compendium's spell list in D&D: the filter, whether it is open, the order (by level or by name).
import { t } from '../../renderer/lib/i18n.svelte';
import type { FieldValue } from '../../shared/compendium';
import type { EntryList } from '../ui';
import { levelTitle, NO_SPELL_FILTER, spellMatches, type SpellFilter } from './spellfilter';
import SpellFilters from './SpellFilters.svelte';

export const spells = $state({ filter: structuredClone(NO_SPELL_FILTER) as SpellFilter, open: true, byLevel: true });

const levelOf = (f: Record<string, FieldValue>) => Number(f['level'] ?? 99);

export const spellList: EntryList = {
  filter: SpellFilters,
  match: (f) => spellMatches(f, spells.filter),
  group(f) {
    if (!spells.byLevel) return null;
    const n = levelOf(f);
    return { order: n, title: n === 99 ? t('cmpui.noLevel') : levelTitle(n) };
  },
};
