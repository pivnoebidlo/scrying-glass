<!-- Боковая панель инициативы: текущий бой и заготовки боёв текущего приключения (и общие). -->
<script lang="ts">
  import { Plus, Swords, Sword } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { newEncounterName, ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'initiative'> = $props();

  // Заготовки текущего приключения и общие; без приключения — все. Если папка больше не приключение — тоже видна.
  const adv = $derived(app.adventures);
  const list = $derived(
    ms.encounters.filter((e) => adv.current === null || e.adventure === null || e.adventure === adv.current || !adv.list.includes(e.adventure))
  );
  const running = $derived(ms.turn !== null);

  function create() {
    const id = crypto.randomUUID();
    dispatch('initiative', 'createEncounter', { id, name: newEncounterName(ms), adventure: app.adventures.current });
    ui.encounter = id;
  }
</script>

<div class="list">
  <button class="item" class:active={ui.encounter === null} onclick={() => (ui.encounter = null)}>
    <Swords size={14} />
    <span class="name">Текущий бой</span>
    <span class="count">{running ? `раунд ${ms.round}` : ms.combatants.length || ''}</span>
  </button>

  <div class="section">
    <span>Заготовки</span>
    <button class="icon-btn" title="Новая заготовка боя" onclick={create}><Plus size={14} /></button>
  </div>
  {#each list as e (e.id)}
    <button class="item" class:active={ui.encounter === e.id} onclick={() => (ui.encounter = e.id)}>
      <Sword size={14} />
      <span class="name">{e.name}</span>
      <span class="count">{e.combatants.length}</span>
    </button>
  {:else}
    <p class="hint faint">
      Подготовьте бой заранее: «+», добавьте противников, а когда бой случится — «В бой». Текущий бой можно сохранить
      как заготовку кнопкой в его заголовке.
    </p>
  {/each}
</div>

<style>
  .list {
    padding: 0 6px;
  }
  .section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 14px 0 2px;
    padding: 0 2px 0 8px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .item.active {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    color: var(--text-faint);
    font-size: 12px;
  }
  .hint {
    margin: 4px 8px;
    font-size: 12px;
  }
</style>
