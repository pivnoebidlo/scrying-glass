<!-- Карточка картинки из хранилища. Кнопки — действия модулей (портрет, на весь экран, …) и «в корзину»
     (trash={false} — без неё); у кнопки при наведении сразу видна подпись. Щелчок по картинке ничего не выводит
     игрокам (так бывало случайно), двойной — открывает её крупно (Lightbox). primary — какое действие главное: оно
     первым в окне просмотра. Нижняя часть карточки — на усмотрение того, кто её показывает. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { vaultUrl, thumb } from '../../shared/vault';
  import { imageActions } from './registry';
  import { dispatch, store } from './store.svelte';
  import { Trash2 } from '@lucide/svelte';
  import { badgeOf } from './contrib';
  import { viewImage } from './view-image.svelte';

  let {
    path,
    primary,
    aspect = '3 / 4',
    trash = true,
    children,
  }: { path: string; primary: string; aspect?: string; trash?: boolean; children?: Snippet } = $props();

  const app = $derived(store.state);
  // Главное действие — первым в столбике кнопок.
  const actions = $derived([...imageActions].sort((a, b) => Number(b.id === primary) - Number(a.id === primary)));
  const active = $derived(imageActions.filter((a) => a.active(app, path)));
</script>

<div class="card" class:on={active.length > 0}>
  <div class="pic">
    <button class="thumb" data-view={path} title="Двойной щелчок — рассмотреть крупно" ondblclick={(e) => viewImage(path, e.currentTarget)}>
      <img src={thumb(vaultUrl(path), 480)} alt="" loading="lazy" style:aspect-ratio={aspect} />
    </button>

    <div class="badges">
      {#each active as a (a.id)}<span class="badge">{badgeOf(a, app, path)}</span>{/each}
    </div>

    <div class="actions">
      {#each actions as a (a.id)}
        {@const on = a.active(app, path)}
        <button class="action" class:on aria-label={a.title} onclick={() => a.toggle(app, path)}>
          <a.icon size={13} />
          <span class="tip">{a.tip ? (on ? a.tip.on : a.tip.off) : on ? `${a.title}: убрать` : a.title}</span>
        </button>
      {/each}
      {#if trash}
        <button class="action trash" aria-label="Переместить в корзину" onclick={() => dispatch('vault', 'trash', { paths: [path] })}>
          <Trash2 size={13} />
          <span class="tip">В корзину</span>
        </button>
      {/if}
    </div>
  </div>

  {@render children?.()}
</div>

<style>
  .card {
    position: relative;
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  /* Подпись кнопки может выйти за плитку — поверх соседних. */
  .card:hover {
    z-index: 5;
  }
  .card.on {
    border-color: var(--accent);
  }
  .pic {
    position: relative;
  }
  /* Картинка скруглена сама: у плитки нет overflow: hidden, иначе подписи кнопок обрезались бы её краем. */
  .thumb {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    border-radius: calc(var(--radius-m) - 2px) calc(var(--radius-m) - 2px) 0 0;
    background: none;
    overflow: hidden;
    cursor: zoom-in;
  }
  img {
    display: block;
    width: 100%;
    object-fit: cover;
  }
  /* Кнопки — столбиком вдоль левого края, метки («портрет», «в бою») — справа напротив них:
     так они не перекрывают друг друга. */
  .badges {
    position: absolute;
    right: 6px;
    top: 6px;
    left: 40px;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px;
    pointer-events: none;
  }
  .badge {
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
  }
  .actions {
    position: absolute;
    left: 6px;
    top: 6px;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 4px;
    /* На маленькой плитке кнопки не помещаются в высоту картинки — уходят во второй столбик. */
    max-height: calc(100% - 12px);
    opacity: 0;
    transition: opacity 0.12s ease;
  }
  .card:hover .actions {
    opacity: 1;
  }
  .action {
    position: relative;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    cursor: pointer;
  }
  .action.trash {
    margin-top: 6px;
  }
  .action.trash:hover {
    color: var(--danger);
  }
  .action:hover {
    background: rgba(0, 0, 0, 0.85);
  }
  .action.on {
    background: var(--accent);
  }
  /* Подпись кнопки — сразу при наведении (системная всплывает с задержкой и часто не успевает). */
  .tip {
    position: absolute;
    left: calc(100% + 6px);
    top: 50%;
    z-index: 2;
    padding: 2px 8px;
    border-radius: var(--radius-s);
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font-size: 11px;
    white-space: nowrap;
    transform: translateY(-50%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.08s ease;
  }
  .action:hover .tip {
    opacity: 1;
  }
</style>
