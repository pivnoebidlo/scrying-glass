<!-- Карточка картинки из хранилища. Nothing hides until hovered: the tab's main action (primary — a portrait, a
     background, show) is always a labelled button at the top, «⋯» next to it — every action of the modules (portrait,
     full screen, combat, Telegram…), a closer look and «to trash» (trash={false} — without it); a right click opens the
     same menu. Щелчок по картинке ничего не выводит игрокам (так бывало случайно), двойной — открывает её крупно
     (Lightbox). Нижняя часть карточки — на усмотрение того, кто её показывает. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { vaultUrl, thumb } from '../../shared/vault';
  import { imageActions } from './registry';
  import { dispatch, store } from './store.svelte';
  import { Maximize2, Trash2 } from '@lucide/svelte';
  import { badgeOf, type FileAction } from './contrib';
  import { viewImage } from './view-image.svelte';
  import { t } from './i18n.svelte';
  import type { MenuItem } from './ContextMenu.svelte';
  import TileBar from './TileBar.svelte';

  let {
    path,
    primary,
    aspect = '3 / 4',
    trash = true,
    children,
  }: { path: string; primary: string; aspect?: string; trash?: boolean; children?: Snippet } = $props();

  const app = $derived(store.state);
  const actions = $derived([...imageActions].filter((a) => a.visible?.(app, path) ?? true));
  const main = $derived(actions.find((a) => a.id === primary) ?? actions[0]);
  // Other actions that are on (a portrait in the Backgrounds tab, in combat): a badge.
  const badges = $derived(actions.filter((a) => a !== main && a.active(app, path)));
  const active = $derived(actions.some((a) => a.active(app, path)));

  const label = (a: FileAction, on: boolean) => (a.tip ? (on ? a.tip.on : a.tip.off) : on ? t('action.remove', { what: a.title }) : a.title);

  let pic = $state<HTMLElement>();
  let bar = $state<TileBar>();
  const items = (): MenuItem[] => [
    ...[...actions].sort((a, b) => Number(b === main) - Number(a === main)).map((a) => ({ label: label(a, a.active(app, path)), icon: a.icon as MenuItem['icon'], action: () => a.toggle(app, path) })),
    { label: t('view.zoomShort'), icon: Maximize2, action: () => pic && viewImage(path, pic) },
    ...(trash ? [{ label: t('action.toTrashLong'), icon: Trash2, danger: true, action: () => dispatch('vault', 'trash', { paths: [path] }) }] : []),
  ];
</script>

<div class="card" class:on={active} oncontextmenu={(e) => bar?.openMenu(e)} role="none">
  <div class="pic">
    <button class="thumb" data-view={path} title={t('view.zoom')} bind:this={pic} ondblclick={(e) => viewImage(path, e.currentTarget)}>
      <img src={thumb(vaultUrl(path), 480)} alt="" loading="lazy" style:aspect-ratio={aspect} />
    </button>

    <TileBar
      bind:this={bar}
      main={main ? { icon: main.icon as never, label: label(main, main.active(app, path)), title: main.title, on: main.active(app, path), run: () => main.toggle(app, path) } : null}
      {items}
    />

    {#if badges.length}
      <div class="badges">
        {#each badges as a (a.id)}<span class="badge">{badgeOf(a, app, path)}</span>{/each}
      </div>
    {/if}
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
  .card.on {
    border-color: var(--accent);
  }
  .pic {
    position: relative;
  }
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
  /* What else is on (a portrait in Backgrounds, in combat): along the bottom of the picture. */
  .badges {
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    pointer-events: none;
  }
  .badge {
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    font-size: 11px;
  }
</style>
