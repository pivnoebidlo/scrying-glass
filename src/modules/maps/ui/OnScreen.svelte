<!-- Правая панель: какая карта у игроков. -->
<script lang="ts">
  import { Maximize, Pencil, X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { vaultUrl, thumb } from '../../../shared/vault';
  import { mapName } from '../library';
  import { FULL_VIEW } from '../types';
  import { ui } from './ui.svelte';

  let { ms }: ModuleProps<'maps'> = $props();
</script>

{#if ms.current}
  {@const path = ms.current}
  <div class="row">
    <img src={thumb(vaultUrl(path), 80)} alt="" />
    <span class="name" title={path}>{mapName(path)}</span>
    <button class="icon-btn" title="Открыть в редакторе" onclick={() => { ui.selected = path; openTab('maps'); }}><Pencil size={14} /></button>
    <button class="icon-btn" title="Игроки видят всю карту" onclick={() => dispatch('maps', 'setView', { path, view: FULL_VIEW })}><Maximize size={14} /></button>
    <button class="icon-btn" title="Убрать карту" onclick={() => dispatch('maps', 'clear')}><X size={14} /></button>
  </div>
{:else}
  <div class="faint">Нет. Откройте карту в «Картах» и нажмите «Показать игрокам».</div>
{/if}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
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
</style>
