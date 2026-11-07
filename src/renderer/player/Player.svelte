<!-- A player's page: the character, what happens to them in the fight, the last roll. The GM's app may be off or the
     phone may have slept: the page keeps trying until it is back. -->
<script lang="ts">
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';
  import type { Card } from '../../shared/cards';
  import { afterReset, hpShare, type PlayerAction, type PlayerRoll, type PlayerUsage, type PlayerView } from '../../shared/players';
  import { setNameIndex } from '../../shared/nameindex';
  import { registerPacks, sheetResources } from '../../systems/packs';
  import { sheetOf } from '../../systems/sheets';
  import { peekEntry } from '../lib/entry/peek.svelte';
  import { applyLang, t } from '../lib/i18n.svelte';
  import { sheetUsage } from '../lib/sheetusage.svelte';
  import EntrySheet from './EntrySheet.svelte';
  import LastRoll from './LastRoll.svelte';

  const RETRY = 3000;
  const token = location.pathname.split('/')[2] ?? '';
  const api = (what: string) => `/api/${encodeURIComponent(token)}/${what}`;

  let view = $state.raw<PlayerView | null>(null);
  let Sheet = $state.raw<Component<{ card: Card<any> }> | null>(null);
  let sheetFor = '';
  let lost = $state(false);
  let gone = $state(false);
  let source: EventSource | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;

  // A press shows at once; the answer of the core comes with the stream, and a refusal puts the truth back.
  async function act(action: PlayerAction, usage: PlayerUsage) {
    if (view) view = { ...view, usage };
    try {
      const res = await fetch(api('action'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) });
      if (!res.ok) await load();
    } catch {
      later();
    }
  }
  // A roll for the GM's log: lost with the connection, nothing here depends on it.
  async function tell(roll: PlayerRoll) {
    await fetch(api('action'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roll) }).catch(() => undefined);
  }
  sheetUsage.host = {
    player: true,
    used: () => view?.usage ?? {},
    set: (_card, key, used) => void act({ type: 'use', key, used }, { ...view?.usage, [key]: used }),
    reset: (card, id) => void act({ type: 'reset', id }, afterReset(view?.usage ?? {}, sheetResources(card).resets[id] ?? [])),
  };

  async function apply(next: PlayerView) {
    registerPacks(next.pack ? [next.pack] : []);
    applyLang(next.lang);
    setNameIndex(next.entries);
    const key = `${next.card.system}|${next.card.kind}|${!!next.pack}`;
    if (key !== sheetFor) {
      sheetFor = key;
      Sheet = await sheetOf(next.card, !!next.pack);
    }
    view = next;
    document.title = next.card.name;
  }

  function later() {
    lost = true;
    if (!retry) retry = setTimeout(() => void load(), RETRY);
  }

  function listen() {
    source?.close();
    source = new EventSource(api('events'));
    source.onopen = () => (lost = false);
    source.onmessage = (e) => void apply(JSON.parse(e.data as string) as PlayerView);
    source.addEventListener('gone', () => {
      source?.close();
      gone = true;
    });
    source.onerror = () => {
      // Open again by itself unless the browser gave up.
      lost = true;
      if (source?.readyState === EventSource.CLOSED) later();
    };
  }

  async function load() {
    retry = null;
    try {
      const res = await fetch(api('view'));
      if (res.status === 404) {
        source?.close();
        gone = true;
        return;
      }
      if (!res.ok) return later();
      await apply((await res.json()) as PlayerView);
      lost = false;
      listen();
    } catch {
      later();
    }
  }

  onMount(() => {
    void load();
    // A phone that slept: its stream may be dead without saying so.
    const wake = () => {
      if (document.visibilityState === 'visible' && !gone) void load();
    };
    document.addEventListener('visibilitychange', wake);
    return () => document.removeEventListener('visibilitychange', wake);
  });

  const live = $derived(view?.live ?? null);
</script>

<main>
  {#if gone}
    <p class="center">{t('pl.page.gone')}</p>
  {:else if !view}
    <p class="center">{lost ? t('pl.page.lost') : t('pl.page.wait')}</p>
  {:else}
    {#if lost}<div class="lost" role="status">{t('pl.page.lost')}</div>{/if}
    <header>
      {#if view.portrait}<img src="{api('portrait')}?v={view.portrait}" alt="" />{/if}
      <h1>{view.card.name}</h1>
    </header>
    {#if live}
      <section class="live" class:turn={live.turn} class:down={live.down}>
        {#if live.turn}<strong class="now">{t('pl.page.turn')}</strong>{/if}
        {#if live.hp !== null}
          <div class="hp">
            <span>{t('pl.page.hp')}</span>
            <b>{live.hp}{live.maxHp !== null ? ` / ${live.maxHp}` : ''}</b>
          </div>
          {#if live.maxHp}<div class="bar"><i style:width="{hpShare(live.hp, live.maxHp) * 100}%"></i></div>{/if}
        {/if}
        {#if live.down}<p>{t('pl.page.down')}</p>{/if}
        {#if live.conditions.length}<ul>{#each live.conditions as c (c)}<li>{#if view.conditions.includes(c)}<button onclick={() => peekEntry(c)}>{c}</button>{:else}{c}{/if}</li>{/each}</ul>{/if}
        {#if live.round}<small>{t('pl.page.round', { round: live.round })}</small>{/if}
      </section>
    {/if}
    {#if Sheet}<div class="sheet"><Sheet card={view.card} /></div>{/if}
    <LastRoll send={(roll) => void tell(roll)} />
    <EntrySheet {api} />
  {/if}
</main>

<style>
  /* theme.css comes after this and is written for a window that does not scroll: these selectors must outweigh it. */
  :global(html:root) {
    height: auto;
    -webkit-text-size-adjust: 100%;
  }
  :global(html:root body) {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    font-size: 15px;
    user-select: text;
    -webkit-user-select: text;
  }
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 12px 16px calc(96px + env(safe-area-inset-bottom));
  }
  .center {
    margin-top: 40vh;
    color: var(--text-muted);
    text-align: center;
  }
  .lost {
    position: sticky;
    top: 0;
    z-index: 5;
    margin: -12px -16px 10px;
    padding: 6px 16px;
    background: var(--warning);
    color: #000000;
    text-align: center;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  header img {
    width: 56px;
    height: 56px;
    flex: none;
    object-fit: cover;
    border-radius: 50%;
  }
  h1 {
    margin: 0;
    font-size: 22px;
    overflow-wrap: anywhere;
  }
  .live {
    position: sticky;
    top: 0;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .live.turn {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .live.down {
    border-color: var(--danger);
  }
  .now {
    color: var(--accent);
    font-size: 18px;
  }
  .hp {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .hp b {
    font-size: 20px;
  }
  .bar {
    height: 6px;
    border-radius: 3px;
    background: var(--bg-active);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--success);
    transition: width 0.3s;
  }
  .down .bar i {
    background: var(--danger);
  }
  .live p {
    margin: 0;
    color: var(--danger);
  }
  .live ul {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .live li {
    padding: 1px 8px;
    border-radius: 10px;
    background: var(--accent-soft);
  }
  .live li button {
    padding: 0;
    border: none;
    background: none;
    text-decoration: underline dotted;
  }
  small {
    color: var(--text-muted);
  }
  .sheet {
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
