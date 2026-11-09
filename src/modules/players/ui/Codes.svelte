<!-- The players' screen: a QR code for every character of the party, so everyone opens their sheet before the game.
     A phone that has opened it gets a tick. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Check } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import Qr from './Qr.svelte';
  import { connectPlayers, players } from './players.svelte';

  let { ms }: ModuleProps<'players'> = $props();

  onMount(() => void connectPlayers());

  const s = $derived(players.status);
  const party = $derived(s.party);
  const shown = $derived(!!ms.codes && s.on && !!players.host && party.length > 0);
  // Rows of at most four, as square as the screen allows.
  const cols = $derived(party.length <= 4 ? party.length : Math.ceil(party.length / Math.ceil(party.length / 4)));
  const rows = $derived(Math.ceil(party.length / Math.max(1, cols)));
</script>

{#if shown}
  <div class="codes" transition:fade|global={{ duration: 300 }} style:--cols={cols} style:--rows={rows}>
    <h1>{t('pl.codesTitle')}</h1>
    <p>{t('pl.codesHint')}</p>
    <div class="grid">
      {#each party as row (row.token)}
        <div class="tile" class:done={row.clients > 0}>
          <div class="qr"><Qr text={players.urlOf(row)} /></div>
          <div class="name">
            {#if row.clients > 0}<Check size="1em" />{/if}
            {row.name}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .codes {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4cqh 4cqw;
    background: rgba(10, 10, 14, 0.94);
    color: #f2f2f2;
    font-family: system-ui, sans-serif;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-size: 5cqh;
    font-weight: 600;
  }
  p {
    margin: 1cqh 0 3cqh;
    font-size: 2.6cqh;
    color: #b8b8c0;
  }
  .grid {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(var(--cols), auto);
    align-content: center;
    justify-content: center;
    gap: 3cqh 4cqw;
  }
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2cqh;
  }
  /* The height decides: the rows must fit under the title, the names under the codes. */
  .qr {
    width: min(calc((92cqw - (var(--cols) - 1) * 4cqw) / var(--cols)), calc((78cqh - 14cqh) / var(--rows) - 7cqh));
    padding: 0.6cqh;
    border-radius: 1cqh;
    background: #fff;
  }
  .done .qr {
    opacity: 0.35;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 0.4em;
    font-size: 3cqh;
    font-weight: 600;
  }
  .done .name {
    color: #7ee08a;
  }
</style>
