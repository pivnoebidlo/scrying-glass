<!-- Экран игроков (приключения Fate): аспекты сцены слева внизу — с кружками бесплатных призывов, скрытые не видны;
     жетоны судьбы справа внизу — у портретов персонажей и у мастера. Что показывать — глазами в правой панели. -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { assetUrl } from '../../../shared/vault';
  import { fateHere } from '../here';

  let { ms, app }: ModuleProps<'fate'> = $props();

  const here = $derived(fateHere(app));
  const aspects = $derived(here && ms.show.aspects ? ms.aspects.filter((a) => !a.hidden) : []);
  const holders = $derived(here && ms.show.points ? ms.holders : []);
</script>

{#if aspects.length}
  <div class="aspects" transition:fade|global={{ duration: 300 }}>
    {#each aspects as a (a.id)}
      <div class="aspect" animate:flip={{ duration: 300 }} in:fly|global={{ x: -20, duration: 300 }} out:fade|global={{ duration: 200 }}>
        <span class="text">{a.text}</span>
        {#if a.invokes}
          <span class="invokes">{#each { length: a.invokes } as _, i (i)}<span class="dot"></span>{/each}</span>
        {/if}
      </div>
    {/each}
  </div>
{/if}

{#if holders.length}
  <div class="points" transition:fade|global={{ duration: 300 }}>
    {#each holders as h (h.id)}
      <div class="holder">
        <div class="avatar">
          {#if h.portrait}<img src={assetUrl(h.portrait)} alt="" />{:else}<span class="letter">{h.name.slice(0, 1).toUpperCase()}</span>{/if}
        </div>
        {#key h.points}<div class="coin" in:fly|global={{ y: -8, duration: 250 }}>{h.points}</div>{/key}
        <div class="name">{h.name}</div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .aspects {
    position: absolute;
    left: 3cqmin;
    bottom: 3cqmin;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1cqmin;
    max-width: 40cqw;
    pointer-events: none;
  }
  .aspect {
    display: flex;
    align-items: center;
    gap: 1.2cqmin;
    padding: 1cqmin 1.8cqmin;
    border-left: 0.5cqmin solid #e8b94a;
    border-radius: 0.8cqmin;
    background: rgba(0, 0, 0, 0.6);
    color: #f3e6c8;
    font-family: Georgia, serif;
    font-size: 2.6cqmin;
    font-style: italic;
    text-shadow: 0 0 0.6cqmin #000;
  }
  .invokes {
    display: inline-flex;
    gap: 0.5cqmin;
  }
  .dot {
    width: 1.6cqmin;
    height: 1.6cqmin;
    border: 0.25cqmin solid #f3e6c8;
    border-radius: 50%;
    background: #e8b94a;
  }
  .points {
    position: absolute;
    right: 3cqmin;
    bottom: 3cqmin;
    display: flex;
    gap: 2cqmin;
    pointer-events: none;
  }
  .holder {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6cqmin;
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 8cqmin;
    height: 8cqmin;
    border: 0.4cqmin solid #e8b94a;
    border-radius: 50%;
    overflow: hidden;
    background: #3a3328;
    box-shadow: 0 0 1cqmin rgba(0, 0, 0, 0.7);
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .letter {
    color: #f3e6c8;
    font-size: 3.6cqmin;
    font-weight: 600;
  }
  /* Жетон — монета с числом в углу портрета. */
  .coin {
    position: absolute;
    top: 5cqmin;
    right: -1cqmin;
    display: grid;
    place-items: center;
    min-width: 4cqmin;
    height: 4cqmin;
    padding: 0 0.6cqmin;
    border: 0.3cqmin solid #7a5a12;
    border-radius: 2cqmin;
    background: radial-gradient(circle at 35% 35%, #ffe08a, #d39b22);
    color: #3a2600;
    font-family: Georgia, serif;
    font-size: 2.6cqmin;
    font-weight: 700;
  }
  .name {
    max-width: 12cqmin;
    overflow: hidden;
    color: #f3e6c8;
    font-family: Georgia, serif;
    font-size: 1.8cqmin;
    text-overflow: ellipsis;
    text-shadow: 0 0 0.6cqmin #000;
    white-space: nowrap;
  }
</style>
