<!-- Редактор записи справочника: название (= имя файла), тип, поля типа, текст; справа — как будет выглядеть.
     Сохраняется по кнопке или ⌘S. Если запись у игроков, там она тоже обновится. -->
<script lang="ts">
  import { hotkeyLabel, modKey } from '../../../shared/hotkeys';
  import { markdownKeys } from '../../../renderer/lib/markdownKeys';
  import MarkdownToolbar from '../../../renderer/lib/MarkdownToolbar.svelte';
  import { editorPrefs } from '../../../renderer/lib/editorPrefs.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { ImagePlus, Save, X } from '@lucide/svelte';
  import FilePicker from '../../../renderer/lib/FilePicker.svelte';
  import { assetUrl, thumb } from '../../../shared/vault';
  import { untrack } from 'svelte';
  import EntryCard from '../../../renderer/lib/entry/EntryCard.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { BUILTIN, COMMON_FIELDS, entryImage, IMAGE_FIELD, OVERRIDES, serializeEntry, type Entry, type FieldDef, type FieldValue } from '../../../shared/compendium';
  import { ui } from './ui.svelte';
  import { forPlayers, typeDef } from '../../../renderer/lib/entry/types.svelte';
  import { entriesFolder, isBuiltinEntry, typesHere, type EntryItem } from './store.svelte';
  import { LIBRARY } from '../../../shared/vault';
  import { openEntry } from './ui.svelte';
  import TableEditor from './TableEditor.svelte';
  import { TABLE_TYPE } from '../../../shared/rolltable';

  let { item }: { item: EntryItem } = $props();

  // Черновик — копия записи; поля храним как есть, списки — строкой «a, b» на время правки.
  let draft = $state<Entry>(untrack(() => structuredClone($state.snapshot(item.entry)) as Entry));
  let saving = $state(false);
  let error = $state('');

  const def = $derived(typeDef(draft.type));
  // A roll table: its own editor writes the text and the dice (the `roll` field), and shows the table itself.
  const isTable = $derived(draft.type === TABLE_TYPE);
  const fields = $derived([...def.fields.filter((f) => !(isTable && f.key === 'roll')), ...COMMON_FIELDS]);
  const tableRoll = () => String(draft.fields['roll'] ?? '');
  const setTableRoll = (v: string) => (draft.fields = { ...draft.fields, roll: v });
  // Поля, которых нет у типа (из Obsidian или прошлого типа), — показываем и даём править как текст.
  const extra = $derived(Object.keys(draft.fields).filter((k) => k !== OVERRIDES && k !== IMAGE_FIELD && !(isTable && k === 'roll') && !fields.some((f) => f.key === k)));
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

  let picking = $state(false);
  function setImage(path: string | null) {
    const next = { ...draft.fields };
    if (path) next[IMAGE_FIELD] = path;
    else delete next[IMAGE_FIELD];
    draft.fields = next;
  }

  async function save() {
    const title = draft.title.trim();
    if (!title) return void (error = t('cmpui.needTitle'));
    saving = true;
    error = '';
    try {
      const snap = $state.snapshot(draft) as Entry;
      if (builtin) {
        // Первая правка встроенной: своя запись в библиотеке, заменяющая её.
        const entry = { ...snap, title, fields: { ...snap.fields, [OVERRIDES]: item.path.slice(BUILTIN.length) } };
        const path = await window.api.createEntry(entriesFolder(LIBRARY), title, serializeEntry(entry, def));
        if (!path) throw new Error(t('cmpui.notWritten'));
        if (store.state.handouts.current === item.path) {
          await dispatch('handouts', 'move', { from: item.path, to: path });
          await dispatch('handouts', 'updateEntry', { path, entry: forPlayers(entry) });
        }
        openEntry(path);
        return;
      }
      let path = item.path;
      if (!(await window.api.writeEntry(path, serializeEntry({ ...snap, title }, def)))) throw new Error(t('cmpui.notWritten'));
      if (title !== item.entry.title) {
        const next = await window.api.renameEntry(path, title);
        if (next) path = next;
      }
      if (store.state.handouts.current === path) await dispatch('handouts', 'updateEntry', { path, entry: forPlayers({ ...snap, title }) });
      ui.open = path;
      ui.editing = false;
    } catch (e) {
      error = t('cmpui.saveFailed', { error: String(e) });
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
  let bodyArea = $state<HTMLTextAreaElement>();
</script>

<svelte:window {onkeydown} />

{#if picking && store.state.vault.tree}
  <FilePicker tree={store.state.vault.tree} prefer="handouts" onpick={(p) => ((picking = false), setImage(p[0] ?? null))} onclose={() => (picking = false)} />
{/if}

<div class="editor">
  <header class="bar">
    <input class="title" type="text" bind:value={draft.title} placeholder={t('cmpui.title')} />
    <select bind:value={draft.type} title={t('cmpui.typeHint')}>
      {#each typesHere() as ty (ty.id)}<option value={ty.id}>{ty.def.title}</option>{/each}
      {#if !typesHere().some((ty) => ty.id === draft.type)}<option value={draft.type}>{draft.type}</option>{/if}
    </select>
    {#if builtin}<span class="faint note" title={t('cmpui.builtinEditHint')}>{t('cmpui.builtinEdit')}</span>{/if}
    {#if error}<span class="error">{error}</span>{/if}
    <div class="spacer"></div>
    <button class="btn" onclick={() => (ui.editing = false)}>{t('cmpui.cancel')}</button>
    <button class="btn primary" disabled={saving} onclick={save} title={hotkeyLabel('save')}><Save size={14} /> {t('cmpui.save')}</button>
  </header>

  <div class="columns" class:single={isTable}>
    <form class="form" onsubmit={(e) => e.preventDefault()}>
      {#if isTable}<TableEditor bind:body={draft.body} bind:roll={tableRoll, setTableRoll} title={draft.title} />{/if}
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
      <div class="image">
        {#if entryImage(draft)}
          <img src={thumb(assetUrl(entryImage(draft)!), 120)} alt="" />
          <button type="button" class="btn" onclick={() => (picking = true)}><ImagePlus size={14} /> {t('cmpui.imageChange')}</button>
          <button type="button" class="icon-btn" title={t('cmpui.imageRemove')} onclick={() => setImage(null)}><X size={14} /></button>
        {:else}
          <button type="button" class="btn" title={t('cmpui.imageHint')} onclick={() => (picking = true)}><ImagePlus size={14} /> {t('cmpui.image')}</button>
        {/if}
      </div>
      {#if !isTable}
        <label class="field">
          <span>{t('cmpui.text')}</span>
          {#if editorPrefs.toolbar}<MarkdownToolbar area={bodyArea} />{/if}
          <textarea rows="16" bind:this={bodyArea} bind:value={draft.body} placeholder={t('cmpui.textPh', { mod: modKey() })} use:markdownKeys></textarea>
        </label>
      {/if}
    </form>
    {#if !isTable}
      <div class="preview">
        <EntryCard entry={draft} />
      </div>
    {/if}
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
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  .title {
    flex: 1 1 120px;
    min-width: 0;
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
  .columns.single {
    grid-template-columns: minmax(340px, 900px);
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
  .image {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .image img {
    max-width: 120px;
    max-height: 80px;
    border-radius: var(--radius-s);
    object-fit: contain;
  }
  .preview {
    padding: 20px 24px;
    overflow: auto;
  }
</style>
