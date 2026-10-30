<!-- «Типы записей»: свои типы справочника (божества, фракции, места, ритуалы…) и их поля. Хранятся в библиотеке —
     общие для всех кампаний. Правки сохраняются кнопкой; записи в файлах не меняются (ключи полей — в их шапке). -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { customTypes, saveCustomTypes } from '../../../renderer/lib/entry/types.svelte';
  import { keyFrom, TYPES, validKey, type CustomType, type FieldDef } from '../../../shared/compendium';
  import { book } from './store.svelte';
  import { ui } from './ui.svelte';

  const KINDS: FieldDef['kind'][] = ['text', 'number', 'bool', 'select', 'list'];
  const RESERVED = new Set(['type', 'tags', 'source', 'aliases', 'overrides']);

  // Черновик всех своих типов; orig — id типа до правки (чтобы предупредить, что записи останутся со старым).
  type Draft = CustomType & { orig: string | null };
  const fromStore = () => customTypes.list.map((ty) => ({ ...structuredClone($state.snapshot(ty)), orig: ty.id }) as Draft);
  let draft = $state<Draft[]>(untrack(fromStore));
  let sel = $state(0);
  let status = $state('');
  let confirmDelete = $state(false);

  // Свои типы прочитаются чуть позже открытия страницы — подхватываем, пока ничего не правили.
  let touched = false;
  $effect(() => {
    void customTypes.list;
    if (!touched) draft = untrack(fromStore);
  });

  const cur = $derived(draft[sel] as Draft | undefined);
  const dirty = $derived(JSON.stringify(draft.map(({ orig: _, ...ty }) => ty)) !== JSON.stringify($state.snapshot(customTypes.list)));
  // Сколько своих записей (в хранилище и библиотеке) с этим типом.
  const used = (id: string | null) => (id ? [...book.vault, ...book.library].filter((e) => e.entry.type === id).length : 0);

  // Ошибки, из-за которых сохранять нельзя.
  const errors = $derived.by(() => {
    const out: string[] = [];
    const ids = new Set<string>();
    for (const ty of draft) {
      const name = ty.title.trim() || t('cmpui.untitled');
      if (!ty.title.trim()) out.push(t('cmpui.noTitle'));
      if (!validKey(ty.id)) out.push(t('cmpui.badKey', { name }));
      else if (TYPES[ty.id]) out.push(t('cmpui.keyBuiltin', { name, key: ty.id }));
      else if (ids.has(ty.id)) out.push(t('cmpui.keyTaken', { name, key: ty.id }));
      ids.add(ty.id);
      const keys = new Set<string>();
      for (const f of ty.fields) {
        if (!f.title.trim()) out.push(t('cmpui.noFieldTitle', { name }));
        if (!validKey(f.key)) out.push(t('cmpui.badFieldKey', { name, field: f.title }));
        else if (RESERVED.has(f.key)) out.push(t('cmpui.fieldReserved', { name, field: f.title, key: f.key }));
        else if (keys.has(f.key)) out.push(t('cmpui.fieldRepeats', { name, key: f.key }));
        keys.add(f.key);
      }
    }
    return out;
  });

  function change() {
    touched = true;
    status = '';
    confirmDelete = false;
  }

  function addType() {
    change();
    draft.push({ id: '', title: '', plural: '', fields: [], orig: null });
    sel = draft.length - 1;
  }

  function removeType() {
    if (!cur) return;
    if (!confirmDelete) return void (confirmDelete = true);
    change();
    draft.splice(sel, 1);
    sel = Math.max(0, sel - 1);
  }

  // Ключ следует за названием, пока его не правили руками.
  function setTitle(ty: Draft, v: string) {
    change();
    if (!ty.id || ty.id === keyFrom(ty.title)) ty.id = keyFrom(v);
    if (!ty.plural || ty.plural === ty.title) ty.plural = v;
    ty.title = v;
  }
  function setFieldTitle(f: FieldDef, v: string) {
    change();
    if (!f.key || f.key === keyFrom(f.title)) f.key = keyFrom(v);
    f.title = v;
  }

  function addField() {
    if (!cur) return;
    change();
    cur.fields.push({ key: '', title: '', kind: 'text' });
  }
  function moveField(i: number, d: -1 | 1) {
    if (!cur) return;
    const j = i + d;
    if (j < 0 || j >= cur.fields.length) return;
    change();
    const [f] = cur.fields.splice(i, 1);
    cur.fields.splice(j, 0, f!);
  }

  async function save() {
    if (errors.length) return;
    const list = draft.map(({ orig: _, ...ty }) => ({ ...ty, title: ty.title.trim(), plural: ty.plural.trim() || ty.title.trim() }));
    if (await saveCustomTypes(list)) {
      touched = false;
      draft = fromStore();
      status = t('cmpui.saved');
    } else status = t('cmpui.noLibrary');
  }

  function revert() {
    touched = false;
    draft = fromStore();
    sel = Math.min(sel, Math.max(0, draft.length - 1));
    status = '';
  }

  // Как выглядит шапка файла записи этого типа — для Obsidian.
  const sample = $derived.by(() => {
    if (!cur) return '';
    const val = (f: FieldDef) =>
      f.kind === 'number' ? '1' : f.kind === 'bool' ? 'true' : f.kind === 'list' ? '\n  - …\n  - …' : f.kind === 'select' ? (f.options?.[0] ?? '…') : '…';
    return ['---', `type: ${cur.id || '…'}`, ...cur.fields.map((f) => `${f.key || '…'}:${f.kind === 'list' ? '' : ' '}${val(f)}`), '---', t('cmpui.entryText')].join('\n');
  });
