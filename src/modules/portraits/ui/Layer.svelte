<!-- Экран игроков: портреты с подписями и автоматической раскладкой. -->
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { assetUrl } from '../../../shared/vault';
  import { onMount } from 'svelte';
  import { caption } from '../library';
  import { connectCardNames } from './cardNames.svelte';

  let { ms }: ModuleProps<'portraits'> = $props();

  // Подписи берут названия карточек: окну игроков тоже нужен их список.
  onMount(connectCardNames);

  const n = $derived(ms.onScreen.length);
  // Раскладка: до 4 портретов в один ряд, дальше в два ряда.
  const rows = $derived(n <= 4 ? 1 : 2);
  const cols = $derived(Math.max(1, rows === 1 ? n : Math.ceil(n / 2)));
  // Размер подписи зависит от количества портретов.
  const cap = $derived(rows === 2 ? 2.4 : n <= 2 ? 4 : n === 3 ? 3.4 : 3);
</script>

<div class="portraits" style:--cols={cols} style:--rows={rows} style:--cap="{cap}cqmin">
  {#each ms.onScreen as path (path)}
    {@const name = caption(ms, path)}
    <div class="portrait" in:scale={{ start: 0.96, duration: 400 }} out:fade={{ duration: 250 }}>
      <div class="frame"><img src={assetUrl(path)} alt="" /></div>
      {#if ms.showNames && name}
        <div class="caption">{name}</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .portraits {
    position: absolute;
    inset: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    padding: 2cqmin;
  }
  .portrait {
    display: flex;
    flex-direction: column;
    flex: 0 0 calc(100% / var(--cols, 1));
    height: calc(100% / var(--rows, 1));
    padding: 1.5cqmin;
    transition: flex-basis 0.3s ease, height 0.3s ease;
  }
  .frame {
    flex: 1;
    min-height: 0;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* Чёрная обводка, чтобы портрет не сливался с фоном. drop-shadow идёт по контуру картинки (у PNG с прозрачностью —
       по фигуре), а не по рамке img, которая из-за contain шире картинки. */
    --o: 0.22cqmin;
    filter: drop-shadow(var(--o) 0 0 #000) drop-shadow(calc(-1 * var(--o)) 0 0 #000) drop-shadow(0 var(--o) 0 #000)
      drop-shadow(0 calc(-1 * var(--o)) 0 #000) drop-shadow(0 0 1cqmin rgba(0, 0, 0, 0.5));
  }
  .caption {
    flex: none;
    padding-top: 1cqmin;
    color: #fff;
    font-family: Georgia, serif;
    font-size: var(--cap);
    line-height: 1.2;
    max-height: 2.4em;
    overflow: hidden;
    text-align: center;
    text-shadow: 0 0 0.5em #000;
  }
</style>
