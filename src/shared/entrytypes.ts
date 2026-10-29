// Types of compendium entries: fields and their titles. Apart from shared/compendium.ts because system plugins
// describe their types with these helpers, and shared/compendium.ts reads the plugins (no import cycle).
import { t, type Key } from './i18n';

export type FieldValue = string | number | boolean | string[];

export interface FieldDef {
  key: string;
  title: string;
  kind: 'text' | 'number' | 'bool' | 'select' | 'list';
  options?: string[];
  // Подсказка в редакторе.
  hint?: string;
  // Своё поле: значение — в строке под названием («Божество, хаотично-доброе»), а не строкой «поле — значение».
  subtitle?: boolean;
}

export interface TypeDef {
  title: string;
  // Во множественном числе — для фильтра: «Заклинания».
  plural: string;
  fields: FieldDef[];
  // Семейство систем, к которому относится тип (dnd5e — заклинания и т. п.); нет — тип для любой системы.
  family?: string;
}

// Field titles and hints come from the dictionary (cmp.field.<type>.<key>, cmp.hint.<type>.<key>): getters, so they
// follow the interface language. Option values of select fields are data written into entry files — not translated.
export const entryField = (type: string, key: string, kind: FieldDef['kind'], extra: { options?: () => string[]; hint?: boolean } = {}): FieldDef => ({
  key,
  kind,
  ...(extra.options ? { get options() {
    return extra.options!();
  } } : {}),
  get title() {
    return t(`cmp.field.${type}.${key}` as Key);
  },
  get hint() {
    return extra.hint ? t(`cmp.hint.${type}.${key}` as Key) : undefined;
  },
});

// A built-in type: title and plural from the dictionary (cmp.type.<id>, cmp.plural.<id>).
export const entryType = (id: string, fields: FieldDef[], family?: string): TypeDef => ({
  get title() {
    return t(`cmp.type.${id}` as Key);
  },
  get plural() {
    return t(`cmp.plural.${id}` as Key);
  },
  fields,
  ...(family ? { family } : {}),
});
