<!-- Карточка (монстр, NPC, персонаж игрока) в списке «Файлов»: портрет, название, вид и тип; открыть, перенести,
     удалить вместе с её картинками. -->
<script lang="ts">
  import { ArrowRightLeft, ScrollText, Skull, Trash2, User, Users } from '@lucide/svelte';
  import { cardImageUrl, type CardSummary } from '../../../shared/cards';
  import { bestiary } from '../../bestiary/ui/cards.svelte';

  let { card }: { card: CardSummary } = $props();

  const KIND: Record<string, string> = { monster: 'монстр', npc: 'NPC', character: 'персонаж игрока' };
  const Icon = $derived(card.kind === 'monster' ? Skull : card.kind === 'character' ? Users : User);
</script>

<li class="card">
  <button class="main" title="Открыть карточку" onclick={() => bestiary.show(card.ref)}>
    {#if card.portrait}
      <img src={cardImageUrl(card.ref.scope, card.portrait)} alt="" loading="lazy" />
    {:else}
      <span class="noimg"><Icon size={16} /></span>
    {/if}
    <span class="text">
      <span class="name">{card.name}</span>
      <span class="sub">{KIND[card.kind] ?? card.kind} · {card.subtitle}</span>
    </span>
    <span class="file faint">{card.file?.split('/').pop()}</span>
  </button>
  <button class="icon-btn" title="Открыть карточку" onclick={() => bestiary.show(card.ref)}><ScrollText size={14} /></button>
  <button class="icon-btn" title="Перенести в другую папку или в библиотеку" onclick={() => bestiary.move(card.ref)}><ArrowRightLeft size={14} /></button>
  <button class="icon-btn trash" title="Удалить карточку (с её картинками — по выбору)" onclick={() => bestiary.remove(card.ref)}><Trash2 size={14} /></button>
</li>

<style>
  .card {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px;
    border-radius: var(--radius-s);
  }
  .card:hover {
    background: var(--bg-hover);
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 3px 4px;
    border: 0;
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  img,
  .noimg {
    flex: none;
    width: 30px;
    height: 40px;
    border-radius: var(--radius-s);
    object-fit: cover;
  }
  .noimg {
    display: grid;
    place-items: center;
    background: var(--bg-active);
    color: var(--text-faint);
  }
  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name,
  .sub,
  .file {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    color: var(--text-faint);
    font-size: 11px;
  }
  .file {
    max-width: 30%;
    font-size: 11px;
  }
  .trash:hover {
    color: var(--danger);
  }
</style>
