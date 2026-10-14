<!-- «Типы записей»: свои типы справочника (божества, фракции, места, ритуалы…) и их поля. Хранятся в библиотеке —
     общие для всех кампаний. Правки сохраняются кнопкой; записи в файлах не меняются (ключи полей — в их шапке). -->
<script lang="ts">
  import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { customTypes, saveCustomTypes } from '../../../renderer/lib/entry/types.svelte';
  import { keyFrom, TYPES, validKey, type CustomType, type FieldDef } from '../../../shared/compendium';
  import { book } from './store.svelte';
  import { ui } from './ui.svelte';

  const KINDS: { id: FieldDef['kind']; title: string }[] = [
    { id: 'text', title: 'Текст' },
    { id: 'number', title: 'Число' },
    { id: 'bool', title: 'Да / нет' },
    { id: 'select', title: 'Выбор из списка' },
    { id: 'list', title: 'Список (через запятую)' },
  ];
  const RESERVED = new Set(['type', 'tags', 'source', 'aliases', 'overrides']);

  // Черновик всех своих типов; orig — id типа до правки (чтобы предупредить, что записи останутся со старым).
  type Draft = CustomType & { orig: string | null };
  const fromStore = () => customTypes.list.map((t) => ({ ...structuredClone($state.snapshot(t)), orig: t.id }) as Draft);
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
  const dirty = $derived(JSON.stringify(draft.map(({ orig: _, ...t }) => t)) !== JSON.stringify($state.snapshot(customTypes.list)));
  // Сколько своих записей (в хранилище и библиотеке) с этим типом.
  const used = (id: string | null) => (id ? [...book.vault, ...book.library].filter((e) => e.entry.type === id).length : 0);

  // Ошибки, из-за которых сохранять нельзя.
  const errors = $derived.by(() => {
    const out: string[] = [];
    const ids = new Set<string>();
    for (const t of draft) {
      const name = t.title.trim() || 'без названия';
      if (!t.title.trim()) out.push('У типа нет названия.');
      if (!validKey(t.id)) out.push(`«${name}»: ключ в файле — латиница, цифры, «_» (например, deity).`);
      else if (TYPES[t.id]) out.push(`«${name}»: ключ «${t.id}» занят встроенным типом.`);
      else if (ids.has(t.id)) out.push(`«${name}»: ключ «${t.id}» уже у другого типа.`);
      ids.add(t.id);
      const keys = new Set<string>();
      for (const f of t.fields) {
        if (!f.title.trim()) out.push(`«${name}»: у поля нет подписи.`);
        if (!validKey(f.key)) out.push(`«${name}», поле «${f.title}»: ключ — латиница, цифры, «_».`);
        else if (RESERVED.has(f.key)) out.push(`«${name}», поле «${f.title}»: ключ «${f.key}» занят (общие поля).`);
        else if (keys.has(f.key)) out.push(`«${name}»: ключ поля «${f.key}» повторяется.`);
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
  function setTitle(t: Draft, v: string) {
    change();
    if (!t.id || t.id === keyFrom(t.title)) t.id = keyFrom(v);
    if (!t.plural || t.plural === t.title) t.plural = v;
    t.title = v;
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
    const list = draft.map(({ orig: _, ...t }) => ({ ...t, title: t.title.trim(), plural: t.plural.trim() || t.title.trim() }));
    if (await saveCustomTypes(list)) {
      touched = false;
      draft = fromStore();
      status = 'Сохранено.';
    } else status = 'Не удалось сохранить: нет папки библиотеки.';
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
    return ['---', `type: ${cur.id || '…'}`, ...cur.fields.map((f) => `${f.key || '…'}:${f.kind === 'list' ? '' : ' '}${val(f)}`), '---', 'Текст записи…'].join('\n');
  });
</script>

<div class="types">
  <header class="bar">
    <h2>Типы записей</h2>
    {#if status}<span class="status">{status}</span>{/if}
    <div class="spacer"></div>
    {#if dirty}<button class="btn" onclick={revert}>Отменить правки</button>{/if}
    <button class="btn primary" disabled={!dirty || errors.length > 0} onclick={save}><Save size={14} /> Сохранить</button>
    <button class="icon-btn" title="Закрыть" onclick={() => (ui.page = 'entry')}><X size={16} /></button>
  </header>

  <div class="columns">
    <nav>
      <p class="faint small">Встроенные: {Object.values(TYPES).map((t) => t.title.toLowerCase()).join(', ')}.</p>
      {#each draft as t, i (i)}
        <button class="type" class:active={i === sel} onclick={() => ((sel = i), (confirmDelete = false))}>
          <span>{t.title || 'Новый тип'}</span>
          <span class="faint">{t.fields.length ? `полей: ${t.fields.length}` : ''}{used(t.orig) ? ` · записей: ${used(t.orig)}` : ''}</span>
        </button>
      {/each}
      <button class="btn add" onclick={addType}><Plus size={14} /> Новый тип</button>
    </nav>

    <section class="form">
      {#if cur}
        <div class="row">
          <label class="field">
            <span>Название</span>
            <input type="text" value={cur.title} placeholder="Божество" oninput={(e) => setTitle(cur, e.currentTarget.value)} />
          </label>
          <label class="field">
            <span>Во множественном числе</span>
            <input type="text" bind:value={cur.plural} oninput={change} placeholder="Божества" title="Для фильтра в списке: «Божества 12»" />
          </label>
          <label class="field">
            <span>Ключ в файле (type:)</span>
            <input type="text" class="mono" bind:value={cur.id} oninput={change} placeholder="deity" />
          </label>
        </div>
        {#if cur.orig && cur.orig !== cur.id && used(cur.orig)}
          <p class="warn">У {used(cur.orig)} записей в файлах написано «type: {cur.orig}» — после смены ключа они станут записями неизвестного типа. Ключ в файлах можно поменять вручную.</p>
        {/if}

        <h3>Поля</h3>
        <p class="faint small">Метки, источник и другие названия есть у любой записи. Отмеченное «под названием» пишется в строке под заголовком («Божество, хаотично-доброе»), остальное — строками «поле: значение».</p>
        {#if cur.fields.length}
          <div class="fields">
            {#each cur.fields as f, i (i)}
              <div class="fcard">
                <div class="line">
                  <input type="text" class="ftitle" value={f.title} placeholder="Подпись: Мировоззрение" oninput={(e) => setFieldTitle(f, e.currentTarget.value)} />
                  <select bind:value={f.kind} onchange={change} title="Вид значения">{#each KINDS as k (k.id)}<option value={k.id}>{k.title}</option>{/each}</select>
                  <span class="acts">
                    <button class="icon-btn" title="Выше" disabled={i === 0} onclick={() => moveField(i, -1)}><ArrowUp size={13} /></button>
                    <button class="icon-btn" title="Ниже" disabled={i === cur.fields.length - 1} onclick={() => moveField(i, 1)}><ArrowDown size={13} /></button>
                    <button class="icon-btn" title="Убрать поле (в файлах значения останутся)" onclick={() => (cur.fields.splice(i, 1), change())}><X size={13} /></button>
                  </span>
                </div>
                <div class="line">
                  <label class="key" title="Как поле называется в шапке файла"><span class="faint">ключ</span><input type="text" class="mono" bind:value={f.key} oninput={change} placeholder="alignment" /></label>
                  {#if f.kind === 'select'}
                    <input type="text" class="grow" value={(f.options ?? []).join(', ')} placeholder="Варианты через запятую" onchange={(e) => ((f.options = e.currentTarget.value.split(',').map((x) => x.trim()).filter(Boolean)), change())} />
                  {:else}
                    <input type="text" class="grow" value={f.hint ?? ''} placeholder="Подсказка в редакторе (необязательно)" onchange={(e) => ((f.hint = e.currentTarget.value.trim() || undefined), change())} />
                  {/if}
                  <label class="sub"><input type="checkbox" checked={!!f.subtitle} onchange={(e) => ((f.subtitle = e.currentTarget.checked || undefined), change())} /> под названием</label>
                </div>
              </div>
            {/each}
          </div>
        {/if}
        <button class="btn" onclick={addField}><Plus size={14} /> Поле</button>

        <h3>Шапка файла</h3>
        <pre class="sample">{sample}</pre>

        <div class="danger">
          <button class="btn" class:warn-btn={confirmDelete} onclick={removeType}>
            <Trash2 size={14} />
            {confirmDelete ? 'Точно удалить тип? Нажмите ещё раз' : 'Удалить тип'}
          </button>
          {#if used(cur.orig)}<span class="faint small">Записи останутся — поля покажутся как «поле — значение».</span>{/if}
        </div>
      {:else}
        <div class="empty">
          <p>Свои типы — для того, чего нет в правилах: божества, фракции, места, ритуалы, слухи.</p>
          <p class="faint">У типа свои поля; записи этого типа создаются «+» в списке и правятся, как обычные. Типы общие для всех кампаний.</p>
          <button class="btn primary" onclick={addType}><Plus size={14} /> Новый тип</button>
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
    color: var(--warning, #d9a441);
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
