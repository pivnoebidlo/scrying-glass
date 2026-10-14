import type { AmbientLoop } from '../music/types';
import type { Fit } from '../scene/types';
import { adventureHidden, type AdventuresState } from '../../shared/adventures';

// Части экрана, которые сцена может задавать. Выключенная часть при включении сцены не меняется.
export type Part = 'background' | 'map' | 'portraits' | 'handout' | 'music' | 'ambience';

export const PARTS: Part[] = ['background', 'map', 'portraits', 'handout', 'music', 'ambience'];

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
  handout: { path: string | null };
  music: { playlist: string | null; shuffle: boolean };
  ambience: { loops: AmbientLoop[] };
}

export type SceneContent = Omit<Scene, 'id' | 'name' | 'include'>;

// Сцены, которые видны при текущем приключении: его собственные и общие. Без приключения — все, кроме скрытых
// приключений (их система отключена).
export const scenesFor = (s: ScenesState, adv: AdventuresState) =>
  s.scenes.filter((x) => !x.adventure || (adv.current === null ? !adventureHidden(adv, x.adventure) : x.adventure === adv.current));

export interface ScenesState {
  scenes: Scene[];
  // Последняя включённая сцена (после этого мастер мог что-то поменять вручную).
  active: string | null;
  // Менять сцены через короткое затемнение.
  throughBlack: boolean;
}
