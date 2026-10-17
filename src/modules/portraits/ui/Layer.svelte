<!-- Экран игроков: портреты с подписями и автоматической раскладкой. -->
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { assetUrl } from '../../../shared/vault';
  import { onMount } from 'svelte';
  import { caption } from '../library';
  import { connectCardNames } from './cardNames.svelte';
  import NamePlate from './NamePlate.svelte';
  import { DEFAULT_PLATE } from '../types';

  let { ms }: ModuleProps<'portraits'> = $props();

  // Подписи берут названия карточек: окну игроков тоже нужен их список.
  onMount(connectCardNames);

  const n = $derived(ms.onScreen.length);
  // Раскладка: до 4 портретов в один ряд, дальше в два ряда.
  const rows = $derived(n <= 4 ? 1 : 2);
  const cols = $derived(Math.max(1, rows === 1 ? n : Math.ceil(n / 2)));
  // Размер подписи зависит от количества портретов.
  const cap = $derived(rows === 2 ? 2.4 : n <= 2 ? 4 : n === 3 ? 3.4 : 3);

  // Ширина самой картинки (она вписана в рамку и бывает уже её): подложка подписи — во всю эту ширину.
  // Размеры — без трансформаций (clientWidth), иначе в уменьшенном превью получилось бы не то.
  function imageWidth(node: HTMLElement) {
    const frame = node.querySelector<HTMLElement>('.frame');
    const img = node.querySelector<HTMLImageElement>('img');
    if (!frame || !img) return;
    const update = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const w = Math.min(frame.clientWidth, (frame.clientHeight * img.naturalWidth) / img.naturalHeight);
      node.style.setProperty('--pw', `${Math.floor(w)}px`);
    };
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    img.addEventListener('load', update);
    update();
    return { destroy: () => (ro.disconnect(), img.removeEventListener('load', update)) };
  }
</script>

<div class="portraits" style:--cols={cols} style:--rows={rows} style:--cap="{cap}cqmin">
  {#each ms.onScreen as path (path)}
    {@const name = ms.unknown?.includes(path) ? '???' : caption(ms, path)}
    <div class="portrait" use:imageWidth in:scale={{ start: 0.96, duration: 400 }} out:fade={{ duration: 250 }}>
      <div class="frame"><img src={assetUrl(path)} alt="" /></div>
      {#if ms.showNames && name}
        <div class="caption"><NamePlate {name} plate={ms.plate ?? DEFAULT_PLATE} stretch /></div>
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
    /* Ширина — только от раскладки: подпись (у неё ширина в пикселях) не должна раздвигать ячейку. */
    min-width: 0;
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
  /* Вид подписи — NamePlate; здесь только размер (от числа портретов) и место под картинкой. */
  .caption {
    flex: none;
    width: var(--pw, 100%);
    max-width: 100%;
    margin: 0 auto;
    padding-top: 1cqmin;
    font-size: var(--cap);
  }
</style>
