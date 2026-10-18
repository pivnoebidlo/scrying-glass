<!-- Random events (Tools → Random events): terrain, day or night, danger, how many → encounters, finds, obstacles,
     travellers, omens and rumors. Creatures in the text open their cards on the side; in D&D adventures an obstacle
     shows its check. Each event can be rerolled; copy or save to the journal. The last roll is remembered. -->
<script lang="ts">
  import { Check, Copy, Dices, NotebookPen, RefreshCw, Swords } from '@lucide/svelte';
  import { toEncounter } from '../encounter';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { peekEntry } from '../../../renderer/lib/entry/peek.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { isDnd } from '../../../systems';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { TERRAINS, type Terrain } from '../weather/generate';
  import { COMPLICATIONS, EVENTS, RUMOR_INTROS } from './events';
  import { DANGERS, generateEvent, generateEvents, splitLinks, type Danger, type GeneratedEvent, type Time } from './generate';
  import { RUMORS, checkText, complicationText, eventLang, eventText, type EventLang } from './text';

  const KEY = 'events.state';
  interface Saved {
    terrain: Terrain;
    time: Time;
    danger: Danger;
    count: number;
    result: GeneratedEvent[] | null;
    // Language and options of the result (the selects may have changed since).
    lang: EventLang;
    for: { terrain: Terrain; time: Time; danger: Danger };
  }
  const DEFAULTS: Saved = { terrain: 'forest', time: 'day', danger: 'tense', count: 3, result: null, lang: 'en', for: { terrain: 'forest', time: 'day', danger: 'tense' } };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const ev = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(ev)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const rules = $derived(isDnd(currentSystem(store.state.adventures)));
  const lang = () => eventLang(locale.lang);
  const sizes = (l: EventLang) => [RUMORS[l].length, RUMOR_INTROS[l].length, COMPLICATIONS[l].length] as const;
  const check = (g: GeneratedEvent) =>
    rules ? checkText(g, locale.lang, (what, dc) => t('events.checkText', { what, dc }), (ability) => t('events.save', { ability })) : '';

  function roll() {
    const l = lang();
    const o = { terrain: ev.terrain, time: ev.time, danger: ev.danger };
    ev.result = generateEvents(EVENTS, ...sizes(l), { ...o, count: ev.count });
    ev.lang = l;
    ev.for = o;
    save();
  }
  function reroll(i: number) {
    if (!ev.result) return;
    const used = ev.result.filter((g, j) => j !== i && g.kind !== 'rumor').map((g) => g.index);
    ev.result[i] = generateEvent(EVENTS, ...sizes(ev.lang), $state.snapshot(ev.for), Math.random, used);
    save();
  }

  const title = () =>
    `${t('events.title')} — ${t(`weather.t.${ev.for.terrain}` as never)}, ${t(ev.for.time === 'day' ? 'events.day' : 'events.night').toLowerCase()}`;
  function markdown(heading = true) {
    const out = heading ? [`# ${title()}`, ''] : [];
    for (const g of ev.result ?? []) {
      out.push(`## ${t(`events.kind.${g.kind}` as never)}`, '', eventText(g, ev.lang));
      const c = check(g);
      if (c) out.push('', `*${t('events.check')}:* ${c}`);
      const comp = complicationText(g, ev.lang);
      if (comp) out.push('', `*${t('events.complication')}:* ${comp}`);
      out.push('');
    }
    return out.join('\n');
  }
  // An encounter's creatures (its links) → an encounter preset; how many — by the card's challenge.
  const creatures = (g: GeneratedEvent) => [...new Set(splitLinks(eventText(g, ev.lang)).flatMap((p) => ('link' in p ? [p.link] : [])))];
  let missing = $state('');
  async function encounterOf(g: GeneratedEvent) {
    const names = creatures(g);
    const title = `${t('events.kind.encounter')}: ${names.join(', ')}`;
    const lost = await toEncounter(title, names.map((name) => ({ name })), ev.lang);
    missing = lost.length ? t('tools.noCards', { names: lost.join(', ') }) : '';
  }
  let copied = $state(false);
  function copy() {
    void navigator.clipboard.writeText(markdown().replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1'));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), title(), markdown(false));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('events.title')}</h2>
    <div class="spacer"></div>
    {#if ev.result}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about">{t('events.about')}</p>

  <div class="options">
    <label>{t('weather.terrain')}
      <select bind:value={ev.terrain} onchange={save}>
        {#each TERRAINS as id (id)}<option value={id}>{t(`weather.t.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('events.time')}
      <select bind:value={ev.time} onchange={save}>
        <option value="day">{t('events.day')}</option>
        <option value="night">{t('events.night')}</option>
      </select>
    </label>
    <label>{t('events.danger')}
      <select bind:value={ev.danger} onchange={save}>
        {#each DANGERS as id (id)}<option value={id}>{t(`events.danger.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('events.count')}
      <select bind:value={ev.count} onchange={save}>
        {#each [1, 3, 6] as n (n)}<option value={n}>{n}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={roll}><Dices size={16} /> {t('events.generate')}</button>
  </div>

  {#if !ev.result}
    <p class="faint placeholder">{t('events.empty')}</p>
  {:else}
    <div class="list">
      {#each ev.result as g, i (i)}
        {@const c = check(g)}
        {@const comp = complicationText(g, ev.lang)}
        <section class="event kind-{g.kind}">
          <header>
            <h3>{t(`events.kind.${g.kind}` as never)}</h3>
            <div class="spacer"></div>
            {#if g.kind === 'encounter' && creatures(g).length}
              <button class="btn small" title={t('tools.toEncounterHint')} onclick={() => encounterOf(g)}><Swords size={13} /> {t('tools.toEncounter')}</button>
            {/if}
            <button class="icon-btn" title={t('events.reroll')} onclick={() => reroll(i)}><RefreshCw size={13} /></button>
          </header>
          <p class="text">
            {#each splitLinks(eventText(g, ev.lang)) as piece, j (j)}
              {#if 'link' in piece}<button class="link" title={t('events.openCard')} onclick={() => peekEntry(piece.link)}>{piece.text}</button>{:else}{piece.text}{/if}
            {/each}
          </p>
          {#if c}<p class="check"><b>{t('events.check')}:</b> {c}</p>{/if}
          {#if comp}<p class="comp"><b>{t('events.complication')}:</b> {comp}</p>{/if}
        </section>
      {/each}
    </div>
    {#if missing}<p class="faint">{missing}</p>{/if}
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
  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .event {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .kind-encounter {
    border-left-color: #c0504d;
  }
  .kind-obstacle {
    border-left-color: #d9a441;
  }
  .kind-discovery {
    border-left-color: #4f9d69;
  }
  .kind-traveler {
    border-left-color: #4a86c5;
  }
  .kind-omen {
    border-left-color: #8b6fc9;
  }
  .kind-rumor {
    border-left-color: var(--text-faint);
  }
  .event header {
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
  .text {
    margin: 4px 0 0;
    font-size: 15px;
    line-height: 1.5;
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
  .small {
    padding: 2px 8px;
    font-size: 12px;
  }
  .check,
  .comp {
    margin: 6px 0 0;
    color: var(--text-muted);
    font-size: 13px;
  }
</style>
