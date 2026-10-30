<!-- The builder: the system's own compendium — rules, conditions, gear… Each entry has a title, a group to sort it
     under and a Markdown text; in adventures of this system they are built-in entries (search, ⌘K, [[links]]), and a
     condition in the tracker with an entry of the same name opens it. On the left — the entries by group, a search,
     a new entry, an import of a Markdown file (# — a group, ## — an entry); on the right — the chosen one: the text with
     the buttons of the journal, or as the GM will see it. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { ChevronDown, ChevronRight, Eye, FileUp, Pencil, Plus, Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { entriesFromMarkdown, loc, type Loc, type PackEntry, type SystemPack } from '../../../shared/syspack';
  import { entryHtml } from '../../../renderer/lib/entry/markup';
  import { markdownKeys } from '../../../renderer/lib/markdownKeys';
  import MarkdownToolbar from '../../../renderer/lib/MarkdownToolbar.svelte';
  import LocInput from './LocInput.svelte';

  let { pack = $bindable(), disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  const L = (x: Loc | undefined) => loc(x, lang);
  const list = $derived(pack.compendium ?? []);
  let sel = $state(0);
  const cur = $derived(list[sel]);
  let query = $state('');
  let closed = $state(new Set<string>());
  let reading = $state(false);
  let area = $state<HTMLTextAreaElement>();

  // The entries by group, in the order the groups first come; a search keeps the matching ones (title or text).
  const groups = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const by = new Map<string, { e: PackEntry; i: number }[]>();
    list.forEach((e, i) => {
      if (q && !L(e.title).toLowerCase().includes(q) && !L(e.text).toLowerCase().includes(q)) return;
      const g = L(e.category);
      by.set(g, [...(by.get(g) ?? []), { e, i }]);
    });
    return [...by].map(([name, items]) => ({ name, items }));
  });
  const groupNames = $derived([...new Set(list.map((e) => L(e.category)).filter(Boolean))]);

  // A text of the entry in the interface language: one string stays one string (as LocInput).
  const put = (v: Loc | undefined, x: string): Loc => (v === undefined || typeof v === 'string' ? x : { ...v, [lang]: x });

  function add() {
    const category = cur?.category;
    pack.compendium = [...list, { title: t('sb.newEntry'), ...(category ? { category } : {}), text: '' }];
    sel = pack.compendium.length - 1;
    reading = false;
  }
  function remove(i: number) {
    pack.compendium = list.filter((_, j) => j !== i);
    if (!pack.compendium.length) delete pack.compendium;
    sel = Math.max(0, Math.min(sel, list.length - 2));
  }
  function toggle(g: string) {
    const next = new Set(closed);
    next.has(g) ? next.delete(g) : next.add(g);
    closed = next;
  }

  // An import: the entries of a Markdown file, asked about before they are added.
  let input = $state<HTMLInputElement>();
  let incoming = $state<{ file: string; entries: PackEntry[]; replace: boolean } | null>(null);
  const same = (e: PackEntry) => list.findIndex((x) => L(x.title).toLowerCase() === L(e.title).toLowerCase());
  async function read(file: File | undefined) {
    if (!file) return;
    const entries = entriesFromMarkdown(await file.text());
    incoming = { file: file.name, entries, replace: true };
    if (input) input.value = '';
  }
  function take() {
    if (!incoming) return;
    const next = [...list];
    for (const e of incoming.entries) {
      const i = same(e);
      if (i >= 0 && incoming.replace) next[i] = e;
      else if (i < 0) next.push(e);
    }
    pack.compendium = next;
    const first = incoming.entries[0];
    if (first) sel = Math.max(0, next.findIndex((x) => L(x.title) === L(first.title)));
    incoming = null;
  }
  const importGroups = $derived(incoming ? [...new Set(incoming.entries.map((e) => L(e.category)))] : []);
</script>

<div class="panel">
  <div class="side">
    <input class="search" type="search" placeholder={t('sb.entrySearch')} bind:value={query} />
    {#if !disabled}
      <div class="acts">
        <button class="btn small" onclick={add}><Plus size={13} /> {t('sb.addEntry')}</button>
        <button class="btn small" title={t('sb.importMdHint')} onclick={() => input?.click()}><FileUp size={13} /> {t('sb.importMd')}</button>
        <input bind:this={input} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden onchange={(e) => read(e.currentTarget.files?.[0])} />
      </div>
    {/if}
    <div class="groups">
      {#each groups as g (g.name)}
        {@const open = !!query.trim() || !closed.has(g.name)}
        <button class="group" onclick={() => toggle(g.name)}>
          {#if open}<ChevronDown size={12} />{:else}<ChevronRight size={12} />{/if}
          <span class="gname">{g.name || t('sb.noGroup')}</span><span class="n">{g.items.length}</span>
        </button>
        {#if open}
          {#each g.items as { e, i } (i)}
            <button class="item" class:on={i === sel} onclick={() => (sel = i)}>{L(e.title) || '—'}</button>
          {/each}
        {/if}
      {:else}
        <p class="faint small">{list.length ? t('sb.entryNone') : t('sb.compendiumAbout')}</p>
      {/each}
    </div>
  </div>

  <div class="edit">
    {#if incoming}
      <div class="import">
        <b>{t('sb.importTitle', { file: incoming.file })}</b>
        {#if incoming.entries.length}
          <p class="faint small"><Lead text={t('sb.importRule')} /></p>
          <div class="import-list">
            {#each importGroups as g (g)}
              {#if g}<div class="ig">{g}</div>{/if}
              {#each incoming.entries.filter((e) => L(e.category) === g) as e, k (k)}
                <div>{L(e.title)}{#if same(e) >= 0}<span class="warn"> — {incoming.replace ? t('sb.importReplaces') : t('sb.importSkips')}</span>{/if}</div>
              {/each}
            {/each}
          </div>
          {#if incoming.entries.some((e) => same(e) >= 0)}
            <label class="check"><input type="checkbox" bind:checked={incoming.replace} /> {t('sb.importReplace')}</label>
          {/if}
          <div class="acts end">
            <button class="btn" onclick={() => (incoming = null)}>{t('sb.cancel')}</button>
            <button class="btn primary" onclick={take}>{t('sb.importAdd', { count: incoming.entries.length })}</button>
          </div>
        {:else}
          <p class="faint">{t('sb.importEmpty')}</p>
          <div class="acts end"><button class="btn" onclick={() => (incoming = null)}>{t('sb.cancel')}</button></div>
        {/if}
      </div>
    {:else if cur}
      <div class="titles">
        <label class="row grow"><span>{t('sb.name')}</span><LocInput value={cur.title} set={(v) => (cur.title = v)} {disabled} /></label>
        <label class="row grow">
          <span>{t('sb.entryCategory')}</span>
          <input type="text" list="sb-groups" placeholder={t('sb.entryCategoryPh')} {disabled} value={L(cur.category)} oninput={(e) => (e.currentTarget.value ? (cur.category = put(cur.category, e.currentTarget.value)) : delete cur.category)} />
          <datalist id="sb-groups">{#each groupNames as g (g)}<option value={g}></option>{/each}</datalist>
        </label>
        {#if !disabled}<button class="icon-btn del" title={t('sb.remove')} onclick={() => remove(sel)}><Trash2 size={14} /></button>{/if}
      </div>
      <div class="bar">
        {#if !reading && !disabled}<MarkdownToolbar {area} />{/if}
        <button class="btn small mode" onclick={() => (reading = !reading)}>
          {#if reading}<Pencil size={13} /> {t('sb.entryEdit')}{:else}<Eye size={13} /> {t('sb.entryRead')}{/if}
        </button>
      </div>
      {#if reading || disabled}
        <div class="read">
          <h4>{L(cur.title)}</h4>
          {@html entryHtml(L(cur.text))}
        </div>
      {:else}
        <textarea bind:this={area} use:markdownKeys value={L(cur.text)} oninput={(e) => (cur.text = put(cur.text, e.currentTarget.value))} placeholder={t('sb.entryTextPh')}></textarea>
      {/if}
      <p class="faint small"><Lead text={t('sb.compendiumAbout')} /></p>
    {:else}
      <p class="faint">{t('sb.entryPick')}</p>
    {/if}
  </div>
</div>

<style>
  /* The list and the editor side by side; narrow — one under the other. */
  .panel {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }
  .side {
    display: flex;
    flex: 1 1 220px;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    max-width: 280px;
  }
  .search {
    width: 100%;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .acts.end {
    justify-content: flex-end;
  }
  .groups {
    display: flex;
    flex-direction: column;
    max-height: 60vh;
    overflow-y: auto;
  }
  /* In a scrolled column the rows would shrink to nothing. */
  .groups > * {
    flex-shrink: 0;
  }
  .group {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    padding: 3px 4px;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
  }
  .gname {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .n {
    color: var(--text-faint);
    font-variant-numeric: tabular-nums;
  }
  .item {
    padding: 3px 6px 3px 20px;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--bg-active);
  }
  .edit {
    display: flex;
    flex: 1 1 340px;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .titles {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px;
  }
  .grow {
    flex: 1 1 200px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .row > span:first-child {
    color: var(--text-faint);
    font-size: 11px;
  }
  .del {
    margin-bottom: 3px;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .mode {
    margin-left: auto;
  }
  textarea {
    min-height: 360px;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 12px;
    line-height: 1.55;
    resize: vertical;
  }
  .read {
    min-height: 360px;
    max-width: 72ch;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    line-height: 1.5;
  }
  .read h4 {
    margin: 0 0 6px;
    font-size: 16px;
  }
  .read :global(table) {
    border-collapse: collapse;
  }
  .read :global(td),
  .read :global(th) {
    padding: 2px 8px;
    border: 1px solid var(--border);
  }
  .import {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
  }
  .import-list {
    max-height: 50vh;
    overflow-y: auto;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
  }
  .ig {
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .warn {
    color: var(--warning);
  }
  .check {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .small {
    margin: 0;
    font-size: 11px;
  }
</style>
