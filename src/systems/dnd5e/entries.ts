// D&D 5e's types of compendium entries: spells, items, feats, conditions — their fields and the line under the title.
// Only titles and pure functions (the core reads them through the plugin).
import { getLang, t } from '../../shared/i18n';
import { entryField, entryType, type FieldValue, type TypeDef } from '../../shared/entrytypes';

// Choices of select fields: values written into entry files (so data, not labels), offered in the interface
// language — the same words the built-in book of that language uses. Other languages get the English ones.
const OPTIONS = {
  ru: {
    school: ['Ограждение', 'Вызов', 'Прорицание', 'Очарование', 'Воплощение', 'Иллюзия', 'Некромантия', 'Преобразование'],
    rarity: ['Обычный', 'Необычный', 'Редкий', 'Очень редкий', 'Легендарный', 'Артефакт'],
    itemCategory: ['Оружие', 'Доспех', 'Чудесный предмет', 'Зелье', 'Кольцо', 'Жезл', 'Посох', 'Волшебная палочка', 'Свиток', 'Снаряжение', 'Прочее'],
    featCategory: ['Происхождение', 'Общая', 'Боевой стиль', 'Эпический дар'],
  },
  en: {
    school: ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'],
    rarity: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'],
    itemCategory: ['Weapon', 'Armor', 'Wondrous Item', 'Potion', 'Ring', 'Rod', 'Staff', 'Wand', 'Scroll', 'Equipment', 'Other'],
    featCategory: ['Origin', 'General', 'Fighting Style', 'Epic Boon'],
  },
};
const options = (k: keyof (typeof OPTIONS)['en']) => () => (getLang() === 'ru' ? OPTIONS.ru : OPTIONS.en)[k];

export const ENTRY_TYPES: Record<string, TypeDef> = {
  spell: entryType(
    'spell',
    [
      entryField('spell', 'level', 'number', { hint: true }),
      entryField('spell', 'school', 'select', { options: options('school') }),
      entryField('spell', 'casting_time', 'text'),
      entryField('spell', 'range', 'text'),
      entryField('spell', 'components', 'text'),
      entryField('spell', 'duration', 'text'),
      entryField('spell', 'concentration', 'bool'),
      entryField('spell', 'ritual', 'bool'),
      entryField('spell', 'classes', 'list', { hint: true }),
    ],
    'dnd5e'
  ),
  item: entryType(
    'item',
    [
      entryField('item', 'category', 'select', { options: options('itemCategory') }),
      entryField('item', 'rarity', 'select', { options: options('rarity') }),
      entryField('item', 'attunement', 'text', { hint: true }),
      entryField('item', 'cost', 'text'),
      entryField('item', 'weight', 'text'),
    ],
    'dnd5e'
  ),
  feat: entryType(
    'feat',
    [
      entryField('feat', 'category', 'select', { options: options('featCategory') }),
      entryField('feat', 'prerequisite', 'text'),
      entryField('feat', 'repeatable', 'bool'),
    ],
    'dnd5e'
  ),
  condition: entryType('condition', [], 'dnd5e'),
};

const low = (v: FieldValue | undefined) => (typeof v === 'string' ? v.toLowerCase() : '');
// Строка под названием: «3 уровень, воплощение», «Чудесный предмет, редкий, требует настройки».
export const ENTRY_SUBTITLES: Record<string, (f: Record<string, FieldValue>) => string> = {
  spell(f) {
    const lvl = typeof f['level'] === 'number' ? f['level'] : null;
    const head = lvl === 0 ? t('cmp.sub.cantrip') : lvl !== null ? t('cmp.sub.level', { n: lvl }) : t('cmp.type.spell');
    return [head, low(f['school']), f['ritual'] ? t('cmp.sub.ritual') : '', f['concentration'] ? t('cmp.sub.concentration') : ''].filter(Boolean).join(', ');
  },
  item: (f) =>
    [f['category'] || t('cmp.type.item'), low(f['rarity']), f['attunement'] ? t('cmp.sub.attunement') + (f['attunement'] === 'да' || f['attunement'] === 'yes' || f['attunement'] === true ? '' : ` (${f['attunement']})`) : ''].filter(Boolean).join(', '),
  feat: (f) =>
    [f['category'] ? t('cmp.sub.featOf', { category: low(f['category']) }) : t('cmp.type.feat'), f['prerequisite'] ? t('cmp.sub.requires', { what: String(f['prerequisite']) }) : ''].filter(Boolean).join(', '),
};
