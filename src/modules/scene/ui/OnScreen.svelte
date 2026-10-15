<!-- Правая панель: фоны под рукой (подборка) — щелчок выводит на экран и убирает; размещение текущего. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import Tray from '../../scenes/ui/Tray.svelte';

  let { ms, app }: ModuleProps<'scene'> = $props();
</script>

<Tray
  {app}
  part="background"
  prefer="backgrounds"
  wide
  isOn={(p) => ms.background === p}
  toggle={(p) => (ms.background === p ? dispatch('scene', 'clear') : dispatch('scene', 'show', { path: p }))}
  hint="Фоны под рукой: перетащите сюда картинки из вкладок или добавьте кнопкой."
>
  {#if ms.background}
    <div class="seg" role="radiogroup" aria-label="Размещение">
      <button class:active={ms.fit === 'contain'} onclick={() => dispatch('scene', 'setFit', { fit: 'contain' })}>Вписать</button>
      <button class:active={ms.fit === 'cover'} onclick={() => dispatch('scene', 'setFit', { fit: 'cover' })}>Заполнить</button>
    </div>
  {/if}
</Tray>

<style>
  .seg {
    display: flex;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    flex: 1;
    padding: 3px 0;
    border: 0;
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg button.active {
    background: var(--bg-active);
    color: var(--text-normal);
  }
</style>
