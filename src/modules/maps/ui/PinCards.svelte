<!-- Карточки, привязанные к метке: кто здесь живёт или кого тут встретят. Щелчок открывает карточку сбоку,
     поле ниже ищет карточки по имени (сначала своего приключения). -->
<script lang="ts">
  import { thumb } from '../../../shared/vault';
  import { Link, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { cardImageUrl, refKey, sameRef, type CardRef, type CardSummary } from '../../../shared/cards';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { suggest } from '../../initiative/ui/quick';
  import type { MapPin } from '../types';

  let { path, pin }: { path: string; pin: MapPin } = $props();

  onMount(connectCards);

  const linked = $derived((pin.cards ?? []).map((ref) => ({ ref, card: bestiary.all.find((c) => sameRef(c.ref, ref)) })));

  let query = $state('');
  let focused = $state(false);
  let active = $state(0);
  const hints = $derived((bestiary.all, suggest(query).filter((c) => !(pin.cards ?? []).some((r) => sameRef(r, c.ref)))));
  const open = $derived(focused && hints.length > 0);
  $effect(() => {
    query;
    active = 0;
  });

  const set = (cards: CardRef[]) => dispatch('maps', 'updatePin', { path, id: pin.id, changes: { cards } });

  function pick(c: CardSummary) {
    set([...(pin.cards ?? []), c.ref]);
    query = '';
  }

  function onkeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') active = (active + 1) % hints.length;
    else if (e.key === 'ArrowUp') active = (active - 1 + hints.length) % hints.length;
    else if (e.key === 'Escape') focused = false;
    else if (e.key === 'Enter') pick(hints[active]!);
    else return;
    e.preventDefault();
  }
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

  <div class="find">
    <input
      type="text"
      placeholder="Привязать карточку: трактирщик, стража…"
      bind:value={query}
      onfocus={() => (focused = true)}
      onblur={() => setTimeout(() => (focused = false), 150)}
      oninput={() => (focused = true)}
      {onkeydown}
    />
    {#if open}
      <ul class="hints" role="listbox">
        {#each hints as c, i (refKey(c.ref))}
          <li>
            <button type="button" class="hint" class:active={i === active} onmousedown={(e) => e.preventDefault()} onclick={() => pick(c)} onmouseenter={() => (active = i)}>
              {#if c.portrait}<img src={thumb(cardImageUrl(c.ref.scope, c.portrait), 32)} alt="" />{:else}<span class="noimg"></span>{/if}
              <span class="n">{c.name}</span>
              {#if c.ref.scope === 'srd'}<span class="faint w">SRD</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
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
  .open img,
  .hint img,
  .noimg {
    flex: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }
  .noimg {
    background: var(--bg-active);
  }
  .find {
    position: relative;
  }
  .find input {
    width: 100%;
  }
  .hints {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    z-index: 30;
    max-height: 240px;
    margin: 0;
    padding: 4px;
    overflow: auto;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .hint {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 4px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .hint.active {
    background: var(--bg-active);
  }
  .n {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .w {
    font-size: 11px;
  }
</style>
