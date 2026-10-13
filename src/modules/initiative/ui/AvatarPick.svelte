<!-- Портрет участника в таблице боя. Если у его карточки несколько картинок, по нажатию можно выбрать другую:
     четыре разбойника — четыре разных лица. -->
<script lang="ts">
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { sameRef } from '../../../shared/cards';
  import { assetUrl } from '../../../shared/vault';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { onMount } from 'svelte';
  import type { Combatant } from '../types';
  import Avatar from './Avatar.svelte';

  // encounter — участник заготовки боя.
  let { c, encounter }: { c: Combatant; encounter?: string } = $props();

  onMount(connectCards);
  const images = $derived(c.card ? (bestiary.all.find((x) => sameRef(x.ref, c.card))?.images ?? []) : []);
  let open = $state(false);
  let root = $state<HTMLElement>();

  function pick(p: string) {
    dispatch('initiative', 'update', { id: c.id, changes: { portrait: p }, encounter });
    open = false;
  }

  // Клик мимо или Esc — закрыть.
  function onpointerdown(e: PointerEvent) {
    if (open && root && !root.contains(e.target as Node)) open = false;
  }
  function onkeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') {
      e.stopPropagation();
      open = false;
    }
  }
</script>

<svelte:window {onpointerdown} {onkeydown} />

{#if images.length > 1}
  <span class="wrap" bind:this={root}>
    <button class="pick" title="Выбрать другую картинку карточки" onclick={() => (open = !open)}><Avatar {c} /></button>
    {#if open}
      <div class="menu">
        {#each images as p (p)}
          <button class="opt" class:on={p === c.portrait} onclick={() => pick(p)}><img src={assetUrl(p)} alt="" /></button>
        {/each}
      </div>
    {/if}
  </span>
{:else}
  <Avatar {c} />
{/if}

<style>
  .wrap {
    position: relative;
    display: inline-block;
  }
  .pick {
    display: block;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    cursor: pointer;
  }
  .pick:hover {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .menu {
    position: absolute;
    top: calc(100% + 6px);
    left: -6px;
    z-index: 20;
    display: grid;
    grid-template-columns: repeat(4, 56px);
    gap: 6px;
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .opt {
    width: 56px;
    height: 56px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-s);
    background: none;
    overflow: hidden;
    cursor: pointer;
  }
  .opt:hover {
    border-color: var(--border);
  }
  .opt.on {
    border-color: var(--accent);
  }
  .opt img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
