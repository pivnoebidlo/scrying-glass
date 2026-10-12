// Сцены: сохранённые наборы того, что видят и слышат игроки. Здесь только хранение;
// включает сцену окно управления, через обычные действия модулей.
import { randomUUID } from 'node:crypto';
import { defineModule } from '../../shared/module';
import type { Part, Scene, SceneContent, ScenesState } from './types';

const initialState: ScenesState = { scenes: [], active: null, throughBlack: false };

const ALL: Record<Part, boolean> = { background: true, map: true, portraits: true, music: true, ambience: true };

export default defineModule({
  id: 'scenes',
  persist: true,
  initialState,

  actions: {
    create(s, { name, content, adventure }: { name: string; content: SceneContent; adventure?: string | null }) {
      const scene: Scene = { id: randomUUID(), name, adventure: adventure ?? null, include: { ...ALL }, ...content };
      return { ...s, scenes: [...s.scenes, scene], active: scene.id };
    },

    rename(s, { id, name }: { id: string; name: string }) {
      return { ...s, scenes: s.scenes.map((x) => (x.id === id ? { ...x, name } : x)) };
    },

    setInclude(s, { id, part, value }: { id: string; part: Part; value: boolean }) {
      return { ...s, scenes: s.scenes.map((x) => (x.id === id ? { ...x, include: { ...x.include, [part]: value } } : x)) };
    },

    // Заменить содержимое сцены (целиком или отдельные части) тем, что сейчас на экране.
    setContent(s, { id, content }: { id: string; content: Partial<SceneContent> }) {
      return { ...s, scenes: s.scenes.map((x) => (x.id === id ? { ...x, ...content } : x)) };
    },

    remove(s, { id }: { id: string }) {
      return { ...s, scenes: s.scenes.filter((x) => x.id !== id), active: s.active === id ? null : s.active };
    },

    // Переставить сцену перед сценой before (null — в конец). Порядок — как пойдут сцены на игре.
    // Через соседа, а не номер: список в окне отфильтрован по приключению, номера там другие.
    move(s, { id, before }: { id: string; before: string | null }) {
      const from = s.scenes.findIndex((x) => x.id === id);
      if (from < 0 || id === before) return s;
      const scenes = [...s.scenes];
      const [scene] = scenes.splice(from, 1);
      const to = before === null ? scenes.length : scenes.findIndex((x) => x.id === before);
      scenes.splice(to < 0 ? scenes.length : to, 0, scene!);
      return { ...s, scenes };
    },

    setAdventure(s, { id, adventure }: { id: string; adventure: string | null }) {
      return { ...s, scenes: s.scenes.map((x) => (x.id === id ? { ...x, adventure } : x)) };
    },

    markActive(s, { id }: { id: string | null }) {
      return { ...s, active: id };
    },

    setThroughBlack(s, { value }: { value: boolean }) {
      return { ...s, throughBlack: value };
    },
  },
});
