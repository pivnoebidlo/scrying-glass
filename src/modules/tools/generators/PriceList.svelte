<!-- A price list of a package (shared/generators.ts): its sections, a search and the options. A click on an item puts it
     into the basket: how many and the total. What is on the page is remembered by the window. Knows no game. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { Minus, Plus, Search, Trash2 } from '@lucide/svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { genText, plainText, priceItems, priceOfItem, type GeneratorFile, type GenList, type PriceItem } from '../../../shared/generators';

  let { file, list }: { file: GeneratorFile; list: GenList } = $props();

  const KEY = $derived(`generators.list.${file.system}/${list.id}`);
  type Saved = { query: string; options: Record<string, boolean>; basket: Record<string, number> };
  function load(key: string): Saved {
    const fresh: Saved = { query: '', options: Object.fromEntries((list.options ?? []).map((o) => [o.key, !!o.default])), basket: {} };
    try {
      return { ...fresh, ...JSON.parse(localStorage.getItem(key) ?? '{}') };
    } catch {
      return fresh;
    }
  }
  const s = $state(untrack(() => load(KEY)));
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(s)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const lang = $derived(locale.lang);
  const items = $derived(priceItems(file, list, lang));
  const keyOf = (i: PriceItem) => `${i.section}:${i.row}`;
  const q = $derived(s.query.trim().toLowerCase());
  const shown = (i: PriceItem) => !q || plainText(i.name).toLowerCase().includes(q);
  const sections = $derived(
    list.sections.filter((x) => !x.when || s.options[x.when]).map((sec) => ({ sec, items: items.filter((i) => i.section === sec.id && shown(i)) })).filter((x) => x.items.length),
  );
  const price = (i: PriceItem) => priceOfItem(list, i, s.options);
  const money = (n: number) => genText(list.unit, lang, { n: n.toLocaleString(lang) });
  const priceText = (i: PriceItem) => {
    const p = price(i);
    return p === null ? i.text : money(p);
  };
  // **Bold** of a table; the text may be someone else's, so it is escaped.
  const html = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  const basket = $derived(
    Object.entries(s.basket).flatMap(([k, n]) => {
      const i = items.find((x) => keyOf(x) === k);
      return i && n > 0 ? [{ item: i, n }] : [];
    }),
  );
  const total = $derived(basket.reduce((sum, b) => sum + (price(b.item) ?? 0) * b.n, 0));
  function put(i: PriceItem, by: number) {
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
  {#if list.about}<p class="faint about"><Lead text={genText(list.about, lang)} /></p>{/if}

  <div class="options">
    <label class="search"><Search size={14} /><input type="search" bind:value={s.query} oninput={save} placeholder={t('gen.search')} /></label>
    {#each list.options ?? [] as o (o.key)}
      <label class="check" title={genText(o.hint, lang)}><input type="checkbox" bind:checked={s.options[o.key]} onchange={save} /> {genText(o.title, lang)}</label>
    {/each}
  </div>

  <div class="columns">
    <div class="list">
      {#each sections as x (x.sec.id)}
        <section>
          <h3>{genText(x.sec.title, lang)}</h3>
          {#if x.sec.note}<p class="faint note">{genText(x.sec.note, lang)}</p>{/if}
          <ul>
            {#each x.items as i (keyOf(i))}
              <li>
                <button class="item" onclick={() => put(i, 1)} title={t('gen.add')} disabled={price(i) === null}>
                  <span class="name">{@html html(i.name)}</span>
                  <span class="price">{priceText(i)}</span>
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {:else}
        <p class="faint">{t('gen.nothing')}</p>
      {/each}
    </div>

    <aside class="basket">
      <h3>{t('gen.basket')}</h3>
      {#if basket.length}
        <ul>
          {#each basket as b (keyOf(b.item))}
            <li>
              <span class="name">{plainText(b.item.name)}</span>
              <span class="qty">
                <button class="icon-btn" title={t('gen.less')} onclick={() => put(b.item, -1)}><Minus size={12} /></button>
                {b.n}
                <button class="icon-btn" title={t('gen.more')} onclick={() => put(b.item, 1)}><Plus size={12} /></button>
              </span>
              <span class="price">{money((price(b.item) ?? 0) * b.n)}</span>
            </li>
          {/each}
        </ul>
        <div class="total"><span>{t('gen.total')}</span><b>{money(total)}</b></div>
        <button class="btn" onclick={clear}><Trash2 size={14} /> {t('gen.clear')}</button>
      {:else}
        <p class="faint">{t('gen.basketEmpty')}</p>
      {/if}
    </aside>
  </div>
</div>

<style>
  .view {
    max-width: 980px;
    padding: 16px 20px 32px;
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
