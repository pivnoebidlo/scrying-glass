<!-- Таблицы случайностей: список (свои — из папок таблиц, и встроенные) или открытая таблица. -->
<script lang="ts">
  import { RotateCcw } from '@lucide/svelte';
  import CopyToMenu from '../ui/CopyToMenu.svelte';
  import { tablesFolder } from './place';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { tableDie } from '../../../shared/tables';
  import { ui } from '../ui/ui.svelte';
  import { loadTables, restoreBuiltins, tables, type TableItem } from './store.svelte';
  import TableView from './TableView.svelte';

  // Перечитываем, когда меняется дерево хранилища или ядро сообщило о новых файлах.
  const tree = $derived(store.state.vault.tree);
  const adv = $derived(store.state.adventures.current);
  $effect(() => {
    void tree;
    void adv;
    void notes.rev;
    void tables.rev;
    loadTables();
  });

  const all = $derived([...tables.vault, ...tables.library]);
  const open = $derived(ui.table ? all.find((t) => t.id === ui.table) : undefined);
  const groups = $derived.by(() => {
    const m = new Map<string, TableItem[]>();
    for (const t of all) m.set(t.group, [...(m.get(t.group) ?? []), t]);
    return [...m];
  });

  const TEMPLATE = '# Новая таблица\n\nПояснение (необязательно).\n\n- Первый вариант\n- Второй вариант\n- 2× Вариант, который выпадает вдвое чаще\n';

  async function create(place: string | null) {
    const path = await window.api.createTable(tablesFolder(place), 'Новая таблица', TEMPLATE);
    if (path) ui.table = path;
  }

  let restored = $state('');
  async function restore() {
    const n = await restoreBuiltins();
    restored = n ? `Вернулось таблиц: ${n}` : 'Все встроенные таблицы на месте';
    setTimeout(() => (restored = ''), 3000);
  }
</script>

{#if open}
  {#key open.id}<TableView item={open} />{/key}
{:else if ui.table && tables.loading}
  <p class="faint pad">Загрузка…</p>
{:else}
  <div class="view">
    <header class="head">
      <h2>Таблицы случайностей</h2>
      <div class="spacer"></div>
      <CopyToMenu label="Новая таблица" title="Где создать: в приключении, в общем или в библиотеке (для всех кампаний)" library primary onpick={create} />
    </header>
    <p class="faint intro">
      Слухи, погода, события в пути, имена. Своя таблица — обычный Markdown-файл в папке <RoleFolderNames role="tables" />:
      её удобно писать и в Obsidian. Строки списка — варианты, «1-4:» — диапазоны, [[Другая таблица]] — бросок по
      другой таблице, {'{2d6}'} — кубы, {'{меч|топор}'} — один из вариантов. Таблицы библиотеки общие для всех
      кампаний; встроенные таблицы лежат там же — их можно дополнять своими вариантами.
    </p>
    {#each groups as [g, list] (g)}
      <section>
        <h3>{g} <span class="faint">{list.length}</span></h3>
        <div class="grid">
          {#each list as t (t.id)}
            {@const die = tableDie(t.table)}
            <button class="card" onclick={() => (ui.table = t.id)}>
              <span class="t">{t.table.title}</span>
              <span class="faint s">{t.table.entries.length} вар.{die ? ` · d${die}` : ''}</span>
            </button>
          {/each}
        </div>
      </section>
    {/each}
    <footer class="foot">
      <button class="btn" title="Положить в библиотеку встроенные таблицы, которые были удалены" onclick={restore}><RotateCcw size={14} /> Вернуть встроенные таблицы</button>
      {#if restored}<span class="faint">{restored}</span>{/if}
    </footer>
  </div>
{/if}

<style>
  .view {
    padding: 16px 20px;
  }
  .pad {
    padding: 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .intro {
    max-width: 680px;
    margin: 8px 0 16px;
  }
  h3 {
    margin: 16px 0 10px;
    font-size: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 24px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .card:hover {
    border-color: var(--accent);
  }
  .t {
    font-weight: 500;
  }
  .s {
    font-size: 12px;
  }
</style>
