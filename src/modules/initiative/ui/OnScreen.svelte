<!-- Правая панель: заготовки боёв под рукой (подборка) и чей ход. -->
<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { defeated, ordered } from '../order';
  import Avatar from './Avatar.svelte';
  import { Swords } from '@lucide/svelte';
  import TrayChips from '../../scenes/ui/TrayChips.svelte';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'initiative'> = $props();

  // Подборка: заготовки боёв. Щелчок — участники в бой (дальше — инициатива во вкладке); идущий — к вкладке.
  const inFight = (id: string) => ms.combatants.some((c) => c.encounter === id);
  async function start(id: string) {
    if (!inFight(id)) await dispatch('initiative', 'startEncounter', { id });
    ui.encounter = null;
    openTab('initiative');
  }
  const here = $derived(ms.encounters.filter((e) => !e.adventure || app.adventures.current === null || e.adventure === app.adventures.current));
  const options = () => here.map((e) => ({ id: e.id, title: e.name, sub: `участников: ${e.combatants.length}${e.adventure && app.adventures.current === null ? ` · ${e.adventure}` : ''}` }));
  const list = $derived(ordered(ms.combatants));
  const i = $derived(list.findIndex((c) => c.id === ms.turn));
  const current = $derived(list[i]);
  // Следующий живой после текущего.
  const next = $derived(i < 0 ? undefined : [...list.slice(i + 1), ...list.slice(0, i)].find((c) => !defeated(c)));
</script>

<TrayChips
  {app}
  part="encounters"
  isOn={inFight}
  toggle={start}
  {options}
  caption={(id) => ms.encounters.find((e) => e.id === id)?.name ?? null}
  iconOf={() => Swords}
  pickTitle="Заготовки боёв"
  hint="Бои под рукой: крысы или гоблины — щелчок добавляет участников в бой."
/>

{#if current}
  <div class="row turn">
    <Avatar c={current} size="32px" />
    <div class="who">
      <div class="name">{current.name}</div>
      <div class="faint sub">Раунд {ms.round}{next ? ` · дальше ${next.name}` : ''}</div>
    </div>
    <button class="icon-btn" title="Предыдущий ход" onclick={() => dispatch('initiative', 'prev')}><ChevronLeft size={16} /></button>
    <button class="btn primary" title="Следующий ход" onclick={() => dispatch('initiative', 'next')}><ChevronRight size={16} /></button>
  </div>
{:else}
  <div class="faint turn">
    Бой не идёт.
    {#if list.length}<button class="link" onclick={() => openTab('initiative')}>Участников: {list.length}</button>{/if}
  </div>
{/if}

<style>
  .turn {
    margin-top: 10px;
  }
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
