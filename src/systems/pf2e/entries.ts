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
  'pf2e-feat': entryType(
    'pf2e-feat',
    [
      entryField('pf2e-feat', 'level', 'number'),
      entryField('pf2e-feat', 'category', 'text'),
      entryField('pf2e-feat', 'actions', 'text'),
      entryField('pf2e-feat', 'traits', 'list'),
      entryField('pf2e-feat', 'prerequisites', 'text'),
      entryField('pf2e-feat', 'rarity', 'text'),
    ],
    'pf2e',
  ),
  'pf2e-item': entryType(
    'pf2e-item',
    [
      entryField('pf2e-item', 'level', 'number'),
      entryField('pf2e-item', 'kind', 'text'),
      entryField('pf2e-item', 'category', 'text'),
      entryField('pf2e-item', 'price', 'text'),
      entryField('pf2e-item', 'bulk', 'text'),
      entryField('pf2e-item', 'traits', 'list'),
      entryField('pf2e-item', 'damage', 'text'),
      entryField('pf2e-item', 'range', 'text'),
      entryField('pf2e-item', 'ac', 'text'),
      entryField('pf2e-item', 'rarity', 'text'),
    ],
    'pf2e',
  ),
  'pf2e-class': entryType('pf2e-class', [entryField('pf2e-class', 'hp', 'number'), entryField('pf2e-class', 'key', 'text')], 'pf2e'),
  'pf2e-ancestry': entryType(
    'pf2e-ancestry',
    ['hp', 'size', 'speed', 'boosts'].map((k) => entryField('pf2e-ancestry', k, k === 'hp' ? 'number' : 'text')).concat([entryField('pf2e-ancestry', 'traits', 'list')]),
    'pf2e',
  ),
  'pf2e-heritage': entryType('pf2e-heritage', [entryField('pf2e-heritage', 'ancestry', 'text')], 'pf2e'),
  'pf2e-background': entryType('pf2e-background', [entryField('pf2e-background', 'boosts', 'text'), entryField('pf2e-background', 'skills', 'list')], 'pf2e'),
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
  'pf2e-feat': (f) => [t('pf2e.sub.feat', { n: Number(f['level'] ?? 1) }), actionIcon(f['actions']), list(f['traits'])].filter(Boolean).join(' · '),
  'pf2e-item': (f) => [t('pf2e.sub.item', { n: Number(f['level'] ?? 0) }), list(f['category']) || list(f['kind']), list(f['price'])].filter(Boolean).join(' · '),
  'pf2e-class': (f) => [t('cmp.type.pf2e-class'), f['key'] ? String(f['key']) : ''].filter(Boolean).join(' · '),
  'pf2e-ancestry': (f) => [t('cmp.type.pf2e-ancestry'), f['hp'] ? `${f['hp']} HP` : ''].filter(Boolean).join(' · '),
  'pf2e-heritage': (f) => [t('cmp.type.pf2e-heritage'), list(f['ancestry'])].filter(Boolean).join(' · '),
  'pf2e-background': (f) => [t('cmp.type.pf2e-background'), list(f['skills'])].filter(Boolean).join(' · '),
};
