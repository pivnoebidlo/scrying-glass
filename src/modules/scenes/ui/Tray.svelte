<!-- Подборка в блоке правой панели (фон, карта, портреты, раздатка): плитки под рукой. Щелчок — вывести на экран,
     ещё щелчок — убрать; на экране — с рамкой. Пополняется само (всё показанное), перетаскиванием плиток из вкладок
     и кнопкой «+»; крестик убирает из подборки (с экрана — нет). Чья подборка — trayOwner: включённой сцены или
     приключения. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { BookOpen, Eye, Plus, ScrollText, X } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import FilePicker from '../../../renderer/lib/FilePicker.svelte';
  import { draggedFile, sortable } from '../../../renderer/lib/sortable';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { allFiles, assetUrl, prettyName, thumb, type FileKind, type FolderRole } from '../../../shared/vault';
  import { isNotePath } from '../../../shared/notes';
  import { BUILTIN } from '../../../shared/compendium';
  import type { AppState } from '../../../shared/types';
  import { currentTray, shown, trayOwner, type TrayPart } from '../tray';

  let {
    app,
    part,
    isOn,
    toggle,
    kinds = ['image'],
    prefer,
    wide = false,
    caption = prettyName,
    hint,
    showLoose = true,
    children,
  }: {
    app: AppState;
    part: TrayPart;
    isOn: (path: string) => boolean;
    toggle: (path: string) => unknown;
    kinds?: FileKind[];
    prefer: FolderRole;
    // Плитки шире (фоны, карты) — по три в ряд, иначе по четыре.
    wide?: boolean;
    caption?: (path: string) => string;
    hint: string;
    // Строка «На экране: …» для показанного вне подборки (у блока может быть своя — тогда false).
    showLoose?: boolean;
    children?: Snippet;
  } = $props();

  const owner = $derived(trayOwner(app.scenes, app.adventures));
  const tray = $derived(currentTray(app.scenes, app.adventures)[part]);
  const items = $derived(tray);
  // На экране, но не в подборке (осталось от прошлой сцены, вывели до неё) — отдельной строкой, не плиткой: в подборке
  // сцены этого нет.
  const loose = $derived(showLoose ? shown(app)[part].filter((p) => !tray.includes(p)) : []);
  const whose = $derived(
    'scene' in owner
      ? t('scenes.ownerScene', { name: app.scenes.scenes.find((x) => x.id === owner.scene)?.name ?? '' })
      : owner.adventure
        ? t('scenes.ownerAdventure', { name: owner.adventure })
        : t('scenes.ownerVault')
  );
  const kindOf = $derived(new Map(app.vault.tree ? allFiles(app.vault.tree).map((f) => [f.path, f.kind]) : []));

  // Запись справочника: в хранилище, в библиотеке или встроенная.
  const isEntry = (path: string) => kindOf.get(path) === 'entry' || path.startsWith(BUILTIN) || /\.md$/i.test(path);

  let picking = $state(false);
  let over = $state(false);

  const accepts = (path: string | null) => !!path && kinds.includes(kindOf.get(path) as FileKind) && !tray.includes(path);
  const add = (paths: string[]) => paths.length && dispatch('scenes', 'trayAdd', { owner: $state.snapshot(owner), part, paths });
  const reorder = (ids: string[]) => dispatch('scenes', 'traySet', { owner: $state.snapshot(owner), part, ids });
  const remove = (path: string) => dispatch('scenes', 'trayRemove', { owner: $state.snapshot(owner), part, path });

  function ondragover(e: DragEvent) {
    if (!accepts(draggedFile())) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    over = true;
  }
  function ondrop(e: DragEvent) {
    over = false;
    const path = draggedFile();
    if (!accepts(path)) return;
    e.preventDefault();
    add([path!]);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="tray" class:over {ondragover} ondragleave={() => (over = false)} {ondrop}>
  {#if items.length}
    <div class="grid" class:wide>
      {#each items as path (path)}
        {@const on = isOn(path)}
        <div class="tile" class:on use:sortable={{ group: `tray:${part}`, id: path, ids: tray, disabled: !tray.includes(path), onmove: reorder }}>
          <button class="pick" title={t('scenes.pickHint', { caption: caption(path), action: on ? t('scenes.removeFromScreen') : t('scenes.showToPlayers') })} onclick={() => toggle(path)}>
            {#if isNotePath(path)}
              <span class="doc"><ScrollText size={18} /><b>{caption(path)}</b></span>
            {:else if isEntry(path)}
              <span class="doc"><BookOpen size={18} /><b>{caption(path)}</b></span>
            {:else}
              <img src={thumb(assetUrl(path), 128)} alt="" loading="lazy" />
            {/if}
            {#if on}<i class="live" title={t('scenes.onScreen')}><Eye size={10} /></i>{/if}
          </button>
          <button class="remove" title={t('scenes.removeFromTray')} onclick={() => remove(path)}><X size={10} /></button>
        </div>
      {/each}
      <button class="tile add" title={t('scenes.addToTrayOf', { whose })} disabled={!app.vault.tree} onclick={() => (picking = true)}><Plus size={14} /></button>
    </div>
  {:else}
    <div class="empty">
      <span class="faint">{hint}</span>
      <button class="btn" title={t('scenes.addToTrayOf', { whose })} disabled={!app.vault.tree} onclick={() => (picking = true)}><Plus size={13} /> {t('scenes.add')}</button>
    </div>
  {/if}
  {#each loose as path (path)}
    <div class="loose">
      <span class="faint">{t('scenes.onScreenLabel')}</span>
      <span class="loose-name" title={path}>{caption(path)}</span>
      <button class="icon-btn" title={t('scenes.addToTray')} onclick={() => add([path])}><Plus size={13} /></button>
      <button class="icon-btn" title={t('scenes.removeFromScreenBtn')} onclick={() => toggle(path)}><X size={13} /></button>
    </div>
  {/each}
  {@render children?.()}
</div>

{#if picking && app.vault.tree}
  <FilePicker tree={app.vault.tree} {kinds} {prefer} multi skip={tray} onpick={(paths) => ((picking = false), add(paths))} onclose={() => (picking = false)} />
{/if}

<style>
  .tray {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: -4px;
    padding: 4px;
    border: 1px dashed transparent;
    border-radius: var(--radius-m);
  }
  .tray.over {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }
  .grid.wide {
    grid-template-columns: repeat(3, 1fr);
  }
  .tile {
    position: relative;
    aspect-ratio: 1;
  }
  .wide .tile {
    aspect-ratio: 4 / 3;
  }
  .pick {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: var(--radius-s);
    background: var(--bg-hover);
    cursor: pointer;
    opacity: 0.75;
  }
  .pick:hover {
    opacity: 1;
    border-color: var(--border);
  }
  .on .pick {
    border-color: var(--accent);
    opacity: 1;
  }
  .pick img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .doc {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: 100%;
    padding: 2px;
    color: var(--text-faint);
  }
  .doc b {
    display: -webkit-box;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 9px;
    font-weight: 500;
    line-height: 1.15;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .live {
    position: absolute;
    left: 3px;
    bottom: 3px;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
  }
  .remove {
    position: absolute;
    top: 2px;
    right: 2px;
    display: none;
    place-items: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    cursor: pointer;
  }
  .tile:hover .remove {
    display: grid;
  }
  .remove:hover {
    background: var(--danger);
  }
  .add {
    display: grid;
    place-items: center;
    border: 1px dashed var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .add:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .loose {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
  .loose-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
</style>
