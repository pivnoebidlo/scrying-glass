<!-- Под портретом во вкладке «Персонажи»: карточка NPC (статблок, в инициативу) или кнопка её создать.
     Карточка привязана к портрету, если эта картинка — её основной портрет. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { FilePlus, ScrollText, Swords } from '@lucide/svelte';
  import { systemUi } from '../../../systems/ui';
  import { currentSystem } from '../../../shared/adventures';
  import { store } from '../../../renderer/lib/store.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { SIDE_TITLES } from '../../../shared/cards';
  import { addToInitiative } from '../../bestiary/ui/combat';

  let { path, name }: { path: string; name: string } = $props();

  const card = $derived(bestiary.cardFor(path));
  // The system may start a card otherwise (D&D: from another stat block): the button asks how; else — a blank one.
  const ways = $derived(systemUi(currentSystem(store.state.adventures))?.newCard ?? []);
  let menu = $state(false);
  function create() {
    if (ways.length) menu = !menu;
    else bestiary.createFor(path, name);
  }

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
    <button class="create" title={t('portraits.createCardHint')} onclick={create}>
      <FilePlus size={12} /> {t('portraits.createCard')}
    </button>
    {#if menu}
      <div class="backdrop" role="presentation" onclick={() => (menu = false)}></div>
      <div class="menu">
        <button onclick={() => ((menu = false), bestiary.createFor(path, name))}><FilePlus size={13} /> {t('portraits.blankCard')}</button>
        {#each ways as w (w.label)}
          {@const Icon = w.icon}
          <button title={w.title} onclick={() => ((menu = false), w.run({ path, name }))}><Icon size={13} /> {w.short}</button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .bar {
    position: relative;
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
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 40;
  }
  .menu {
    position: absolute;
    top: calc(100% - 2px);
    left: 4px;
    z-index: 41;
    display: flex;
    flex-direction: column;
    min-width: 180px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    font: inherit;
    font-size: 12px;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--bg-hover);
  }
  .icon-btn {
    width: 24px;
    height: 24px;
  }
</style>
