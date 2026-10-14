<!-- Вкладка «Инициатива»: таблица участников боя для мастера. -->
<script lang="ts">
  import { ChevronLeft, ChevronRight, Dices, Save, Eye, EyeOff, Heart, HeartOff, ScrollText, Square, Swords, Trash2, X } from '@lucide/svelte';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { defeated, ordered } from '../order';
  import { SIDES, type Combatant, type Side } from '../types';
  import { peekEntry } from '../../../renderer/lib/entry/peek.svelte';
  import AvatarPick from './AvatarPick.svelte';
  import QuickAdd from './QuickAdd.svelte';
  import StripControls from './StripControls.svelte';
  import EncounterView from './EncounterView.svelte';
  import Difficulty from './Difficulty.svelte';
  import { newEncounterName, ui } from './ui.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { isDnd, systemOf } from '../../../systems';
  import { trackerCells } from '../../../systems/ui';

  let { ms, app }: ModuleProps<'initiative'> = $props();

  // Открыта заготовка боя (выбрана в боковой панели) — показываем её редактор.
  const encounter = $derived(ui.encounter ? ms.encounters.find((e) => e.id === ui.encounter) : undefined);

  // Сохранить противников и союзников текущего боя как заготовку (партия не входит).
  function saveAsEncounter() {
    const id = crypto.randomUUID();
    dispatch('initiative', 'createEncounter', { id, name: newEncounterName(ms), adventure: app.adventures.current, fromFight: true });
    ui.encounter = id;
  }

  // Что показывать у участника, решает система приключения: хиты и КД или стресс и последствия.
  const system = $derived(currentSystem(app.adventures));
  const tracker = $derived(systemOf(system).tracker);
  const Cells = $derived(trackerCells(system));

  const list = $derived(ordered(ms.combatants));
  const running = $derived(ms.turn !== null);


  // Число из поля или null, если поле пустое.
  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));

  const update = (c: Combatant, changes: Partial<Omit<Combatant, 'id'>>) => dispatch('initiative', 'update', { id: c.id, changes });

  // Аспект (Fate) вводится текстом: Enter — добавить.
  function addAspect(c: Combatant, input: HTMLInputElement) {
    const v = input.value.trim();
    if (v && !c.conditions.includes(v)) dispatch('initiative', 'toggleCondition', { id: c.id, condition: v });
    input.value = '';
  }

  function clearEnemies() {
    if (confirm('Убрать всех противников и союзников? Партия останется, её инициатива и состояния сбросятся.')) {
      dispatch('initiative', 'clearEnemies');
    }
  }
</script>

