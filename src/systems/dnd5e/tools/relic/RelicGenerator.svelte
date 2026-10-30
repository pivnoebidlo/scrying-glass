<!-- Magic item generator (Tools → Magic item generator): kind and power → name, look, magic (in D&D — an SRD item of
     the power's rarity as its base, a link to the entry), history, quirk and sometimes a curse. Each part can be
     rerolled; copy, to the journal, to Telegram (without the curse). The current item is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { Check, Copy, NotebookPen, RefreshCw, Send, Sparkles } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { peekEntry } from '../../../../renderer/lib/entry/peek.svelte';
  import { openTab } from '../../../../renderer/lib/nav';
  import { store } from '../../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../../shared/adventures';
  import { markdownToTelegram } from '../../../../shared/telegram';
  import { isDnd } from '../../here';
  import { allEntries, loadEntries } from '../../../../modules/compendium/ui/store.svelte';
  import { journalFolder } from '../../../../modules/journal/ui/store.svelte';
  import { openPage } from '../../../../modules/journal/ui/ui.svelte';
  import { sendToTelegram, tgReady } from '../../../../modules/telegram/ui/tg.svelte';
  import { rarityOf } from '../treasure/generate';
  import { generateRelic, generateRelicPart, POWERS, RELIC_KINDS, type BaseItem, type Power, type Relic, type RelicKind, type RelicLang, type RelicPart } from './generate';

  const KEY = 'relic.state';
  interface Saved {
    kind: RelicKind | 'random';
    power: Power;
    relic: Relic | null;
    dnd: boolean;
  }
  const DEFAULTS: Saved = { kind: 'random', power: 'minor', relic: null, dnd: true };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const rl = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(rl)));
    } catch {
      /* not remembered — not a problem */
    }
  };
  onMount(() => void loadEntries());

  const dnd = $derived(isDnd(currentSystem(store.state.adventures)));
  // Magic items of the compendium shown here (D&D only).
  const baseItems = (inDnd: boolean): BaseItem[] | null =>
    inDnd
      ? allEntries().flatMap((e) => {
          const rarity = e.entry.type === 'item' ? rarityOf(e.entry.fields['rarity']) : null;
          const category = e.entry.fields['category'];
          return rarity ? [{ title: e.entry.title, rarity, category: typeof category === 'string' ? category : '' }] : [];
        })
      : null;

  function create() {
    const lang: RelicLang = locale.lang === 'ru' ? 'ru' : 'en';
    const kind = rl.kind === 'random' ? RELIC_KINDS[Math.floor(Math.random() * RELIC_KINDS.length)]! : rl.kind;
    rl.relic = generateRelic(kind, rl.power, lang, baseItems(dnd));
    rl.dnd = dnd;
    save();
  }
  function reroll(part: RelicPart) {
    if (!rl.relic) return;
    const x = $state.snapshot(rl.relic) as Relic;
    rl.relic = { ...x, ...generateRelicPart(part, x, baseItems(rl.dnd)) };
    save();
  }

  const subtitle = (x: Relic) => `${t(`relic.kind.${x.kind}` as never)} · ${t(`relic.power.${x.power}` as never)}`;
  function markdown(x: Relic, o: { links: boolean; curse: boolean; heading: boolean }) {
    const out = o.heading ? [`# ${x.name}`, ''] : [];
    out.push(`*${subtitle(x)}*`, '', x.look, '');
    if (x.base) out.push(`**${t('relic.base')}:** ${o.links ? `[[${x.base}]]` : x.base}${x.rarity ? ` (${t(`treasure.rarity.${x.rarity}` as never)})` : ''}`, '');
    out.push(`**${t('relic.property')}:** ${x.property}`, '', `**${t('relic.creator')}:** ${x.creator}. ${x.history}`, '', `**${t('relic.part.quirk')}:** ${x.quirk}`);
    if (o.curse && x.curse) out.push('', `**${t('relic.curse')}:** ${x.curse}`);
    return out.join('\n');
  }
  let copied = $state(false);
  function copy() {
    if (!rl.relic) return;
    void navigator.clipboard.writeText(markdown(rl.relic, { links: false, curse: true, heading: true }));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!rl.relic) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), rl.relic.name, markdown(rl.relic, { links: true, curse: true, heading: false }));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  const toTelegram = () =>
    rl.relic && sendToTelegram({ kind: 'text', title: rl.relic.name, html: markdownToTelegram(markdown(rl.relic, { links: false, curse: false, heading: true })) });
</script>

{#snippet part(id: RelicPart, body: Snippet)}
  <section class="part">
    <header>
      <h3>{t(`relic.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => reroll(id)}><RefreshCw size={13} /></button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('relic.title')}</h2>
    <div class="spacer"></div>
    {#if rl.relic}
      {#if tgReady()}<button class="btn" onclick={toTelegram}><Send size={14} /> {t('tg.sendShort')}</button>{/if}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('relic.about')} /></p>

  <div class="options">
    <label>{t('relic.kind')}
      <select bind:value={rl.kind} onchange={save}>
        <option value="random">{t('relic.random')}</option>
        {#each RELIC_KINDS as id (id)}<option value={id}>{t(`relic.kind.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('relic.power')}
      <select bind:value={rl.power} onchange={save}>
        {#each POWERS as id (id)}<option value={id}>{t(`relic.power.${id}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={create}><Sparkles size={16} /> {t('relic.create')}</button>
  </div>

  {#if !rl.relic}
    <p class="faint placeholder">{t('relic.empty')}</p>
  {:else}
    {@const x = rl.relic}
    <div class="sheet">
      {#snippet nameBody()}
        <p class="name">{x.name}</p>
        <p class="faint">{subtitle(x)}</p>
      {/snippet}
      {@render part('name', nameBody)}
      {#snippet lookBody()}<p class="look">{x.look}</p>{/snippet}
      {@render part('look', lookBody)}
      {#snippet magicBody()}
        {#if x.base}
          <p><b>{t('relic.base')}:</b> <button class="link" onclick={() => peekEntry(x.base!)}>{x.base}</button>{#if x.rarity}{' '}<span class="faint">— {t(`treasure.rarity.${x.rarity}` as never)}</span>{/if}</p>
        {:else if rl.dnd && x.power !== 'curio'}
          <p class="faint">{t('relic.noBase')}</p>
        {/if}
        <p><b>{t('relic.property')}:</b> {x.property}</p>
      {/snippet}
      {@render part('magic', magicBody)}
      {#snippet historyBody()}
        <p><b>{t('relic.creator')}:</b> {x.creator}.</p>
        <p>{x.history}</p>
      {/snippet}
      {@render part('history', historyBody)}
      {#snippet quirkBody()}
        <p>{x.quirk}</p>
        {#if x.curse}<p class="curse"><b>{t('relic.curse')}:</b> {x.curse}</p>{/if}
      {/snippet}
      {@render part('quirk', quirkBody)}
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
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
  }
  .options label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
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
  .part:first-child {
    grid-column: 1 / -1;
  }
  .part header {
    display: flex;
    align-items: center;
  }
  h3 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .part p {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .name {
    font-size: 22px;
  }
  .look {
    font-style: italic;
  }
  .curse {
    color: #c0504d;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline dotted;
    cursor: pointer;
  }
</style>
