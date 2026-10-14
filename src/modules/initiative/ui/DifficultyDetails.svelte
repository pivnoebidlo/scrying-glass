<!-- Подробности сложности боя: шкала бюджета, опыт противников, партия (и её настройка, если героев не нашлось
     или у кого-то нет листа). Общие для плашки в «Инициативе» и калькулятора в «Инструментах». -->
<script lang="ts">
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import type { Analysis } from '../difficulty';

  let { a, editable = true }: { a: Analysis; editable?: boolean } = $props();

  const party = $derived(store.state.initiative.party);
  const fmt = (n: number) => n.toLocaleString('ru');
  const scale = $derived(Math.max(a.budget.high * 1.25, a.xp * 1.05, 1));
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  const FROM = { fight: 'герои в бою', adventure: 'персонажи игроков приключения', settings: 'героев нет — партия из настройки ниже' };
</script>

<div class="bar">
  <div class="fill {a.rating}" style:width={pct(a.xp)}></div>
  {#each [['низкая', a.budget.low], ['умеренная', a.budget.moderate], ['высокая', a.budget.high]] as [t, v] (t)}
    <div class="mark" style:left={pct(v as number)} title="{t}: {fmt(v as number)} ОО"></div>
  {/each}
</div>
<div class="legend faint">
  <span>низкая {fmt(a.budget.low)}</span><span>умеренная {fmt(a.budget.moderate)}</span><span>высокая {fmt(a.budget.high)}</span>
</div>

<p><b>Противники:</b> {fmt(a.xp)} ОО.</p>
{#if a.unknown.length}
  <p class="warn">Без карточки, опыт не учтён: {a.unknown.join(', ')}.</p>
{/if}

<p><b>Партия</b> <span class="faint">({FROM[a.partyFrom]})</span>:
  {a.heroes.map((h, i) => `${h.name} ${h.level ?? a.levels[i]}${h.level === null ? '?' : ''}`).join(', ')}.
</p>
<div class="row">
  {#if editable && a.partyFrom === 'settings'}
    <label>Героев <input type="number" min="1" max="10" value={party.size} onchange={(e) => dispatch('initiative', 'setParty', { size: Number(e.currentTarget.value) })} /></label>
  {/if}
  {#if editable && (a.partyFrom === 'settings' || a.heroes.some((h) => h.level === null))}
    <label title="Уровень героев, у которых нет листа персонажа">Уровень <input type="number" min="1" max="20" value={party.level} onchange={(e) => dispatch('initiative', 'setParty', { level: Number(e.currentTarget.value) })} /></label>
  {/if}
</div>
<p class="faint note">
  Правила 2024 года (SRD 5.2): бюджет опыта на каждого героя по уровню, опыт противников складывается без
  множителей. Союзники и нейтральные не учитываются. Это ориентир, а не приговор.
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
