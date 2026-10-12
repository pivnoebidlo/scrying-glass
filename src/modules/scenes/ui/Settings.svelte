<!-- Раздел настроек «Сцены». -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'scenes'> = $props();
  const mod = navigator.platform.startsWith('Mac') ? '⌘' : 'Ctrl+';
</script>

<div class="setting">
  <div class="info">
    <div class="name">Переход через затемнение</div>
    <div class="desc">При смене сцены экран игроков на мгновение гаснет, а затем показывает новую сцену целиком.</div>
  </div>
  <input type="checkbox" checked={ms.throughBlack} onchange={(e) => dispatch('scenes', 'setThroughBlack', { value: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">Горячие клавиши</div>
    <div class="desc">{mod}1 … {mod}9 включают первые девять сцен. Порядок сцен меняется перетаскиванием в списке слева.</div>
  </div>
</div>
