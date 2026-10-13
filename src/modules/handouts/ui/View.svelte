<!-- Вкладка «Раздатка»: записки, улики и письма из папок handouts / раздатка / улики, сгруппированные по приключениям.
     Клик по картинке показывает её игрокам поверх всего, повторный — убирает. -->
<script lang="ts">
  import { Search } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import { prettyName } from '../../../shared/vault';
  import { imageGroups } from '../../portraits/library';
  import { ui } from './ui.svelte';
  import ThumbSize from '../../../renderer/lib/ThumbSize.svelte';
  import { thumbs } from '../../../renderer/lib/thumbs.svelte';

  let { app }: ModuleProps<'handouts'> = $props();

  const groups = $derived(app.vault.tree ? imageGroups(app.vault.tree, app.vault.name, 'handouts', app.adventures) : []);
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
    <div class="spacer"></div>
    <ThumbSize grid="handouts" />
  </header>

  {#if groups.length === 0}
    <div class="empty">
      <p>В хранилище пока нет папок с раздаточными материалами.</p>
      <p class="faint">
        Создайте папку <code>handouts</code>, <code>раздатка</code> или <code>улики</code> в приключении или главе, и
        картинки из неё появятся здесь. Любую другую картинку можно показать раздаткой через «Файлы».
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
        <div class="grid" style:--thumb="{thumbs.handouts}px">
          {#each g.items as f (f.path)}
            <ImageCard path={f.path} primary="handout" aspect="3 / 4">
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
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
