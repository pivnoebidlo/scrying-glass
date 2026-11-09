<!-- A pack system's character as a paper sheet — a picture sent to a player (Telegram): the portrait and the name over
     the sheet of the pack in two columns, as it is now at the table. Fixed width; the sender scales it to fit. -->
<script lang="ts">
  import { cardImageUrl, type Card, type CardScope } from '../../shared/cards';
  import { showOnly } from '../../renderer/lib/sheetusage.svelte';
  import Sheet from './Sheet.svelte';
  import { PARCHMENT } from './parchment';

  let { card, scope }: { card: Card<any>; scope: CardScope } = $props();

  // A picture: nothing to press, the table's values shown.
  showOnly();
  const portrait = $derived(card.portraits?.[0] ? cardImageUrl(scope, card.portraits[0]) : '');
</script>

<div class="paper" style={PARCHMENT}>
  <header>
    {#if portrait}<img class="portrait" src={portrait} alt="" />{/if}
    <h1>{card.name}</h1>
  </header>
  <div class="body"><Sheet {card} /></div>
</div>

<style>
  .paper {
    box-sizing: border-box;
    width: 1180px;
    padding: 26px 28px 30px;
    background:
      radial-gradient(ellipse at 20% 10%, rgba(255, 255, 255, 0.55), transparent 60%),
      radial-gradient(ellipse at 90% 90%, rgba(160, 120, 70, 0.25), transparent 55%),
      #f3e9d2;
    color: var(--text-normal);
    font-family: Georgia, 'Palatino', 'Times New Roman', serif;
    font-size: 14px;
    border: 2px solid #a08a68;
  }
  header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #6b5a45;
  }
  .portrait {
    width: 92px;
    height: 92px;
    border: 2px solid #6b5a45;
    border-radius: 8px;
    object-fit: cover;
  }
  h1 {
    margin: 0;
    font-size: 30px;
  }
  .body {
    columns: 2;
    column-gap: 32px;
  }
  .body :global(:is(h2, h3, h4)) {
    break-after: avoid;
  }
  .body :global(section) {
    break-inside: avoid-column;
  }
  /* A picture: a roll button reads as its value. */
  .body :global(button) {
    border: none;
    background: none;
    color: inherit;
    font: inherit;
  }
</style>
