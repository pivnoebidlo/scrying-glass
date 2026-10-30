<!-- Shop generator (Tools → Shop generator): kind and level → name and owner, the look and a quirk, goods with prices
     and stock, a hook. In D&D the magic shop sells compendium items (links open the entry). Each part can be
     rerolled; copy, to the journal, to Telegram (without the hook). The current shop is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { Check, Copy, NotebookPen, RefreshCw, Send, Store } from '@lucide/svelte';
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
  import { en as npcEn } from '../../../../modules/tools/npc/content/en';
  import { ru as npcRu } from '../../../../modules/tools/npc/content/ru';
  import { helpers } from '../../../../modules/tools/settlement/store.svelte';
  import { en as tavernEn } from '../../../../modules/tools/tavern/content/en';
  import { ru as tavernRu } from '../../../../modules/tools/tavern/content/ru';
  import { coins } from '../../../../modules/tools/tavern/generate';
  import { rarityOf } from '../treasure/generate';
  import { generateShop, generateShopPart, isConsumable, SHOP_TYPES, SHOP_WEALTH, type Shop, type ShopContext, type ShopLang, type ShopPart, type ShopType, type ShopWealth } from './generate';

  const KEY = 'shop.state';
  interface Saved {
    type: ShopType | 'random';
    wealth: ShopWealth;
    shop: Shop | null;
    // The shop was made in a D&D adventure: prices and links.
    dnd: boolean;
  }
  const DEFAULTS: Saved = { type: 'general', wealth: 'modest', shop: null, dnd: true };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const sh = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(sh)));
    } catch {
      /* not remembered — not a problem */
    }
  };
  onMount(() => void loadEntries());

  const dnd = $derived(isDnd(currentSystem(store.state.adventures)));
  const shopLang = (): ShopLang => (locale.lang === 'ru' ? 'ru' : 'en');

  async function context(lang: ShopLang, inDnd: boolean): Promise<ShopContext> {
    const h = await helpers(lang);
    return {
      person: () => h.person(''),
      magic: inDnd
        ? allEntries().flatMap((e) => {
            const rarity = e.entry.type === 'item' ? rarityOf(e.entry.fields['rarity']) : null;
            return rarity ? [{ title: e.entry.title, rarity, consumable: isConsumable(e.entry.fields['category']) }] : [];
          })
        : null,
      curios: (lang === 'ru' ? npcRu : npcEn).magicItems,
    };
  }

  async function create() {
    const lang = shopLang();
    const type = sh.type === 'random' ? SHOP_TYPES[Math.floor(Math.random() * SHOP_TYPES.length)]! : sh.type;
    sh.shop = generateShop(type, sh.wealth, lang, await context(lang, dnd));
    sh.dnd = dnd;
    save();
  }
  async function reroll(part: ShopPart) {
    if (!sh.shop) return;
    const s = $state.snapshot(sh.shop) as Shop;
    sh.shop = { ...s, ...generateShopPart(part, s, await context(s.lang, sh.dnd)) };
    save();
  }

  const money = (cp: number | null, lang: ShopLang) => (cp === null ? '—' : coins(cp, (lang === 'ru' ? tavernRu : tavernEn).coins));
  const ownerLine = (s: Shop) => `${s.owner.name} — ${s.owner.trait}`;
  const typeTitle = (s: Shop) => `${t(`shop.type.${s.type}` as never)}, ${t(`shop.wealth.${s.wealth}` as never).toLowerCase()}`;

  // Markdown: links to the compendium for the journal; the hook only for the GM.
  function markdown(s: Shop, o: { links: boolean; hook: boolean; heading: boolean }) {
    const out = o.heading ? [`# ${s.name}`, ''] : [];
    out.push(`*${typeTitle(s)}*`, '', `> ${s.look}`, '', `**${t('shop.owner')}:** ${ownerLine(s)}`, '', `**${t('shop.quirk')}:** ${s.quirk}`, '');
    out.push(`**${t('shop.part.goods')}:**`);
    for (const g of s.goods) {
      const name = o.links && g.rarity ? `[[${g.name}]]` : g.name;
      out.push(`- ${name}${g.cp !== null && sh.dnd ? ` — ${money(g.cp, s.lang)}` : ''}${g.stock > 1 ? ` (×${g.stock})` : ''}`);
    }
    if (o.hook) out.push('', `**${t('shop.part.hook')}:** ${s.hook}`);
    return out.join('\n');
  }
  let copied = $state(false);
  function copy() {
    if (!sh.shop) return;
    void navigator.clipboard.writeText(markdown(sh.shop, { links: false, hook: true, heading: true }));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!sh.shop) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), sh.shop.name.replace(/[«»]/g, ''), markdown(sh.shop, { links: true, hook: true, heading: false }));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  const toTelegram = () =>
    sh.shop && sendToTelegram({ kind: 'text', title: sh.shop.name, html: markdownToTelegram(markdown(sh.shop, { links: false, hook: false, heading: true })) });
