<!-- Вкладка «Портреты»: библиотека карточек. -->
<script lang="ts">
  import { ImagePlus, Search } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import Card from './Card.svelte';
  import { sections, ui } from './ui.svelte';

  let { ms }: ModuleProps<'portraits'> = $props();

  const visible = $derived.by(() => {
    const q = ui.search.trim().toLowerCase();
    return sections(ms)
      .filter((s) => ui.group === 'all' || s.key === ui.group)
      .map((s) => ({ ...s, items: q ? s.items.filter((p) => p.name.toLowerCase().includes(q)) : s.items }))
      .filter((s) => s.items.length || !q);
  });
  const onScreen = $derived(new Set(ms.onScreen));
  const collapsed = $state<Record<string, boolean>>({});
</script>

<div class="view">
  <header class="toolbar">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder="Поиск по имени" bind:value={ui.search} />
    </label>
    <div class="spacer"></div>
    <button class="btn" onclick={() => dispatch('portraits', 'add')}><ImagePlus size={14} /> Добавить картинки…</button>
  </header>

  {#if ms.library.length === 0 && ms.groups.length === 0}
    <div class="empty faint">
      Пока пусто. Подключите папку приключения на панели слева или добавьте картинки.
    </div>
  {:else if visible.length === 0}
    <div class="empty faint">Ничего не найдено.</div>
  {/if}

  {#each visible as s (s.key)}
    <section>
      <button class="group-title" title={s.hint} onclick={() => (collapsed[s.key] = !collapsed[s.key])}>
        {collapsed[s.key] ? '▸' : '▾'} {s.title} <span class="faint">{s.items.length}</span>
      </button>
      {#if !collapsed[s.key]}
        <div class="grid">
          {#each s.items as p (p.id)}
            <Card {p} on={onScreen.has(p.id)} />
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
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
  }
  .empty {
    padding: 40px 0;
    text-align: center;
  }
</style>
