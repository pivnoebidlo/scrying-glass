// Что система говорит трекеру инициативы: как называется очерёдность и чем её определить, какие числа у участника,
// какие состояния предлагать. Только чистые функции — нужно и ядру (бросок за NPC), и окнам.
import type { CombatStats } from '../shared/cards';
import type { Combatant } from '../modules/initiative/types';

// Число участника, которое вводится при быстром добавлении и в заготовке боя («Хиты», «КД», «Физ.»).
export interface CombatField {
  key: string;
  label: string;
  title: string;
  get(c: Combatant): number | null;
  set(v: number | null, c?: Combatant): Partial<Combatant>;
}

export interface TrackerDef {
  // Столбец очерёдности («Иниц.»).
  init: { label: string; title: string };
  // Бонус очерёдности: подпись в заготовке и кратко в строке участника.
  // from — the key of a field that sets the bonus (Mausritter: DEX): no separate input, shown without a sign.
  bonus: { label: string; short: string; title: string; from?: string };
  // Кнопка «Бросить за NPC»: результат для участника с этим бонусом.
  roll: { label: string; title: string; value(bonus: number): number };
  // Состояния: готовый список (у D&D) или свободный ввод (аспекты Fate).
  conditions: { label: string; list: string[]; free: boolean; entry?(c: string): string[] };
  fields: CombatField[];
  // Участник из карточки: всё, кроме имени, стороны и картинки.
  fromCard(combat: CombatStats): Partial<Combatant>;
}

// Числа участника из полей (нет значения — по умолчанию системы). Поля применяются по очереди: дорожки стресса
// одного участника складываются, а не затирают друг друга.
export function fromFields(fields: CombatField[], values: Record<string, number | null>, c?: Combatant): Partial<Combatant> {
  const out: Partial<Combatant> = {};
  for (const f of fields) Object.assign(out, f.set(values[f.key] ?? null, { ...c, ...out } as Combatant));
  return out;
}