</script>

<div class="types">
  <header class="bar">
    <h2>{t('cmpui.types')}</h2>
    {#if status}<span class="status">{status}</span>{/if}
    <div class="spacer"></div>
    {#if dirty}<button class="btn" onclick={revert}>{t('cmpui.revert')}</button>{/if}
    <button class="btn primary" disabled={!dirty || errors.length > 0} onclick={save}><Save size={14} /> {t('cmpui.save')}</button>
    <button class="icon-btn" title={t('cmpui.close')} onclick={() => (ui.page = 'entry')}><X size={16} /></button>
  </header>

  <div class="columns">
    <nav>
      <p class="faint small">{t('cmpui.builtinTypes', { list: Object.values(TYPES).map((ty) => ty.title.toLowerCase()).join(', ') })}</p>
      {#each draft as ty, i (i)}
        <button class="type" class:active={i === sel} onclick={() => ((sel = i), (confirmDelete = false))}>
          <span>{ty.title || t('cmpui.newType')}</span>
          <span class="faint">{ty.fields.length ? t('cmpui.fieldsN', { count: ty.fields.length }) : ''}{used(ty.orig) ? t('cmpui.entriesN', { count: used(ty.orig) }) : ''}</span>
        </button>
      {/each}
      <button class="btn add" onclick={addType}><Plus size={14} /> {t('cmpui.newType')}</button>
    </nav>

    <section class="form">
      {#if cur}
        <div class="row">
          <label class="field">
            <span>{t('cmpui.typeTitle')}</span>
            <input type="text" value={cur.title} placeholder={t('cmpui.typeTitlePh')} oninput={(e) => setTitle(cur, e.currentTarget.value)} />
          </label>
          <label class="field">
            <span>{t('cmpui.plural')}</span>
            <input type="text" bind:value={cur.plural} oninput={change} placeholder={t('cmpui.pluralPh')} title={t('cmpui.pluralHint')} />
          </label>
          <label class="field">
            <span>{t('cmpui.key')}</span>
            <input type="text" class="mono" bind:value={cur.id} oninput={change} placeholder="deity" />
          </label>
        </div>
        {#if cur.orig && cur.orig !== cur.id && used(cur.orig)}
          <p class="warn">{t('cmpui.keyWarn', { count: used(cur.orig), key: cur.orig ?? '' })}</p>
        {/if}

        <h3>{t('cmpui.fields')}</h3>
        <p class="faint small"><Lead text={t('cmpui.fieldsHint')} /></p>
        {#if cur.fields.length}
          <div class="fields">
            {#each cur.fields as f, i (i)}
              <div class="fcard">
                <div class="line">
                  <input type="text" class="ftitle" value={f.title} placeholder={t('cmpui.fieldTitlePh')} oninput={(e) => setFieldTitle(f, e.currentTarget.value)} />
                  <select bind:value={f.kind} onchange={change} title={t('cmpui.kindHint')}>{#each KINDS as k (k)}<option value={k}>{t(`cmpui.kind.${k}`)}</option>{/each}</select>
                  <span class="acts">
                    <button class="icon-btn" title={t('cmpui.up')} disabled={i === 0} onclick={() => moveField(i, -1)}><ArrowUp size={13} /></button>
                    <button class="icon-btn" title={t('cmpui.down')} disabled={i === cur.fields.length - 1} onclick={() => moveField(i, 1)}><ArrowDown size={13} /></button>
                    <button class="icon-btn" title={t('cmpui.removeField')} onclick={() => (cur.fields.splice(i, 1), change())}><X size={13} /></button>
                  </span>
                </div>
                <div class="line">
                  <label class="key" title={t('cmpui.keyLabelHint')}><span class="faint">{t('cmpui.keyLabel')}</span><input type="text" class="mono" bind:value={f.key} oninput={change} placeholder="alignment" /></label>
                  {#if f.kind === 'select'}
                    <input type="text" class="grow" value={(f.options ?? []).join(', ')} placeholder={t('cmpui.optionsPh')} onchange={(e) => ((f.options = e.currentTarget.value.split(',').map((x) => x.trim()).filter(Boolean)), change())} />
                  {:else}
                    <input type="text" class="grow" value={f.hint ?? ''} placeholder={t('cmpui.hintPh')} onchange={(e) => ((f.hint = e.currentTarget.value.trim() || undefined), change())} />
                  {/if}
                  <label class="sub"><input type="checkbox" checked={!!f.subtitle} onchange={(e) => ((f.subtitle = e.currentTarget.checked || undefined), change())} /> {t('cmpui.underTitle')}</label>
                </div>
              </div>
            {/each}
          </div>
        {/if}
        <button class="btn" onclick={addField}><Plus size={14} /> {t('cmpui.addField')}</button>

        <h3>{t('cmpui.header')}</h3>
        <pre class="sample">{sample}</pre>

        <div class="danger">
          <button class="btn" class:warn-btn={confirmDelete} onclick={removeType}>
            <Trash2 size={14} />
            {confirmDelete ? t('cmpui.confirmDelete') : t('cmpui.deleteType')}
          </button>
          {#if used(cur.orig)}<span class="faint small">{t('cmpui.entriesStay')}</span>{/if}
        </div>
      {:else}
        <div class="empty">
          <p>{t('cmpui.typesAbout1')}</p>
          <p class="faint"><Lead text={t('cmpui.typesAbout2')} /></p>
          <button class="btn primary" onclick={addType}><Plus size={14} /> {t('cmpui.newType')}</button>
        </div>
      {/if}

      {#if errors.length}
        <ul class="errors">{#each errors as e (e)}<li>{e}</li>{/each}</ul>
      {/if}
    </section>
  </div>
</div>

<style>
  .types {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }
  h3 {
    margin: 18px 0 4px;
    font-size: 13px;
  }
  .spacer {
    flex: 1;
  }
  .status {
    color: var(--accent);
    font-size: 12px;
  }
  .columns {
    display: grid;
    grid-template-columns: 190px 1fr;
    flex: 1;
    min-height: 0;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 8px;
    overflow: auto;
    border-right: 1px solid var(--border);
  }
  .type {
    display: flex;
    flex-direction: column;
    padding: 5px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .type:hover {
    background: var(--bg-hover);
  }
  .type.active {
    background: var(--bg-active);
  }
  .type .faint {
    font-size: 11px;
  }
  .add {
    margin-top: 8px;
    align-self: flex-start;
  }
  .small {
    margin: 0 0 8px;
    font-size: 12px;
  }
  .form {
    padding: 16px 20px;
    overflow: auto;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(3, minmax(140px, 1fr));
    gap: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .mono {
    font-family: var(--font-mono, ui-monospace, monospace);
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
  }
  .row input {
    width: 100%;
    min-width: 0;
  }
  .fcard {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ftitle,
  .grow {
    flex: 1;
    min-width: 0;
  }
  .key {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .key input {
    width: 150px;
  }
  .sub {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
  }
  .acts {
    display: flex;
  }
  .sample {
    margin: 0;
    padding: 8px 12px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 12px;
  }
  .danger {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }
  .warn-btn {
    border-color: var(--danger, #e04545);
    color: var(--danger, #e04545);
  }
  .warn {
    margin: 8px 0 0;
    color: var(--warning);
    font-size: 12px;
  }
  .errors {
    margin: 16px 0 0;
    padding-left: 18px;
    color: var(--danger, #e04545);
    font-size: 12px;
  }
  .empty {
    max-width: 520px;
  }
</style>
