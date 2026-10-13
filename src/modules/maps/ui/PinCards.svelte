<!-- Карточки, привязанные к метке: кто здесь живёт или кого тут встретят. Щелчок открывает карточку сбоку,
     поле ниже ищет карточки по имени (сначала своего приключения). -->
<script lang="ts">
  import { Link, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { cardImageUrl, refKey, sameRef, type CardRef } from '../../../shared/cards';
  import { thumb } from '../../../shared/vault';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import type { MapPin } from '../types';
  import CardSearch from './CardSearch.svelte';

  let { path, pin }: { path: string; pin: MapPin } = $props();

  onMount(connectCards);

  const linked = $derived((pin.cards ?? []).map((ref) => ({ ref, card: bestiary.all.find((c) => sameRef(c.ref, ref)) })));
  const set = (cards: CardRef[]) => dispatch('maps', 'updatePin', { path, id: pin.id, changes: { cards } });
</script>

<div class="cards">
  {#each linked as l (refKey(l.ref))}
    <div class="chip">
      <button class="open" title="Открыть карточку" disabled={!l.card} onclick={() => bestiary.show(l.ref)}>
        {#if l.card?.portrait}<img src={thumb(cardImageUrl(l.card.ref.scope, l.card.portrait), 32)} alt="" />{:else}<Link size={12} />{/if}
        <span class:faint={!l.card}>{l.card?.name ?? 'карточки больше нет'}</span>
      </button>
      <button class="icon-btn" title="Отвязать" onclick={() => set((pin.cards ?? []).filter((r) => !sameRef(r, l.ref)))}><X size={12} /></button>
    </div>
  {/each}

  <CardSearch placeholder="Привязать карточку: трактирщик, стража…" exclude={pin.cards ?? []} onpick={(c) => set([...(pin.cards ?? []), c.ref])} />
</div>

<style>
  .cards {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .open {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    padding: 3px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: var(--bg-active);
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .open span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .open img {
    flex: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }
</style>
