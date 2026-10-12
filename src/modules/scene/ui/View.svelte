<!-- Вкладка «Фоны»: картинки из папок backgrounds / фоны / локации, сгруппированные по приключениям.
     Клик по картинке показывает её игрокам на весь экран. -->
<script lang="ts">
  import { Search } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import { prettyName } from '../../../shared/vault';
  import { imageGroups } from '../../portraits/library';
  import { ui } from './ui.svelte';

  let { app }: ModuleProps<'scene'> = $props();

  const groups = $derived(app.vault.tree ? imageGroups(app.vault.tree, app.vault.name, 'backgrounds') : []);
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
  </header>

  {#if groups.length === 0}
    <div class="empty">
      <p>В хранилище пока нет папок с фонами.</p>
      <p class="faint">
        Создайте папку <code>backgrounds</code>, <code>фоны</code> или <code>локации</code> в приключении или главе, и
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
        <div class="grid">
          {#each g.items as f (f.path)}
            <ImageCard path={f.path} primary="background" aspect="16 / 9">
              <div class="caption" title={f.path}>{prettyName(f.path)}</div>
            </ImageCard>
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
    padding: 12px 0;
    background: var(--bg-primary);
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
  .search input {
    width: 220px;
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
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
