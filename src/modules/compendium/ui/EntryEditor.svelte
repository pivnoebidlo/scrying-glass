<!-- Редактор записи справочника: название (= имя файла), тип, поля типа, текст; справа — как будет выглядеть.
     Сохраняется по кнопке или ⌘S. Если запись у игроков, там она тоже обновится. -->
<script lang="ts">
  import { Save } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import EntryCard from '../../../renderer/lib/entry/EntryCard.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { BUILTIN, COMMON_FIELDS, OVERRIDES, serializeEntry, type Entry, type FieldDef, type FieldValue } from '../../../shared/compendium';
  import { ui } from './ui.svelte';
  import { forPlayers, typeDef } from '../../../renderer/lib/entry/types.svelte';
  import { entriesFolder, isBuiltinEntry, typesHere, type EntryItem } from './store.svelte';
  import { LIBRARY } from '../../../shared/vault';
  import { openEntry } from './ui.svelte';

  let { item }: { item: EntryItem } = $props();

  // Черновик — копия записи; поля храним как есть, списки — строкой «a, b» на время правки.
  let draft = $state<Entry>(untrack(() => structuredClone($state.snapshot(item.entry)) as Entry));
  let saving = $state(false);
  let error = $state('');

  const def = $derived(typeDef(draft.type));
  const fields = $derived([...def.fields, ...COMMON_FIELDS]);
  // Поля, которых нет у типа (из Obsidian или прошлого типа), — показываем и даём править как текст.
  const extra = $derived(Object.keys(draft.fields).filter((k) => k !== OVERRIDES && !fields.some((f) => f.key === k)));
  // Встроенная запись: правка сохранится в библиотеку и заменит её.
  const builtin = $derived(isBuiltinEntry(item.path));

  const listText = (v: FieldValue | undefined) => (Array.isArray(v) ? v.join(', ') : v === undefined ? '' : String(v));
  function set(f: FieldDef, raw: string | boolean) {
    let v: FieldValue | undefined;
    if (f.kind === 'bool') v = raw as boolean;
    else if (f.kind === 'number') v = raw === '' ? undefined : Number(raw);
    else if (f.kind === 'list') v = String(raw).split(',').map((x) => x.trim()).filter(Boolean);
    else v = String(raw);
    const next = { ...draft.fields };
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'number' && isNaN(v))) delete next[f.key];
    else next[f.key] = v;
    draft.fields = next;
  }

  async function save() {
    const title = draft.title.trim();
    if (!title) return void (error = 'Укажите название.');
    saving = true;
    error = '';
    try {
      const snap = $state.snapshot(draft) as Entry;
      if (builtin) {
        // Первая правка встроенной: своя запись в библиотеке, заменяющая её.
        const entry = { ...snap, title, fields: { ...snap.fields, [OVERRIDES]: item.path.slice(BUILTIN.length) } };
        const path = await window.api.createEntry(entriesFolder(LIBRARY), title, serializeEntry(entry, def));
        if (!path) throw new Error('файл не записан');
        if (store.state.handouts.current === item.path) {
          await dispatch('handouts', 'move', { from: item.path, to: path });
          await dispatch('handouts', 'updateEntry', { path, entry: forPlayers(entry) });
        }
        openEntry(path);
        return;
      }
      let path = item.path;
      if (!(await window.api.writeEntry(path, serializeEntry({ ...snap, title }, def)))) throw new Error('файл не записан');
      if (title !== item.entry.title) {
        const next = await window.api.renameEntry(path, title);
        if (next) path = next;
      }
      if (store.state.handouts.current === path) await dispatch('handouts', 'updateEntry', { path, entry: forPlayers({ ...snap, title }) });
      ui.open = path;
      ui.editing = false;
    } catch (e) {
      error = `Не удалось сохранить: ${String(e)}`;
    } finally {
      saving = false;
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
      e.preventDefault();
      save();
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="editor">
  <header class="bar">
    <input class="title" type="text" bind:value={draft.title} placeholder="Название" />
    <select bind:value={draft.type} title="Тип записи">
      {#each typesHere() as t (t.id)}<option value={t.id}>{t.def.title}</option>{/each}
      {#if !typesHere().some((t) => t.id === draft.type)}<option value={draft.type}>{draft.type}</option>{/if}
    </select>
    {#if builtin}<span class="faint note" title="Правка ляжет в библиотеку (для всех кампаний) и заменит встроенную запись. Вернуть как было — «Вернуть как в SRD».">Правка встроенной записи</span>{/if}
    {#if error}<span class="error">{error}</span>{/if}
    <div class="spacer"></div>
    <button class="btn" onclick={() => (ui.editing = false)}>Отмена</button>
    <button class="btn primary" disabled={saving} onclick={save} title="⌘S"><Save size={14} /> Сохранить</button>
  </header>

  <div class="columns">
    <form class="form" onsubmit={(e) => e.preventDefault()}>
      <div class="grid">
        {#each fields as f (f.key)}
          {@const v = draft.fields[f.key]}
          <label class="field" class:wide={f.kind === 'list' || f.key === 'components' || f.key === 'source'} title={f.hint}>
            <span>{f.title}</span>
            {#if f.kind === 'bool'}
              <input type="checkbox" checked={!!v} onchange={(e) => set(f, e.currentTarget.checked)} />
            {:else if f.kind === 'select'}
              <select value={typeof v === 'string' ? v : ''} onchange={(e) => set(f, e.currentTarget.value)}>
                <option value="">—</option>
                {#each f.options ?? [] as o (o)}<option value={o}>{o}</option>{/each}
                {#if typeof v === 'string' && v && !f.options?.includes(v)}<option value={v}>{v}</option>{/if}
              </select>
            {:else}
              <input type={f.kind === 'number' ? 'number' : 'text'} value={listText(v)} placeholder={f.hint ?? ''} onchange={(e) => set(f, e.currentTarget.value)} />
            {/if}
          </label>
        {/each}
        {#each extra as k (k)}
          <label class="field">
            <span>{k}</span>
            <input type="text" value={listText(draft.fields[k])} onchange={(e) => set({ key: k, title: k, kind: Array.isArray(draft.fields[k]) ? 'list' : 'text' }, e.currentTarget.value)} />
          </label>
        {/each}
      </div>
      <label class="field">
        <span>Текст</span>
        <textarea rows="16" bind:value={draft.body} placeholder={'Описание. **Жирный**, *курсив*, «- » — список, «## » — подзаголовок, таблицы «| a | b |», [[Другая запись]].'}></textarea>
      </label>
    </form>
    <div class="preview">
      <EntryCard entry={draft} />
    </div>
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  .title {
    min-width: 240px;
    font-size: 16px;
    font-weight: 600;
  }
  .spacer {
    flex: 1;
  }
  .note {
    font-size: 12px;
  }
  .error {
    color: var(--danger, #e04545);
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(340px, 1fr) minmax(300px, 1fr);
    flex: 1;
    min-height: 0;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    overflow: auto;
    border-right: 1px solid var(--border);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field.wide {
    grid-column: 1 / -1;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .field input[type='checkbox'] {
    align-self: flex-start;
  }
  textarea {
    width: 100%;
    resize: vertical;
    font: inherit;
    line-height: 1.5;
  }
  .preview {
    padding: 20px 24px;
    overflow: auto;
  }
</style>
