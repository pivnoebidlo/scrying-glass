<!-- Settlement generator (Tools → Settlements): size → name, population and peoples, rule and defence, the first
     impression, what it is known for, places with a tavern, notable people and a trouble. Each part can be rerolled
     or pinned; to the journal or copy. The current settlement is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { Castle, Check, Copy, NotebookPen, Pin, RefreshCw } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { troubleText } from './generate';
  import { createSettlement, rerollPart, rerollUnpinned, save, tavernPlace, togglePin, towns } from './store.svelte';
  import { personLine, settlementMarkdown, type SettlementLabels } from './text';
  import { SIZES, type Settlement, type SettlementPart } from './types';

  const s = $derived(towns.settlement);
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const peoplesLine = (x: Settlement) => {
    const [main, ...others] = x.races.map((r) => t(`settlement.race.${r}` as never));
    const head = t('settlement.mostly', { main: main ?? '' });
    return others.length ? `${head}, ${t('settlement.also', { list: others.join(', ') })}` : head;
  };
  const labels = (x: Settlement): SettlementLabels => ({
    size: t(`settlement.size.${x.size}` as never),
    population: t('settlement.population', { count: x.population }),
    peoples: t('settlement.peoples'),
    peoplesLine: peoplesLine(x),
    ruled: t('settlement.ruled'),
    defense: t('settlement.defense'),
    knownFor: t('settlement.part.knownFor'),
    places: t('settlement.part.places'),
    people: t('settlement.part.people'),
    trouble: t('settlement.part.trouble'),
    tavern: tavernPlace(x),
  });

  let copied = $state(false);
  function copy() {
    if (!s) return;
    void navigator.clipboard.writeText(settlementMarkdown(s, labels(s)));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!s) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), s.name, settlementMarkdown(s, labels(s), false));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  // Inline markdown bold in a person line → plain text with the name apart.
  const personParts = (line: string) => line.match(/^\*\*(.+?)\*\* (.*)$/)?.slice(1) ?? ['', line];
</script>

{#snippet part(id: SettlementPart, body: Snippet, wide = false)}
  <section class="part" class:wide class:pinned={towns.pinned.includes(id)}>
    <header>
      <h3>{t(`settlement.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => rerollPart(id)}><RefreshCw size={13} /></button>
      <button class="icon-btn pin" class:on={towns.pinned.includes(id)} title={towns.pinned.includes(id) ? t('tavern.unpin') : t('tavern.pin')} onclick={() => togglePin(id)}>
        <Pin size={13} />
      </button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('settlement.title')}</h2>
    <div class="spacer"></div>
    {#if s}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('settlement.about')} /></p>

  <div class="options">
    <label>{t('settlement.size')}
      <select bind:value={towns.size} onchange={save}>
        <option value="random">{t('settlement.random')}</option>
        {#each SIZES as id (id)}<option value={id}>{t(`settlement.size.${id}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={createSettlement}><Castle size={16} /> {t('settlement.create')}</button>
    {#if s}<button class="btn" onclick={rerollUnpinned}><RefreshCw size={14} /> {t('tavern.reroll')}</button>{/if}
  </div>

  {#if !s}
    <p class="faint placeholder">{t('settlement.empty')}</p>
  {:else}
    <div class="sheet">
      {#snippet nameBody()}
        <p class="name">{s.name}</p>
        <p class="faint">{t(`settlement.size.${s.size}` as never)} · {t('settlement.population', { count: s.population })}</p>
      {/snippet}
      {@render part('name', nameBody, true)}
      {#snippet overviewBody()}
        <p class="impression">{s.impression}</p>
        <p><b>{t('settlement.peoples')}:</b> {peoplesLine(s)}</p>
        <p><b>{t('settlement.ruled')}:</b> {s.government}</p>
        <p><b>{t('settlement.defense')}:</b> {s.defense}</p>
      {/snippet}
      {@render part('overview', overviewBody, true)}
      {#snippet knownBody()}<p>{cap(s.knownFor.join('; '))}.</p>{/snippet}
      {@render part('knownFor', knownBody)}
      {#snippet troubleBody()}<p>{troubleText(s)}</p>{/snippet}
      {@render part('trouble', troubleBody)}
      {#snippet placesBody()}
        <ul>
          <li>{cap(tavernPlace(s))}</li>
          {#each s.places as p, i (i)}<li>{cap(p)}</li>{/each}
        </ul>
      {/snippet}
      {@render part('places', placesBody)}
      {#snippet peopleBody()}
        <ul>
          {#each s.people as p, i (i)}
            {@const [name, rest] = personParts(personLine(p))}
            <li><b>{name}</b> {rest}</li>
          {/each}
        </ul>
      {/snippet}
      {@render part('people', peopleBody)}
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
  .part p,
  .part ul {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .part ul {
    padding-left: 18px;
  }
  .name {
    font-size: 22px;
  }
  .impression {
    padding: 4px 10px;
    border-left: 3px solid var(--accent);
    background: var(--bg-primary);
    font-style: italic;
  }
</style>
