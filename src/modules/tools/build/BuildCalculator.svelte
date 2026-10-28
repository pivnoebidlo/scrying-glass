<!-- Tools → Constructions (Mausritter only): rooms and tunnels by 6" cubes → the materials, the upkeep a month, the days
     of digging for so many tunnel diggers and their wages (rules.ts, by the SRD). The plan is remembered by the window;
     "To journal" writes it as a note of the adventure. -->
<script lang="ts">
  import { NotebookPen, Plus, X } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { build, ROOM_COST, ROOMS, UPKEEP, DIGGER_WAGE, type BuildPart } from './rules';

  const KEY = 'build.state';
  type Saved = { parts: BuildPart[]; diggers: number };
  const DEFAULTS: Saved = { parts: [{ room: 'tunnel', cubes: 4 }, { room: 'standard', cubes: 2 }], diggers: 3 };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return structuredClone(DEFAULTS);
    }
  }
  const b = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(b)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const r = $derived(build(b.parts, b.diggers));
  const pips = (n: number) => t('build.pips', { n: n.toLocaleString(locale.lang) });
  const roomTitle = (p: BuildPart) => p.name?.trim() || t(`build.room.${p.room}` as never);

  function add() {
    b.parts.push({ room: 'poor', cubes: 1 });
    save();
  }
  function remove(i: number) {
    b.parts.splice(i, 1);
    save();
  }

  function markdown(): string {
    const rows = b.parts.map(
      (p) => `| ${roomTitle(p)} | ${t(`build.room.${p.room}` as never)}${p.hard ? `, ${t('build.hard').toLowerCase()}` : ''} | ${p.cubes} | ${pips(p.cubes * ROOM_COST[p.room])} |`
    );
    const lines = [
      `| ${t('build.name')} | ${t('build.kind')} | ${t('build.cubes')} | ${t('build.cost')} |`,
      '|---|---|---|---|',
      ...rows,
      '',
      `- ${t('build.materials')}: **${pips(r.materials)}**`,
      `- ${t('build.upkeep', { pct: UPKEEP * 100 })}: **${pips(r.upkeep)}** ${t('build.perMonth')}`,
    ];
    if (r.days) lines.push(`- ${t('build.digging', { count: r.days, diggers: b.diggers })}: **${pips(r.wages)}**`);
    return lines.join('\n');
  }
  async function toJournal() {
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), t('build.title'), markdown());
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('build.title')}</h2>
    <span class="spacer"></span>
    <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal} disabled={!b.parts.length}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
  </header>
  <p class="faint about">{t('build.about')}</p>

  <table>
    <thead>
      <tr>
        <th>{t('build.name')}</th>
        <th>{t('build.kind')}</th>
        <th class="num">{t('build.cubes')}</th>
        <th>{t('build.hard')}</th>
        <th class="num">{t('build.cost')}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each b.parts as p, i (i)}
        <tr>
          <td><input type="text" bind:value={p.name} placeholder={t(`build.room.${p.room}` as never)} oninput={save} /></td>
          <td>
            <select bind:value={p.room} onchange={save}>
              {#each ROOMS as room (room)}<option value={room}>{t(`build.room.${room}` as never)} — {pips(ROOM_COST[room])}</option>{/each}
            </select>
          </td>
          <td class="num"><input type="number" min="0" step="1" bind:value={p.cubes} oninput={save} /></td>
          <td><input type="checkbox" bind:checked={p.hard} onchange={save} title={t('build.hardHint')} /></td>
          <td class="num">{pips((p.cubes || 0) * ROOM_COST[p.room])}</td>
          <td><button class="icon-btn" title={t('build.remove')} onclick={() => remove(i)}><X size={14} /></button></td>
        </tr>
      {/each}
    </tbody>
  </table>
  <button class="btn add" onclick={add}><Plus size={14} /> {t('build.add')}</button>

  <div class="options">
    <label>{t('build.diggers')}
      <input type="number" min="0" step="1" bind:value={b.diggers} oninput={save} />
    </label>
  </div>

  <section class="result">
    <div class="big">{pips(r.total)}</div>
    <dl>
      <dt>{t('build.materials')}</dt><dd>{pips(r.materials)}</dd>
      <dt>{t('build.wages', { wage: DIGGER_WAGE })}</dt><dd>{r.days ? pips(r.wages) : '—'}</dd>
      <dt>{t('build.time')}</dt><dd>{r.days ? t('build.days', { count: r.days }) : '—'}</dd>
      <dt>{t('build.upkeep', { pct: UPKEEP * 100 })}</dt><dd>{pips(r.upkeep)} {t('build.perMonth')}</dd>
    </dl>
  </section>
  <p class="faint note">{t('build.rules')}</p>
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
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
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    padding: 4px 6px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
  }
  td {
    padding: 3px 6px;
  }
  .num {
    text-align: right;
    white-space: nowrap;
  }
  td input[type='text'],
  td select {
    width: 100%;
  }
  td input[type='number'] {
    width: 80px;
  }
  .add {
    margin-top: 6px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin-top: 14px;
  }
  .options label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .options input[type='number'] {
    width: 110px;
  }
  .result {
    margin: 16px 0 8px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .big {
    font-size: 24px;
    font-weight: 600;
  }
  dl {
    display: grid;
    grid-template-columns: max-content auto;
    gap: 2px 16px;
    margin: 6px 0 0;
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
  }
  .note {
    font-size: 12px;
    line-height: 1.5;
  }
</style>