{#if encounter}
  <EncounterView e={encounter} />
{:else}
<div class="view">
  <header class="head">
    <div class="round">
      {#if running}<span class="label faint">Раунд</span> <span class="n">{ms.round}</span>{:else}<span class="faint">Бой не начат</span>{/if}
    </div>
    {#if running}
      <button class="btn" title="Предыдущий ход" onclick={() => dispatch('initiative', 'prev')}><ChevronLeft size={14} /></button>
      <button class="btn primary" onclick={() => dispatch('initiative', 'next')}>Следующий ход <ChevronRight size={14} /></button>
      <button class="btn" onclick={() => dispatch('initiative', 'end')}><Square size={13} /> Закончить</button>
    {:else}
      <button class="btn primary" disabled={!list.length} onclick={() => dispatch('initiative', 'start')}><Swords size={14} /> Начать бой</button>
    {/if}
    <div class="spacer"></div>
    {#if isDnd(system)}<Difficulty list={ms.combatants} />{/if}
    <button class="btn" title={tracker.roll.title} onclick={() => dispatch('initiative', 'rollNpcs', { system })}>
      <Dices size={14} /> {tracker.roll.label}
    </button>
    <StripControls d={ms.display} />
    <label class="show" title="Полоса очерёдности на экране игроков">
      <input type="checkbox" checked={ms.showToPlayers} onchange={(e) => dispatch('initiative', 'setShowToPlayers', { value: e.currentTarget.checked })} />
      игрокам
    </label>
    <button class="icon-btn" title="Сохранить противников и союзников как заготовку боя" disabled={!ms.combatants.some((c) => c.side !== 'party')} onclick={saveAsEncounter}
      ><Save size={15} /></button
    >
    <button class="icon-btn" title="Убрать противников и союзников" onclick={clearEnemies}><Trash2 size={15} /></button>
  </header>

  {#if list.length}
    <table>
      <thead>
        <tr>
          <th class="c-init" title={tracker.init.title}>{tracker.init.label}</th>
          <th></th>
          <th>Имя</th>
          <Cells head />
          <th>{tracker.conditions.label}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each list as c (c.id)}
          <tr class:turn={ms.turn === c.id} class:down={defeated(c)} class:hidden-row={c.hidden}>
            <td class="c-init">
              <input type="text" inputmode="numeric" value={c.init ?? ''} placeholder="—" onchange={(e) => update(c, { init: num(e.currentTarget.value) })} />
            </td>
            <td><AvatarPick {c} /></td>
            <td class="c-name">
              <input class="name" type="text" value={c.name} onchange={(e) => update(c, { name: e.currentTarget.value.trim() || c.name })} />
              <span class="side faint">
                <!-- Сторону можно поменять прямо в бою: союзник, на которого напали, становится противником. -->
                <select class="side-select" value={c.side} title="Сторона" onchange={(e) => update(c, { side: e.currentTarget.value as Side })}>
                  {#each Object.entries(SIDES) as [v, t] (v)}<option value={v}>{t}</option>{/each}
                </select>{c.bonus ? ` · ${tracker.bonus.short} ${c.bonus > 0 ? '+' : ''}${c.bonus}` : ''}
              </span>
            </td>
            <Cells {c} />
            <td class="c-cond">
              {#each c.conditions as cond (cond)}
                {@const entry = tracker.conditions.entry}
                <span class="chip">
                  {#if entry}
                    <button class="cond" title="Что это значит — открыть в справочнике" onclick={() => peekEntry(entry(cond))}>{cond}</button>
                  {:else}
                    <span>{cond}</span>
                  {/if}
                  <button class="off" title="Снять" onclick={() => dispatch('initiative', 'toggleCondition', { id: c.id, condition: cond })}><X size={10} /></button>
                </span>
              {/each}
              {#if tracker.conditions.free}
                <input
                  class="add-aspect"
                  type="text"
                  placeholder="+ аспект"
                  title="Аспект на участнике («В огне», «Прижат к стене»): Enter — добавить"
                  onkeydown={(e) => e.key === 'Enter' && addAspect(c, e.currentTarget)}
                  onblur={(e) => addAspect(c, e.currentTarget)}
                />
              {:else}
                <select
                  class="add-cond"
                  value=""
                  title="Добавить состояние"
                  onchange={(e) => {
                    const v = e.currentTarget.value;
                    if (v) dispatch('initiative', 'toggleCondition', { id: c.id, condition: v });
                    e.currentTarget.value = '';
                  }}
                >
                  <option value="">+</option>
                  {#each tracker.conditions.list.filter((x) => !c.conditions.includes(x)) as cond (cond)}<option value={cond}>{cond}</option>{/each}
                </select>
              {/if}
            </td>
            <td class="c-act">
              {#if c.card}
                {@const ref = c.card}
                <button class="icon-btn" title="Статблок" onclick={() => bestiary.show(ref)}><ScrollText size={14} /></button>
              {/if}
              {#if ms.display.wounds}
                <button
                  class="icon-btn"
                  class:off={c.hideWounds}
                  title={c.hideWounds ? 'Игроки не видят его ранения — показывать' : 'Не показывать игрокам его ранения (портрет не краснеет)'}
                  onclick={() => update(c, { hideWounds: !c.hideWounds })}
                >
                  {#if c.hideWounds}<HeartOff size={14} />{:else}<Heart size={14} />{/if}
                </button>
              {/if}
              <button class="icon-btn" title={c.hidden ? 'Спрятан от игроков — показать' : 'Спрятать от игроков'} onclick={() => update(c, { hidden: !c.hidden })}>
                {#if c.hidden}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
              </button>
              <button class="icon-btn" title="Убрать из боя" onclick={() => dispatch('initiative', 'remove', { id: c.id })}><X size={14} /></button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="faint empty">
      Участников пока нет. Начните вводить имя ниже — появятся подходящие карточки; «Партия» добавит героев приключения. Заранее подготовленный бой — в боковой панели.
    </p>
  {/if}

  <QuickAdd />
</div>
{/if}

<style>
  .view {
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .round {
    min-width: 110px;
    font-size: 16px;
  }
  .round .n {
    font-size: 20px;
    font-weight: 600;
  }
  .spacer {
    flex: 1;
  }
  .show {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  table :global(th) {
    padding: 4px 6px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 500;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  table :global(td) {
    padding: 4px 6px;
    border-top: 1px solid var(--border);
    vertical-align: middle;
  }
  tr.turn :global(td) {
    background: var(--accent-soft);
  }
  tr.turn :global(td:first-child) {
    box-shadow: inset 3px 0 0 var(--accent);
  }
  tr.down {
    opacity: 0.45;
  }
  tr.hidden-row .name {
    font-style: italic;
  }
  table :global(td input[type='text']) {
    width: 100%;
    padding: 3px 5px;
    border-color: transparent;
    background: none;
  }
  table :global(td input[type='text']:hover) {
    border-color: var(--border);
  }
  .c-init {
    width: 56px;
  }
  .c-init input {
    font-size: 15px;
    font-weight: 600;
    text-align: center;
  }
  .c-name {
    min-width: 140px;
  }
  .side {
    display: block;
    padding-left: 6px;
    font-size: 11px;
  }
  .side-select {
    padding: 0 2px;
    border-color: transparent;
    background: none;
    color: var(--text-faint);
    font-size: 11px;
    cursor: pointer;
  }
  .side-select:hover {
    border-color: var(--border);
    color: var(--text-normal);
  }
  .c-cond {
    max-width: 260px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin: 1px 2px;
    padding: 1px 6px;
    border: 0;
    border-radius: 999px;
    background: var(--bg-active);
    font-size: 11px;
  }
  .chip button {
    display: inline-flex;
    align-items: center;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .chip .cond:hover {
    color: var(--accent);
    text-decoration: underline dotted;
  }
  .chip .off {
    color: var(--text-faint);
  }
  .chip .off:hover {
    color: var(--text-normal);
  }
  .add-aspect {
    width: 90px !important;
    font-size: 12px;
  }
  .add-cond {
    width: 36px;
    padding: 1px 4px;
    font-size: 12px;
  }
  .c-act {
    width: 92px;
    text-align: right;
    white-space: nowrap;
  }
  .empty {
    padding: 24px 0;
  }
  /* Ранения этого участника игроки не видят. */
  .off {
    color: var(--accent);
  }
</style>