</script>

{#snippet part(id: ShopPart, body: Snippet, wide = false)}
  <section class="part" class:wide>
    <header>
      <h3>{t(`shop.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => reroll(id)}><RefreshCw size={13} /></button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('shop.title')}</h2>
    <div class="spacer"></div>
    {#if sh.shop}
      {#if tgReady()}<button class="btn" onclick={toTelegram}><Send size={14} /> {t('tg.sendShort')}</button>{/if}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('shop.about')} /></p>

  <div class="options">
    <label>{t('shop.type')}
      <select bind:value={sh.type} onchange={save}>
        <option value="random">{t('shop.random')}</option>
        {#each SHOP_TYPES as id (id)}<option value={id}>{t(`shop.type.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('shop.wealth')}
      <select bind:value={sh.wealth} onchange={save}>
        {#each SHOP_WEALTH as id (id)}<option value={id}>{t(`shop.wealth.${id}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={create}><Store size={16} /> {t('shop.create')}</button>
  </div>

  {#if !sh.shop}
    <p class="faint placeholder">{t('shop.empty')}</p>
  {:else}
    {@const s = sh.shop}
    <div class="sheet">
      {#snippet nameBody()}
        <p class="name">{s.name}</p>
        <p class="faint">{typeTitle(s)}</p>
        <p><b>{t('shop.owner')}:</b> {s.owner.name} — {s.owner.trait}.</p>
      {/snippet}
      {@render part('name', nameBody, true)}
      {#snippet lookBody()}
        <p class="look">{s.look}</p>
        <p><b>{t('shop.quirk')}:</b> {s.quirk}</p>
      {/snippet}
      {@render part('look', lookBody, true)}
      {#snippet goodsBody()}
        {#if s.goods.length}
          <table>
            <thead><tr><th>{t('shop.item')}</th>{#if sh.dnd}<th class="num">{t('shop.price')}</th>{/if}<th class="num">{t('shop.stock')}</th></tr></thead>
            <tbody>
              {#each s.goods as g, i (i)}
                <tr>
                  <td>
                    {#if g.rarity}<button class="link" onclick={() => peekEntry(g.name)}>{g.name}</button> <span class="faint">— {t(`treasure.rarity.${g.rarity}` as never)}</span>{:else}{g.name}{/if}
                  </td>
                  {#if sh.dnd}<td class="num">{money(g.cp, s.lang)}</td>{/if}
                  <td class="num">{g.stock}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}<p class="faint">{t('shop.noItems')}</p>{/if}
      {/snippet}
      {@render part('goods', goodsBody, true)}
      {#snippet hookBody()}<p>{s.hook}</p>{/snippet}
      {@render part('hook', hookBody, true)}
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
  .part p {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .name {
    font-size: 22px;
  }
  .look {
    padding: 4px 10px;
    border-left: 3px solid var(--accent);
    background: var(--bg-primary);
    font-style: italic;
  }
  table {
    width: 100%;
    margin-top: 6px;
    border-collapse: collapse;
  }
  th {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
  }
  td,
  th {
    padding: 3px 6px;
    border-bottom: 1px solid var(--border);
  }
  .num {
    text-align: right;
    white-space: nowrap;
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
