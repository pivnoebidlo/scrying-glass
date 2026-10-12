<!-- Под портретом во вкладке «Персонажи»: карточка NPC (статблок, в инициативу) или кнопка её создать.
     Карточка привязана к портрету, если эта картинка — её основной портрет. -->
<script lang="ts">
  import { FilePlus, ScrollText, Swords } from '@lucide/svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { addToInitiative } from '../../bestiary/ui/combat';

  let { path, name }: { path: string; name: string } = $props();

  const card = $derived(bestiary.cardFor(path));

  async function fight() {
    if (!card) return;
    await addToInitiative(card);
    openTab('initiative');
  }
</script>

<div class="bar">
  {#if card}
    <button class="card" title="Открыть статблок" onclick={() => bestiary.show(card.ref)}>
      <ScrollText size={12} />
      <span class="sub">{card.subtitle}</span>
    </button>
    <button class="icon-btn" title="В инициативу ({card.side === 'ally' ? 'союзник' : 'противник'})" onclick={fight}><Swords size={13} /></button>
  {:else}
    <button class="create" title="Статблок, описание и заметки для этого персонажа" onclick={() => bestiary.createFor(path, name)}>
      <FilePlus size={12} /> Создать карточку
    </button>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px 4px;
  }
  .card,
  .create {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 4px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    text-align: left;
    cursor: pointer;
  }
  .card:hover,
  .create:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .create {
    color: var(--text-faint);
  }
  .sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .icon-btn {
    width: 24px;
    height: 24px;
  }
</style>
