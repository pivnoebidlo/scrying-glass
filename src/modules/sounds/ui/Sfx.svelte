<!-- Проигрыватель звуков (фоновый компонент окна управления): каждая команда «сыграть» — свой элемент Audio поверх
     музыки, на устройство вывода музыки. Тот же звук ещё раз — сначала (прежний обрывается); «остановить» — все. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { vaultUrl } from '../../../shared/vault';
  import { output, route } from '../../music/ui/output.svelte';
  import { fade } from '../../music/ui/playback.svelte';
  import { sfx } from './playing.svelte';

  let { ms }: ModuleProps<'sounds'> = $props();

  const active = new Map<string, HTMLAudioElement>();
  const sync = () => (sfx.playing = [...active.keys()]);

  function stop(path: string) {
    const a = active.get(path);
    if (!a) return;
    active.delete(path);
    fade(a, () => 0, 150, () => a.pause());
  }

  function play(path: string) {
    stop(path);
    const a = new Audio(vaultUrl(path));
    a.volume = sfx.volume ?? ms.volume;
    route(a, output.sink);
    a.onended = a.onerror = () => {
      if (active.get(path) === a) active.delete(path);
      sync();
    };
    active.set(path, a);
    a.play().catch(() => active.delete(path));
    sync();
  }

  // Команды после запуска окна; то, что было в состоянии до него, не играем.
  let seen = untrack(() => ms.last.seq);
  const last = $derived(ms.last);
  $effect(() => {
    const cmd = last;
    untrack(() => {
      if (cmd.seq === seen) return;
      seen = cmd.seq;
      if (cmd.path) play(cmd.path);
      else for (const p of [...active.keys()]) stop(p);
      sync();
    });
  });

  // Громкость — и у звучащих.
  const volume = $derived(sfx.volume ?? ms.volume);
  $effect(() => {
    const v = volume;
    untrack(() => {
      for (const a of active.values()) a.volume = v;
    });
  });

  $effect(() => {
    const sink = output.sink;
    untrack(() => {
      for (const a of active.values()) route(a, sink);
    });
  });
</script>
