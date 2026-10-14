<!-- Одна таблица: бросок (пробел или кнопка), результаты сверху, все варианты ниже (щелчок — выбрать вручную).
     Таблицу можно править здесь же, открыть в другой программе (Obsidian), удалить в корзину или скопировать
     в приключение, в общие таблицы хранилища или в библиотеку (для всех кампаний). -->
<script lang="ts">
  import { ChevronLeft, Copy, Dices, ExternalLink, Pencil, Trash2 } from '@lucide/svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { inline } from '../../../renderer/lib/markdown';
  import { store } from '../../../renderer/lib/store.svelte';
  import { tableDie } from '../../../shared/tables';
  import { allFiles } from '../../../shared/vault';
  import { tablesFolder, visibleHere } from './place';
  import CopyToMenu from '../ui/CopyToMenu.svelte';
  import { ui } from '../ui/ui.svelte';
  import { history, isLibraryTable, pick, roll, tables, type TableItem } from './store.svelte';

  let { item }: { item: TableItem } = $props();

  const die = $derived(tableDie(item.table));
  const results = $derived(history.filter((h) => h.table === item.id));
  let showAll = $state(false);
  let editing = $state(false);
  let draft = $state('');
  let copied = $state<number | null>(null);

  function copy(id: number, text: string) {
    navigator.clipboard.writeText(text.replace(/\*\*|\*/g, ''));
    copied = id;
    setTimeout(() => copied === id && (copied = null), 1200);
  }

  async function save() {
    await window.api.writeTable(item.path, draft);
    editing = false;
  }

  let status = $state('');

  // Копия в папку таблиц места (приключение, «Общее» или библиотека); нет папки — создаётся.
  async function copyTo(place: string | null) {
    const path = await window.api.createTable(tablesFolder(place), item.table.title, item.text);
    if (!path) return;
    // Видно здесь — открываем копию; иначе — сообщаем, куда легла.
    if (visibleHere(place)) ui.table = path;
    else {
      status = `Копия — в «${place}»: её видно, когда это приключение выбрано.`;
      setTimeout(() => (status = ''), 4000);
    }
  }

  // В корзину (спросит подтверждение). Таблицу библиотеки удаляет ядро, таблицу хранилища — действие vault/trash.
  async function trash() {
    const p = item.path;
    if (isLibraryTable(p)) {
      if (await window.api.trashLibraryTable(p)) {
        ui.table = null;
        tables.rev++;
      }
      return;
    }
    const s = await dispatch('vault', 'trash', { paths: [p] });
    if (!s.vault.tree || !allFiles(s.vault.tree).some((f) => f.path === p)) ui.table = null;
  }

  function onkeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (editing || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
    if (e.code === 'Space' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      roll(item);
    }
  }

  const range = (e: { from?: number; to?: number }) => (e.from === undefined ? '' : e.from === e.to ? `${e.from}` : `${e.from}–${e.to}`);
</script>

<svelte:window {onkeydown} />

