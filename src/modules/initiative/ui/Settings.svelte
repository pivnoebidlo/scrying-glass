<!-- Раздел настроек «Инициатива»: как выглядит полоса очерёдности на экране игроков. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { StripPosition } from '../types';

  let { ms }: ModuleProps<'initiative'> = $props();
  const d = $derived(ms.display);
  let size = $state(0);
  $effect.pre(() => {
    size = d.size;
  });
</script>

<div class="setting">
  <div class="info">
    <div class="name">Размер портретов</div>
    <div class="desc">Полоса очерёдности на экране игроков: портреты и подписи. Сейчас — ×{size.toFixed(1)}.</div>
  </div>
  <div class="slider">
    <Slider value={size} min={0.8} max={3} step={0.1} oninput={(v) => (size = v)} onchange={(v) => dispatch('initiative', 'setDisplay', { size: v })} />
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Где полоса</div>
    <div class="desc">Её можно быстро переставить и кнопками в заголовке вкладки «Инициатива».</div>
  </div>
  <select value={d.position ?? 'top'} onchange={(e) => dispatch('initiative', 'setDisplay', { position: e.currentTarget.value as StripPosition })}>
    <option value="top">Сверху</option>
    <option value="bottom">Снизу</option>
    <option value="left">Слева</option>
    <option value="right">Справа</option>
  </select>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Имена под портретами</div>
    <div class="desc">Длинные имена переносятся на вторую строку.</div>
  </div>
  <input type="checkbox" checked={d.names} onchange={(e) => dispatch('initiative', 'setDisplay', { names: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">Ранения на портретах</div>
    <div class="desc">
      Портрет краснеет по мере потери хитов — так игроки видят, насколько ранен противник (числа не показываются).
      Побеждённые остаются на полосе серыми. Для отдельного участника ранения можно скрыть кнопкой с сердцем в трекере.
    </div>
  </div>
  <input type="checkbox" checked={d.wounds} onchange={(e) => dispatch('initiative', 'setDisplay', { wounds: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">Цвет обводки</div>
    <div class="desc">
      <span class="sw" style:--c="#e8b94a"></span> партия · <span class="sw" style:--c="#4f8de8"></span> союзник ·
      <span class="sw" style:--c="#9aa0a8"></span> нейтрал · <span class="sw" style:--c="#e04545"></span> противник. Чей ход —
      портрет крупнее и светится.
    </div>
  </div>
</div>

<style>
  .slider {
    width: 220px;
  }
  .sw {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid var(--c);
    border-radius: 50%;
    vertical-align: -1px;
  }
</style>
