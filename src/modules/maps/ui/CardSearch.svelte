<!-- Поле поиска карточки по имени с подсказками (сначала карточки приключения, потом библиотека и SRD).
     Общее для привязки карточек к метке и для жетонов. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { cardImageUrl, refKey, sameRef, type CardRef, type CardSummary } from '../../../shared/cards';
  import { thumb } from '../../../shared/vault';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { suggest } from '../../initiative/ui/quick';

  let { placeholder, exclude = [], onpick }: { placeholder: string; exclude?: CardRef[]; onpick: (c: CardSummary) => void } = $props();

  onMount(connectCards);

  let query = $state('');
  let focused = $state(false);
  let active = $state(0);
  const hints = $derived((bestiary.all, suggest(query).filter((c) => !exclude.some((r) => sameRef(r, c.ref)))));
  const open = $derived(focused && hints.length > 0);
  $effect(() => {
    query;
    active = 0;
  });

  function pick(c: CardSummary) {
    onpick(c);
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

<div class="find">
  <input
    type="text"
    {placeholder}
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

<style>
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
