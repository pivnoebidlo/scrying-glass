import type { CardRef, CardSide } from '../../shared/cards';

export type Side = CardSide;
export { SIDE_TITLES as SIDES } from '../../shared/cards';

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
  // Картинка из хранилища или библиотеки карточек («library:…»).
  portrait: string | null;
  // Спрятан от игроков (засада, невидимка).
  hidden: boolean;
  // Не показывать игрокам его ранения (портрет не краснеет), даже если ранения включены в настройках.
  hideWounds?: boolean;
  conditions: string[];
  // Карточка из бестиария, если участник добавлен оттуда (открыть статблок).
  card?: CardRef | null;
}

// Заготовка боя: участники, подготовленные заранее («Крысы в башне»). «В бой» добавляет их к текущему бою.
export interface Encounter {
  id: string;
  name: string;
  // Приключение, к которому относится (null — общая).
  adventure: string | null;
  combatants: Combatant[];
}

export interface InitiativeState {
  combatants: Combatant[];
  encounters: Encounter[];
  // Чей ход (id). null — бой не начат.
  turn: string | null;
  round: number;
  // Показывать полосу очерёдности на экране игроков.
  showToPlayers: boolean;
  // Вид полосы на экране игроков.
  display: StripSettings;
}

export interface StripSettings {
  // Масштаб портретов и подписей (1 — исходный размер).
  size: number;
  names: boolean;
  // Краснеть портрету по мере ранений (игроки видят, насколько ранен противник).
  wounds: boolean;
  // Где полоса на экране игроков.
  position: StripPosition;
}

export type StripPosition = 'top' | 'bottom' | 'left' | 'right';

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
