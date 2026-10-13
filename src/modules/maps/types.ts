import type { PinIcon } from './icons';

// Карты. Все координаты — доли размера карты (0..1): x — от ширины, y — от высоты.
// Так данные не зависят от разрешения картинки.

// Прямоугольник карты, который видят игроки.
export interface MapView {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FogMode = 'reveal' | 'hide';

// Операция тумана: открыть или скрыть кистью (ломаная с радиусом) или прямоугольником.
export type FogOp =
  | { mode: FogMode; kind: 'brush'; r: number; points: number[] } // r — доля ширины; points — [x0, y0, x1, y1, …]
  | { mode: FogMode; kind: 'rect'; x: number; y: number; w: number; h: number };

export interface Fog {
  // С чего начинается туман: всё скрыто или всё открыто. Дальше применяются операции по порядку.
  base: 'hidden' | 'revealed';
  ops: FogOp[];
}

export interface Grid {
  on: boolean;
  // Сколько клеток укладывается по ширине карты.
  cells: number;
  // Сдвиг сетки в долях клетки (0..1), чтобы совпала с нарисованной на карте.
  ox?: number;
  oy?: number;
}

// Метка мастера на карте: что где находится. Игроки видят только отмеченные «игрокам» — название, без заметки
// (и поверх тумана: раз мастер показал, место им известно).
export interface MapPin {
  id: string;
  x: number;
  y: number;
  title: string;
  // Заметка только для мастера.
  note: string;
  color: PinColor;
  // Значок в головке булавки (нет — просто булавка).
  icon?: PinIcon;
  shown: boolean;
}

export const PIN_COLORS = {
  red: '#e04545',
  gold: '#e8b94a',
  green: '#4caf6a',
  blue: '#4f8de8',
  violet: '#9a6cf0',
  white: '#e8e8e8',
} as const;
export type PinColor = keyof typeof PIN_COLORS;

export interface MapData {
  fog: Fog;
  view: MapView;
  grid: Grid;
  pins: MapPin[];
}

export interface MapsState {
  // Карта на экране игроков.
  current: string | null;
  // Данные всех карт, которые открывали, по пути в хранилище.
  maps: Record<string, MapData>;
  // Туман новой карты: скрыть всё (игроки видят только открытое) или ничего не скрывать.
  defaultFog: 'hidden' | 'revealed';
  // Размер меток на экране игроков (1 — обычный).
  pinSize: number;
}

export const FULL_VIEW: MapView = { x: 0, y: 0, w: 1, h: 1 };
