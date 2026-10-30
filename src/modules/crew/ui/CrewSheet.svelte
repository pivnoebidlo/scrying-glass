<!-- Tools → Crew (Forged in the Dark adventures): the crew sheet of the adventure — who they are, tier and hold, rep
     and turf, heat and wanted level, coin, crew xp, the payoff of a score, entanglements, special abilities, upgrades,
     claims, cohorts and factions. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { Minus, Plus, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { peekEntry } from '../../../renderer/lib/entry/peek.svelte';
  import { atWar, blankCrew, coinCap, COHORT_HARM, CREW_XP, EXPOSURE, heatFor, MAX_HEAT, MAX_TIER, MAX_TURF, MAX_WANTED, repFor, REP_TRACK, roman, VAULTS, type Cohort, type Crew, type CrewFaction } from '../types';
  import Boxes from './Boxes.svelte';
  import Develop from './Develop.svelte';
  import Entangle from './Entangle.svelte';

  const adventure = $derived(store.state.adventures.current);
  const crew = $derived(store.state.crew.byAdventure[adventure ?? ''] ?? blankCrew());
  const update = (changes: Partial<Crew>) => dispatch('crew', 'update', { adventure, changes: $state.snapshot(changes) as Partial<Crew> });
  const cohort = (c: Cohort, changes: Partial<Omit<Cohort, 'id'>>) => dispatch('crew', 'updateCohort', { adventure, id: c.id, changes });
  const faction = (f: CrewFaction, changes: Partial<Omit<CrewFaction, 'id'>>) => dispatch('crew', 'updateFaction', { adventure, id: f.id, changes });
  const num = (v: string) => (isNaN(Number(v)) ? 0 : Number(v));
  const tiers = Array.from({ length: MAX_TIER + 1 }, (_, i) => i);

  // After the score: the form (not saved).
  const pay = $state({ target: 0, quiet: false, exposure: 2, profile: false, hostile: false, war: false, killing: false, coin: 4 });
  let touched = $state(false);
  $effect(() => {
    if (!touched) {
      pay.target = crew.tier;
      pay.war = atWar(crew);
    }
  });
  const payRep = $derived(pay.quiet ? 0 : repFor(crew.tier, pay.target));
  const payHeat = $derived(heatFor(pay));
  function applyPayoff() {
    dispatch('crew', 'payoff', { adventure, rep: payRep, coin: pay.coin, heat: payHeat });
    touched = false;
  }
  const rule = (name: string) => () => peekEntry(name);
</script>

<div class="view">
  <header class="head">
    <h2>{t('crew.title')}</h2>
  </header>
  <p class="faint about"><Lead text={t('crew.about')} /></p>

  <section class="who">
    <label><span>{t('crew.name')}</span><input type="text" value={crew.name} placeholder={t('crew.namePh')} onchange={(e) => update({ name: e.currentTarget.value })} /></label>
    <label><span>{t('crew.type')}</span><input type="text" value={crew.type} placeholder={t('crew.typePh')} onchange={(e) => update({ type: e.currentTarget.value })} /></label>
    <label><span>{t('crew.reputation')}</span><input type="text" value={crew.reputation} placeholder={t('crew.reputationPh')} onchange={(e) => update({ reputation: e.currentTarget.value })} /></label>
    <label><span>{t('crew.lair')}</span><input type="text" value={crew.lair} onchange={(e) => update({ lair: e.currentTarget.value })} /></label>
    <label><span>{t('crew.grounds')}</span><input type="text" value={crew.grounds} onchange={(e) => update({ grounds: e.currentTarget.value })} /></label>
    <label><span>{t('crew.contacts')}</span><input type="text" value={crew.contacts} onchange={(e) => update({ contacts: e.currentTarget.value })} /></label>
  </section>

  <section class="stats">
    <div class="line">
      <label title={t('crew.tier')}><span class="k">{t('crew.tier')}</span>
        <select value={crew.tier} onchange={(e) => update({ tier: num(e.currentTarget.value) })}>{#each tiers as n (n)}<option value={n}>{roman(n)}</option>{/each}</select>
      </label>
      <label title={t('crew.holdHint')}><span class="k">{t('crew.hold')}</span>
        <select value={crew.hold} onchange={(e) => update({ hold: e.currentTarget.value as Crew['hold'] })}>
          <option value="weak">{t('crew.hold.weak')}</option>
          <option value="strong">{t('crew.hold.strong')}</option>
        </select>
      </label>
      <label title={t('crew.turfHint')}><span class="k">{t('crew.turf')}</span>
        <input class="small-num" type="number" min="0" max={MAX_TURF} value={crew.turf} onchange={(e) => update({ turf: num(e.currentTarget.value) })} />
      </label>
    </div>
    <div class="line">
      <button class="k link" onclick={rule(t('crew.repEntry'))}>{t('crew.rep')}</button>
      <Boxes n={crew.rep} of={REP_TRACK} fixed={crew.turf} title={t('crew.repHint', { n: crew.rep, of: REP_TRACK - crew.turf })} set={(v) => update({ rep: v })} />
    </div>
    <Develop {crew} {adventure} />
    <div class="line">
      <button class="k link" onclick={rule(t('crew.heat'))}>{t('crew.heat')}</button>
      <Boxes n={crew.heat} of={MAX_HEAT} tone="danger" title={t('crew.heatHint', { n: crew.heat })} set={(v) => dispatch('crew', 'heat', { adventure, delta: v - crew.heat })} />
      <button class="k link" onclick={rule(t('crew.wanted'))}>{t('crew.wanted')}</button>
      <Boxes n={crew.wanted} of={MAX_WANTED} tone="danger" title={t('crew.wantedHint', { n: crew.wanted })} set={(v) => update({ wanted: v })} />
    </div>
    <div class="line" title={t('crew.coinHint', { cap: coinCap(crew) })}>
      <span class="k">{t('crew.coin')}</span>
      <button class="icon-btn" title={t('crew.minus')} disabled={!crew.coin} onclick={() => update({ coin: crew.coin - 1 })}><Minus size={13} /></button>
      <span class="n" class:warn={crew.coin > coinCap(crew)}>{crew.coin}</span>
      <button class="icon-btn" title={t('crew.plus')} onclick={() => update({ coin: crew.coin + 1 })}><Plus size={13} /></button>
      <label><span class="k">{t('crew.vault')}</span>
        <select value={crew.vault} onchange={(e) => update({ vault: num(e.currentTarget.value) })}>{#each VAULTS as _, i (i)}<option value={i}>{t(`crew.vault.${i}` as 'crew.vault.0')}</option>{/each}</select>
      </label>
    </div>
    {#if crew.coin > coinCap(crew)}<p class="warn small">{t('crew.overCap', { cap: coinCap(crew) })}</p>{/if}
    <div class="line">
      <span class="k">{t('crew.xp')}</span>
      <Boxes n={crew.xp} of={CREW_XP} title={t('crew.xpHint', { n: crew.xp, of: CREW_XP })} set={(v) => update({ xp: v })} />
      {#if crew.xp >= CREW_XP}
        <button class="btn primary" title={t('crew.advanceHint')} onclick={() => update({ xp: 0 })}>{t('crew.advance')}</button>
        <span class="faint small">{t('crew.advanceHint')}</span>
      {/if}
    </div>
    {#if atWar(crew)}<p class="warn small">{t('crew.atWar')}</p>{/if}
  </section>

  <section class="payoff">
    <h3>{t('crew.payoff')}</h3>
    <p class="faint small">{t('crew.payoffHint')}</p>
    <div class="line wrap">
      <label><span class="k">{t('crew.target')}</span>
        <select value={pay.target} onchange={(e) => ((pay.target = num(e.currentTarget.value)), (touched = true))}>{#each tiers as n (n)}<option value={n}>{roman(n)}</option>{/each}</select>
      </label>
      <label class="check"><input type="checkbox" bind:checked={pay.quiet} onchange={() => (touched = true)} /> {t('crew.quiet')}</label>
      <label><span class="k">{t('crew.loot')}</span><input class="small-num" type="number" min="0" bind:value={pay.coin} /></label>
    </div>
    <div class="line wrap">
      <label><span class="k">{t('crew.exposure')}</span>
        <select value={pay.exposure} onchange={(e) => ((pay.exposure = num(e.currentTarget.value)), (touched = true))}>{#each EXPOSURE as n (n)}<option value={n}>{t(`crew.exposure.${n}` as 'crew.exposure.0')}</option>{/each}</select>
      </label>
      <label class="check"><input type="checkbox" bind:checked={pay.profile} onchange={() => (touched = true)} /> {t('crew.profile')}</label>
      <label class="check"><input type="checkbox" bind:checked={pay.hostile} onchange={() => (touched = true)} /> {t('crew.hostile')}</label>
      <label class="check"><input type="checkbox" bind:checked={pay.war} onchange={() => (touched = true)} /> {t('crew.war')}</label>
      <label class="check"><input type="checkbox" bind:checked={pay.killing} onchange={() => (touched = true)} /> {t('crew.killing')}</label>
    </div>
    <div class="line">
      <button class="btn primary" onclick={applyPayoff}>{t('crew.apply', { rep: payRep, coin: Math.max(0, pay.coin), heat: payHeat })}</button>
    </div>
    <Entangle {crew} {adventure} />
  </section>

  <section>
    <h3>{t('crew.abilities')}</h3>
    {#each crew.abilities as a, i (i)}
      <div class="ability">
        <input class="aname" type="text" value={a.name} placeholder={t('crew.abilityPh')} onchange={(e) => update({ abilities: crew.abilities.map((x, k) => (k === i ? { ...x, name: e.currentTarget.value } : x)) })} />
        <input class="atext" type="text" value={a.text} placeholder={t('crew.abilityTextPh')} onchange={(e) => update({ abilities: crew.abilities.map((x, k) => (k === i ? { ...x, text: e.currentTarget.value } : x)) })} />
        <button class="icon-btn" title={t('crew.remove')} onclick={() => update({ abilities: crew.abilities.filter((_, k) => k !== i) })}><X size={13} /></button>
      </div>
    {/each}
    <button class="btn" onclick={() => update({ abilities: [...crew.abilities, { name: '', text: '' }] })}><Plus size={13} /> {t('crew.addAbility')}</button>
  </section>

  <section class="two">
    <label><h3>{t('crew.upgrades')}</h3><textarea rows="5" placeholder={t('crew.linesPh')} value={crew.upgrades.join('\n')} onchange={(e) => update({ upgrades: e.currentTarget.value.split('\n') })}></textarea></label>
    <label><h3>{t('crew.claims')}</h3><textarea rows="5" placeholder={t('crew.linesPh')} value={crew.claims.join('\n')} onchange={(e) => update({ claims: e.currentTarget.value.split('\n') })}></textarea></label>
  </section>

  <section>
    <div class="line">
      <h3>{t('crew.cohorts')}</h3>
      <div class="spacer"></div>
      <button class="btn" onclick={() => dispatch('crew', 'addCohort', { adventure, kind: 'gang' })}><Plus size={13} /> {t('crew.addGang')}</button>
      <button class="btn" onclick={() => dispatch('crew', 'addCohort', { adventure, kind: 'expert' })}><Plus size={13} /> {t('crew.addExpert')}</button>
    </div>
    {#each crew.cohorts as c (c.id)}
      <div class="cohort" class:dead={c.harm >= COHORT_HARM}>
        <div class="line">
          <span class="tag">{t(`crew.kind.${c.kind}`)}</span>
          <input type="text" value={c.name} placeholder={t('crew.cohortName')} onchange={(e) => cohort(c, { name: e.currentTarget.value })} />
          <input type="text" value={c.type} placeholder={t(`crew.cohortTypePh.${c.kind}`)} title={t('crew.cohortType')} onchange={(e) => cohort(c, { type: e.currentTarget.value })} />
          <span class="faint" title={t('crew.qualityHint')}>{t('crew.quality', { n: crew.tier + (c.kind === 'expert' ? 1 : 0) })}</span>
          <select value={c.harm} onchange={(e) => cohort(c, { harm: num(e.currentTarget.value) })}>
            {#each { length: COHORT_HARM + 1 } as _, h (h)}<option value={h}>{h ? `${h} — ` : ''}{t(`crew.harm.${h}` as 'crew.harm.0')}</option>{/each}
          </select>
          <button class="icon-btn" title={t('crew.remove')} onclick={() => confirm(t('crew.removeConfirm', { name: c.name || c.type || t(`crew.kind.${c.kind}`) })) && dispatch('crew', 'removeCohort', { adventure, id: c.id })}><X size={13} /></button>
        </div>
        <div class="line">
          <input type="text" value={c.edges} placeholder={t('crew.edges')} title={t('crew.edges')} onchange={(e) => cohort(c, { edges: e.currentTarget.value })} />
          <input type="text" value={c.flaws} placeholder={t('crew.flaws')} title={t('crew.flaws')} onchange={(e) => cohort(c, { flaws: e.currentTarget.value })} />
        </div>
      </div>
    {/each}
  </section>

  <section>
    <div class="line">
      <h3>{t('crew.factions')}</h3>
      <div class="spacer"></div>
      <button class="btn" onclick={() => dispatch('crew', 'addFaction', { adventure, name: t('crew.newFaction') })}><Plus size={13} /> {t('crew.addFaction')}</button>
    </div>
    {#each crew.factions as f (f.id)}
      <div class="line faction" class:war={f.status <= -3}>
        <input class="fname" type="text" value={f.name} onchange={(e) => faction(f, { name: e.currentTarget.value })} />
        <select title={t('crew.tier')} value={f.tier} onchange={(e) => faction(f, { tier: num(e.currentTarget.value) })}>{#each tiers as n (n)}<option value={n}>{roman(n)}</option>{/each}</select>
        <select title={t('crew.hold')} value={f.hold} onchange={(e) => faction(f, { hold: e.currentTarget.value as CrewFaction['hold'] })}>
          <option value="weak">{t('crew.hold.weak')}</option>
          <option value="strong">{t('crew.hold.strong')}</option>
        </select>
        <select title={t('crew.status')} value={f.status} onchange={(e) => faction(f, { status: num(e.currentTarget.value) })}>
          {#each [3, 2, 1, 0, -1, -2, -3] as n (n)}<option value={n}>{t(`crew.status.${n}` as 'crew.status.0')}</option>{/each}
        </select>
        <button class="icon-btn" title={t('crew.remove')} onclick={() => confirm(t('crew.removeConfirm', { name: f.name })) && dispatch('crew', 'removeFaction', { adventure, id: f.id })}><X size={13} /></button>
      </div>
    {/each}
  </section>
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .about {
    margin: 6px 0 12px;
  }
  section {
    margin-bottom: 12px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  h3 {
    margin: 0 0 6px;
    font-size: 14px;
  }
  .line h3 {
    margin: 0;
  }
  .who {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px 14px;
  }
  .who label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .stats,
  .payoff {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .line.wrap {
    flex-wrap: wrap;
  }
  .line + .line {
    margin-top: 4px;
  }
  .stats .line + .line,
  .payoff .line + .line {
    margin-top: 0;
  }
  .line label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .spacer {
    flex: 1;
  }
  .k {
    min-width: 64px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    text-align: left;
    text-decoration: underline dotted;
    cursor: pointer;
  }
  .n {
    min-width: 22px;
    font-weight: 700;
    text-align: center;
  }
  .small-num {
    width: 60px;
  }
  .warn {
    color: var(--warning);
  }
  .small {
    margin: 0;
    font-size: 11px;
  }
  .check {
    font-size: 13px;
  }
  .ability {
    display: flex;
    gap: 6px;
    margin-bottom: 6px;
  }
  .aname {
    width: 200px;
  }
  .atext {
    flex: 1;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .two textarea {
    width: 100%;
    resize: vertical;
  }
  .cohort {
    margin-top: 8px;
    padding: 8px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
  }
  .cohort input {
    flex: 1;
    min-width: 0;
  }
  .cohort.dead {
    opacity: 0.55;
  }
  .tag {
    padding: 1px 6px;
    border-radius: var(--radius-s);
    background: var(--bg-primary);
    font-size: 11px;
  }
  .faction {
    margin-top: 6px;
  }
  .fname {
    flex: 1;
  }
  .faction.war .fname {
    color: var(--danger);
  }
</style>
