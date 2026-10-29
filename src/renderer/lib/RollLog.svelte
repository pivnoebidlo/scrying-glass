<!-- Журнал бросков мастера: всплывает при броске, новые снизу. Игрокам не виден. -->
<script lang="ts">
  import { degreeOf, type Degree } from '../../shared/dice';
  import { t } from './i18n.svelte';
  import { Dices, Trash2, X } from '@lucide/svelte';
  import { diceText } from '../../shared/dice';
  import { rolls, type RollEntry } from './rolls.svelte';
  import { entryHtml } from './entry/markup';
  import { peekEntry, peekEntryAt } from './entry/peek.svelte';
  import { dispatch, store } from './store.svelte';
  import { ROLL_RESULT, stepsMarkdown, type TableSource } from '../../shared/rolltable';


  let list = $state<HTMLElement>();

  // Новый бросок — прокрутить вниз.
  $effect(() => {
    rolls.list.length;
    if (list) list.scrollTop = list.scrollHeight;
  });

  const signed = (n: number) => (n >= 0 ? `+ ${n}` : `− ${-n}`);
  const d20Note = (e: RollEntry) =>
    e.d20
      ? `${t('lib.d20')}: ${e.d20.rolls.join(' | ')}${e.d20.mode === 'advantage' ? ` (${t('lib.adv')})` : e.d20.mode === 'disadvantage' ? ` (${t('lib.dis')})` : ''} ${signed(e.d20.bonus)}`
      : '';
  const crit = (e: RollEntry) => !!e.attack && e.d20?.natural === 20;
  // A roll judged against a DC typed here: its natural die, total and how many degrees.
  const judged = (e: RollEntry) =>
    e.d20 && e.degrees ? { natural: e.d20.natural, total: e.d20.total, degrees: e.degrees } : e.pack?.dc ? { natural: e.pack.dc.natural, total: e.pack.total, degrees: e.pack.dc.degrees } : null;
  const degree = (e: RollEntry): Degree | null => {
    const j = judged(e);
    if (!j || e.dc === undefined) return null;
    return j.degrees === 'four' ? degreeOf(j.total, j.natural, e.dc) : j.total >= e.dc ? 'success' : 'failure';
  };
  const fumble = (e: RollEntry) => !!e.attack && e.d20?.natural === 1;

  // Roll tables: offered on a natural 20 or 1 or an event of the game (the tables marked so), the result — to the
  // players or Telegram.
  const offers = (e: RollEntry): TableSource[] =>
    !rolls.tables
      ? []
      : e.event
        ? rolls.tables.offered(e.event)
        : !e.d20
          ? []
          : e.d20.natural === 20
            ? rolls.tables.offered('crit')
            : e.d20.natural === 1
              ? rolls.tables.offered('fumble')
              : [];
  const markdown = (e: RollEntry) => stepsMarkdown(e.table!.steps, t('lib.tableNone'));
  const resultPath = (e: RollEntry) => `${ROLL_RESULT}${e.id}`;
  const shown = (e: RollEntry) => store.state?.handouts.current === resultPath(e);
  const toPlayers = (e: RollEntry) =>
    dispatch('handouts', 'toggleEntry', { path: resultPath(e), entry: { title: e.table!.start.title, type: 'note', fields: {}, body: markdown(e) } });
  function link(ev: MouseEvent) {
    const a = (ev.target as HTMLElement).closest('a.wikilink') as HTMLElement | null;
    if (!a) return;
    ev.preventDefault();
    peekEntry(a.dataset['link'] ?? '');
  }
</script>

