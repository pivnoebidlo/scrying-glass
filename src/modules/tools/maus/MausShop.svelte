<!-- Tools → Shop (Mausritter only): the price list of the SRD by its sections, a search, "Near humans" (human-made
     tools are sold only there) and "For a warband" (equipment ×20). A click on an item puts it into the basket: how many
     and the total. What is on the page is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { Minus, Plus, Search, Trash2 } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { GEAR, gearItems, NEAR_HUMANS, priceFor, type GearItem } from './shop';
  import { plain, tablesLang } from './text';

  const KEY = 'mausShop.state';
  type Saved = { query: string; humans: boolean; warband: boolean; basket: Record<string, number> };
  const DEFAULTS: Saved = { query: '', humans: true, warband: false, basket: {} };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return structuredClone(DEFAULTS);
    }
  }
  const s = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(s)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const lang = $derived(tablesLang(locale.lang));
  const items = $derived(gearItems(lang));
  const keyOf = (i: GearItem) => `${i.section}:${i.row}`;
  const q = $derived(s.query.trim().toLowerCase());
  const shown = (i: GearItem) => (s.humans || i.section !== NEAR_HUMANS) && (!q || plain(i.name).toLowerCase().includes(q));
  const sections = $derived(GEAR.map((id) => ({ id, items: items.filter((i) => i.section === id && shown(i)) })).filter((x) => x.items.length));

  const pips = (n: number) => t('build.pips', { n: n.toLocaleString(locale.lang) });
  const priceText = (i: GearItem) => {
    const p = priceFor(i, s.warband);
    return p === null ? i.text : pips(p);
  };
  // **Bold** of the SRD; the names are ours (the SRD files), escaped anyway.
  const html = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  const basket = $derived(
    Object.entries(s.basket).flatMap(([k, n]) => {
      const i = items.find((x) => keyOf(x) === k);
      return i && n > 0 ? [{ item: i, n }] : [];
    })
  );
  const total = $derived(basket.reduce((sum, b) => sum + (priceFor(b.item, s.warband) ?? 0) * b.n, 0));
  function put(i: GearItem, by: number) {
    const n = (s.basket[keyOf(i)] ?? 0) + by;
    if (n > 0) s.basket[keyOf(i)] = n;
    else delete s.basket[keyOf(i)];
    save();
  }
  function clear() {
    s.basket = {};
    save();
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('mshop.title')}</h2>
  </header>
  <p class="faint about"><Lead text={t('mshop.about')} /></p>

  <div class="options">
    <label class="search"><Search size={14} /><input type="search" bind:value={s.query} oninput={save} placeholder={t('mshop.search')} /></label>
    <label class="check"><input type="checkbox" bind:checked={s.humans} onchange={save} /> {t('mshop.humans')}</label>
    <label class="check" title={t('mshop.warbandHint')}><input type="checkbox" bind:checked={s.warband} onchange={save} /> {t('mshop.warband')}</label>
  </div>

  <div class="columns">
    <div class="list">
      {#each sections as sec (sec.id)}
        <section>
          <h3>{t(`mshop.${sec.id}` as never)}</h3>
          <p class="faint note">{t(`mshop.${sec.id}.note` as never)}</p>
          <ul>
            {#each sec.items as i (keyOf(i))}
              <li>
                <button class="item" onclick={() => put(i, 1)} title={t('mshop.add')} disabled={priceFor(i, s.warband) === null}>
                  <span class="name">{@html html(i.name)}</span>
                  <span class="price">{priceText(i)}</span>
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {:else}
        <p class="faint">{t('mshop.nothing')}</p>
      {/each}
    </div>

    <aside class="basket">
      <h3>{t('mshop.basket')}</h3>
      {#if basket.length}
        <ul>
          {#each basket as b (keyOf(b.item))}
            <li>
              <span class="name">{plain(b.item.name)}</span>
              <span class="qty">
                <button class="icon-btn" title={t('mshop.less')} onclick={() => put(b.item, -1)}><Minus size={12} /></button>
                {b.n}
                <button class="icon-btn" title={t('mshop.more')} onclick={() => put(b.item, 1)}><Plus size={12} /></button>
              </span>
              <span class="price">{pips((priceFor(b.item, s.warband) ?? 0) * b.n)}</span>
            </li>
          {/each}
        </ul>
        <div class="total"><span>{t('mshop.total')}</span><b>{pips(total)}</b></div>
        <button class="btn" onclick={clear}><Trash2 size={14} /> {t('mshop.clear')}</button>
      {:else}
        <p class="faint">{t('mshop.empty')}</p>
      {/if}
    </aside>
  </div>
</div>

<style>
  .view {
    max-width: 980px;
    padding: 16px 20px 32px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .about {
    margin: 6px 0 12px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    margin-bottom: 12px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
  }
  .search input {
    width: 220px;
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 760px) {
    .columns {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  section {
    margin-bottom: 14px;
  }
  h3 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .note {
    margin: 2px 0 4px;
    font-size: 12px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 3px 6px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .item:hover:not(:disabled) {
    background: var(--bg-hover);
  }
  .item:disabled {
    cursor: default;
  }
  .price {
    color: var(--text-muted);
    white-space: nowrap;
  }
  .basket {
    position: sticky;
    top: 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .basket ul {
    margin: 8px 0;
  }
  .basket li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .basket .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .qty {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .total {
    display: flex;
    justify-content: space-between;
    margin: 6px 0 10px;
    padding-top: 6px;
    border-top: 1px solid var(--border);
  }
</style>
