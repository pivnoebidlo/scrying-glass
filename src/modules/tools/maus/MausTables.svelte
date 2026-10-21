<!-- Tools → Mausritter tables (Mausritter adventures only): the GM tables of the SRD — settlement, hex, adventure site
     with rooms, treasure, non-player mouse, adventure seed, season weather, reaction. A roll shows what each line got
     (and the dice); "To journal" and "Copy" take the result as Markdown. -->
<script lang="ts">
  import { Check, Copy, Dices, NotebookPen } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { hordePips, KINDS, SEASONS, type Kind, type Line } from './generate';
  import { mt, rollNow, save } from './store.svelte';
  import { extraText, labelOf, lineText, plain, resultMarkdown, rollText, tablesLang } from './text';
  import { SRD_TABLES } from './srd';
  import { IdCard } from '@lucide/svelte';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { NAMES } from '../mouse/content';
  import type { Hireling } from './generate';

  // A hireling's card: a Mausritter NPC with its numbers.
  function hirelingCard(l: Line) {
    const h = l.extra!.params as unknown as Hireling;
    void bestiary.create(undefined, {
      name: NAMES[lang][h.name]!,
      kind: 'npc',
      lang,
      system: 'mausritter',
      description: plain(lineText({ ...l, extra: undefined }, lang)),
      stats: { hp: h.hp, str: h.str, dex: h.dex, wil: h.wil, armour: 0, attacks: [], critical: '', abilities: [], wants: '' },
    });
  }

  const lang = $derived(tablesLang(locale.lang));
  const result = $derived(mt.results[mt.kind]);
  const pick = (k: Kind) => {
    mt.kind = k;
    save();
  };

  let copied = $state(false);
  function copy() {
    if (!result) return;
    void navigator.clipboard.writeText(resultMarkdown(result, lang));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!result) return;
    const title = t(`mt.kind.${result.kind}` as never);
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), title, resultMarkdown(result, lang).replace(/^## .*\n\n/, ''));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

{#snippet row(l: Line)}
  <li class:room={l.label === 'room'}>
    <span class="label">{labelOf(l)}{l.extra?.params?.['n'] && l.label === 'room' ? ` ${l.extra.params['n']}` : ''}</span>
    <span class="text">{plain(lineText(l, lang))}</span>
    {#if extraText(l) && l.label !== 'room'}<span class="tag" class:warn={l.extra?.key === 'cursed' || l.extra?.key === 'poor'}>{extraText(l)}</span>{/if}
    {#if l.label === 'room'}<span class="tag">{extraText(l)}</span>{/if}
    {#if l.roll}<span class="dice faint">{rollText(l.roll, lang)}</span>{/if}
    {#if l.extra?.key === 'hireling'}<button class="icon-btn" title={t('mt.hirelingCard')} onclick={() => hirelingCard(l)}><IdCard size={13} /></button>{/if}
    {#if l.sub?.length}
      <ul>{#each l.sub as s, i (i)}{@render row(s)}{/each}</ul>
    {/if}
  </li>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('mt.title')}</h2>
    <div class="spacer"></div>
    {#if result}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about">{t('mt.about')}</p>

  <div class="kinds">
    {#each KINDS as k (k)}
      <button class="chip" class:on={mt.kind === k} onclick={() => pick(k)}>{t(`mt.kind.${k}` as never)}</button>
    {/each}
  </div>

  <div class="options">
    {#if mt.kind === 'site'}
      <label>{t('mt.rooms')} <input type="number" min="1" max="20" bind:value={mt.opts.rooms} onchange={save} /></label>
    {:else if mt.kind === 'treasure'}
      {#each ['former', 'magical', 'guarded', 'adversity'] as const as q (q)}
        <label class="check"><input type="checkbox" bind:checked={mt.opts[q]} onchange={save} /> {t(`mt.q.${q}`)}</label>
      {/each}
    {:else if mt.kind === 'hirelings'}
      <label>{t('mt.hireKind')}
        <select bind:value={mt.opts.hireling} onchange={save}>
          {#each SRD_TABLES[lang]['hirelings']!.rows as r, i (i)}<option value={i}>{r[0]} · {r[2]}</option>{/each}
        </select>
      </label>
      <label class="check"><input type="checkbox" bind:checked={mt.opts.paid} onchange={save} /> {t('mt.paid')}</label>
      {#if !mt.opts.paid}<label title={t('mt.wilHint')}>{t('mt.wil')} <input type="number" min="1" max="20" bind:value={mt.opts.wil} onchange={save} /></label>{/if}
    {:else if mt.kind === 'weather'}
      <label>{t('mt.season')}
        <select bind:value={mt.opts.season} onchange={save}>
          {#each SEASONS as s (s)}<option value={s}>{t(`mt.season.${s}`)}</option>{/each}
        </select>
      </label>
    {/if}
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={rollNow}><Dices size={16} /> {t('mt.roll')}</button>
  </div>

  {#if !result}
    <p class="faint placeholder">{t('mt.empty')}</p>
  {:else}
    <section class="result">
      <ul>{#each result.lines as l, i (i)}{@render row(l)}{/each}</ul>
      {#if result.kind === 'treasure' && hordePips(result)}<p class="total">{t('mt.x.pips', { count: hordePips(result) })} {t('mt.inTotal')}</p>{/if}
    </section>
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
  .kinds {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    padding: 3px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-top: 12px;
    color: var(--text-muted);
    font-size: 13px;
  }
  .options label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .options input[type='number'] {
    width: 60px;
  }
  .actions {
    margin: 12px 0 16px;
  }
  .big {
    padding: 6px 18px;
    font-size: 15px;
  }
  .placeholder {
    font-style: italic;
  }
  .result {
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    margin: 6px 0;
    line-height: 1.5;
  }
  li ul {
    margin-left: 18px;
  }
  li.room {
    padding-top: 6px;
    border-top: 1px dashed var(--border);
  }
  .label {
    margin-right: 6px;
    color: var(--text-muted);
    font-weight: 600;
  }
  .label::after {
    content: ':';
  }
  .tag {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--bg-active);
    font-size: 12px;
  }
  .tag.warn {
    background: var(--danger);
    color: var(--bg-primary);
  }
  .dice {
    margin-left: 8px;
    font-size: 11px;
  }
  .total {
    margin: 8px 0 0;
    font-weight: 600;
  }
</style>
