<!-- Фильтр заклинаний в списке справочника (как на dnd.su): уровень, класс, школа, время накладывания, концентрация,
     ритуал. Внутри признака — любое из отмеченного, между признаками — всё сразу. Классы и школы — те, что есть
     среди заклинаний. -->
<script lang="ts">
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import { CASTING_KINDS, NO_SPELL_FILTER, spellFilterOn, type CastingKind, type FieldValue } from '../../../shared/compendium';
  import { ui } from './ui.svelte';

  let { spells }: { spells: Record<string, FieldValue>[] } = $props();

  const collator = new Intl.Collator('ru');
  const uniq = (xs: string[]) => [...new Map(xs.map((x) => [x.toLowerCase(), x])).values()].sort(collator.compare);
  const classes = $derived(uniq(spells.flatMap((f) => (Array.isArray(f['classes']) ? f['classes'] : typeof f['classes'] === 'string' ? f['classes'].split(',') : []).map((x) => String(x).trim()).filter(Boolean))));
  const schools = $derived(uniq(spells.map((f) => (typeof f['school'] === 'string' ? f['school'] : '')).filter(Boolean)));
  const f = $derived(ui.spells);
  const on = $derived(spellFilterOn(f));
  const count = $derived(f.levels.length + f.classes.length + f.schools.length + f.times.length + (f.concentration !== 'any' ? 1 : 0) + (f.ritual !== 'any' ? 1 : 0));

  function toggle<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }
  const cycle = (v: 'any' | 'yes' | 'no') => (v === 'any' ? 'yes' : v === 'yes' ? 'no' : 'any');
  const triTitle = { any: 'не важно', yes: 'да', no: 'нет' };
</script>

<div class="filters">
  <div class="head">
    <button class="toggle" onclick={() => (ui.spellsOpen = !ui.spellsOpen)}>
      {#if ui.spellsOpen}<ChevronDown size={13} />{:else}<ChevronRight size={13} />{/if}
      Фильтр{#if count}<span class="n">{count}</span>{/if}
    </button>
    <div class="spacer"></div>
    {#if on}<button class="reset" onclick={() => (ui.spells = structuredClone(NO_SPELL_FILTER))}>Сбросить</button>{/if}
  </div>
  <div class="chips">
    <button class:on={ui.byLevel} onclick={() => (ui.byLevel = true)}>По уровням</button>
    <button class:on={!ui.byLevel} onclick={() => (ui.byLevel = false)}>По алфавиту</button>
  </div>

  {#if ui.spellsOpen}
    <div class="group">
      <span class="label">Уровень</span>
      <div class="chips">
        {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as l (l)}
          <button class:on={f.levels.includes(l)} title={l === 0 ? 'Заговоры' : `${l} уровень`} onclick={() => (ui.spells.levels = toggle(f.levels, l))}>{l === 0 ? 'Загов.' : l}</button>
        {/each}
      </div>
    </div>
    <div class="group">
      <span class="label">Класс</span>
      <div class="chips">
        {#each classes as c (c)}<button class:on={f.classes.includes(c)} onclick={() => (ui.spells.classes = toggle(f.classes, c))}>{c}</button>{/each}
      </div>
    </div>
    <div class="group">
      <span class="label">Школа</span>
      <div class="chips">
        {#each schools as s (s)}<button class:on={f.schools.includes(s)} onclick={() => (ui.spells.schools = toggle(f.schools, s))}>{s}</button>{/each}
      </div>
    </div>
    <div class="group">
      <span class="label">Время</span>
      <div class="chips">
        {#each Object.entries(CASTING_KINDS) as [k, title] (k)}
          <button class:on={f.times.includes(k as CastingKind)} onclick={() => (ui.spells.times = toggle(f.times, k as CastingKind))}>{title}</button>
        {/each}
      </div>
    </div>
    <div class="group">
      <div class="chips">
        <button class:on={f.concentration !== 'any'} class:no={f.concentration === 'no'} title="Щелчок: да → нет → не важно" onclick={() => (ui.spells.concentration = cycle(f.concentration))}
          >Концентрация: {triTitle[f.concentration]}</button
        >
        <button class:on={f.ritual !== 'any'} class:no={f.ritual === 'no'} title="Щелчок: да → нет → не важно" onclick={() => (ui.spells.ritual = cycle(f.ritual))}
          >Ритуал: {triTitle[f.ritual]}</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  .filters {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    font-size: 12px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--text-normal);
    font-weight: 600;
    cursor: pointer;
  }
  .n {
    margin-left: 4px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
  }
  .spacer {
    flex: 1;
  }
  .reset {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .label {
    color: var(--text-faint);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .chips button {
    padding: 1px 7px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
  }
  .chips button:hover {
    color: var(--text-normal);
  }
  .chips button.on {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--text-normal);
  }
  .chips button.on.no {
    border-color: var(--danger, #e04545);
    background: color-mix(in srgb, var(--danger, #e04545) 14%, transparent);
  }
</style>
