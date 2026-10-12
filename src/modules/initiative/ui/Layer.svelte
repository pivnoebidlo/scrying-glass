<!-- Экран игроков: полоса очерёдности сверху. Хиты и КД противников не показываются,
     спрятанные и побеждённые противники не видны. -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { vaultUrl } from '../../../shared/vault';
  import { defeated, ordered } from '../order';

  let { ms }: ModuleProps<'initiative'> = $props();

  const visible = $derived(ordered(ms.combatants).filter((c) => !c.hidden && !defeated(c)));
  const shown = $derived(ms.showToPlayers && ms.turn !== null && visible.length > 0);
</script>

{#if shown}
  <div class="bar" transition:fade|global={{ duration: 300 }}>
    <div class="round">Раунд {ms.round}</div>
    <div class="list">
      {#each visible as c (c.id)}
        <div class="c {c.side}" class:turn={c.id === ms.turn} animate:flip={{ duration: 300 }} in:fly|global={{ y: -10, duration: 250 }}>
          <div class="avatar">
            {#if c.portrait}<img src={vaultUrl(c.portrait)} alt="" />{:else}{c.name.slice(0, 1).toUpperCase()}{/if}
          </div>
          <div class="name">{c.name}</div>
          {#if c.conditions.length}<div class="cond">{c.conditions.join(', ')}</div>{/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .bar {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    display: flex;
    align-items: flex-start;
    gap: 2cqmin;
    padding: 1.5cqmin 2cqmin 3cqmin;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
    font-family: Georgia, serif;
    color: #fff;
    pointer-events: none;
  }
  .round {
    flex: none;
    padding-top: 2.6cqmin;
    font-size: 2.2cqmin;
    opacity: 0.8;
    white-space: nowrap;
  }
  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 1.2cqmin;
    min-width: 0;
  }
  .c {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 9cqmin;
    opacity: 0.75;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .c.turn {
    opacity: 1;
    transform: scale(1.15);
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 7cqmin;
    height: 7cqmin;
    border: 0.35cqmin solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    overflow: hidden;
    font-size: 3cqmin;
    font-weight: 600;
  }
  .party .avatar {
    background: #2f6f4f;
  }
  .ally .avatar {
    background: #2f5a8f;
  }
  .enemy .avatar {
    background: #8f2f2f;
  }
  .c.turn .avatar {
    border-color: #f0c45a;
    box-shadow: 0 0 2cqmin rgba(240, 196, 90, 0.7);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .name {
    max-width: 100%;
    margin-top: 0.6cqmin;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.6cqmin;
    text-shadow: 0 0 0.6cqmin #000;
  }
  .cond {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.2cqmin;
    color: #f0c45a;
  }
</style>
