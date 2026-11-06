<!-- Tools → Generators: what the packages of this system bring (shared/generators.ts). A roll shows what each line got
     and the dice; «To journal» and «Copy» take the result as Markdown. Knows no game. -->
<script lang="ts">
  import { Check, Copy, Dices, IdCard, NotebookPen } from '@lucide/svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { genCardOf, genText, lineWords, plainText, resultMarkdown, rollWords, type GeneratorFile, type GenLine, type GenOption, type GenOptions, type GenResult } from '../../../shared/generators';
  import Calculator from './Calculator.svelte';
  import PriceList from './PriceList.svelte';
  import { calc } from '../../../shared/syspack';
  import { familyOf } from '../../../systems';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { filesOf, gen, optionsOf, resultOf, rollNow, save } from './store.svelte';

  const lang = $derived(locale.lang);
  const family = $derived(familyOf(currentSystem(store.state.adventures)));
  const all = $derived(filesOf(family).flatMap((file) => file.generators.map((g) => ({ file, g }))));
  const lists = $derived(filesOf(family).flatMap((file) => (file.lists ?? []).map((l) => ({ file, l }))));
  const calcs = $derived(filesOf(family).flatMap((file) => (file.calculators ?? []).map((c) => ({ file, c }))));
  const list = $derived(lists.find((x) => x.l.id === gen.open[family]));
  const calculator = $derived(calcs.find((x) => x.c.id === gen.open[family]));
  const now = $derived(list || calculator ? undefined : (all.find((x) => x.g.id === gen.open[family]) ?? all[0]));
  const file = $derived(now?.file ?? list?.file ?? calculator?.file ?? filesOf(family)[0]);
  const opts = $derived(now ? optionsOf(now.file, now.g) : ({} as GenOptions));
  const result = $derived(now ? resultOf(now.file, now.g) : undefined);

  function pick(id: string) {
    gen.open[family] = id;
    save();
  }
  // An option shown only while its condition holds.
  const shown = (o: GenOption) => !o.when || !!calc(o.when, (k) => Number(opts[k] ?? 0), () => 1);
  const rowsOf = (f: GeneratorFile, o: GenOption) => f.tables[lang]?.[o.rows!.table]?.rows ?? f.tables['en']?.[o.rows!.table]?.rows ?? [];

  function card(f: GeneratorFile, l: GenLine) {
    void bestiary.create(undefined, { ...genCardOf(f, l.card!, lang), lang, system: f.system, description: plainText(lineWords(f, l, lang)) });
  }
  const wholeCard = (f: GeneratorFile, r: GenResult) => bestiary.create(undefined, { ...genCardOf(f, r.card!, lang), lang, system: f.system });

  let copied = $state(false);
  function copy() {
    if (!result || !file) return;
    void navigator.clipboard.writeText(resultMarkdown(file, result, lang));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!result || !file || !now) return;
    const body = resultMarkdown(file, result, lang).replace(/^## .*\n\n/, '');
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), genText(now.g.title, lang), body);
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

{#snippet row(f: GeneratorFile, l: GenLine)}
  <li class:sep={l.sep}>
    <span class="label">{genText(l.label, lang, l.params)}</span>
    <span class="text">{plainText(lineWords(f, l, lang))}</span>
    {#each l.notes ?? [] as n, i (i)}<span class="tag" class:warn={n.warn}>{genText(n.text, lang, l.params)}</span>{/each}
    {#if l.roll}<span class="dice faint">{rollWords(l.roll, lang)}</span>{/if}
    {#if l.card}<button class="icon-btn" title={t('gen.card')} onclick={() => card(f, l)}><IdCard size={13} /></button>{/if}
    {#if l.sub?.length}
      <ul>{#each l.sub as s, i (i)}{@render row(f, s)}{/each}</ul>
    {/if}
  </li>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{file?.title ? genText(file.title, lang) : t('tools.side.generators')}</h2>
    <div class="spacer"></div>
    {#if result?.card && file}
      <button class="btn" title={t('gen.card')} onclick={() => wholeCard(file, result)}><IdCard size={14} /> {t('gen.toCard')}</button>
    {/if}
    {#if result}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  {#if file?.about && now}<p class="faint about"><Lead text={genText(file.about, lang)} /></p>{/if}

  <div class="kinds">
    {#each all as x (`${x.file.system}/${x.g.id}`)}
      <button class="chip" class:on={now?.g.id === x.g.id} onclick={() => pick(x.g.id)}>{genText(x.g.title, lang)}</button>
    {/each}
    {#each lists as x (`${x.file.system}/${x.l.id}`)}
      <button class="chip" class:on={list?.l.id === x.l.id} onclick={() => pick(x.l.id)}>{genText(x.l.title, lang)}</button>
    {/each}
    {#each calcs as x (`${x.file.system}/${x.c.id}`)}
      <button class="chip" class:on={calculator?.c.id === x.c.id} onclick={() => pick(x.c.id)}>{genText(x.c.title, lang)}</button>
    {/each}
  </div>

  {#if list}
    {#key `${list.file.system}/${list.l.id}`}<PriceList file={list.file} list={list.l} />{/key}
  {:else if calculator}
    {#key `${calculator.file.system}/${calculator.c.id}`}<Calculator file={calculator.file} calc={calculator.c} />{/key}
  {:else if now && file}
    <div class="options">
      {#each (now.g.options ?? []).filter(shown) as o (o.key)}
        {#if o.type === 'check'}
          <label class="check"><input type="checkbox" checked={!!opts[o.key]} onchange={(e) => ((opts[o.key] = e.currentTarget.checked), save())} /> {genText(o.title, lang)}</label>
        {:else if o.type === 'number'}
          <label title={genText(o.hint, lang)}>{genText(o.title, lang)} <input type="number" min={o.min} max={o.max} value={opts[o.key]} onchange={(e) => ((opts[o.key] = Number(e.currentTarget.value)), save())} /></label>
        {:else}
          <label>{genText(o.title, lang)}
            <select value={opts[o.key]} onchange={(e) => ((opts[o.key] = o.rows ? Number(e.currentTarget.value) : e.currentTarget.value), save())}>
              {#if o.rows}
                {#each rowsOf(file, o) as r, i (i)}<option value={i}>{o.rows.cols.map((c) => r[c]).join(' · ')}</option>{/each}
              {:else}
                {#each o.choices ?? [] as c (c.value)}<option value={c.value}>{genText(c.title, lang)}</option>{/each}
              {/if}
            </select>
          </label>
        {/if}
      {/each}
    </div>
    <div class="actions">
      <button class="btn primary big" onclick={() => rollNow(file, now.g)}><Dices size={16} /> {t('gen.roll')}</button>
    </div>

    {#if !result}
      <p class="faint placeholder">{t('gen.empty')}</p>
    {:else}
      <section class="result">
        <ul>{#each result.lines as l, i (i)}{@render row(file, l)}{/each}</ul>
        {#if result.footer}<p class="total">{genText(result.footer, lang, result.params)}</p>{/if}
      </section>
    {/if}
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
  li.sep {
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
