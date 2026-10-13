<!-- Вкладка «Фоны»: картинки из папок backgrounds / фоны / локации, сгруппированные по приключениям.
     Клик по картинке показывает её игрокам на весь экран. -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { Search } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import PasteButton from '../../../renderer/lib/PasteButton.svelte';
  import { prettyName } from '../../../shared/vault';
  import { imageGroups } from '../../portraits/library';
  import { sortable } from '../../../renderer/lib/sortable';
  import { applyOrder } from '../../../shared/order';
  import { ui } from './ui.svelte';
  import ThumbSize from '../../../renderer/lib/ThumbSize.svelte';
  import { thumbs } from '../../../renderer/lib/thumbs.svelte';

  let { app }: ModuleProps<'scene'> = $props();

  const groups = $derived(
    (app.vault.tree ? imageGroups(app.vault.tree, app.vault.name, 'backgrounds', app.adventures) : []).map((g) => ({
      ...g,
      items: applyOrder(g.items, (f) => f.path, app.order.groups[g.key]),
    }))
  );
  const visible = $derived.by(() => {
    const q = ui.search.trim().toLowerCase();
    return groups
      .filter((g) => ui.group === 'all' || g.key === ui.group)
      .map((g) => ({ ...g, items: q ? g.items.filter((f) => prettyName(f.path).toLowerCase().includes(q)) : g.items }))
      .filter((g) => g.items.length || !q);
  });
  const collapsed = $state<Record<string, boolean>>({});
</script>

<div class="view">
  <header class="toolbar">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder="Поиск по названию" bind:value={ui.search} />
    </label>
    <PasteButton {app} role="backgrounds" />
    <div class="spacer"></div>
    <ThumbSize grid="backgrounds" />
  </header>

  {#if groups.length === 0}
    <div class="empty">
      <p>В хранилище пока нет папок с фонами.</p>
      <p class="faint">
        Создайте папку <RoleFolderNames role="backgrounds" /> в приключении или главе, и
        картинки из неё появятся здесь. Картинку из любой другой папки можно показать фоном через «Файлы».
      </p>
    </div>
  {:else if visible.length === 0}
    <div class="empty faint">Ничего не найдено.</div>
  {/if}

  {#each visible as g (g.key)}
    <section>
      <button class="group-title" title={g.key} onclick={() => (collapsed[g.key] = !collapsed[g.key])}>
        {collapsed[g.key] ? '▸' : '▾'} {g.title} <span class="faint">{g.items.length}</span>
      </button>
      {#if !collapsed[g.key]}
        <div class="grid" style:--thumb="{thumbs.backgrounds}px">
          {#each g.items as f (f.path)}
            <div use:sortable={{ group: g.key, id: f.path, ids: g.items.map((x) => x.path), disabled: !!ui.search.trim() }}>
              <ImageCard path={f.path} primary="background" aspect="16 / 9">
                <div class="caption" title={f.path}>{prettyName(f.path)}</div>
              </ImageCard>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .view {
    padding: 0 20px 20px;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 12px 0;
    background: var(--bg-primary);
  }
  .spacer {
    flex: 1;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    color: var(--text-faint);
  }
  .search:focus-within {
    border-color: var(--accent);
  }
  .search {
    flex: 0 1 220px;
    min-width: 120px;
  }
  .search input {
    width: 100%;
    min-width: 0;
    border: 0;
    padding: 5px 0;
    background: none;
  }
  .group-title {
    margin: 14px 0 10px;
    padding: 0;
    border: 0;
    background: none;
    font-weight: 600;
    cursor: pointer;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--thumb), 1fr));
    gap: 12px;
  }
  .caption {
    padding: 6px 8px;
    border-top: 1px solid var(--border);
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    max-width: 460px;
    margin: 40px auto;
    text-align: center;
  }
</style>
