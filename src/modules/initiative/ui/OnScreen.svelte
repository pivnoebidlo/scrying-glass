<!-- Правая панель: чей ход. -->
<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { defeated, ordered } from '../order';
  import Avatar from './Avatar.svelte';

  let { ms }: ModuleProps<'initiative'> = $props();
  const list = $derived(ordered(ms.combatants));
  const i = $derived(list.findIndex((c) => c.id === ms.turn));
  const current = $derived(list[i]);
  // Следующий живой после текущего.
  const next = $derived(i < 0 ? undefined : [...list.slice(i + 1), ...list.slice(0, i)].find((c) => !defeated(c)));
</script>

{#if current}
  <div class="row">
    <Avatar c={current} size="32px" />
    <div class="who">
      <div class="name">{current.name}</div>
      <div class="faint sub">Раунд {ms.round}{next ? ` · дальше ${next.name}` : ''}</div>
    </div>
    <button class="icon-btn" title="Предыдущий ход" onclick={() => dispatch('initiative', 'prev')}><ChevronLeft size={16} /></button>
    <button class="btn primary" title="Следующий ход" onclick={() => dispatch('initiative', 'next')}><ChevronRight size={16} /></button>
  </div>
{:else}
  <div class="faint">
    Бой не идёт.
    {#if list.length}<button class="link" onclick={() => openTab('initiative')}>Участников: {list.length}</button>{/if}
  </div>
{/if}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .who {
    flex: 1;
    min-width: 0;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  .sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
  }
  .btn {
    padding: 5px 8px;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
</style>
