<!-- Проигрыватель: невидимый, живёт в окне управления, пока открыто хранилище.
     Музыка играет на двух «деках», чтобы треки могли плавно переходить друг в друга. -->
<script lang="ts">
  import { matches } from '../../../shared/hotkeys';
  import { untrack } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { vaultUrl, assetUrl } from '../../../shared/vault';
  import { fade, isFading, live, playback, provideSeek } from './playback.svelte';
  import { output, route, watchDevices } from './output.svelte';

  let { ms }: ModuleProps<'music'> = $props();

  const FADE_MS = 400;
  const decks = [new Audio(), new Audio()];
  let active = 0;
  let currentSeq = -1;
  let lastPlaying = false;
  let endSent = -1;
  let errors = 0;

  const volume = $derived(live.volume ?? ms.volume);
  const deck = () => decks[active]!;

  // ---- Смена трека ----
  function startTrack(seq: number, path: string | undefined) {
    if (seq === currentSeq) return;
    currentSeq = seq;
    lastPlaying = ms.playing;
    endSent = -1;
    const old = deck();
    if (!path) {
      fade(old, () => 0, FADE_MS, () => old.pause());
      return;
    }
    active = 1 - active;
    const next = deck();
    next.src = vaultUrl(path);
    next.volume = 0;
    playback.time = 0;
    playback.duration = 0;
    const ms_ = Math.max(ms.crossfade * 1000, 50);
    if (ms.playing) {
      next.play().catch(() => {});
      fade(next, () => volume, ms_);
    }
    if (!old.paused) fade(old, () => 0, ms_, () => old.pause());
  }

  // ---- Пауза / продолжение ----
  function setPlaying(playing: boolean) {
    if (playing === lastPlaying) return;
    lastPlaying = playing;
    const a = deck();
    if (!a.src) return;
    if (playing) {
      if (a.paused) a.play().catch(() => {});
      fade(a, () => volume, FADE_MS);
    } else {
      for (const d of decks) if (!d.paused) fade(d, () => 0, FADE_MS, () => d.pause());
    }
  }

  $effect(() => {
    const seq = ms.seq;
    const path = ms.queue[ms.index];
    untrack(() => startTrack(seq, path));
  });

  $effect(() => {
    const playing = ms.playing;
    untrack(() => setPlaying(playing));
  });

  // Громкость: сразу, если не идёт переход (переход сам придёт к новой громкости).
  $effect(() => {
    const v = volume;
    untrack(() => {
      const a = deck();
      if (!a.paused && !isFading(a)) a.volume = v;
    });
  });

  // ---- События дек ----
  function onTime(e: Event) {
    const a = e.currentTarget as HTMLAudioElement;
    if (a !== deck()) return;
    playback.time = a.currentTime;
    playback.duration = isFinite(a.duration) ? a.duration : 0;
    // Переход начинается заранее, за crossfade секунд до конца. Кроме последнего трека без повтора:
    // его нужно доиграть до конца.
    const cf = ms.crossfade;
    const last = ms.index === ms.queue.length - 1 && ms.repeat === 'off';
    if (cf > 0 && !last && a.duration > cf * 2 && a.duration - a.currentTime <= cf) sendEnded();
  }

  function sendEnded() {
    if (endSent === currentSeq) return;
    endSent = currentSeq;
    dispatch('music', 'ended', { seq: currentSeq });
  }

  function onEnded(e: Event) {
    if (e.currentTarget === deck()) sendEnded();
  }

  // Файл не читается: пропускаем. Если не читается вся очередь, останавливаемся, а не крутимся по кругу.
  function onError(e: Event) {
    if (e.currentTarget !== deck() || !ms.playing) return;
    errors++;
    if (errors >= ms.queue.length) {
      errors = 0;
      dispatch('music', 'stop');
    } else sendEnded();
  }

  function onPlaying() {
    errors = 0;
  }

  for (const d of decks) {
    d.addEventListener('timeupdate', onTime);
    d.addEventListener('ended', onEnded);
    d.addEventListener('error', onError);
    d.addEventListener('playing', onPlaying);
  }

  provideSeek((t) => {
    const a = deck();
    if (a.src) a.currentTime = t;
  });

  // ---- Атмосфера: по одному зацикленному звуку на каждый файл ----
  const loops = new Map<string, HTMLAudioElement>();

  $effect(() => {
    const items = ms.ambience.map((x) => ({ path: x.path, volume: live.ambient[x.path] ?? x.volume }));
    const master = (live.ambienceVolume ?? ms.ambienceVolume) * (ms.ambiencePlaying ? 1 : 0);
    untrack(() => {
      for (const [path, a] of loops) {
        if (!items.some((x) => x.path === path)) {
          loops.delete(path);
          fade(a, () => 0, FADE_MS, () => a.pause());
        }
      }
      for (const item of items) {
        let a = loops.get(item.path);
        if (!a) {
          a = new Audio(assetUrl(item.path));
          a.loop = true;
          a.volume = 0;
          route(a, output.sink);
          loops.set(item.path, a);
        }
        const target = item.volume * master;
        const el = a;
        if (target > 0 && el.paused) el.play().catch(() => {});
        fade(el, () => target, 600, () => target === 0 && el.pause());
      }
    });
  });

  // ---- Устройство вывода ----
  watchDevices();
  $effect(() => {
    const sink = output.sink;
    untrack(() => {
      for (const d of decks) route(d, sink);
      for (const a of loops.values()) route(a, sink);
    });
  });

  // ---- Горячие клавиши (не во время ввода текста) ----
  // ⌘P — пауза/продолжить, ⌘→ / ⌘← — следующий/предыдущий трек, ⌘↑ / ⌘↓ — громкость, ⌘⇧A — атмосфера.
  const typing = (e: KeyboardEvent) =>
    e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement || (e.target as HTMLElement)?.isContentEditable;

  function onkeydown(e: KeyboardEvent) {
    if (typing(e)) return;
    const vol = (d: number) => dispatch('music', 'setVolume', { value: Math.round(Math.min(1, Math.max(0, ms.volume + d)) * 100) / 100 });
    // The combos — shared/hotkeys.ts (the GM may change them in Settings → Hotkeys).
    if (matches(e, 'playPause')) {
      if (ms.queue.length) dispatch('music', 'playPause');
    } else if (matches(e, 'nextTrack')) dispatch('music', 'next');
    else if (matches(e, 'prevTrack')) dispatch('music', 'prev');
    else if (matches(e, 'volumeUp')) vol(0.1);
    else if (matches(e, 'volumeDown')) vol(-0.1);
    else if (matches(e, 'ambience')) {
      if (ms.ambience.length) dispatch('music', 'toggleAmbience');
    } else return;
    e.preventDefault();
  }

  // Хранилище закрыли: всё замолкает.
  $effect(() => () => {
    for (const d of decks) d.pause();
    for (const a of loops.values()) a.pause();
  });
</script>

<svelte:window {onkeydown} />
