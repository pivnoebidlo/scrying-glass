<!-- Невидимый компонент окна мастера: время вышло — три удара колокольчика (если звук включён). Звук идёт
     на устройство вывода музыки. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { output } from '../../music/ui/output.svelte';

  let { ms }: ModuleProps<'timer'> = $props();

  // Конец таймера, по которому уже звонили (пауза и добавка времени меняют конец — позвоним снова).
  let rung: number | null = null;
  const endsAt = $derived(ms.endsAt);
  const on = $derived(ms.active && ms.sound);

  $effect(() => {
    const end = endsAt;
    if (!on || end === null) return;
    const wait = end - Date.now();
    if (wait < -2000 || rung === end) return;
    const t = setTimeout(() => {
      rung = end;
      ring();
    }, Math.max(0, wait));
    return () => clearTimeout(t);
  });

  async function ring() {
    const ctx = new AudioContext();
    const sink = output.sink;
    // setSinkId у AudioContext есть в Chromium, но не в типах TypeScript.
    if (sink) await (ctx as AudioContext & { setSinkId?: (id: string) => Promise<void> }).setSinkId?.(sink).catch(() => {});
    for (let i = 0; i < 3; i++) {
      const t0 = ctx.currentTime + i * 0.55;
      for (const [f, v] of [[880, 0.25], [1320, 0.12], [2640, 0.05]] as const) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(v, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
        o.connect(g).connect(ctx.destination);
        o.start(t0);
        o.stop(t0 + 1.25);
      }
    }
    setTimeout(() => ctx.close(), 3000);
  }
</script>
