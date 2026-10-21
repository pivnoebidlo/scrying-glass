<!-- Tools → Factions (Mausritter adventures only): the factions of the adventure — resources, goals with progress
     marks — and the between-sessions roll by the SRD. Example factions of the SRD can be added in the interface
     language. -->
<script lang="ts">
  import { Dices, Plus, X } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { EXAMPLE_FACTIONS } from '../../tools/maus/srd';
  import { blankAdventure, currentGoal, type Faction, type FactionGoal } from '../types';

  const adventure = $derived(store.state.adventures.current);
  const data = $derived(store.state.mausritter.byAdventure[adventure ?? ''] ?? blankAdventure());
  const examples = $derived(EXAMPLE_FACTIONS[locale.lang === 'ru' ? 'ru' : 'en']);

  const add = (name = t('mfac.newName'), resources: string[] = [], goals: { text: string; marks: number }[] = []) =>
    dispatch('mausritter', 'addFaction', { adventure, name, resources, goals });
  const update = (f: Faction, changes: Partial<Pick<Faction, 'name' | 'resources'>>) => dispatch('mausritter', 'updateFaction', { adventure, id: f.id, changes });
  const updateGoal = (f: Faction, g: FactionGoal, changes: Partial<Omit<FactionGoal, 'id'>>) =>
    dispatch('mausritter', 'updateGoal', { adventure, id: f.id, goal: g.id, changes });
  const remove = (f: Faction) => confirm(t('mfac.removeConfirm', { name: f.name })) && dispatch('mausritter', 'removeFaction', { adventure, id: f.id });

  function onEnter(e: KeyboardEvent, fn: (v: string) => void) {
    const input = e.currentTarget as HTMLInputElement;
    if (e.key !== 'Enter' || !input.value.trim()) return;
    fn(input.value.trim());
    input.value = '';
  }
  const num = (v: string) => (isNaN(Number(v)) ? 0 : Number(v));
  const nameOf = (id: string) => data.factions.find((f) => f.id === id)?.name ?? '';
  const goalOf = (fid: string, gid: string) => data.factions.find((f) => f.id === fid)?.goals.find((g) => g.id === gid)?.text ?? '';
</script>

