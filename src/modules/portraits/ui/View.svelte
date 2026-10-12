<!-- Вкладка «Портреты»: все персонажи хранилища, сгруппированные по папкам. -->
<script lang="ts">
  import { Search } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { caption, characterGroups } from '../library';
  import Card from './Card.svelte';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'portraits'> = $props();

  const groups = $derived(app.vault.tree ? characterGroups(app.vault.tree, app.vault.name) : []);
  const visible = $derived.by(() => {
    const q = ui.search.trim().toLowerCase();
    return groups
      .filter((g) => ui.group === 'all' || g.key === ui.group)
      .map((g) => ({ ...g, items: q ? g.items.filter((f) => caption(ms, f.path).toLowerCase().includes(q)) : g.items }))
      .filter((g) => g.items.length || !q);
  });
  const collapsed = $state<Record<string, boolean>>({});
</script>

<div class="view">
  <header class="toolbar">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder="Поиск по имени" bind:value={ui.search} />
    </label>
  </header>

  {#if groups.length === 0}
    <div class="empty">
      <p>В хранилище пока нет папок с персонажами.</p>
      <p class="faint">
        Создайте папку <code>characters</code> или <code>персонажи</code> в приключении или главе, и картинки из неё
        появятся здесь. Картинку из любой другой папки можно показать игрокам через «Файлы».
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
            <Card path={f.path} />
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
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
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
