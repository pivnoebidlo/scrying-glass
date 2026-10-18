<!-- «Инструменты» → «Покупка характеристик»: 27 очков, от 8 до 15 до бонусов (правила SRD). Бонусы — предыстории
     (2024), расы SRD (2014) или свои. «Проверить персонажа» берёт итоговые значения из листа и подбирает бонусы. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { ChevronDown, ChevronRight, Minus, Plus, RotateCcw, UserCheck } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { refKey } from '../../../shared/cards';
  import { visibleIn } from '../../../shared/adventures';
  import { isCharacter, totalLevel, type Dnd5eCharacter } from '../../../systems/dnd5e/character';
  import {
    ABILITY_TITLES, STANDARD_ARRAY, checkFinal, combine, costOf, isStandardArray, problemsOf, spent, zero,
    type Scores,
  } from '../../../systems/dnd5e/pointbuy';
  import { ABILITIES, mod, type Ability } from '../../../systems/dnd5e/stats';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { pb } from './state.svelte';
  import { allRaces, custom, loadRaces } from './races.svelte';
  import RaceEditor from './RaceEditor.svelte';

  onMount(() => {
    connectCards();
    loadRaces();
  });

  const races = $derived((custom.races, custom.subraces, allRaces()));
  const raceDef = $derived(pb.mode === 'race' ? races.find((r) => r.id === pb.race) : undefined);
  const subDef = $derived(raceDef?.subraces.find((s) => s.id === pb.sub));
  // Бонусы выбранной расы с подрасой.
  const race = $derived(raceDef ? combine(raceDef, subDef) : undefined);
  let editRaces = $state(false);

  // Раса выбрана — подраса: прежняя, если она у этой расы есть, иначе первая.
  function pickRace(id: string, sub: string | null = null) {
    pb.mode = 'race';
    pb.race = id;
    const r = races.find((x) => x.id === id);
    pb.sub = sub ?? (r?.subraces.some((s) => s.id === pb.sub) ? pb.sub : (r?.subraces[0]?.id ?? null));
    pb.bonus = zero();
    pb.checked = null;
  }
  // Бонус к характеристике: раса — её постоянный (+ выбранные «+1» полуэльфа), иначе — то, что выставлено вручную.
  const bonus = $derived.by<Scores>(() => {
    if (!race) return pb.bonus;
    const b = { ...zero(), ...race.fixed };
    if (race.choose?.count) for (const a of ABILITIES) b[a] += Math.min(1, pb.bonus[a]);
    return b;
  });
  const total = (a: Ability) => pb.base[a] + bonus[a] + pb.extra[a];
  const used = $derived(spent(pb.base));
  const left = $derived(pb.rules.budget - used);
  const problems = $derived(problemsOf(pb.base, pb.rules));
  // Правильно ли распределены бонусы для выбранного режима.
  const bonusNote = $derived.by(() => {
    const vals = ABILITIES.map((a) => bonus[a]).filter(Boolean).sort().join();
    if (pb.mode === '2024') return vals === '1,2' || vals === '1,1,1' ? '' : t('tools.pb.bg2024');
    if (race?.choose?.count) {
      const picked = ABILITIES.filter((a) => !race.choose!.except.includes(a) && pb.bonus[a] > 0).length;
      return picked === race.choose.count ? '' : t('tools.pb.chooseMore', { count: race.choose.count - picked });
    }
    return '';
  });

  function step(a: Ability, d: number) {
    const v = pb.base[a] + d;
    if (v < pb.rules.min || v > pb.rules.max) return;
    pb.base[a] = v;
    pb.checked = null;
  }

  function setBonus(a: Ability, v: number) {
    pb.bonus[a] = v;
    pb.checked = null;
  }

  function reset() {
    for (const a of ABILITIES) pb.base[a] = pb.rules.min;
    pb.bonus = zero();
    pb.extra = zero();
    pb.checked = null;
  }

  function standard() {
    ABILITIES.forEach((a, i) => (pb.base[a] = STANDARD_ARRAY[i]!));
    pb.checked = null;
  }

  // Персонажи игроков: приключения и общие (карточки с листом).
  const heroes = $derived(
    bestiary.all.filter((c) => c.kind === 'character' && (c.ref.scope !== 'vault' || c.folder === undefined || visibleIn(store.state.adventures, c.folder)))
  );
  let pickRef = $state('');

  async function check() {
    const card = heroes.find((c) => refKey(c.ref) === pickRef);
    if (!card) return;
    const full = await window.api.getCard($state.snapshot(card.ref));
    const sheet = full?.stats as Dnd5eCharacter | undefined;
    if (!sheet || !isCharacter(sheet)) return;
    const final = sheet.abilities;
    const level = totalLevel(sheet);
    let res;
    if (pb.mode === 'custom') {
      const base = { ...zero() };
      for (const a of ABILITIES) base[a] = final[a] - pb.extra[a] - pb.bonus[a];
      res = { bonus: pb.bonus, base, spent: spent(base), problems: problemsOf(base, pb.rules) };
    } else {
      res = checkFinal(final, pb.extra, pb.mode === '2024' || !race ? '2024' : race, pb.rules);
    }
    pb.base = res.base;
    if (!race || race.choose?.count) pb.bonus = race ? { ...zero(), ...Object.fromEntries(ABILITIES.map((a) => [a, res.bonus[a] - (race.fixed[a] ?? 0)])) } : res.bonus;
    const bonusText = ABILITIES.filter((a) => res.bonus[a]).map((a) => `+${res.bonus[a]} ${ABILITY_TITLES[a].toLowerCase()}`).join(', ');
    const extraNote = level > 1 && ABILITIES.every((a) => !pb.extra[a]) ? t('tools.pb.levelNote', { level }) : '';
    pb.checked = res.problems.length
      ? { name: card.name, level, ok: false, verdict: `${res.problems.map((p) => p.text).join('; ')}.${extraNote}` }
      : {
          name: card.name,
          level,
          ok: true,
          verdict: t('tools.pb.legal', { spent: res.spent, budget: pb.rules.budget, standard: isStandardArray(res.base) ? t('tools.pb.standard') : '', bonuses: bonusText ? t('tools.pb.bonuses', { list: bonusText }) : '' }),
        };
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('tools.pb.title')}</h2>
    <div class="spacer"></div>
    <span class="points" class:over={left < 0} class:exact={left === 0}>{t('tools.pb.spent', { used, budget: pb.rules.budget })}</span>
  </header>
  <p class="faint intro">
    {t('tools.pb.rules', { min: pb.rules.min, max: pb.rules.max, budget: pb.rules.budget })}
  </p>

  <div class="bar">
    <label>{t('tools.pb.bonusesLabel')}
      <select value={pb.mode} onchange={(e) => (e.currentTarget.value === 'race' ? pickRace(pb.race) : ((pb.mode = e.currentTarget.value as '2024' | 'custom'), (pb.bonus = zero()), (pb.checked = null)))}>
        <option value="2024">{t('tools.pb.mode2024')}</option>
        <option value="race">{t('tools.pb.modeRace')}</option>
        <option value="custom">{t('tools.pb.modeCustom')}</option>
      </select>
    </label>
    {#if pb.mode === 'race'}
      <select value={pb.race} title={t('tools.pb.race')} onchange={(e) => pickRace(e.currentTarget.value)}>
        <optgroup label="SRD">{#each races.filter((r) => !r.own) as r (r.id)}<option value={r.id}>{r.title}</option>{/each}</optgroup>
        {#if races.some((r) => r.own)}
          <optgroup label={t('tools.pb.own')}>{#each races.filter((r) => r.own) as r (r.id)}<option value={r.id}>{r.title}</option>{/each}</optgroup>
        {/if}
      </select>
      {#if raceDef?.subraces.length}
        <select value={pb.sub ?? ''} title={t('tools.pb.subrace')} onchange={(e) => pickRace(pb.race, e.currentTarget.value)}>
          {#each raceDef.subraces as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
        </select>
      {/if}
    {/if}
    <button class="btn" onclick={standard}>{t('tools.pb.standardArray')}</button>
    <button class="btn" onclick={reset}><RotateCcw size={14} /> {t('tools.pb.reset')}</button>
  </div>

  <table>
    <thead>
      <tr><th>{t('tools.pb.ability')}</th><th class="c">{t('tools.pb.base')}</th><th class="c">{t('tools.pb.cost')}</th><th class="c">{t('tools.pb.bonus')}</th><th class="c" title={t('tools.pb.otherHint')}>{t('tools.pb.other')}</th><th class="c">{t('tools.pb.total')}</th><th class="c">{t('tools.pb.mod')}</th></tr>
    </thead>
    <tbody>
      {#each ABILITIES as a (a)}
        {@const bad = problems.some((p) => p.ability === a)}
        <tr class:bad>
          <td>{ABILITY_TITLES[a]}</td>
          <td class="c base">
            <button class="icon-btn" disabled={pb.base[a] <= pb.rules.min} onclick={() => step(a, -1)}><Minus size={13} /></button>
            <span>{pb.base[a]}</span>
            <button class="icon-btn" disabled={pb.base[a] >= pb.rules.max} onclick={() => step(a, 1)}><Plus size={13} /></button>
          </td>
          <td class="c faint">{costOf(pb.base[a])}</td>
          <td class="c">
            {#if race && !race.choose?.count}
              {bonus[a] ? `+${bonus[a]}` : '—'}
            {:else if race?.choose?.count}
              {#if race.choose.except.includes(a)}+{bonus[a]}{:else}
                <select value={pb.bonus[a]} onchange={(e) => setBonus(a, Number(e.currentTarget.value))}><option value={0}>{(race.fixed[a] ?? 0) ? `+${race.fixed[a]}` : '—'}</option><option value={1}>+{(race.fixed[a] ?? 0) + 1}</option></select>
              {/if}
            {:else}
              <select value={pb.bonus[a]} onchange={(e) => setBonus(a, Number(e.currentTarget.value))}>
                {#each pb.mode === '2024' ? [0, 1, 2] : [-2, -1, 0, 1, 2, 3] as v (v)}<option value={v}>{v > 0 ? `+${v}` : v === 0 ? '—' : v}</option>{/each}
              </select>
            {/if}
          </td>
          <td class="c"><input type="number" min="0" max="10" value={pb.extra[a]} onchange={(e) => ((pb.extra[a] = Number(e.currentTarget.value) || 0), (pb.checked = null))} /></td>
          <td class="c total">{total(a)}</td>
          <td class="c">{mod(total(a)) >= 0 ? '+' : ''}{mod(total(a))}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if bonusNote}<p class="warn">{bonusNote}</p>{/if}
  {#each problems.filter((p) => !p.ability) as p (p.text)}<p class="warn">{p.text}.</p>{/each}
  {#if left > 0 && !problems.length}<p class="faint">{t('tools.pb.left', { count: left })}</p>{/if}

  <section class="own">
    <button class="toggle" onclick={() => (editRaces = !editRaces)}>
      {#if editRaces}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
      {t('tools.pb.customRaces')}{custom.races.length + custom.subraces.length ? ` (${custom.races.length + custom.subraces.length})` : ''}
    </button>
    {#if editRaces}<RaceEditor onpick={pickRace} />{/if}
  </section>

  <section class="check">
    <h3>{t('tools.pb.check')}</h3>
    <div class="bar">
      <select bind:value={pickRef}>
        <option value="">{t('tools.pb.pickHero')}</option>
        {#each heroes as h (refKey(h.ref))}<option value={refKey(h.ref)}>{h.name} — {h.subtitle}</option>{/each}
      </select>
      <button class="btn primary" disabled={!pickRef} onclick={check}><UserCheck size={14} /> {t('tools.pb.doCheck')}</button>
    </div>
    {#if !heroes.length}<p class="faint">{t('tools.pb.noHeroes')}</p>{/if}
    <p class="faint">
      {t('tools.pb.checkHint')}
    </p>
    {#if pb.checked}
      <p class="verdict" class:ok={pb.checked.ok}><b>{pb.checked.name}</b> ({t('tools.pb.lvl', { n: pb.checked.level })}): {pb.checked.verdict}</p>
    {/if}
  </section>
</div>

<style>
  .view {
    max-width: 760px;
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
  .spacer {
    flex: 1;
  }
  .points {
    padding: 3px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-weight: 600;
  }
  .points.exact {
    border-color: var(--success);
    color: var(--success);
  }
  .points.over {
    border-color: var(--danger);
    color: var(--danger);
  }
  .intro {
    margin: 8px 0 14px;
  }
  .bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .bar label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    padding: 4px 6px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 500;
    text-align: left;
    text-transform: uppercase;
  }
  td {
    padding: 4px 6px;
    border-top: 1px solid var(--border);
  }
  .c {
    text-align: center;
  }
  .base {
    white-space: nowrap;
  }
  .base span {
    display: inline-block;
    min-width: 26px;
    font-size: 16px;
    font-weight: 600;
  }
  td input {
    width: 52px;
    text-align: center;
  }
  .total {
    font-size: 16px;
    font-weight: 600;
  }
  tr.bad td {
    background: color-mix(in srgb, var(--danger) 12%, transparent);
  }
  .warn {
    margin: 8px 0 0;
    color: var(--warning);
  }
  .check {
    margin-top: 24px;
  }
  .own {
    margin-top: 20px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 10px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--text-normal);
    font-weight: 600;
    cursor: pointer;
  }
  .check select {
    min-width: 280px;
  }
  .verdict {
    padding: 10px 12px;
    border: 1px solid var(--danger);
    border-radius: var(--radius-m);
    background: color-mix(in srgb, var(--danger) 10%, transparent);
  }
  .verdict.ok {
    border-color: var(--success);
    background: color-mix(in srgb, var(--success) 10%, transparent);
  }
</style>
