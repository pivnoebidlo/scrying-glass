// Сцены: сохранённые наборы того, что видят и слышат игроки. Здесь только хранение;
// включает сцену окно управления, через обычные действия модулей.
import { randomUUID } from 'node:crypto';
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles, isLibraryAsset, walk } from '../../shared/vault';
import { BUILTIN } from '../../shared/compendium';
import type { AdventuresState } from '../../shared/adventures';
import type { Part, Scene, SceneContent, ScenesState } from './types';
import { addShown, addTo, editTray, emptyTray, merge, pruneTrays, removeFrom, trayOf, trayOwner, type ScreenNow, type Tray, type TrayOwner, type TrayPart } from './tray';

const initialState: ScenesState = { scenes: [], active: null, throughBlack: false };

const ALL: Record<Part, boolean> = { background: true, map: true, portraits: true, handout: true, music: true, ambience: true };

// Сцены до появления раздатки: часть «Раздатка» включена и пуста — при смене сцены записка с экрана уходит.
// Сцены до подборок: подборка — из содержимого сцены.
function upgrade(s: ScenesState): ScenesState {
  if (s.scenes.some((x) => !x.handout || x.include.handout === undefined)) {
    s = { ...s, scenes: s.scenes.map((x) => ({ ...x, handout: x.handout ?? { path: null }, include: { ...ALL, ...x.include } })) };
  }
  if (s.scenes.some((x) => !x.tray)) s = { ...s, scenes: s.scenes.map((x) => (x.tray ? x : { ...x, tray: trayOf(x) })) };
  return s;
}

// Из подборок — файлы, которых больше нет. Картинки библиотеки и записи справочника вне хранилища не проверяются.
function prune(s: ScenesState, ctx: ModuleContext): ScenesState {
  const tree = ctx.vault.tree;
  if (!tree) return s;
  // Файлы и папки (плейлисты в подборке музыки).
  const exists = new Set(allFiles(tree).map((f) => f.path));
  walk(tree, (f) => exists.add(f.path));
  return pruneTrays(s, (p) => exists.has(p) || isLibraryAsset(p) || p.startsWith(BUILTIN));
}

export default defineModule({
  id: 'scenes',
  persist: true,
  initialState,

  init: (s, ctx) => prune(upgrade(s), ctx),
  onTreeChange: prune,

  // Что вывели на экран (в любом модуле) — в текущую подборку правой панели.
  afterAction(s, before, after) {
    const app = after as unknown as ScreenNow & { adventures: AdventuresState };
    const owner = trayOwner(s, app.adventures);
    return editTray(s, owner, (t) => addShown(t, before as unknown as ScreenNow, app));
  },

  actions: {
    // tray — подборка, из которой собрана сцена (то, что накидано в правую панель); к ней добавляется показанное.
    create(s, { name, content, adventure, tray }: { name: string; content: SceneContent; adventure?: string | null; tray?: Tray }) {
      const scene: Scene = { id: randomUUID(), name, adventure: adventure ?? null, include: { ...ALL }, ...content, tray: merge(tray ?? emptyTray(), trayOf(content)) };
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

    // Подборка правой панели: добавить (перетаскиванием, «+») и убрать.
    trayAdd(s, { owner, part, paths }: { owner: TrayOwner; part: TrayPart; paths: string[] }) {
      return editTray(s, owner, (t) => addTo(t, part, paths));
    },

    // Новый порядок (перетаскиванием в правой панели): только то, что уже было в подборке.
    traySet(s, { owner, part, ids }: { owner: TrayOwner; part: TrayPart; ids: string[] }) {
      return editTray(s, owner, (t) => ({ ...t, [part]: [...ids.filter((x) => t[part].includes(x)), ...t[part].filter((x) => !ids.includes(x))] }));
    },

    trayRemove(s, { owner, part, path }: { owner: TrayOwner; part: TrayPart; path: string }) {
      return editTray(s, owner, (t) => removeFrom(t, part, path));
    },

    setThroughBlack(s, { value }: { value: boolean }) {
      return { ...s, throughBlack: value };
    },
  },
});
