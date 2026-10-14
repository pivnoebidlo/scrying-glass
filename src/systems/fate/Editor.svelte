<!-- Редактор карточки Fate Core. Стресс и последствия по умолчанию считаются по правилам (из Телосложения, Воли и
     важности NPC); их можно задать вручную. -->
<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import { consequencesOf, DEFAULT_SKILLS, stepTitle, stressOf, TIERS, type FateStats, type FateTier } from './stats';
  import { CONSEQUENCE_SHIFTS, CONSEQUENCE_TITLES, trackTitle } from './tracker';
  import { LADDER } from './ladder';

  let { stats = $bindable() }: { stats: FateStats; system: string } = $props();

  const RATINGS = Object.keys(LADDER).map(Number).sort((a, b) => b - a);
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? null : n;
  };

  // Навыки, которых на карточке ещё нет, — для подсказки.
  const missing = $derived([...DEFAULT_SKILLS['ru']!, ...DEFAULT_SKILLS['en']!].filter((n) => !stats.skills.some((x) => x.name === n)));

  function addSkill() {
    stats.skills.push({ name: '', rating: 1 });
  }

  // Стресс и последствия: по правилам или вручную (тогда — копия текущих значений).
  const manual = $derived(!!stats.stress || !!stats.consequences);
  function setManual(on: boolean) {
    if (on) {
      stats.stress = stressOf(stats).map((t) => ({ ...t }));
      stats.consequences = [...consequencesOf(stats)];
    } else {
      delete stats.stress;
      delete stats.consequences;
    }
  }
  function setBoxes(id: string, v: string) {
    const n = Math.max(0, Math.min(10, num(v) ?? 0));
    const list = stats.stress ?? [];
    stats.stress = list.some((t) => t.id === id) ? list.map((t) => (t.id === id ? { ...t, boxes: n } : t)) : [...list, { id, boxes: n }];
  }
  function setConsequences(v: string) {
    stats.consequences = CONSEQUENCE_SHIFTS.slice(0, Math.max(0, Math.min(CONSEQUENCE_SHIFTS.length, num(v) ?? 0)));
  }
</script>

<datalist id="fate-skills">
  {#each missing as n (n)}<option value={n}></option>{/each}
</datalist>

<section>
  <div class="grid">
    <label class="field">
      <span>Важность</span>
      <select value={stats.tier} onchange={(e) => (stats.tier = e.currentTarget.value as FateTier)} title="Для NPC: от неё зависят стресс и последствия по правилам">
        {#each Object.entries(TIERS) as [k, t] (k)}<option value={k}>{t}</option>{/each}
      </select>
    </label>
    <label class="field">
      <span>Восстановление</span>
      <input type="number" min="0" placeholder="—" value={stats.refresh ?? ''} onchange={(e) => (stats.refresh = num(e.currentTarget.value))} />
    </label>
    <label class="field">
      <span>Навык очерёдности</span>
      <input type="text" list="fate-skills" placeholder="Внимательность" bind:value={stats.initiativeSkill} />
    </label>
  </div>
</section>

<section>
  <h4>Аспекты</h4>
  <div class="rows">
    <label class="row"><span class="lbl">Концепция</span><input type="text" placeholder="Рыцарь-изгнанник с проклятым мечом" bind:value={stats.highConcept} /></label>
    <label class="row"><span class="lbl">Проблема</span><input type="text" placeholder="Долг чести перед Королевой воронов" bind:value={stats.trouble} /></label>
    {#each stats.aspects as _, i (i)}
      <div class="row">
        <span class="lbl">Аспект</span>
        <span class="pair">
          <input type="text" bind:value={stats.aspects[i]} />
          <button type="button" class="icon-btn" title="Убрать" onclick={() => stats.aspects.splice(i, 1)}><X size={14} /></button>
        </span>
      </div>
    {/each}
  </div>
  <button type="button" class="btn add" onclick={() => stats.aspects.push('')}><Plus size={14} /> Аспект</button>
</section>

<section>
  <h4>Навыки</h4>
  <div class="skills">
    {#each stats.skills as x, i (i)}
      <div class="skill">
        <input type="text" list="fate-skills" placeholder="Навык" bind:value={x.name} />
        <select value={x.rating} onchange={(e) => (x.rating = Number(e.currentTarget.value))}>
          {#each RATINGS as r (r)}<option value={r}>{stepTitle(r)}</option>{/each}
        </select>
        <button type="button" class="icon-btn" title="Убрать" onclick={() => stats.skills.splice(i, 1)}><X size={14} /></button>
      </div>
    {/each}
  </div>
  <button type="button" class="btn add" onclick={addSkill}><Plus size={14} /> Навык</button>
</section>

<section>
  <h4>Трюки</h4>
  {#each stats.stunts as t, i (i)}
    <div class="stunt">
      <span class="pair">
        <input type="text" placeholder="Название трюка" bind:value={t.name} />
        <button type="button" class="icon-btn" title="Убрать" onclick={() => stats.stunts.splice(i, 1)}><X size={14} /></button>
      </span>
      <textarea rows="2" placeholder="Что даёт: +2 к Атлетике, когда…" bind:value={t.text}></textarea>
    </div>
  {/each}
  <button type="button" class="btn add" onclick={() => stats.stunts.push({ name: '', text: '' })}><Plus size={14} /> Трюк</button>
</section>

<section>
  <h4>Стресс и последствия</h4>
  <label class="check">
    <input type="checkbox" checked={!manual} onchange={(e) => setManual(!e.currentTarget.checked)} />
    по правилам — из Телосложения и Воли, у NPC — по важности
  </label>
  <div class="grid">
    {#each stressOf(stats) as t (t.id)}
      <label class="field">
        <span>{trackTitle(t.id)}, клеток</span>
        <input type="number" min="0" max="10" value={t.boxes} disabled={!manual} onchange={(e) => setBoxes(t.id, e.currentTarget.value)} />
      </label>
    {/each}
    {#if manual && !stressOf(stats).some((t) => t.id === 'mental')}
      <button type="button" class="btn" onclick={() => setBoxes('mental', '2')}><Plus size={14} /> Ментальный</button>
    {/if}
    <label class="field wide">
      <span>Последствия</span>
      <select value={consequencesOf(stats).length} disabled={!manual} onchange={(e) => setConsequences(e.currentTarget.value)}>
        {#each { length: CONSEQUENCE_SHIFTS.length + 1 } as _, n (n)}
          <option value={n}>{n ? CONSEQUENCE_SHIFTS.slice(0, n).map((x) => `${(CONSEQUENCE_TITLES[x] ?? '').toLowerCase()} ${x}`).join(', ') : 'нет'}</option>
        {/each}
      </select>
    </label>
  </div>
</section>

<style>
  section {
    margin-bottom: 18px;
  }
  h4 {
    margin: 0 0 8px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 8px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 160px;
  }
  .field.wide {
    flex: 1;
    min-width: 220px;
  }
  .field > span:first-child,
  .lbl {
    color: var(--text-faint);
    font-size: 11px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 100px 1fr;
    align-items: center;
    gap: 8px;
  }
  .pair {
    display: flex;
    gap: 4px;
  }
  .pair > input {
    flex: 1;
    min-width: 0;
  }
  .add {
    margin-top: 8px;
  }
  .skills {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 6px;
  }
  .skill {
    display: flex;
    gap: 4px;
  }
  .skill input {
    flex: 1;
    min-width: 0;
  }
  .skill select {
    width: 150px;
  }
  .stunt {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }
  textarea {
    width: 100%;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    color: var(--text-muted);
  }
</style>
