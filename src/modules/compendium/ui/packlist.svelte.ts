// The list of a type of entries a pack filters and groups (PackEntryType.filters, groupBy): what is picked, by type.
import { getLang } from '../../../shared/i18n';
import { filterMatches, groupOfEntry, type FilterPick, type PackEntryType } from '../../../shared/syspack';
import type { FieldValue } from '../../../shared/compendium';

export const packFilters = $state<{ picks: Record<string, Record<string, FilterPick>>; closed: boolean }>({ picks: {}, closed: false });

export const packList = (t: PackEntryType) => ({
  match: (f: Record<string, FieldValue>) => filterMatches(f, t.filters ?? [], packFilters.picks[t.id] ?? {}),
  group: t.groupBy ? (f: Record<string, FieldValue>) => groupOfEntry(f, t.groupBy!, getLang()) : undefined,
});
