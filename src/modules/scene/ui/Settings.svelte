<!-- Раздел настроек «Фон». -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'scene'> = $props();
</script>

<div class="setting">
  <div class="info">
    <div class="name">Притенять фон под портретами</div>
    <div class="desc">Когда поверх фона показаны портреты, фон темнеет, чтобы портреты лучше читались.</div>
  </div>
  <input type="checkbox" checked={ms.dim} onchange={(e) => dispatch('scene', 'setDim', { value: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">Как показать картинку на весь экран</div>
    <div class="desc">
      Наведите на картинку в «Файлах» или «Портретах» и нажмите кнопку «на весь экран». В папках, которые не относятся к
      персонажам, на весь экран картинка выводится и просто кликом. Размещение (вписать или заполнить экран)
      переключается в панели «Экран игроков».
    </div>
  </div>
</div>
