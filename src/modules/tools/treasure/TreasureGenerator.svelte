<!-- Treasure (Tools → Treasure): where (pockets, a stash, a lair) and the heroes' level → coins, gems and art, things
     and trinkets, magic items. In D&D the items come from the compendium (links open the entry) and prices are shown;
     elsewhere — curiosities and no prices. Each part can be rerolled; copy, to the journal, to Telegram. -->
<script lang="ts">
  import { Check, Copy, Gem, NotebookPen, RefreshCw, Send } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { peekEntry } from '../../../renderer/lib/entry/peek.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { markdownToTelegram } from '../../../shared/telegram';
  import { isDnd } from '../../../systems';
  import { allEntries, loadEntries } from '../../compendium/ui/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { sendToTelegram, tgReady } from '../../telegram/ui/tg.svelte';
  import { en as npcEn } from '../npc/content/en';
  import { ru as npcRu } from '../npc/content/ru';
  import { SIZES } from './content';
  import { generateTreasure, pickItems, rarityOf, rerollPart, SOURCES, TIERS, totalGold, type Rarity, type Source, type Tier, type Treasure, type TreasurePart } from './generate';
  import { coinsLine, thingLines, treasureLang, treasureMarkdown, valuableLines, type TreasureLang, type TreasureWords } from './text';

  const KEY = 'treasure.state';
  interface Saved {
    source: Source;
    tier: Tier;
    result: Treasure | null;
    // Chosen magic items (compendium titles) or curiosities, with their rarities; language and system of the result.
    items: { title: string; rarity?: Rarity }[];
    lang: TreasureLang;
    dnd: boolean;
  }
  const DEFAULTS: Saved = { source: 'stash', tier: 1, result: null, items: [], lang: 'en', dnd: true };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const tr = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(tr)));
    } catch {
      /* not remembered — not a problem */
    }
  };
  onMount(() => void loadEntries());

  const dnd = $derived(isDnd(currentSystem(store.state.adventures)));
  // Magic items of the compendium shown here (its edition and language), with a known rarity.
  const pool = () =>
    allEntries().flatMap((e) => {
      const rarity = e.entry.type === 'item' ? rarityOf(e.entry.fields['rarity']) : null;
      return rarity ? [{ title: e.entry.title, rarity }] : [];
    });
  const curios = (l: TreasureLang) => (l === 'ru' ? npcRu : npcEn).magicItems;
  const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  function chooseItems(rarities: Rarity[], l: TreasureLang, isDnd: boolean) {
    if (isDnd) {
      const p = pool();
      return pickItems(rarities, p).map((title) => ({ title, rarity: p.find((x) => x.title === title)?.rarity }));
    }
    const list = [...curios(l)];
    return rarities.map(() => ({ title: capFirst(list.splice(Math.floor(Math.random() * list.length), 1)[0] ?? '') })).filter((x) => x.title);
  }

  function search() {
    const l = treasureLang(locale.lang);
    const result = generateTreasure(tr.source, tr.tier, SIZES);
    tr.result = result;
    tr.lang = l;
    tr.dnd = dnd;
    tr.items = chooseItems(result.magic, l, dnd);
    save();
  }
  function reroll(part: TreasurePart) {
    if (!tr.result) return;
    const next = rerollPart($state.snapshot(tr.result) as Treasure, part, SIZES);
    tr.result = next;
    if (part === 'magic') tr.items = chooseItems(next.magic, tr.lang, tr.dnd);
    save();
  }

  const words = (): TreasureWords => ({ coin: (c) => t(`treasure.coin.${c}` as never), each: (value) => t('treasure.each', { value }) });
  const heads = () => ({
    coins: t('treasure.coins'),
    valuables: t('treasure.valuables'),
    things: t('treasure.things'),
    magic: t(tr.dnd ? 'treasure.magic' : 'treasure.curios'),
    total: (gold: string) => t('treasure.total', { gold }),
  });
  const title = () => `${t('treasure.title')} — ${t(`treasure.source.${tr.result?.source ?? tr.source}` as never).toLowerCase()}`;
  const markdown = (o: { links: boolean; heading: boolean }) =>
    tr.result
      ? treasureMarkdown(tr.result, tr.items.map((i) => i.title), tr.lang, words(), heads(), { values: tr.dnd, links: o.links && tr.dnd, title: o.heading ? title() : undefined })
      : '';

  let copied = $state(false);
  function copy() {
    void navigator.clipboard.writeText(markdown({ links: false, heading: true }));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), title(), markdown({ links: true, heading: false }));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  const toTelegram = () => sendToTelegram({ kind: 'text', title: title(), html: markdownToTelegram(markdown({ links: false, heading: true })) });

  const TIER_LEVELS: Record<Tier, string> = { 1: '1–4', 2: '5–10', 3: '11–16', 4: '17–20' };