{#if rolls.open}
  <section class="log" aria-label={t('lib.rolls')}>
    <header>
      <Dices size={14} />
      <span class="title">{t('lib.rolls')}</span>
      <button class="icon-btn" title={t('lib.clear')} onclick={() => rolls.clear()}><Trash2 size={13} /></button>
      <button class="icon-btn" title={t('lib.hideLog')} onclick={() => (rolls.open = false)}><X size={14} /></button>
    </header>
    {#if !rolls.list.length}<p class="empty">{t('lib.noRolls')}</p>{/if}
    <ol bind:this={list}>
      {#each rolls.list as e (e.id)}
        <li class:last={e === rolls.list.at(-1)}>
          <div class="what"><span class="who">{e.who}</span> · {e.what}</div>
          {#if e.d20}
            <div class="line">
              <span class="total" class:crit={crit(e) || (!e.attack && e.d20.natural === 20)} class:fumble={fumble(e) || (!e.attack && e.d20.natural === 1)}
                >{e.d20.total}</span
              >
              <span class="note">{d20Note(e)}</span>
              {#if crit(e)}<span class="tag crit">{t('lib.crit')}</span>{:else if fumble(e)}<span class="tag fumble">{t('lib.miss')}</span>{/if}
            </div>
          {/if}
          {#if judged(e)}
            {@const d = degree(e)}
            <div class="line dc">
              <label title={t('lib.dcHint')}>{t('lib.dc')} <input type="number" min="0" max="99" value={e.dc ?? ''} onchange={(ev) => rolls.setDc(e.id, ev.currentTarget.value.trim() === '' ? null : Number(ev.currentTarget.value))} /></label>
              {#if d}<span class="tag" class:crit={d === 'critical' || d === 'success'} class:fumble={d === 'failure' || d === 'fumble'}>{t(`lib.degree.${d}`)}</span>{/if}
            </div>
          {/if}
          {#if e.save}
            <div class="line">
              <span class="total" class:crit={e.save.success} class:fumble={!e.save.success}>{e.save.natural}</span>
              <span class="note"
                >{t('lib.d20')}: {e.save.rolls.join(' | ')}{e.save.mode === 'advantage' ? ` (${t('lib.adv')})` : e.save.mode === 'disadvantage' ? ` (${t('lib.dis')})` : ''} ≤ {e.save.target}</span
              >
              <span class="tag" class:crit={e.save.success} class:fumble={!e.save.success}>{e.save.success ? t('lib.saved') : t('lib.failed')}</span>
            </div>
          {/if}
          {#if e.pack}
            {@const p = e.pack}
            <div class="line">
              <span class="total" class:crit={p.tone === 'good'} class:fumble={p.tone === 'bad'}>{p.total}</span>
              <span class="note">{p.note}{#if !p.tally}: <span class="faces">{p.dice.map((g) => g.join(' ')).join(' | ')}</span>{/if}</span>
              {#if p.outcome}<span class="tag" class:crit={p.tone === 'good'} class:fumble={p.tone === 'bad'}>{p.outcome}</span>{/if}
            </div>
            {#if p.tally}
              {@const tl = p.tally}
              <div class="dice">
                {#each tl.dice as d, i (i)}<button class="die" class:hit={d >= (tl.fives ? Math.min(5, tl.success) : tl.success)} title={t('pack.dieHint')} onclick={() => rolls.tweak(e.id, { die: i })}>{d}</button>{/each}
              </div>
            {/if}
            {#if p.need}
              {@const ok = e.dc !== undefined ? p.total >= e.dc : null}
              <div class="line dc">
                <label title={t('pack.needHint')}>{t('pack.need')} <input type="number" min="0" max="30" value={e.dc ?? ''} onchange={(ev) => rolls.setDc(e.id, ev.currentTarget.value.trim() === '' ? null : Number(ev.currentTarget.value))} /></label>
                {#if ok !== null}
                  <span class="tag" class:crit={ok} class:fumble={!ok}>{ok ? t('pack.success') : t('pack.failure')}</span>
                  {#if ok && p.total > e.dc!}<span class="note">{t('pack.extra', { count: p.total - e.dc! })}</span>{/if}
                {/if}
              </div>
            {/if}
            {#if p.tally}
              {@const tl = p.tally}
              <div class="acts">
                <button class="push" title={t('pack.addSuccess')} onclick={() => rolls.tweak(e.id, { plus: 1 })}>+1</button>
                <button class="push" title={t('pack.takeSuccess')} disabled={p.total === 0} onclick={() => rolls.tweak(e.id, { plus: -1 })}>−1</button>
                <button class="push" title={t('pack.againFailedHint')} onclick={() => rolls.tweak(e.id, { failed: true })}>{t('pack.againFailed')}</button>
                <button class="push" title={t('pack.againOnesHint')} disabled={!tl.dice.includes(1)} onclick={() => rolls.tweak(e.id, { ones: true })}>{t('pack.againOnes')}</button>
                {#if tl.success > 5}<button class="push" class:on={tl.fives} title={t('pack.fivesHint')} onclick={() => rolls.tweak(e.id, { fives: !tl.fives })}>{t('pack.fivesToggle')}</button>{/if}
              </div>
            {/if}
            {#if p.push && !p.pushed}
              <button class="push" title={t('pack.pushHint')} onclick={() => rolls.pushRoll(e)}>{t('pack.push')}</button>
            {/if}
          {/if}
          {#if e.table}
            {@const tb = e.table}
            {#each tb.steps as st, i (i)}
              <div class="step" style:padding-left="{st.depth * 12}px">
                <button class="step-title" onclick={() => (st.path ? peekEntryAt(st.path, st.title) : peekEntry(st.title))}>{st.title}</button>
                <span class="note">{st.dice}</span>
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                <div class="result" onclick={link}>
                  {#if st.text === null}<span class="note">{t('lib.tableNone')}</span>{:else}{@html entryHtml(st.text)}{/if}
                </div>
              </div>
            {/each}
            <div class="acts">
              <button class="push" onclick={() => rolls.table(tb.start, e.who)}>{t('lib.again')}</button>
              <button class="push" class:on={shown(e)} onclick={() => toPlayers(e)}>{shown(e) ? t('lib.hideFromPlayers') : t('lib.toPlayers')}</button>
              {#if rolls.telegram}<button class="push" onclick={() => rolls.telegram?.(tb.start.title, markdown(e))}>{t('lib.toTelegram')}</button>{/if}
            </div>
          {/if}
          {#if offers(e).length}
            <div class="acts">
              {#each offers(e) as o (o.path ?? o.title)}
                <button class="push" title={t('lib.tableOffer')} onclick={() => rolls.table(o, e.who)}><Dices size={11} /> {o.title}</button>
              {/each}
            </div>
          {/if}
          {#each e.damage as d, i (i)}
            <div class="line dmg">
              <span class="total">{d.total}</span>
              <span class="note">
                {e.d20 ? t('lib.damage') + ' ' : ''}{diceText(d.expr)}{d.doubled ? ' ' + t('lib.doubled') : d.crit ? ' ' + t('lib.doubleDice') : ''}: {d.rolls.map((r) => r.join(', ')).join(' | ')}
              </span>
            </div>
          {/each}
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .empty {
    margin: 0;
    padding: 10px 12px;
    color: var(--text-faint);
    font-size: 13px;
  }
  .faces {
    font-family: ui-monospace, monospace;
    letter-spacing: 0.1em;
  }
  .log {
    position: fixed;
    -webkit-app-region: no-drag;
    right: 292px;
    bottom: 12px;
    z-index: 60;
    display: flex;
    flex-direction: column;
    width: 270px;
    max-height: min(300px, 50vh);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px 4px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
  }
  .title {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  ol {
    margin: 0;
    padding: 4px 0;
    overflow: auto;
    list-style: none;
    user-select: text;
  }
  li {
    padding: 3px 10px;
    opacity: 0.6;
  }
  li.last {
    opacity: 1;
  }
  li + li {
    border-top: 1px solid var(--border);
  }
  .what {
    font-size: 12px;
    color: var(--text-muted);
  }
  .who {
    color: var(--text-normal);
  }
  .line {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .dc label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .dc input {
    width: 48px;
    padding: 1px 4px;
  }
  .dice {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin: 2px 0 2px 36px;
  }
  .die {
    min-width: 20px;
    padding: 0 3px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: none;
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .die.hit {
    color: var(--success);
    border-color: var(--success);
    font-weight: 600;
  }
  .die:hover {
    background: var(--bg-hover);
  }
  .total {
    min-width: 28px;
    font-size: 18px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .dmg .total {
    font-size: 16px;
    color: var(--danger);
  }
  .note {
    font-size: 12px;
    color: var(--text-faint);
  }
  .crit {
    color: var(--accent-hover);
  }
  .fumble {
    color: var(--text-faint);
  }
  .push {
    margin: 2px 0 4px;
    padding: 1px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .push:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 2px 0 4px;
  }
  .acts .push {
    margin: 0;
  }
  .push.on {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .step {
    margin: 2px 0;
  }
  .step-title {
    padding: 0;
    border: 0;
    background: none;
    color: var(--text-normal);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .step-title:hover {
    color: var(--text-accent, var(--accent));
  }
  .result {
    font-size: 13px;
  }
  .result :global(p) {
    margin: 0;
  }
  .result :global(a.wikilink) {
    color: var(--accent);
    text-decoration: underline dotted;
    cursor: pointer;
  }
  .tag {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
</style>
