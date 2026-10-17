<!-- Tavern generator (Tools → Tavern generator): type, wealth, crowd, lodging, wonders → a tavern in parts. Each part
     can be rerolled or pinned; "Reroll unpinned" keeps the pinned ones. "To journal" saves the tavern as a Markdown
     note of the current adventure (the description as a read-aloud quote, rumors as tasks); "Copy" — the same text. -->
<script lang="ts">
  import { Check, Copy, Dices, NotebookPen, Pin, RefreshCw } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { withPeople } from './generate';
  import { tavernMarkdown } from './markdown';
  import { createTavern, rerollPart, rerollUnpinned, saveOptions, tavern, tavernContent, togglePin } from './store.svelte';
  import { TAVERN_TYPES, WEALTH, type Person, type TavernPart } from './types';

  const tv = $derived(tavern.tavern);
  const c = $derived(tavernContent());
  const race = (id: string) => t(`names.race.${id}` as never);
  const typeTitle = (id: string) => t(`tavern.type.${id}` as never);
  const wealthTitle = (id: string) => t(`tavern.wealth.${id}` as never);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const markdown = (heading = true) =>
    tv
      ? tavernMarkdown(tv, c, {
          type: typeTitle(tv.type),
          wealth: wealthTitle(tv.wealth),
          wealthLabel: t('tavern.wealth'),
          sign: t('tavern.sign'),
          people: t('tavern.people'),
          patrons: t('tavern.part.patrons'),
          says: t('tavern.says'),
          secret: t('tavern.secret'),
          menu: t('tavern.part.menu'),
          item: t('tavern.item'),
          price: t('tavern.price'),
          rooms: t('tavern.part.rooms'),
          services: t('tavern.services'),
          event: t('tavern.part.event'),
          rumors: t('tavern.part.rumors'),
          request: t('tavern.part.request'),
          tavernSecret: t('tavern.part.secret'),
          race,
        }, heading)
      : '';

  let copied = $state(false);
  function copy() {
    void navigator.clipboard.writeText(markdown());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }

  async function toJournal() {
    if (!tv) return;
    const title = tv.name.replace(/[«»"“”]/g, '').trim();
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), title, markdown(false));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }

  const set = <K extends keyof typeof tavern.opts>(k: K, v: (typeof tavern.opts)[K]) => {
    tavern.opts[k] = v;
    saveOptions();
  };
</script>

