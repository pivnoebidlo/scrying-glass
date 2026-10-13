<!-- Плитка монстра во вкладке «Персонажи»: портрет (клик — показать игрокам), название, «в бой» с количеством
     и статблок. Монстр без портрета — с заглушкой. -->
<script lang="ts">
  import { ScrollText, Skull, Swords } from '@lucide/svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { cardAsset, cardImageUrl, type CardSummary } from '../../../shared/cards';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { addToInitiative } from '../../bestiary/ui/combat';

  let { card }: { card: CardSummary } = $props();

  let count = $state(1);
  const asset = $derived(card.portrait ? cardAsset(card.ref.scope, card.portrait) : null);
  const onScreen = $derived(!!asset && store.state.portraits.onScreen.includes(asset));
  const inFight = $derived(store.state.initiative.combatants.filter((c) => c.card?.id === card.ref.id && c.card.scope === card.ref.scope).length);

  async function fight() {
    await addToInitiative(card, { count });
    openTab('initiative');
  }
</script>

<div class="tile" class:on={onScreen}>
  {#if asset && card.portrait}
    <button class="thumb" title={onScreen ? 'Убрать с экрана' : 'Показать портретом'} onclick={() => dispatch('portraits', 'toggle', { path: asset })}>
      <img src={cardImageUrl(card.ref.scope, card.portrait)} alt="" loading="lazy" />
    </button>
  {:else}
    <button class="thumb empty" title="Открыть статблок (портрета нет)" onclick={() => bestiary.show(card.ref)}><Skull size={32} /></button>
  {/if}
  <div class="badges">
    {#if onScreen}<span class="badge">портрет</span>{/if}
    {#if inFight}<span class="badge">в бою{inFight > 1 ? ` ×${inFight}` : ''}</span>{/if}
  </div>
  <div class="name" title={card.name}>{card.name}</div>
  <div class="bar">
    <button class="sub" title="Открыть статблок" onclick={() => bestiary.show(card.ref)}>
      <ScrollText size={12} /><span>{card.subtitle}</span>
    </button>
    <input class="count" type="number" min="1" max="20" bind:value={count} title="Сколько добавить в бой" />
    <button class="icon-btn" title="В инициативу" onclick={fight}><Swords size={13} /></button>
  </div>
</div>

<style>
  .tile {
    position: relative;
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    overflow: hidden;
  }
  .tile.on {
    border-color: var(--accent);
  }
  .thumb {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .thumb img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }
  .thumb.empty {
    display: grid;
    place-items: center;
    aspect-ratio: 3 / 4;
    background: var(--bg-hover);
    color: var(--text-faint);
  }
  .thumb.empty:hover {
    color: var(--text-muted);
  }
  .badges {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    gap: 4px;
    pointer-events: none;
  }
  .badge {
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
  }
  .name {
    padding: 6px 8px 0;
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px 4px;
  }
  .sub {
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
  .sub:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .sub span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    width: 40px;
    padding: 2px 4px;
    font-size: 11px;
    text-align: center;
  }
  .icon-btn {
    width: 24px;
    height: 24px;
  }
</style>
