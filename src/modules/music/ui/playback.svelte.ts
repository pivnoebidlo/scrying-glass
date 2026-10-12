// Состояние проигрывателя, которое живёт только в окне управления: позиция в треке и громкость,
// пока ползунок тянут (в ядро она уходит, когда ползунок отпустят).
export const playback = $state({ time: 0, duration: 0 });

export const live = $state({
  volume: null as number | null,
  ambienceVolume: null as number | null,
  ambient: {} as Record<string, number>,
});

let seekImpl: (t: number) => void = () => {};
export const seek = (t: number) => seekImpl(t);
export const provideSeek = (fn: (t: number) => void) => (seekImpl = fn);

// Плавное изменение громкости. Через setInterval, а не requestAnimationFrame: rAF останавливается,
// когда окно свёрнуто, и звук застрял бы посреди перехода.
const fades = new Map<HTMLAudioElement, ReturnType<typeof setInterval>>();

export function fade(a: HTMLAudioElement, to: () => number, ms: number, done?: () => void) {
  clearInterval(fades.get(a));
  const from = a.volume;
  const t0 = performance.now();
  const step = () => {
    const k = ms > 0 ? Math.min(1, (performance.now() - t0) / ms) : 1;
    a.volume = Math.min(1, Math.max(0, from + (to() - from) * k));
    if (k >= 1) {
      clearInterval(fades.get(a));
      fades.delete(a);
      done?.();
    }
  };
  fades.set(a, setInterval(step, 30));
  step();
}

export const isFading = (a: HTMLAudioElement) => fades.has(a);

export function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
