<!-- Вид полосы очерёдности на экране игроков — прямо в трекере: где она и какого размера.
     Остальное (имена, ранения) — в настройках «Инициативы». -->
<script lang="ts">
  import { PanelBottom, PanelLeft, PanelRight, PanelTop } from '@lucide/svelte';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { StripPosition, StripSettings } from '../types';

  let { d }: { d: StripSettings } = $props();

  const POSITIONS: [StripPosition, string, typeof PanelTop][] = [
    ['top', 'Полоса сверху', PanelTop],
    ['bottom', 'Полоса снизу', PanelBottom],
    ['left', 'Полоса слева', PanelLeft],
    ['right', 'Полоса справа', PanelRight],
  ];

  // Пока тянут ползунок — число меняется сразу, в состояние уходит, когда отпустили.
  let size = $state(0);
  $effect.pre(() => {
    size = d.size;
  });
</script>

<div class="strip" title="Полоса очерёдности на экране игроков">
  {#each POSITIONS as [pos, title, Icon] (pos)}
    <button class="icon-btn" class:active={(d.position ?? 'top') === pos} {title} onclick={() => dispatch('initiative', 'setDisplay', { position: pos })}>
      <Icon size={15} />
    </button>
  {/each}
  <div class="size" title="Размер портретов на экране игроков: ×{size.toFixed(1)}">
    <Slider value={size} min={0.8} max={3} step={0.1} oninput={(v) => (size = v)} onchange={(v) => dispatch('initiative', 'setDisplay', { size: v })} />
  </div>
</div>

<style>
  .strip {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .active {
    background: var(--bg-active);
    color: var(--accent);
  }
  .size {
    width: 90px;
    margin-left: 6px;
  }
</style>
