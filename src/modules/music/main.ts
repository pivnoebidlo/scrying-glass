// Музыка (очередь из папки) и атмосфера (зацикленные звуки поверх музыки).
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles, findFolder } from '../../shared/vault';
import { isBuiltinSound } from '../../shared/sounds';
import type { AmbientLoop, MusicState, Repeat } from './types';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// Запустить трек с номером index с начала.
const start = (s: MusicState, index: number): MusicState => ({ ...s, index, playing: true, seq: s.seq + 1 });

// Следующий трек. auto — трек доиграл сам (тогда учитывается повтор одного трека и конец очереди).
function advance(s: MusicState, auto: boolean): MusicState {
  if (!s.queue.length) return s;
  if (auto && s.repeat === 'one') return start(s, s.index);
  const next = s.index + 1;
  if (next < s.queue.length) return start(s, next);
  // Конец очереди: по кругу, если включён повтор (или если трек переключили вручную).
  if (s.repeat !== 'off' || !auto) return start(s, 0);
  return { ...s, playing: false, index: 0 };
}

// Убирает из очереди и атмосферы файлы, которых больше нет в хранилище.
function prune(s: MusicState, ctx: ModuleContext): MusicState {
  const tree = ctx.vault.tree;
  if (!tree) return s;
  const exists = new Set(allFiles(tree, 'audio').map((f) => f.path));
  const current = s.queue[s.index];
  const queue = s.queue.filter((p) => exists.has(p));
  // Встроенные звуки (sound:…) — вне хранилища, их не проверяем.
  const ambience = s.ambience.filter((a) => exists.has(a.path) || isBuiltinSound(a.path));
  if (queue.length === s.queue.length && ambience.length === s.ambience.length) return s;
  const kept = current ? queue.indexOf(current) : -1;
  const next = { ...s, queue, ambience };
  if (kept >= 0) return { ...next, index: kept };
  // Текущий трек удалили: играем то, что встало на его место.
  if (!queue.length) return { ...next, index: 0, playing: false, playlist: null };
  return { ...next, index: Math.min(s.index, queue.length - 1), seq: s.seq + 1 };
}

// Перемешать очередь (текущий трек остаётся первым) или вернуть порядок папки.
function setShuffle(s: MusicState, shuffle: boolean, ctx: ModuleContext): MusicState {
  if (shuffle === s.shuffle) return s;
  const current = s.queue[s.index];
  let queue = s.queue;
  if (shuffle) {
    queue = shuffled(s.queue.filter((p) => p !== current));
    if (current) queue = [current, ...queue];
  } else {
    const f = s.playlist !== null && ctx.vault.tree ? findFolder(ctx.vault.tree, s.playlist) : null;
    if (f) queue = allFiles(f, 'audio').map((x) => x.path).filter((p) => s.queue.includes(p));
  }
  const index = current ? Math.max(0, queue.indexOf(current)) : 0;
  return { ...s, shuffle, queue, index };
}

const initialState: MusicState = {
  playlist: null,
  queue: [],
  index: 0,
  playing: false,
  seq: 0,
  volume: 0.8,
  repeat: 'all',
  shuffle: false,
  crossfade: 3,
  ambience: [],
  ambiencePlaying: false,
  ambienceVolume: 0.8,
};

export default defineModule({
  id: 'music',
  persist: true,
  initialState,

  // После запуска ничего не играет само: музыка включается, когда мастер нажмёт «играть».
  init: (s, ctx) => prune({ ...s, playing: false, ambiencePlaying: false }, ctx),
  onTreeChange: prune,

  actions: {
    // Играть папку (со вложенными), начиная с трека start, если он задан.
    playFolder(s, { folder, start: first }: { folder: string; start?: string }, ctx) {
      const f = ctx.vault.tree && findFolder(ctx.vault.tree, folder);
      if (!f) return s;
      let queue = allFiles(f, 'audio').map((x) => x.path);
      if (!queue.length) return s;
      if (s.shuffle) {
        queue = shuffled(queue);
        // Выбранный трек — первым.
        if (first && queue.includes(first)) queue = [first, ...queue.filter((p) => p !== first)];
      }
      const index = first ? Math.max(0, queue.indexOf(first)) : 0;
      return start({ ...s, playlist: folder, queue }, index);
    },

    // Один трек отдельно от папки (из подборки правой панели): очередь — только он, с повтором — по кругу.
    // playlist тогда — путь самого трека.
    playTrack(s, { path }: { path: string }) {
      return start({ ...s, playlist: path, queue: [path] }, 0);
    },

    jump(s, { index }: { index: number }) {
      return index >= 0 && index < s.queue.length ? start(s, index) : s;
    },

    playPause(s) {
      return s.queue.length ? { ...s, playing: !s.playing } : s;
    },

    stop(s) {
      return { ...s, playing: false };
    },

    next(s) {
      return advance(s, false);
    },

    prev(s) {
      if (!s.queue.length) return s;
      return start(s, s.index > 0 ? s.index - 1 : s.queue.length - 1);
    },

    // Сообщение проигрывателя: трек доиграл (или подошёл к концу на время перехода).
    ended(s, { seq }: { seq: number }) {
      // Устаревшее сообщение (трек уже сменили) не должно перескакивать через трек.
      return seq === s.seq ? advance(s, true) : s;
    },

    setVolume(s, { value }: { value: number }) {
      return { ...s, volume: clamp01(value) };
    },

    setRepeat(s, { repeat }: { repeat: Repeat }) {
      return { ...s, repeat };
    },

    // Перемешать очередь (текущий трек остаётся играть) или вернуть порядок папки.
    toggleShuffle(s, _: void, ctx) {
      return setShuffle(s, !s.shuffle, ctx);
    },

    setShuffle(s, { value }: { value: boolean }, ctx) {
      return setShuffle(s, value, ctx);
    },

    // Задать атмосферу целиком (например, при включении сцены). Пустой список — тишина.
    setAmbience(s, { loops }: { loops: AmbientLoop[] }) {
      return { ...s, ambience: loops, ambiencePlaying: loops.length > 0 };
    },

    setCrossfade(s, { seconds }: { seconds: number }) {
      return { ...s, crossfade: Math.min(10, Math.max(0, seconds)) };
    },

    // Атмосфера: добавить звук (сразу начинает играть) или убрать, если он уже есть.
    toggleAmbient(s, { path }: { path: string }) {
      if (s.ambience.some((a) => a.path === path)) {
        return { ...s, ambience: s.ambience.filter((a) => a.path !== path) };
      }
      return { ...s, ambience: [...s.ambience, { path, volume: 0.7 }], ambiencePlaying: true };
    },

    setAmbientVolume(s, { path, value }: { path: string; value: number }) {
      return { ...s, ambience: s.ambience.map((a) => (a.path === path ? { ...a, volume: clamp01(value) } : a)) };
    },

    setAmbienceVolume(s, { value }: { value: number }) {
      return { ...s, ambienceVolume: clamp01(value) };
    },

    toggleAmbience(s) {
      return s.ambience.length ? { ...s, ambiencePlaying: !s.ambiencePlaying } : s;
    },

    clearAmbience(s) {
      return { ...s, ambience: [], ambiencePlaying: false };
    },
  },
});
