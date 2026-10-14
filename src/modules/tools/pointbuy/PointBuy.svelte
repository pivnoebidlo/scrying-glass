<!-- «Инструменты» → «Покупка характеристик»: 27 очков, от 8 до 15 до бонусов (правила SRD). Бонусы — предыстории
     (2024), расы SRD (2014) или свои. «Проверить персонажа» берёт итоговые значения из листа и подбирает бонусы. -->
<script lang="ts">
  import { Minus, Plus, RotateCcw, UserCheck } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { refKey } from '../../../shared/cards';
  import { visibleIn } from '../../../shared/adventures';
  import { isCharacter, totalLevel, type Dnd5eCharacter } from '../../../systems/dnd5e/character';
  import {
    ABILITY_TITLES, RACES_2014, STANDARD_ARRAY, checkFinal, costOf, isStandardArray, problemsOf, spent, zero,
    type Scores,
  } from '../../../systems/dnd5e/pointbuy';
  import { ABILITIES, mod, type Ability } from '../../../systems/dnd5e/stats';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { pb } from './state.svelte';

  onMount(connectCards);

  const race = $derived(RACES_2014[pb.mode]);
  // Бонус к характеристике: раса — её постоянный (+ выбранные «+1» полуэльфа), иначе — то, что выставлено вручную.
  const bonus = $derived.by<Scores>(() => {
    if (!race) return pb.bonus;
    const b = { ...zero(), ...race.fixed };
    if (race.choose) for (const a of ABILITIES) b[a] += Math.min(1, pb.bonus[a]);
    return b;
  });
  const total = (a: Ability) => pb.base[a] + bonus[a] + pb.extra[a];
  const used = $derived(spent(pb.base));
  const left = $derived(pb.rules.budget - used);
  const problems = $derived(problemsOf(pb.base, pb.rules));
  // Правильно ли распределены бонусы для выбранного режима.
  const bonusNote = $derived.by(() => {
    const vals = ABILITIES.map((a) => bonus[a]).filter(Boolean).sort().join();
    if (pb.mode === '2024') return vals === '1,2' || vals === '1,1,1' ? '' : 'Предыстория даёт +2 и +1 к разным характеристикам или +1 к трём.';
    if (race?.choose) {
      const picked = ABILITIES.filter((a) => !race.choose!.except.includes(a) && pb.bonus[a] > 0).length;
      return picked === race.choose.count ? '' : `Выберите ещё +1 к ${race.choose.count - picked} характеристик${race.choose.count - picked === 1 ? 'е' : 'ам'}.`;
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
      res = checkFinal(final, pb.extra, pb.mode === '2024' ? '2024' : { race: pb.mode }, pb.rules);
    }
    pb.base = res.base;
    if (!race || race.choose) pb.bonus = race ? { ...zero(), ...Object.fromEntries(ABILITIES.map((a) => [a, res.bonus[a] - (race.fixed[a] ?? 0)])) } : res.bonus;
    const bonusText = ABILITIES.filter((a) => res.bonus[a]).map((a) => `+${res.bonus[a]} ${ABILITY_TITLES[a].toLowerCase()}`).join(', ');
    const extraNote = level > 1 && ABILITIES.every((a) => !pb.extra[a]) ? ` Персонаж ${level} уровня: увеличения характеристик с уровнями и черт впишите в «Прочее».` : '';
    pb.checked = res.problems.length
      ? { name: card.name, level, ok: false, verdict: `${res.problems.map((p) => p.text).join('; ')}.${extraNote}` }
      : {
          name: card.name,
          level,
          ok: true,
          verdict: `законно: ${res.spent} из ${pb.rules.budget} очков${isStandardArray(res.base) ? ' (стандартный набор)' : ''}${bonusText ? `, бонусы ${bonusText}` : ''}.`,
        };
  }
</script>

<div class="view">
  <header class="head">
    <h2>Покупка характеристик</h2>
    <div class="spacer"></div>
    <span class="points" class:over={left < 0} class:exact={left === 0}>Потрачено {used} / {pb.rules.budget}</span>
  </header>
  <p class="faint intro">
    Каждая характеристика от {pb.rules.min} до {pb.rules.max} до бонусов, {pb.rules.budget} очков: 8–13 стоят по очку за ступень,
    14 и 15 — по два. Бонусы — от предыстории (правила 2024 года) или от расы (2014).
  </p>

  <div class="bar">
    <label>Бонусы
      <select bind:value={pb.mode} onchange={() => ((pb.bonus = zero()), (pb.checked = null))}>
        <option value="2024">Предыстория (2024): +2/+1 или +1/+1/+1</option>
        <optgroup label="Раса (2014, SRD)">
          {#each Object.entries(RACES_2014) as [id, r] (id)}<option value={id}>{r.title}</option>{/each}
        </optgroup>
        <option value="custom">Свои бонусы</option>
      </select>
    </label>
    <button class="btn" onclick={standard}>Стандартный набор</button>
    <button class="btn" onclick={reset}><RotateCcw size={14} /> Сбросить</button>
  </div>

  <table>
    <thead>
      <tr><th>Характеристика</th><th class="c">База</th><th class="c">Цена</th><th class="c">Бонус</th><th class="c" title="Увеличения с уровнями, черты и прочее">Прочее</th><th class="c">Итог</th><th class="c">Мод.</th></tr>
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
            {#if race && !race.choose}
              {bonus[a] ? `+${bonus[a]}` : '—'}
            {:else if race?.choose}
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
  {#if left > 0 && !problems.length}<p class="faint">Осталось очков: {left}.</p>{/if}

  <section class="check">
    <h3>Проверить персонажа</h3>
    <div class="bar">
      <select bind:value={pickRef}>
        <option value="">Выберите персонажа игрока…</option>
        {#each heroes as h (refKey(h.ref))}<option value={refKey(h.ref)}>{h.name} — {h.subtitle}</option>{/each}
      </select>
      <button class="btn primary" disabled={!pickRef} onclick={check}><UserCheck size={14} /> Проверить</button>
    </div>
    {#if !heroes.length}<p class="faint">Персонажей игроков пока нет: их листы — в «Карточках» (папки партии, импорт из Long Story Short).</p>{/if}
    <p class="faint">
      Итоговые значения берутся из листа, бонусы подбираются сами для выбранного вида бонусов. У персонажа выше 1 уровня
      сначала впишите в «Прочее» увеличения характеристик и черты.
    </p>
    {#if pb.checked}
      <p class="verdict" class:ok={pb.checked.ok}><b>{pb.checked.name}</b> ({pb.checked.level} ур.): {pb.checked.verdict}</p>
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
    border-color: #4caf6a;
    color: #4caf6a;
  }
  .points.over {
    border-color: #e04545;
    color: #e04545;
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
    background: color-mix(in srgb, #e04545 12%, transparent);
  }
  .warn {
    margin: 8px 0 0;
    color: #f0c45a;
  }
  .check {
    margin-top: 24px;
  }
  .check select {
    min-width: 280px;
  }
  .verdict {
    padding: 10px 12px;
    border: 1px solid #e04545;
    border-radius: var(--radius-m);
    background: color-mix(in srgb, #e04545 10%, transparent);
  }
  .verdict.ok {
    border-color: #4caf6a;
    background: color-mix(in srgb, #4caf6a 10%, transparent);
  }
</style>
