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
    create(s, { name, content }: { name: string; content: SceneContent }) {
      const scene: Scene = { id: randomUUID(), name, include: { ...ALL }, ...content };
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

    // Переставить сцену на место index (порядок — как пойдут сцены на игре).
    move(s, { id, index }: { id: string; index: number }) {
      const from = s.scenes.findIndex((x) => x.id === id);
      if (from < 0) return s;
      const scenes = [...s.scenes];
      const [scene] = scenes.splice(from, 1);
      scenes.splice(Math.max(0, Math.min(index, scenes.length)), 0, scene!);
      return { ...s, scenes };
    },

    markActive(s, { id }: { id: string | null }) {
      return { ...s, active: id };
    },

    setThroughBlack(s, { value }: { value: boolean }) {
      return { ...s, throughBlack: value };
    },
  },
});
