<!-- Боковая панель инициативы: текущий бой и заготовки боёв текущего приключения (и общие). -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Plus, Swords, Sword } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { newEncounterName, ui } from './ui.svelte';
  import { adventureHidden } from '../../../shared/adventures';

  let { ms, app }: ModuleProps<'initiative'> = $props();

  // Заготовки текущего приключения и общие; без приключения — все. Если папка больше не приключение — тоже видна.
  const adv = $derived(app.adventures);
  const list = $derived(
    ms.encounters.filter(
      (e) =>
        e.adventure === null ||
        (!adventureHidden(adv, e.adventure) && (adv.current === null || e.adventure === adv.current || !adv.list.includes(e.adventure)))
    )
  );
  const running = $derived(ms.turn !== null);

  function create() {
    const id = crypto.randomUUID();
    dispatch('initiative', 'createEncounter', { id, name: newEncounterName(ms), adventure: app.adventures.current });
    ui.encounter = id;
  }
  // A row's menu (a right click): its actions.
  let rowMenu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const rowMenuAt = (e: MouseEvent, items: MenuItem[]) => (rowMenu = { ...menuAt(e), items });
  function encounterMenu(e: MouseEvent, id: string, name: string, count: number) {
    ui.encounter = id;
    rowMenuAt(e, [
      { label: t('init.toFight'), icon: Swords, disabled: !count, action: () => void dispatch('initiative', 'startEncounter', { id }).then(() => (ui.encounter = null)) },
      {
        label: t('init.deleteEnc'),
        icon: Trash2,
        danger: true,
        action: () => {
          if (!confirm(t('init.deleteEncounter', { name }))) return;
          ui.encounter = null;
          void dispatch('initiative', 'deleteEncounter', { id });
        },
      },
    ]);
  }
</script>

<div class="list">
  <button class="item" data-nav class:active={ui.encounter === null} onclick={() => (ui.encounter = null)}>
    <Swords size={14} />
    <span class="name">{t('init.currentFight')}</span>
    <span class="count">{running ? t('init.roundShort', { n: ms.round }) : ms.combatants.length || ''}</span>
  </button>

  <div class="section">
    <span>{t('init.prepared')}</span>
    <button class="icon-btn" title={t('init.newEncounter')} onclick={create}><Plus size={14} /></button>
  </div>
  {#each list as e (e.id)}
    <button class="item" data-nav class:active={ui.encounter === e.id} onclick={() => (ui.encounter = e.id)} oncontextmenu={(ev) => encounterMenu(ev, e.id, e.name, e.combatants.length)}>
      <Sword size={14} />
      <span class="name">{e.name}</span>
      <span class="count">{e.combatants.length}</span>
    </button>
  {:else}
    <p class="hint faint">
      <Lead text={t('init.sidebarHint')} />
    </p>
  {/each}
</div>

{#if rowMenu}<ContextMenu x={rowMenu.x} y={rowMenu.y} items={rowMenu.items} onclose={() => (rowMenu = null)} />{/if}

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