<div class="view">
  <header class="head">
    <h2>{t('mfac.title')}</h2>
    <div class="spacer"></div>
    <select
      title={t('mfac.exampleHint')}
      value=""
      onchange={(e) => {
        const ex = examples[Number(e.currentTarget.value)];
        if (ex) add(ex.name, ex.resources, ex.goals);
        e.currentTarget.value = '';
      }}
    >
      <option value="">{t('mfac.example')}</option>
      {#each examples as ex, i (i)}<option value={i}>{ex.name}</option>{/each}
    </select>
    <button class="btn" onclick={() => add()}><Plus size={14} /> {t('mfac.new')}</button>
    <button class="btn primary" title={t('mfac.betweenHint')} disabled={!data.factions.length} onclick={() => dispatch('mausritter', 'betweenSessions', { adventure })}>
      <Dices size={14} /> {t('mfac.between')}
    </button>
  </header>
  <p class="faint about">{t('mfac.about')}</p>

  {#if data.session.length}
    <section class="session">
      <h3>{t('mfac.session')}</h3>
      <ul>
        {#each data.session as r (r.faction)}
          <li>
            <b>{nameOf(r.faction)}</b> — {goalOf(r.faction, r.goal)}:
            {t('mfac.sessionLine', { roll: r.roll, total: r.total, gained: t(`mfac.gained.${r.gained}` as 'mfac.gained.0') })}
            {#if r.completed}<span class="tag">{t('mfac.completed')}</span>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#each data.factions as f (f.id)}
    {@const cur = currentGoal(f)}
    <section class="faction">
      <header>
        <input class="name" type="text" value={f.name} onchange={(e) => update(f, { name: e.currentTarget.value })} />
        <button class="icon-btn" title={t('mfac.remove')} onclick={() => remove(f)}><X size={14} /></button>
      </header>

      <h4>{t('mfac.resources')}</h4>
      <div class="chips">
        {#each f.resources as r, i (i)}
          <span class="chip">{r}<button class="off" title={t('mfac.remove')} onclick={() => update(f, { resources: f.resources.filter((_, k) => k !== i) })}><X size={10} /></button></span>
        {/each}
        <input class="add" type="text" placeholder={t('mfac.resourcePh')} onkeydown={(e) => onEnter(e, (v) => update(f, { resources: [...f.resources, v] }))} />
      </div>

      <h4>{t('mfac.goals')}</h4>
      {#each f.goals as g (g.id)}
        <div class="goal" class:current={cur?.id === g.id} class:done={g.progress >= g.marks}>
          <span class="marks">
            {#each { length: g.marks } as _, i (i)}
              <button class="mark" class:on={i < g.progress} onclick={() => updateGoal(f, g, { progress: i < g.progress ? i : i + 1 })}>{i < g.progress ? '●' : '○'}</button>
            {/each}
          </span>
          <input class="text" type="text" value={g.text} onchange={(e) => updateGoal(f, g, { text: e.currentTarget.value })} />
          {#if g.progress >= g.marks}<span class="tag">{t('mfac.done')}</span>{:else if cur?.id === g.id}<span class="tag cur">{t('mfac.current')}</span>{/if}
          <button class="icon-btn" title={t('mfac.remove')} onclick={() => dispatch('mausritter', 'removeGoal', { adventure, id: f.id, goal: g.id })}><X size={13} /></button>
          <div class="numbers">
            <label title={t('mfac.relevantHint')}>{t('mfac.relevant')} <input type="number" min="0" max="10" value={g.relevant} onchange={(e) => updateGoal(f, g, { relevant: num(e.currentTarget.value) })} /></label>
            <label title={t('mfac.rivalHint')}>{t('mfac.rival')} <input type="number" min="0" max="10" value={g.rival} onchange={(e) => updateGoal(f, g, { rival: num(e.currentTarget.value) })} /></label>
            <label>{t('mfac.marks')} <input type="number" min="1" max="10" value={g.marks} onchange={(e) => updateGoal(f, g, { marks: num(e.currentTarget.value) })} /></label>
          </div>
        </div>
      {/each}
      <input class="add goal-add" type="text" placeholder={t('mfac.goalPh')} onkeydown={(e) => onEnter(e, (text) => dispatch('mausritter', 'addGoal', { adventure, id: f.id, text, marks: 3 }))} />
    </section>
  {:else}
    <p class="faint placeholder">{t('mfac.none')}</p>
  {/each}
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
  .placeholder {
    font-style: italic;
  }
  .session,
  .faction {
    margin-bottom: 12px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .session ul {
    margin: 6px 0 0;
    padding-left: 18px;
    line-height: 1.6;
  }
  h3,
  h4 {
    margin: 0;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  h4 {
    margin: 10px 0 4px;
  }
  .faction header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .name {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--bg-active);
    font-size: 13px;
  }
  .off {
    padding: 0;
    border: 0;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .add {
    width: 220px;
    font-size: 13px;
  }
  .goal {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 4px 0;
    padding: 3px 6px;
    border-radius: var(--radius-s);
  }
  .goal.current {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .goal.done .text {
    color: var(--text-faint);
    text-decoration: line-through;
  }
  .marks {
    display: flex;
  }
  .mark {
    padding: 0 1px;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 16px;
    cursor: pointer;
  }
  .mark.on {
    color: var(--accent);
  }
  .goal .text {
    flex: 1;
    min-width: 180px;
  }
  .numbers {
    display: flex;
    gap: 14px;
    width: 100%;
    padding-left: 4px;
  }
  .goal label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .goal label input {
    width: 44px;
    padding: 1px 4px;
    font-size: 12px;
  }
  .goal-add {
    margin-top: 4px;
  }
  .tag {
    margin-left: 4px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--bg-active);
    font-size: 11px;
  }
  .tag.cur {
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