{#snippet part(id: TavernPart, body: Snippet)}
  <section class="part" class:pinned={tavern.pinned.includes(id)}>
    <header>
      <h3>{t(`tavern.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => rerollPart(id)}><RefreshCw size={13} /></button>
      <button class="icon-btn pin" class:on={tavern.pinned.includes(id)} title={tavern.pinned.includes(id) ? t('tavern.unpin') : t('tavern.pin')} onclick={() => togglePin(id)}>
        <Pin size={13} />
      </button>
    </header>
    {@render body()}
  </section>
{/snippet}

{#snippet who(p: Person)}
  <b>{p.name}</b> <span class="faint">— {p.role}, {race(p.race).toLowerCase()}</span>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('tavern.title')}</h2>
    <div class="spacer"></div>
    {#if tv}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about">{t('tavern.about')}</p>

  <div class="options">
    <label>{t('tavern.type')}
      <select value={tavern.opts.type} onchange={(e) => set('type', e.currentTarget.value as never)}>
        {#each TAVERN_TYPES as id (id)}<option value={id}>{typeTitle(id)}</option>{/each}
      </select>
    </label>
    <label>{t('tavern.wealth')}
      <select value={tavern.opts.wealth} onchange={(e) => set('wealth', e.currentTarget.value as never)}>
        {#each WEALTH as id (id)}<option value={id}>{wealthTitle(id)}</option>{/each}
      </select>
    </label>
    <label>{t('tavern.crowd')}
      <select value={tavern.opts.crowd} onchange={(e) => set('crowd', e.currentTarget.value as never)}>
        {#each ['quiet', 'usual', 'packed'] as id (id)}<option value={id}>{t(`tavern.crowd.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('tavern.lodging')}
      <select value={tavern.opts.lodging} onchange={(e) => set('lodging', e.currentTarget.value as never)}>
        {#each ['auto', 'yes', 'no'] as id (id)}<option value={id}>{t(`tavern.lodging.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('tavern.wonders')}
      <select value={tavern.opts.wonders} onchange={(e) => set('wonders', e.currentTarget.value as never)}>
        {#each ['none', 'rare', 'often'] as id (id)}<option value={id}>{t(`tavern.wonders.${id}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={createTavern}><Dices size={16} /> {t('tavern.create')}</button>
    {#if tv}<button class="btn" onclick={rerollUnpinned}><RefreshCw size={14} /> {t('tavern.reroll')}</button>{/if}
  </div>

  {#if !tv}
    <p class="faint placeholder">{t('tavern.empty')}</p>
  {:else}
    <div class="sheet">
      {#snippet nameBody()}
        <p class="name">{tv.name}</p>
        <p class="faint">{typeTitle(tv.type)}. {t('tavern.wealth')}: {wealthTitle(tv.wealth).toLowerCase()}. {t('tavern.sign')}: {tv.sign}.</p>
      {/snippet}
      {@render part('name', nameBody)}

      {#snippet introBody()}
        <blockquote title={t('tavern.readAloud')}>
          <p>{tv.intro}</p>
          {#if tv.wonder}<p>{tv.wonder}</p>{/if}
        </blockquote>
      {/snippet}
      {@render part('intro', introBody)}

      {#snippet ownerBody()}
        <p>{@render who(tv.owner)}</p>
        <p>{cap(tv.owner.trait ?? '')}. {t('tavern.says')}: <i>{tv.owner.catchphrase}</i></p>
        <p class="secret"><b>{t('tavern.secret')}:</b> {tv.owner.secret}.</p>
      {/snippet}
      {@render part('owner', ownerBody)}

      {#snippet staffBody()}
        <ul>{#each tv.staff as s, i (i)}<li>{@render who(s)}. {cap(s.trait ?? '')}.</li>{/each}</ul>
      {/snippet}
      {@render part('staff', staffBody)}

      {#snippet patronsBody()}
        <ul>
          {#each tv.patrons as p, i (i)}
            <li>{@render who(p)}: {p.doing}. <span class="secret"><b>{t('tavern.secret')}:</b> {p.secret}.</span></li>
          {/each}
        </ul>
      {/snippet}
      {@render part('patrons', patronsBody)}

      {#snippet menuBody()}
        <div class="menu">
          {#each [['drink', t('tavern.drinks')], ['food', t('tavern.food')]] as [kind, title] (kind)}
            <div>
              <h4>{title}</h4>
              {#each tv.menu.filter((m) => m.kind === kind) as m, i (i)}<div class="price-row"><span>{m.name}</span><span class="dots"></span><span>{m.price}</span></div>{/each}
            </div>
          {/each}
        </div>
      {/snippet}
      {@render part('menu', menuBody)}

      {#snippet roomsBody()}
        {#if tv.rooms.length}
          {#each tv.rooms as r, i (i)}<div class="price-row"><span>{r.name}</span><span class="dots"></span><span>{r.price}</span></div>{/each}
          {#if tv.services.length}<p class="faint">{t('tavern.services')}: {tv.services.map((s) => s.toLowerCase()).join(', ')}.</p>{/if}
        {:else}
          <p class="faint">{t('tavern.noRooms')}</p>
        {/if}
      {/snippet}
      {@render part('rooms', roomsBody)}

      {#snippet eventBody()}<p>{withPeople(c.events[tv.event] ?? '', tv)}</p>{/snippet}
      {@render part('event', eventBody)}

      {#snippet rumorsBody()}<ul>{#each tv.rumors as r, i (i)}<li>{r}</li>{/each}</ul>{/snippet}
      {@render part('rumors', rumorsBody)}

      {#snippet requestBody()}<p>{withPeople(c.requests[tv.request] ?? '', tv)}</p>{/snippet}
      {@render part('request', requestBody)}

      {#snippet secretBody()}<p class="secret">{tv.secret}</p>{/snippet}
      {@render part('secret', secretBody)}
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
  .sheet {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .part {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .part.pinned {
    border-color: var(--accent);
  }
  .part header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .part h3 {
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
  .name {
    font-size: 22px;
  }
  blockquote {
    margin: 6px 0 0;
    padding: 6px 12px;
    border-left: 3px solid var(--accent);
    background: var(--bg-hover);
    font-style: italic;
  }
  blockquote p {
    margin: 4px 0;
  }
  ul {
    margin: 6px 0 0;
    padding-left: 18px;
    line-height: 1.5;
  }
  .secret {
    color: var(--text-muted);
  }
  .menu {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 4px 24px;
  }
  .menu h4 {
    margin: 6px 0 2px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .price-row {
    display: flex;
    gap: 6px;
    margin: 3px 0;
  }
  .dots {
    flex: 1;
    border-bottom: 1px dotted var(--border);
    transform: translateY(-4px);
  }
</style>
