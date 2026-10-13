<!-- Правая панель: текущий фон. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { prettyName, vaultUrl, thumb } from '../../../shared/vault';

  let { ms }: ModuleProps<'scene'> = $props();
</script>

{#if ms.background}
  <div class="row">
    <img src={thumb(vaultUrl(ms.background), 80)} alt="" />
    <span class="name" title={ms.background}>{prettyName(ms.background)}</span>
    <button class="icon-btn" title="Убрать фон" onclick={() => dispatch('scene', 'clear')}><X size={14} /></button>
  </div>
  <div class="seg" role="radiogroup" aria-label="Размещение">
    <button class:active={ms.fit === 'contain'} onclick={() => dispatch('scene', 'setFit', { fit: 'contain' })}>Вписать</button>
    <button class:active={ms.fit === 'cover'} onclick={() => dispatch('scene', 'setFit', { fit: 'cover' })}>Заполнить</button>
  </div>
{:else}
  <div class="faint">Нет. Наведите на картинку и нажмите «на весь экран».</div>
{/if}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  img {
    width: 48px;
    height: 32px;
    border-radius: var(--radius-s);
    object-fit: cover;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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
