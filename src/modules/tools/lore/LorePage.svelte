<!-- A generator of parts (Tools → Ships, Guilds and cults): a kind → a result in parts, each rerolled or pinned; to the
     journal or copy. The page of a generator gives its words and how its result reads. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { Check, Copy, NotebookPen, Pin, RefreshCw, Sparkles } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { loreMarkdown, type LoreView, type Result } from './engine';
  import type { LoreStore } from './store.svelte';

  let {
    gen,
    title,
    about,
    create,
    empty,
    kindLabel = '',
    kinds = [],
    view,
  }: {
    gen: LoreStore;
    title: string;
    about: string;
    create: string;
    empty: string;
    kindLabel?: string;
    kinds?: { id: string; label: string }[];
    view: (r: Result, kind: string) => LoreView;
  } = $props();

  const r = $derived(gen.s.result);
  const v = $derived(r ? view(r, gen.s.made) : null);
  const md = (x: LoreView, heading?: string) => loreMarkdown(x.title, x.parts.map((p) => ({ label: p.label, lines: p.lead ? [p.lead, ...p.lines] : p.lines })), heading);

  let copied = $state(false);
  function copy() {
    if (!v) return;
    void navigator.clipboard.writeText(md(v, v.page));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!v) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), v.page.replace(/[\\/:*?"<>|«»]/g, ''), md(v));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

<div class="view">
  <header class="head">
    <h2>{title}</h2>
    <div class="spacer"></div>
    {#if v}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={about} /></p>

  {#if kinds.length > 1}
    <div class="options">
      <label>{kindLabel}
        <select bind:value={gen.s.kind} onchange={gen.save}>
          <option value="random">{t('settlement.random')}</option>
          {#each kinds as k (k.id)}<option value={k.id}>{k.label}</option>{/each}
        </select>
      </label>
    </div>
  {/if}
  <div class="actions">
    <button class="btn primary big" onclick={gen.create}><Sparkles size={16} /> {create}</button>
    {#if v}<button class="btn" onclick={gen.rerollUnpinned}><RefreshCw size={14} /> {t('tavern.reroll')}</button>{/if}
  </div>

  {#if !v}
    <p class="faint placeholder">{empty}</p>
  {:else}
    <h3 class="title">{v.title}</h3>
    <div class="sheet">
      {#each v.parts as p (p.id)}
        <section class="part" class:wide={p.wide} class:pinned={gen.s.pinned.includes(p.id)}>
          <header>
            <h4>{p.label}</h4>
            <div class="spacer"></div>
            <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => gen.rerollPart(p.id)}><RefreshCw size={13} /></button>
            <button class="icon-btn pin" class:on={gen.s.pinned.includes(p.id)} title={gen.s.pinned.includes(p.id) ? t('tavern.unpin') : t('tavern.pin')} onclick={() => gen.togglePin(p.id)}>
              <Pin size={13} />
            </button>
          </header>
          {#if p.lead}<p class="lead">{p.lead}</p>{/if}
          {#each p.lines as line, i (i)}<p class:faint={!!p.lead}>{line}</p>{/each}
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .about {
    margin: 6px 0 12px;
  }
  .options label {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin: 12px 0 16px;
  }
  .big {
    padding: 6px 18px;
    font-size: 15px;
  }
  .placeholder {
    font-style: italic;
  }
  .title {
    margin: 0 0 10px;
    font-size: 20px;
  }
  .sheet {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 10px;
  }
  .part {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .part.wide {
    grid-column: 1 / -1;
  }
  .part.pinned {
    border-color: var(--accent);
  }
  .part header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .part h4 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .pin {
    color: var(--text-faint);
  }
  .pin.on {
    color: var(--accent);
  }
  .part p {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .lead {
    padding: 4px 10px;
    border-left: 3px solid var(--accent);
    background: var(--bg-primary);
    font-style: italic;
  }
</style>
