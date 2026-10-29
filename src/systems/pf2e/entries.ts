// Pathfinder 2e's types of compendium entries (ids prefixed: D&D has «spell» too) and the line under the title.
import { t } from '../../shared/i18n';
import { entryField, entryType, type FieldValue, type TypeDef } from '../../shared/entrytypes';

const action = (id: string) => entryType(id, [entryField(id, 'actions', 'text', { hint: true }), entryField(id, 'traits', 'list')], 'pf2e');

export const ENTRY_TYPES: Record<string, TypeDef> = {
  'pf2e-spell': entryType(
    'pf2e-spell',
    [
      entryField('pf2e-spell', 'rank', 'number', { hint: true }),
      entryField('pf2e-spell', 'traditions', 'list'),
      entryField('pf2e-spell', 'traits', 'list'),
      entryField('pf2e-spell', 'cast', 'text'),
      entryField('pf2e-spell', 'range', 'text'),
      entryField('pf2e-spell', 'area', 'text'),
      entryField('pf2e-spell', 'targets', 'text'),
      entryField('pf2e-spell', 'defense', 'text'),
      entryField('pf2e-spell', 'duration', 'text'),
      entryField('pf2e-spell', 'rarity', 'text'),
    ],
    'pf2e',
  ),
  'pf2e-condition': entryType('pf2e-condition', [entryField('pf2e-condition', 'valued', 'bool')], 'pf2e'),
  'pf2e-action': action('pf2e-action'),
  'pf2e-ability': action('pf2e-ability'),
};

// The number of actions as icons: ◆ ◆◆ ◆◆◆, a reaction ⟲, a free action ◇.
export const actionIcon = (a: FieldValue | number | null | undefined) =>
  a === 1 || a === '1' ? '◆' : a === 2 || a === '2' ? '◆◆' : a === 3 || a === '3' ? '◆◆◆' : a === 'reaction' ? '⟲' : a === 'free' ? '◇' : '';

const list = (v: FieldValue | undefined) => (Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : '');
export const ENTRY_SUBTITLES: Record<string, (f: Record<string, FieldValue>) => string> = {
  'pf2e-spell': (f) => {
    const rank = Number(f['rank'] ?? 1);
    return [rank === 0 ? t('pf2e.sub.cantrip') : t('pf2e.sub.spell', { n: rank }), list(f['traditions']), actionIcon(f['cast'])].filter(Boolean).join(' · ');
  },
  'pf2e-condition': (f) => [t('pf2e.sub.condition'), f['valued'] ? t('pf2e.sub.valued') : ''].filter(Boolean).join(', '),
  'pf2e-action': (f) => [t('pf2e.sub.action'), actionIcon(f['actions']), list(f['traits'])].filter(Boolean).join(' · '),
  'pf2e-ability': (f) => [t('pf2e.sub.ability'), actionIcon(f['actions']), list(f['traits'])].filter(Boolean).join(' · '),
};
