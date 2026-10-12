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
}

export interface MapData {
  fog: Fog;
  view: MapView;
  grid: Grid;
}

export interface MapsState {
  // Карта на экране игроков.
  current: string | null;
  // Данные всех карт, которые открывали, по пути в хранилище.
  maps: Record<string, MapData>;
  // Туман новой карты: скрыть всё (игроки видят только открытое) или ничего не скрывать.
  defaultFog: 'hidden' | 'revealed';
}

export const FULL_VIEW: MapView = { x: 0, y: 0, w: 1, h: 1 };
