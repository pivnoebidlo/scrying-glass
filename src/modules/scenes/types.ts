import type { AmbientLoop } from '../music/types';
import type { Fit } from '../scene/types';
import type { Tray } from './tray';
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
  // Подборка правой панели, пока сцена включена (scenes/tray.ts).
  tray?: Tray;
}

export type SceneContent = Omit<Scene, 'id' | 'name' | 'include' | 'tray'>;

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
  // Подборки правой панели без включённой сцены — по приключению (ключ — папка, '' — всё хранилище).
  trays?: Record<string, Tray>;
}
