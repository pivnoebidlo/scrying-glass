import type { AmbientLoop } from '../music/types';
import type { Fit } from '../scene/types';

// Части экрана, которые сцена может задавать. Выключенная часть при включении сцены не меняется.
export type Part = 'background' | 'map' | 'portraits' | 'music' | 'ambience';

export const PARTS: Part[] = ['background', 'map', 'portraits', 'music', 'ambience'];

export interface Scene {
  id: string;
  name: string;
  // Приключение, к которому относится сцена. Нет — общая (сцены до появления приключений), видна везде.
  adventure?: string | null;
  include: Record<Part, boolean>;
  // null — «убрать»: без фона, без карты, музыка выключена.
  background: { path: string | null; fit: Fit };
  map: { path: string | null };
  portraits: { paths: string[] };
  music: { playlist: string | null; shuffle: boolean };
  ambience: { loops: AmbientLoop[] };
}

export type SceneContent = Omit<Scene, 'id' | 'name' | 'include'>;

// Сцены, которые видны при текущем приключении: его собственные и общие. Без приключения — все.
export const scenesFor = (s: ScenesState, current: string | null) =>
  current === null ? s.scenes : s.scenes.filter((x) => !x.adventure || x.adventure === current);

export interface ScenesState {
  scenes: Scene[];
  // Последняя включённая сцена (после этого мастер мог что-то поменять вручную).
  active: string | null;
  // Менять сцены через короткое затемнение.
  throughBlack: boolean;
}