</script>

{#snippet part(id: TreasurePart, head: string, empty: boolean, body: Snippet)}
  <section class="part" class:empty>
    <header>
      <h3>{head}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => reroll(id)}><RefreshCw size={13} /></button>
    </header>
    {#if empty}<p class="faint">{t('treasure.none')}</p>{:else}{@render body()}{/if}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('treasure.title')}</h2>
    <div class="spacer"></div>
    {#if tr.result}
      {#if tgReady()}<button class="btn" onclick={toTelegram}><Send size={14} /> {t('tg.sendShort')}</button>{/if}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about">{t('treasure.about')}</p>

  <div class="options">
    <label>{t('treasure.source')}
      <select bind:value={tr.source} onchange={save}>
        {#each SOURCES as id (id)}<option value={id}>{t(`treasure.source.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('treasure.tier')}
      <select bind:value={tr.tier} onchange={save}>
        {#each TIERS as id (id)}<option value={id}>{TIER_LEVELS[id]}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={search}><Gem size={16} /> {t('treasure.generate')}</button>
  </div>

  {#if !tr.result}
    <p class="faint placeholder">{t('treasure.empty')}</p>
  {:else}
    {@const r = tr.result}
    {@const values = valuableLines(r, tr.lang, words(), tr.dnd)}
    {@const things = thingLines(r, tr.lang)}
    <div class="sheet">
      {#snippet coinsBody()}<p class="coins">{coinsLine(r, tr.lang, words())}</p>{/snippet}
      {@render part('coins', t('treasure.coins'), !coinsLine(r, tr.lang, words()), coinsBody)}
      {#snippet valuablesBody()}<ul>{#each values as l, i (i)}<li>{l}</li>{/each}</ul>{/snippet}
      {@render part('valuables', t('treasure.valuables'), !values.length, valuablesBody)}
      {#snippet thingsBody()}<ul>{#each things as l, i (i)}<li>{l}</li>{/each}</ul>{/snippet}
      {@render part('things', t('treasure.things'), !things.length, thingsBody)}
      {#snippet magicBody()}
        <ul>
          {#each tr.items as item, i (i)}
            <li>
              {#if tr.dnd}
                <button class="link" title={t('treasure.openEntry')} onclick={() => peekEntry(item.title)}>{item.title}</button>
                {#if item.rarity}<span class="faint">— {t(`treasure.rarity.${item.rarity}` as never)}</span>{/if}
              {:else}{item.title}{/if}
            </li>
          {/each}
        </ul>
        {#if tr.dnd && r.magic.length > tr.items.length}<p class="faint">{t('treasure.noItems')}</p>{/if}
      {/snippet}
      {@render part('magic', t(tr.dnd ? 'treasure.magic' : 'treasure.curios'), !r.magic.length, magicBody)}
    </div>
    {#if tr.dnd}<p class="total">{t('treasure.total', { gold: `${totalGold(r).toLocaleString(tr.lang === 'ru' ? 'ru-RU' : 'en-US')} ${t('treasure.coin.gp')}` })}</p>{/if}
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
  .part p,
  .part ul {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .part ul {
    padding-left: 18px;
  }
  .coins {
    font-size: 17px;
  }
  .total {
    margin: 12px 0 0;
    color: var(--text-muted);
    font-style: italic;
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
