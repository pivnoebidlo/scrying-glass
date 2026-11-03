<!-- Riddle and puzzle generator (Tools → Riddles and puzzles): a riddle, a cipher, an order puzzle (statues, levers,
     bells) or caskets with inscriptions — the last two always have exactly one solution. Where it stands, what it
     says to the players, hints one by one, the answer behind a click, what happens on failure and success. To the
     journal, as a handout note or copy. The current puzzle is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { Check, Copy, Eye, EyeOff, Lightbulb, RotateCcw, NotebookPen, Puzzle as PuzzleIcon, RefreshCw, ScrollText } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { createNote, notesFolder } from '../../../renderer/lib/note/notes.svelte';
  import SketchView from '../../../renderer/lib/sketch/SketchView.svelte';
  import { cellAt, mosaicSketch, press } from './mosaic';
  import { store } from '../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { editNote } from '../ui/ui.svelte';
  import { createPuzzle, riddles, save } from './store.svelte';
  import { cap, puzzleMarkdown, puzzleNote, type PuzzleLabels } from './text';
  import { KINDS, LEVELS, type Puzzle } from './types';

  const p = $derived(riddles.puzzle);
  const listed = $derived(p?.kind === 'order' || p?.kind === 'caskets');

  const labels = (x: Puzzle): PuzzleLabels => ({
    kind: t(`riddles.kind.${x.kind}` as never),
    level: t(`riddles.level.${x.level}` as never),
    place: t('riddles.place'),
    hints: t('riddles.hints'),
    answer: t('riddles.answer'),
    failure: t('riddles.failure'),
    reward: t('riddles.reward'),
  });
  const title = (x: Puzzle) => t('riddles.pageTitle', { kind: t(`riddles.kind.${x.kind}` as never), place: x.place });
  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '');

  let copied = $state(false);
  function copy() {
    if (!p) return;
    void navigator.clipboard.writeText(puzzleMarkdown(p, labels(p), title(p)));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!p) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), safe(title(p)), puzzleMarkdown(p, labels(p)));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  async function toHandout() {
    if (!p) return;
    if (p.grid) {
      const path = await window.api.createSketch(notesFolder(store.state.vault.tree, store.state.adventures), safe(title(p)), mosaicSketch(p.grid));
      if (path) editNote(path);
      return;
    }
    const path = await createNote(store.state.vault.tree, store.state.adventures, safe(title(p)), puzzleNote(p));
    if (path) editNote(path);
  }
  // Switches at the table: the GM presses the slabs the players step on (remembered with the puzzle).
  const grid = $derived(p?.grid ? (p.grid.kind === 'switches' && riddles.play ? { ...p.grid, cells: riddles.play } : p.grid) : null);
  const picture = $derived(grid ? mosaicSketch(grid, riddles.answer) : null);
  const solved = $derived(grid?.kind === 'switches' && grid.cells.every((v) => v === 1));
  function onPicture(e: MouseEvent) {
    if (grid?.kind !== 'switches') return;
    const sheet = (e.currentTarget as HTMLElement).querySelector('.sheet');
    if (!sheet) return;
    const r = sheet.getBoundingClientRect();
    const i = cellAt(grid, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    if (i < 0) return;
    riddles.play = press(grid.cells, grid.w, i);
    save();
  }
  function resetPlay() {
    riddles.play = null;
    save();
  }

  function moreHint() {
    riddles.hints++;
    save();
  }
  function toggleAnswer() {
    riddles.answer = !riddles.answer;
    save();
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('riddles.title')}</h2>
    <div class="spacer"></div>
    {#if p}
      <button class="btn" title={t('riddles.toHandoutHint')} onclick={toHandout}><ScrollText size={14} /> {t('riddles.toHandout')}</button>
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('riddles.about')} /></p>

  <div class="options">
    <label>{t('riddles.kind')}
      <select bind:value={riddles.kind} onchange={save}>
        <option value="random">{t('settlement.random')}</option>
        {#each KINDS as id (id)}<option value={id}>{t(`riddles.kind.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('riddles.level')}
      <select bind:value={riddles.level} onchange={save}>
        {#each LEVELS as id (id)}<option value={id}>{t(`riddles.level.${id}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={createPuzzle}>
      {#if p}<RefreshCw size={16} />{:else}<PuzzleIcon size={16} />{/if} {t('riddles.create')}
    </button>
  </div>

  {#if !p}
    <p class="faint placeholder">{t('riddles.empty')}</p>
  {:else}
    <div class="sheet">
      <p class="meta faint">{t(`riddles.kind.${p.kind}` as never)} · {t(`riddles.level.${p.level}` as never)} · <b>{t('riddles.place')}:</b> {p.place}</p>

      <section class="aloud">
        <h3>{t('riddles.aloud')}</h3>
        {#if p.intro}<p class="intro">{p.intro}</p>{/if}
        {#if picture && grid}
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
          <div class="picture" class:play={grid.kind === 'switches'} onclick={onPicture}><SketchView sketch={picture} /></div>
          {#if grid.kind === 'switches'}
            <p class="faint play-line">
              {solved ? t('riddles.switchesSolved') : t('riddles.switchesPlay')}
              {#if riddles.play}<button class="btn small" onclick={resetPlay}><RotateCcw size={13} /> {t('riddles.switchesReset')}</button>{/if}
            </p>
          {/if}
        {/if}
        {#if p.kind === 'cipher'}
          <p class="cipher">{p.lines[0]}</p>
        {:else if listed}
          <ul>{#each p.lines as line, i (i)}<li>{line}</li>{/each}</ul>
        {:else}
          <p class="verse">{#each p.lines as line, i (i)}{line}<br />{/each}</p>
        {/if}
      </section>

      <section>
        <header>
          <h3>{t('riddles.hints')}</h3>
          <div class="spacer"></div>
          {#if riddles.hints < p.hints.length}
            <button class="btn small" onclick={moreHint}><Lightbulb size={13} /> {t('riddles.showHint')}</button>
          {/if}
        </header>
        {#if riddles.hints}
          <ol>{#each p.hints.slice(0, riddles.hints) as h, i (i)}<li>{h}</li>{/each}</ol>
        {:else}
          <p class="faint">{t('riddles.hintsHidden', { count: p.hints.length })}</p>
        {/if}
      </section>

      <section>
        <header>
          <h3>{t('riddles.answer')}</h3>
          <div class="spacer"></div>
          <button class="btn small" onclick={toggleAnswer}>
            {#if riddles.answer}<EyeOff size={13} /> {t('riddles.hideAnswer')}{:else}<Eye size={13} /> {t('riddles.showAnswer')}{/if}
          </button>
        </header>
        {#if riddles.answer}<p class="answer">{cap(p.answer)}</p>{/if}
      </section>

      <div class="two">
        <section><h3>{t('riddles.failure')}</h3><p>{cap(p.failure)}.</p></section>
        <section><h3>{t('riddles.reward')}</h3><p>{cap(p.reward)}.</p></section>
      </div>
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
    flex-wrap: wrap;
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
  .small {
    padding: 2px 8px;
    font-size: 12px;
  }
  .placeholder {
    font-style: italic;
  }
  .sheet {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .meta {
    margin: 0;
  }
  section {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  section header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  h3 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  section p,
  section ul,
  section ol {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  section ul,
  section ol {
    padding-left: 20px;
  }
  .aloud {
    border-left: 3px solid var(--accent);
  }
  .intro {
    font-style: italic;
  }
  .verse {
    font-size: 16px;
    font-style: italic;
  }
  .cipher {
    font-family: var(--font-mono, monospace);
    font-size: 18px;
    letter-spacing: 0.12em;
    word-break: break-all;
  }
  .picture {
    width: 100%;
    max-width: 640px;
    aspect-ratio: 4 / 3;
    margin-top: 8px;
  }
  .picture.play {
    cursor: pointer;
  }
  .play-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .answer {
    font-size: 16px;
    font-weight: 600;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
  }
</style>
