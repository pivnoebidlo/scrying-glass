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
  // Из какой заготовки боя пришёл (startEncounter): подборка правой панели отмечает идущий бой.
  encounter?: string;
  // Спрятан от игроков (засада, невидимка).
  hidden: boolean;
  // Не показывать игрокам его ранения (портрет не краснеет), даже если ранения включены в настройках.
  hideWounds?: boolean;
  // Состояния D&D или аспекты Fate — что предлагать, решает система приключения.
  conditions: string[];
  // Fate: дорожки стресса и последствия (у D&D их нет).
  stress?: StressTrack[];
  consequences?: Consequence[];
  // Выведен из боя (Fate: «taken out»); у D&D побеждённого определяют хиты.
  out?: boolean;
  // Карточка из бестиария, если участник добавлен оттуда (открыть статблок).
  card?: CardRef | null;
}

// Дорожка стресса: клетки 1, 2, 3… (отмеченная клетка N поглощает N сдвигов).
export interface StressTrack {
  // 'physical', 'mental' или свой ключ; подпись — `trackTitle`.
  id: string;
  boxes: boolean[];
}

// Последствие: ячейка на столько-то сдвигов (2 — лёгкое, 4 — среднее, 6 — тяжёлое) и его текст-аспект.
export interface Consequence {
  shift: number;
  text: string;
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
  // Партия для расчёта сложности, если героев нет ни в бою, ни в приключении, и уровень героев без листа.
  party: { size: number; level: number };
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
