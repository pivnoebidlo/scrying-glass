<!-- Заготовка боя: участники, подготовленные заранее. «В бой» добавляет их к текущему бою (партия, которая уже
     там, остаётся), заготовка при этом сохраняется — бой можно повторить. -->
<script lang="ts">
  import { Eye, EyeOff, Heart, HeartOff, ScrollText, Swords, Trash2, X } from '@lucide/svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { SIDES, type Combatant, type Encounter, type Side } from '../types';
  import AvatarPick from './AvatarPick.svelte';
  import QuickAdd from './QuickAdd.svelte';
  import Difficulty from './Difficulty.svelte';
  import { ui } from './ui.svelte';

  let { e }: { e: Encounter } = $props();

  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));
  const update = (c: Combatant, changes: Partial<Omit<Combatant, 'id'>>) => dispatch('initiative', 'update', { id: c.id, changes, encounter: e.id });

  const adventures = $derived(store.state.adventures.list);

  async function start() {
    await dispatch('initiative', 'startEncounter', { id: e.id });
    ui.encounter = null;
  }

  function remove() {
    if (confirm(`Удалить заготовку «${e.name}»?`)) {
      ui.encounter = null;
      dispatch('initiative', 'deleteEncounter', { id: e.id });
    }
  }
</script>

<div class="view">
  <header class="head">
    <input class="title" type="text" value={e.name} title="Название заготовки" onchange={(ev) => dispatch('initiative', 'renameEncounter', { id: e.id, name: ev.currentTarget.value })} />
    {#if adventures.length}
      <select
        title="К какому приключению относится (заготовки видны в своём приключении)"
        value={e.adventure ?? ''}
        onchange={(ev) => dispatch('initiative', 'setEncounterAdventure', { id: e.id, adventure: ev.currentTarget.value || null })}
      >
        <option value="">Общая</option>
        {#each adventures as a (a)}<option value={a}>{a}</option>{/each}
      </select>
    {/if}
    <div class="spacer"></div>
    <Difficulty list={e.combatants} />
    <button class="btn primary" disabled={!e.combatants.length} title="Добавить участников к текущему бою" onclick={start}><Swords size={14} /> В бой</button>
    <button class="icon-btn" title="Удалить заготовку" onclick={remove}><Trash2 size={15} /></button>
  </header>

  {#if e.combatants.length}
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Имя</th>
          <th class="c-num" title="Бонус инициативы">Бонус</th>
          <th class="c-num">Хиты</th>
          <th class="c-num" title="Класс доспеха">КД</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each e.combatants as c (c.id)}
          <tr class:hidden-row={c.hidden}>
            <td><AvatarPick {c} encounter={e.id} /></td>
            <td class="c-name">
              <input class="name" type="text" value={c.name} onchange={(ev) => update(c, { name: ev.currentTarget.value.trim() || c.name })} />
              <select class="side-select faint" value={c.side} title="Сторона" onchange={(ev) => update(c, { side: ev.currentTarget.value as Side })}>
                {#each Object.entries(SIDES) as [v, t] (v)}<option value={v}>{t}</option>{/each}
              </select>
            </td>
            <td class="c-num">
              <input type="text" inputmode="numeric" value={c.bonus} onchange={(ev) => update(c, { bonus: num(ev.currentTarget.value) ?? 0 })} />
            </td>
            <td class="c-num">
              <input type="text" inputmode="numeric" value={c.maxHp ?? ''} placeholder="—" onchange={(ev) => update(c, { maxHp: num(ev.currentTarget.value) })} />
            </td>
            <td class="c-num">
              <input type="text" inputmode="numeric" value={c.ac ?? ''} placeholder="—" onchange={(ev) => update(c, { ac: num(ev.currentTarget.value) })} />
            </td>
            <td class="c-act">
              {#if c.card}
                {@const ref = c.card}
                <button class="icon-btn" title="Статблок" onclick={() => bestiary.show(ref)}><ScrollText size={14} /></button>
              {/if}
              <button
                class="icon-btn"
                class:off={c.hideWounds}
                title={c.hideWounds ? 'Игроки не будут видеть его ранения — показывать' : 'Не показывать игрокам его ранения (портрет не краснеет)'}
                onclick={() => update(c, { hideWounds: !c.hideWounds })}
              >
                {#if c.hideWounds}<HeartOff size={14} />{:else}<Heart size={14} />{/if}
              </button>
              <button class="icon-btn" title={c.hidden ? 'Появится спрятанным от игроков — показать' : 'Спрятать от игроков (засада)'} onclick={() => update(c, { hidden: !c.hidden })}>
                {#if c.hidden}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
              </button>
              <button class="icon-btn" title="Убрать из заготовки" onclick={() => dispatch('initiative', 'remove', { id: c.id, encounter: e.id })}><X size={14} /></button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="faint empty">Заготовка пуста. Начните вводить имя ниже — появятся подходящие карточки.</p>
  {/if}

  <QuickAdd encounter={e.id} />
</div>

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
  .title {
    min-width: 200px;
    padding: 3px 6px;
    border-color: transparent;
    background: none;
    font-size: 18px;
    font-weight: 600;
  }
  .title:hover,
  .title:focus {
    border-color: var(--border);
  }
  .spacer {
    flex: 1;
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
    letter-spacing: 0.04em;
  }
  td {
    padding: 4px 6px;
    border-top: 1px solid var(--border);
    vertical-align: middle;
  }
  td input[type='text'] {
    width: 100%;
    padding: 3px 5px;
    border-color: transparent;
    background: none;
  }
  td input[type='text']:hover {
    border-color: var(--border);
  }
  .c-name {
    width: 45%;
  }
  .name {
    font-weight: 500;
  }
  .side-select {
    padding: 0 4px;
    border: 0;
    background: none;
    font-size: 12px;
  }
  .c-num {
    width: 72px;
  }
  .c-act {
    white-space: nowrap;
    text-align: right;
  }
  .hidden-row {
    opacity: 0.55;
  }
  .empty {
    padding: 24px 0;
  }
  /* Ранения этого участника игроки не видят. */
  .off {
    color: var(--accent);
  }
</style>
