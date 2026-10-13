// Данные карты по умолчанию. Отдельный файл без зависимостей: нужен и ядру, и окнам.
import { FULL_VIEW, type MapData, type MapsState } from './types';

export function dataOf(s: MapsState, path: string): MapData {
  return (
    s.maps[path] ?? {
      fog: { base: s.defaultFog, ops: [] },
      view: FULL_VIEW,
      grid: { on: false, cells: 30 },
      pins: [],
    }
  );
}
