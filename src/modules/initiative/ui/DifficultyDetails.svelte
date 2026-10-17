<!-- Подробности сложности боя: шкала бюджета, опыт противников, партия (и её настройка, если героев не нашлось
     или у кого-то нет листа). Общие для плашки в «Инициативе» и калькулятора в «Инструментах». -->
<script lang="ts">
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import type { Analysis } from '../difficulty';

  let { a, editable = true }: { a: Analysis; editable?: boolean } = $props();

  const party = $derived(store.state.initiative.party);
  const fmt = (n: number) => n.toLocaleString(locale.lang);
  const scale = $derived(Math.max(a.budget.high * 1.25, a.xp * 1.05, 1));
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  const from = (k: 'fight' | 'adventure' | 'settings') => t(`init.from.${k}`);
</script>

<div class="bar">
  <div class="fill {a.rating}" style:width={pct(a.xp)}></div>
  {#each [[t('init.low'), a.budget.low], [t('init.moderate'), a.budget.moderate], [t('init.high'), a.budget.high]] as [label, v] (label)}
    <div class="mark" style:left={pct(v as number)} title={t('init.xpMark', { label: label as string, n: fmt(v as number) })}></div>
  {/each}
</div>
<div class="legend faint">
  <span>{t('init.low')} {fmt(a.budget.low)}</span><span>{t('init.moderate')} {fmt(a.budget.moderate)}</span><span>{t('init.high')} {fmt(a.budget.high)}</span>
</div>

<p><b>{t('init.enemies')}</b> {t('init.enemiesXp', { n: fmt(a.xp) })}</p>
{#if a.unknown.length}
  <p class="warn">{t('init.unknownXp', { names: a.unknown.join(', ') })}</p>
{/if}

<p><b>{t('init.party')}</b> <span class="faint">({from(a.partyFrom)})</span>:
  {a.heroes.map((h, i) => `${h.name} ${h.level ?? a.levels[i]}${h.level === null ? '?' : ''}`).join(', ')}.
</p>
<div class="row">
  {#if editable && a.partyFrom === 'settings'}
    <label>{t('init.heroes')} <input type="number" min="1" max="10" value={party.size} onchange={(e) => dispatch('initiative', 'setParty', { size: Number(e.currentTarget.value) })} /></label>
  {/if}
  {#if editable && (a.partyFrom === 'settings' || a.heroes.some((h) => h.level === null))}
    <label title={t('init.levelHint')}>{t('init.level')} <input type="number" min="1" max="20" value={party.level} onchange={(e) => dispatch('initiative', 'setParty', { level: Number(e.currentTarget.value) })} /></label>
  {/if}
</div>
<p class="faint note">
  {t('init.difficultyNote')}
</p>

<style>
  p {
    margin: 8px 0 0;
  }
  .bar {
    position: relative;
    height: 10px;
    border-radius: 5px;
    background: var(--bg-active);
  }
  .fill {
    height: 100%;
    border-radius: 5px;
    background: var(--c);
  }
  .trivial {
    --c: #9aa0a8;
  }
  .low {
    --c: #4caf6a;
  }
  .moderate {
    --c: #e0b23a;
  }
  .high {
    --c: #e57a2e;
  }
  .beyond {
    --c: #e04545;
  }
  .mark {
    position: absolute;
    top: -3px;
    width: 2px;
    height: 16px;
    background: var(--text-muted);
  }
  .legend {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 11px;
  }
  .warn {
    color: #f0c45a;
  }
  .row {
    display: flex;
    gap: 12px;
    margin-top: 6px;
  }
  .row input {
    width: 52px;
    margin-left: 4px;
  }
  .note {
    font-size: 11px;
  }
</style>
