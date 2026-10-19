<!-- Tools → Schedule: the coming games (eight weeks ahead) with their answers, and the game editor. A game: title,
     date and time, length, repeat (and until when), table, adventure of this vault and its plan, place, reminders.
     Per game: announce to the table in Telegram, start, skip this one (a repeat), edit, delete. -->
<script lang="ts">
  import { CalendarPlus, Megaphone, Pencil, Play, SkipForward, Trash2 } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { gameId, occurrences, REPEATS, tally, type Game, type Occurrence } from '../../../shared/schedule';
  import { allFiles } from '../../../shared/vault';
  import { pageTitle } from '../../../shared/journal';
  import { loadTg, tg } from '../../telegram/ui/tg.svelte';
  import { loadSchedule, sameVault, saveGames, sched, startGame } from './store.svelte';
  import { untilText, whenText } from './when';

  onMount(() => {
    void loadSchedule();
    void loadTg();
  });

  const list = $derived(occurrences(sched.data.games, sched.now, sched.now + 56 * 86400000));
  const tables = $derived(tg.status?.tables ?? []);
  const botReady = $derived(!!tg.status?.configured && !!tg.status.chats.some((c) => c.enabled));
  const tableName = (id?: string) => (id ? tables.find((x) => x.id === id)?.name : undefined);
  const vaultName = (root?: string) => root?.split(/[\\/]/).pop() ?? '';

  // ---------- The editor ----------
  interface Draft {
    id: string | null;
    title: string;
    date: string;
    time: string;
    hours: number;
    repeat: Game['repeat'];
    until: string;
    table: string;
    adventure: string;
    plan: string;
    place: string;
    remind: boolean;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateOf = (t: number) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const timeOf = (t: number) => {
    const d = new Date(t);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  let draft = $state<Draft | null>(null);
  function newGame() {
    // Next week, same weekday, 19:00 — a starting point.
    const d = new Date(sched.now + 7 * 86400000);
    d.setHours(19, 0, 0, 0);
    draft = {
      id: null,
      title: '',
      date: dateOf(d.getTime()),
      time: '19:00',
      hours: 4,
      repeat: 'week',
      until: '',
      table: tables.length === 1 ? tables[0]!.id : '',
      adventure: store.state.adventures.current ?? '',
      plan: '',
      place: '',
      remind: true,
    };
  }
  function edit(g: Game) {
    draft = {
      id: g.id,
      title: g.title,
      date: dateOf(g.start),
      time: timeOf(g.start),
      hours: g.minutes / 60,
      repeat: g.repeat,
      until: g.until ? dateOf(g.until) : '',
      table: g.table ?? '',
      adventure: g.adventure ?? '',
      plan: g.plan ?? '',
      place: g.place ?? '',
      remind: g.remind,
    };
  }
  const local = (date: string, time = '00:00') => {
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    return new Date(y!, m! - 1, d!, h ?? 0, min ?? 0).getTime();
  };
  async function save() {
    const d = draft;
    if (!d || !d.date || !d.time) return;
    const old = d.id ? sched.data.games.find((g) => g.id === d.id) : undefined;
    const game: Game = {
      id: d.id ?? gameId(),
      title: d.title.trim(),
      start: local(d.date, d.time),
      minutes: Math.max(15, Math.round(d.hours * 60)),
      repeat: d.repeat,
      until: d.repeat !== 'none' && d.until ? local(d.until) : null,
      skip: old?.skip ?? [],
      table: d.table || undefined,
      vault: store.state.vault.root ?? undefined,
      adventure: d.adventure || null,
      plan: d.plan || undefined,
      place: d.place.trim() || undefined,
      remind: d.remind,
    };
    const games = sched.data.games.filter((g) => g.id !== game.id);
    await saveGames([...games, game]);
    draft = null;
  }
  async function remove(g: Game) {
    if (!confirm(t('sched.deleteAsk'))) return;
    await saveGames(sched.data.games.filter((x) => x.id !== g.id));
  }
  async function skip(o: Occurrence) {
    await saveGames(sched.data.games.map((g) => (g.id === o.game.id ? { ...g, skip: [...(g.skip ?? []), o.start] } : g)));
  }
  // Plans: journal notes of the chosen adventure (or of no adventure).
  const plans = $derived.by(() => {
    const tree = store.state.vault.tree;
    if (!tree || !draft) return [];
    const adv = draft.adventure;
    return allFiles(tree, 'page')
      .map((f) => f.path)
      .filter((p) => (adv ? p.startsWith(adv + '/') : !store.state.adventures.list.some((a) => p.startsWith(a + '/'))));
  });

  let busy = $state<string | null>(null);
  let message = $state('');
  async function announce(o: Occurrence) {
    busy = o.key;
    const r = await window.api.announceGame(o.key);
    busy = null;
    message = r.error ? r.error : '';
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('sched.title')}</h2>
    <div class="spacer"></div>
    <button class="btn primary" onclick={newGame}><CalendarPlus size={14} /> {t('sched.new')}</button>
  </header>
  <p class="faint about">{t('sched.about')}</p>
  {#if !botReady}<p class="faint">{t('sched.noBot')}</p>{/if}
  {#if message}<p class="error">{message}</p>{/if}

  {#if draft}
    <section class="editor">
      <div class="grid">
        <label class="wide">{t('sched.titleLabel')}<input type="text" placeholder={t('sched.titlePh')} bind:value={draft.title} /></label>
        <label>{t('sched.date')}<input type="date" bind:value={draft.date} /></label>
        <label>{t('sched.time')}<input type="time" bind:value={draft.time} /></label>
        <label>{t('sched.hours')}<input type="number" min="0.5" max="24" step="0.5" bind:value={draft.hours} /></label>
        <label>{t('sched.repeat')}
          <select bind:value={draft.repeat}>
            {#each REPEATS as r (r)}<option value={r}>{t(`sched.repeat.${r}` as never)}</option>{/each}
          </select>
        </label>
        {#if draft.repeat !== 'none'}<label>{t('sched.until')}<input type="date" bind:value={draft.until} /></label>{/if}
        <label>{t('sched.table')}
          <select bind:value={draft.table}>
            <option value="">{t('sched.anyTable')}</option>
            {#each tables as x (x.id)}<option value={x.id}>{x.name}</option>{/each}
          </select>
        </label>
        <label>{t('sched.adventure')}
          <select bind:value={draft.adventure} onchange={() => draft && (draft.plan = '')}>
            <option value="">{t('sched.noAdventure')}</option>
            {#each store.state.adventures.list as a (a)}<option value={a}>{a}</option>{/each}
          </select>
        </label>
        <label title={t('sched.planHint')}>{t('sched.plan')}
          <select bind:value={draft.plan}>
            <option value="">{t('sched.noPlan')}</option>
            {#each plans as p (p)}<option value={p}>{pageTitle(p)}</option>{/each}
          </select>
        </label>
        <label class="wide">{t('sched.place')}<input type="text" placeholder={t('sched.placePh')} bind:value={draft.place} /></label>
      </div>
      <label class="check"><input type="checkbox" bind:checked={draft.remind} /> {t('sched.remind')}</label>
      <div class="row">
        <button class="btn primary" disabled={!draft.date || !draft.time} onclick={save}>{t('sched.save')}</button>
        <button class="btn" onclick={() => (draft = null)}>{t('sched.cancel')}</button>
      </div>
    </section>
  {/if}

  {#if !list.length && !draft}
    <p class="faint placeholder">{t('sched.empty')}</p>
  {:else}
    <h3>{t('sched.upcoming')}</h3>
    <div class="games">
      {#each list as o, i (o.key)}
        {@const tl = tally(sched.data.answers[o.key])}
        {@const until = untilText(o, sched.now, locale.lang)}
        {@const repeatOf = list.slice(0, i).some((x) => x.game.id === o.game.id)}
        {@const answered = tl.yes.length + tl.maybe.length + tl.no.length > 0}
        <section class="game" class:compact={repeatOf && !answered && !sched.data.announced[o.key]?.length}>
          <header>
            <div class="when" data-title={o.game.title || o.game.adventure || t('sched.game')}>
              <b>{whenText(o, locale.lang)}</b>
              <span class="faint">· {until ?? t('sched.now')}</span>
            </div>
            <div class="spacer"></div>
            {#if botReady}
              <button class="icon-btn" title={t('sched.announce')} disabled={busy === o.key} onclick={() => announce(o)}><Megaphone size={14} /></button>
            {/if}
            {#if sameVault(o.game)}<button class="icon-btn" title={t('sched.start')} onclick={() => startGame(o)}><Play size={14} /></button>{/if}
            {#if o.game.repeat !== 'none'}<button class="icon-btn" title={t('sched.skip')} onclick={() => skip(o)}><SkipForward size={14} /></button>{/if}
            <button class="icon-btn" title={t('sched.edit')} onclick={() => edit(o.game)}><Pencil size={14} /></button>
            <button class="icon-btn" title={t('sched.delete')} onclick={() => remove(o.game)}><Trash2 size={14} /></button>
          </header>
          <div class="title">{o.game.title || o.game.adventure || t('sched.game')}</div>
          <div class="faint meta">
            {#if tableName(o.game.table)}<span>{tableName(o.game.table)}</span>{/if}
            {#if o.game.title && o.game.adventure}<span>{o.game.adventure}</span>{/if}
            {#if o.game.plan}<span>📝 {pageTitle(o.game.plan)}</span>{/if}
            {#if o.game.place}<span>📍 {o.game.place}</span>{/if}
            {#if !sameVault(o.game)}<span>{t('sched.otherVault', { vault: vaultName(o.game.vault) })}</span>{/if}
            {#if sched.data.announced[o.key]?.length}<span>📣 {t('sched.announced')}</span>{/if}
          </div>
          <div class="answers">
            {#if tl.yes.length + tl.maybe.length + tl.no.length}
              {#if tl.yes.length}<span>✅ {tl.yes.join(', ')}</span>{/if}
              {#if tl.maybe.length}<span>🤔 {tl.maybe.join(', ')}</span>{/if}
              {#if tl.no.length}<span>❌ {tl.no.join(', ')}</span>{/if}
            {:else if sched.data.announced[o.key]?.length}
              <span class="faint">{t('sched.nobody')}</span>
            {/if}
          </div>
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
  .error {
    color: var(--danger);
  }
  .placeholder {
    font-style: italic;
  }
  h3 {
    margin: 18px 0 8px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .editor {
    padding: 12px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px 12px;
  }
  .grid label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .grid .wide {
    grid-column: 1 / -1;
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
  }
  .row {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .games {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .game {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .game.compact {
    padding: 4px 12px;
    border-left-color: var(--border);
  }
  .game.compact .meta,
  .game.compact .answers {
    display: none;
  }
  .game.compact .title {
    display: none;
  }
  .game.compact .when::after {
    content: attr(data-title);
    margin-left: 8px;
    color: var(--text-muted);
  }
  .game header {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .title {
    margin-top: 2px;
    font-size: 15px;
    font-weight: 600;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin-top: 2px;
    font-size: 12px;
  }
  .answers {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 4px;
    font-size: 13px;
  }
</style>