<div class="view">
  <header class="head">
    <button class="icon-btn" title="Ко всем таблицам" onclick={() => (ui.table = null)}><ChevronLeft size={16} /></button>
    <h2>{item.table.title}</h2>
    <span class="faint meta" title={item.path}>{isLibraryTable(item.path) ? 'библиотека, для всех кампаний' : item.path} · {item.table.entries.length} вар.{die ? ` · d${die}` : ''}</span>
    <button class="btn" onclick={() => ((draft = item.text), (editing = !editing))}><Pencil size={14} /> {editing ? 'Не править' : 'Править'}</button>
    <CopyToMenu title="Скопировать в приключение, в общие таблицы хранилища или в библиотеку" library onpick={copyTo} />
    <button class="icon-btn" title="Открыть файл в другой программе (например, в Obsidian)" onclick={() => window.api.openFile(item.path)}><ExternalLink size={15} /></button>
    <button class="icon-btn" title="Удалить таблицу в корзину" onclick={trash}><Trash2 size={15} /></button>
  </header>
  {#if item.table.description}<p class="faint about">{item.table.description}</p>{/if}
  {#if status}<p class="status">{status}</p>{/if}

  {#if editing}
    <textarea rows="18" bind:value={draft}></textarea>
    <p class="faint help">
      Строка «- » — вариант, «3× » — втрое чаще, «1-4:» — диапазон, «# » — название. В тексте: [[Другая таблица]],
      {'{2d6}'}, {'{меч|топор|лук}'}.
    </p>
    <div class="row">
      <button class="btn primary" onclick={save}>Сохранить</button>
      <button class="btn" onclick={() => (editing = false)}>Отмена</button>
    </div>
  {:else}
    <div class="row">
      <button class="btn primary big" disabled={!item.table.entries.length} title="Бросить (пробел)" onclick={() => roll(item)}><Dices size={16} /> Бросить</button>
      <button class="btn" disabled={!item.table.entries.length} onclick={() => roll(item, 3)}>×3</button>
      <button class="btn" disabled={!item.table.entries.length} onclick={() => roll(item, 5)}>×5</button>
      {#if results.length}
        <div class="spacer"></div>
        <button class="icon-btn" title="Очистить результаты этой таблицы" onclick={() => history.splice(0, history.length, ...history.filter((h) => h.table !== item.id))}><Trash2 size={14} /></button>
      {/if}
    </div>

    {#if !item.table.entries.length}
      <p class="faint">В таблице нет вариантов: строки должны начинаться с «- » или с номера («1-4:»).</p>
    {/if}

    <ul class="results">
      {#each results as h, i (h.id)}
        <li class:fresh={i === 0}>
          {#if h.roll.number !== null}<span class="num">{h.roll.number}</span>{/if}
          <!-- Текст экранирован в inline(). -->
          <span class="text">{@html inline(h.roll.text)}</span>
          <button class="icon-btn" title={copied === h.id ? 'Скопировано' : 'Копировать'} onclick={() => copy(h.id, h.roll.text)}><Copy size={13} /></button>
        </li>
      {/each}
    </ul>

    <button class="all faint" onclick={() => (showAll = !showAll)}>{showAll ? '▾' : '▸'} Все варианты ({item.table.entries.length})</button>
    {#if showAll}
      <ol class="entries">
        {#each item.table.entries as e, i (i)}
          <li>
            <button title="Выбрать этот вариант" onclick={() => pick(item, i)}>
              <span class="r faint">{range(e) || (e.weight > 1 ? `${e.weight}×` : '')}</span>
              <span>{e.text}</span>
            </button>
          </li>
        {/each}
      </ol>
    {/if}
  {/if}
</div>

<style>
  .view {
    max-width: 860px;
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
    white-space: nowrap;
  }
  .meta {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row .spacer {
    flex: 1;
  }
  .status {
    margin: 8px 0 0 34px;
    color: var(--accent);
  }
  .about {
    margin: 6px 0 0 34px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 14px 0;
  }
  .big {
    padding: 6px 16px;
    font-size: 15px;
  }
  .results {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .results li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    opacity: 0.75;
  }
  .results li.fresh {
    border-color: var(--accent);
    font-size: 16px;
    opacity: 1;
  }
  .num {
    flex: none;
    min-width: 28px;
    padding: 1px 6px;
    border-radius: var(--radius-s);
    background: var(--bg-active);
    font-weight: 600;
    text-align: center;
  }
  .text {
    flex: 1;
    line-height: 1.45;
  }
  .all {
    margin-top: 18px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .entries {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
  .entries button {
    display: flex;
    gap: 10px;
    width: 100%;
    padding: 4px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .entries button:hover {
    background: var(--bg-hover);
  }
  .r {
    flex: none;
    width: 40px;
    text-align: right;
  }
  textarea {
    width: 100%;
    margin-top: 14px;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 13px;
    line-height: 1.5;
  }
  .help {
    font-size: 12px;
  }
</style>
