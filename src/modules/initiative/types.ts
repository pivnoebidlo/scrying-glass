export type Side = 'party' | 'ally' | 'enemy';

export interface Combatant {
  id: string;
  name: string;
  // Результат броска инициативы (null — ещё не бросали).
  init: number | null;
  // Бонус инициативы: для броска за противников и при равенстве.
  bonus: number;
  hp: number | null;
  maxHp: number | null;
  ac: number | null;
  side: Side;
  // Картинка из хранилища.
  portrait: string | null;
  // Спрятан от игроков (засада, невидимка).
  hidden: boolean;
  conditions: string[];
}

export interface InitiativeState {
  combatants: Combatant[];
  // Чей ход (id). null — бой не начат.
  turn: string | null;
  round: number;
  // Показывать полосу очерёдности на экране игроков.
  showToPlayers: boolean;
}

// Состояния из правил D&D 5e.
export const CONDITIONS = [
  'Без сознания',
  'Испуган',
  'Истощение',
  'Невидим',
  'Недееспособен',
  'Оглушён',
  'Окаменел',
  'Опутан',
  'Ослеплён',
  'Отравлен',
  'Очарован',
  'Парализован',
  'Сбит с ног',
  'Схвачен',
  'Ошеломлён',
  'Концентрация',
];
