<!-- Weather generator (Tools → Weather generator): terrain, season, 1/3/7 days → for each day the sky, precipitation,
     wind and temperature, a line to read aloud, a rare event, and in D&D adventures the SRD weather rules that apply.
     Copy, to the journal, to Telegram. The last weather is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { Check, CloudSun, Copy, NotebookPen, Send } from '@lucide/svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../../renderer/lib/nav';
  import { store } from '../../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../../shared/adventures';
  import { markdownToTelegram } from '../../../../shared/telegram';
  import { isDnd } from '../../here';
  import { journalFolder } from '../../../../modules/journal/ui/store.svelte';
  import { openPage } from '../../../../modules/journal/ui/ui.svelte';
  import { sendToTelegram, tgReady } from '../../../../modules/telegram/ui/tg.svelte';
  import { generateWeather, SEASONS, TERRAINS, type Day, type Season, type Terrain } from './generate';
  import { dayEvent, dayFlavor, dayRules, daySummary, weatherMarkdown } from './text';

  const KEY = 'weather.state';
  interface Saved {
    terrain: Terrain;
    season: Season;
    days: number;
    result: Day[] | null;
    // Terrain of the result (the select may have changed since).
    for: Terrain;
  }
  function load(): Saved {
    try {
      return { terrain: 'forest', season: 'autumn', days: 3, result: null, for: 'forest', ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { terrain: 'forest', season: 'autumn', days: 3, result: null, for: 'forest' };
    }
  }
  const w = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(w)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const rules = $derived(isDnd(currentSystem(store.state.adventures)));
  const tr = (key: Parameters<typeof t>[0], params?: Record<string, string | number>) => t(key, params);
  const title = () => `${t('weather.title')} — ${t(`weather.t.${w.for}` as never)}, ${t(`weather.s.${w.season}` as never).toLowerCase()}`;
  const markdown = () => (w.result ? weatherMarkdown(w.result, w.for, locale.lang, rules, tr, title()) : '');

  function generate() {
    w.result = generateWeather({ terrain: w.terrain, season: w.season, days: w.days });
    w.for = w.terrain;
    save();
  }

  let copied = $state(false);
  function copy() {
    void navigator.clipboard.writeText(markdown());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), title(), markdown().replace(/^# .*\n\n/, ''));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  // The players get the weather and the read-aloud lines, not the rules.
  const toTelegram = () =>
    w.result && sendToTelegram({ kind: 'text', title: title(), html: markdownToTelegram(weatherMarkdown(w.result, w.for, locale.lang, false, tr, title())) });
</script>

<div class="view">
  <header class="head">
    <h2>{t('weather.title')}</h2>
    <div class="spacer"></div>
    {#if w.result}
      {#if tgReady()}<button class="btn" onclick={toTelegram}><Send size={14} /> {t('tg.sendShort')}</button>{/if}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('weather.about')} /></p>

  <div class="options">
    <label>{t('weather.terrain')}
      <select bind:value={w.terrain} onchange={save}>
        {#each TERRAINS as id (id)}<option value={id}>{t(`weather.t.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('weather.season')}
      <select bind:value={w.season} onchange={save}>
        {#each SEASONS as id (id)}<option value={id}>{t(`weather.s.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('weather.days')}
      <select bind:value={w.days} onchange={save}>
        {#each [1, 3, 7] as n (n)}<option value={n}>{n}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={generate}><CloudSun size={16} /> {t('weather.generate')}</button>
  </div>

  {#if !w.result}
    <p class="faint placeholder">{t('weather.empty')}</p>
  {:else}
    <div class="days">
      {#each w.result as d, i (i)}
        {@const ev = dayEvent(d, w.for, tr)}
        {@const effects = rules ? dayRules(d, tr) : []}
        <section class="day">
          {#if w.result.length > 1}<h3>{i === 0 ? t('weather.today') : t('weather.day', { n: i + 1 })}</h3>{/if}
          <p class="summary">{daySummary(d, w.for, locale.lang, tr)}</p>
          <blockquote>{dayFlavor(d, w.for, tr)}</blockquote>
          {#if ev}<p class="event"><b>{t('weather.event')}:</b> {ev}</p>{/if}
          {#if effects.length}
            <div class="rules">
              <span class="faint">{t('weather.effects')}</span>
              <ul>{#each effects as e, j (j)}<li>{e}</li>{/each}</ul>
            </div>
          {/if}
        </section>
      {/each}
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
  .days {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .day {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  h3 {
    margin: 0 0 4px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .summary {
    margin: 0;
    font-size: 16px;
  }
  blockquote {
    margin: 6px 0 0;
    padding: 4px 12px;
    border-left: 3px solid var(--accent);
    background: var(--bg-hover);
    font-style: italic;
  }
  .event {
    margin: 6px 0 0;
  }
  .rules {
    margin-top: 6px;
    font-size: 13px;
  }
  .rules ul {
    margin: 2px 0 0;
    padding-left: 18px;
    color: var(--text-muted);
  }
</style>
