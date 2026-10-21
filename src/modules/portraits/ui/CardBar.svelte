<!-- Под портретом во вкладке «Персонажи»: карточка NPC (статблок, в инициативу) или кнопка её создать.
     Карточка привязана к портрету, если эта картинка — её основной портрет. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { FilePlus, ScrollText, Swords, Wand2 } from '@lucide/svelte';
  import { isDnd } from '../../../systems';
  import { currentSystem } from '../../../shared/adventures';
  import { store } from '../../../renderer/lib/store.svelte';
  import { reshapeFor } from '../../tools/reshape/store.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { SIDE_TITLES } from '../../../shared/cards';
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
    <button class="card" title={t('common.openStatblock')} onclick={() => bestiary.show(card.ref)}>
      <ScrollText size={12} />
      <span class="sub">{card.subtitle}</span>
    </button>
    <button class="icon-btn" title={t('portraits.toInitiativeSide', { side: SIDE_TITLES[card.side].toLowerCase() })} onclick={fight}><Swords size={13} /></button>
  {:else}
    <button class="create" title={t('portraits.createCardHint')} onclick={() => bestiary.createFor(path, name)}>
      <FilePlus size={12} /> {t('portraits.createCard')}
    </button>
    <!-- A stat block made from another one (Tools → Reshape a stat block) — in D&D adventures. -->
    {#if isDnd(currentSystem(store.state.adventures))}
      <button class="icon-btn" title={t('portraits.fromStatblock')} onclick={() => reshapeFor(path, name)}><Wand2 size={13} /></button>
    {/if}
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
