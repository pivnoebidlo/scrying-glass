<!-- Вкладка «Инициатива»: таблица участников боя для мастера. -->
<script lang="ts">
  import { ChevronLeft, ChevronRight, Dices, Eye, EyeOff, Plus, Square, Swords, Trash2, X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { defeated, ordered } from '../order';
  import { CONDITIONS, type Combatant, type Side } from '../types';
  import Avatar from './Avatar.svelte';

  let { ms }: ModuleProps<'initiative'> = $props();

  const list = $derived(ordered(ms.combatants));
  const running = $derived(ms.turn !== null);

  const SIDES: Record<Side, string> = { party: 'Партия', ally: 'Союзник', enemy: 'Противник' };

  // Число из поля или null, если поле пустое.
  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));

  const update = (c: Combatant, changes: Partial<Omit<Combatant, 'id'>>) => dispatch('initiative', 'update', { id: c.id, changes });

  // «-7» или «7» — урон, «+5» — лечение.
  function applyHp(c: Combatant, input: HTMLInputElement) {
    const v = input.value.trim();
    const n = Number(v);
    if (!v || isNaN(n)) return;
    dispatch('initiative', 'changeHp', { id: c.id, amount: v.startsWith('+') ? Math.abs(n) : -Math.abs(n) });
    input.value = '';
  }

  // Форма добавления.
  let form = $state({ name: '', side: 'enemy' as Side, init: '', bonus: '', hp: '', ac: '', count: '1' });

  async function add() {
    if (!form.name.trim()) return;
    const n = Math.max(1, Math.min(20, num(form.count) ?? 1));
    for (let i = 1; i <= n; i++) {
      await dispatch('initiative', 'add', {
        c: {
          name: n > 1 ? `${form.name.trim()} ${i}` : form.name,
          side: form.side,
          init: num(form.init),
          bonus: num(form.bonus) ?? 0,
          maxHp: num(form.hp),
          ac: num(form.ac),
        },
      });
    }
    form = { ...form, name: '', init: '', hp: '', ac: '', count: '1' };
  }

  function clearEnemies() {
    if (confirm('Убрать всех противников и союзников? Партия останется, её инициатива и состояния сбросятся.')) {
      dispatch('initiative', 'clearEnemies');
    }
  }
</script>

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
    <button class="btn" title="Бросить d20 + бонус за противников и союзников без инициативы" onclick={() => dispatch('initiative', 'rollNpcs', {})}>
      <Dices size={14} /> Бросить за NPC
    </button>
    <label class="show" title="Полоса очерёдности на экране игроков">
      <input type="checkbox" checked={ms.showToPlayers} onchange={(e) => dispatch('initiative', 'setShowToPlayers', { value: e.currentTarget.checked })} />
      игрокам
    </label>
    <button class="icon-btn" title="Убрать противников и союзников" onclick={clearEnemies}><Trash2 size={15} /></button>
  </header>

  {#if list.length}
    <table>
      <thead>
        <tr>
          <th class="c-init" title="Инициатива">Иниц.</th>
          <th></th>
          <th>Имя</th>
          <th class="c-hp">Хиты</th>
          <th class="c-dmg" title="«7» или «-7» — урон, «+5» — лечение, Enter — применить">±</th>
          <th class="c-ac" title="Класс доспеха">КД</th>
          <th>Состояния</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each list as c (c.id)}
          <tr class:turn={ms.turn === c.id} class:down={defeated(c)} class:hidden-row={c.hidden}>
            <td class="c-init">
              <input type="text" inputmode="numeric" value={c.init ?? ''} placeholder="—" onchange={(e) => update(c, { init: num(e.currentTarget.value) })} />
            </td>
            <td><Avatar {c} /></td>
            <td class="c-name">
              <input class="name" type="text" value={c.name} onchange={(e) => update(c, { name: e.currentTarget.value.trim() || c.name })} />
              <span class="side faint">{SIDES[c.side]}{c.bonus ? ` · бонус ${c.bonus > 0 ? '+' : ''}${c.bonus}` : ''}</span>
            </td>
            <td class="c-hp">
              {#if c.maxHp !== null}
                <span class:low={c.hp !== null && c.hp <= c.maxHp / 2}>{c.hp ?? '—'}</span><span class="faint">/</span><input
                  class="max"
                  type="text"
                  inputmode="numeric"
                  value={c.maxHp}
                  title="Максимум хитов"
                  onchange={(e) => update(c, { maxHp: num(e.currentTarget.value), hp: Math.min(c.hp ?? 0, num(e.currentTarget.value) ?? Infinity) })}
                />
              {:else}
                <input class="max" type="text" inputmode="numeric" placeholder="—" title="Максимум хитов" onchange={(e) => update(c, { maxHp: num(e.currentTarget.value), hp: num(e.currentTarget.value) })} />
              {/if}
            </td>
            <td class="c-dmg">
              <input type="text" placeholder="±" disabled={c.maxHp === null} onkeydown={(e) => e.key === 'Enter' && applyHp(c, e.currentTarget)} onblur={(e) => applyHp(c, e.currentTarget)} />
            </td>
            <td class="c-ac">
              <input type="text" inputmode="numeric" value={c.ac ?? ''} placeholder="—" onchange={(e) => update(c, { ac: num(e.currentTarget.value) })} />
            </td>
            <td class="c-cond">
              {#each c.conditions as cond (cond)}
                <button class="chip" title="Снять" onclick={() => dispatch('initiative', 'toggleCondition', { id: c.id, condition: cond })}>{cond} <X size={10} /></button>
              {/each}
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
                {#each CONDITIONS.filter((x) => !c.conditions.includes(x)) as cond (cond)}<option value={cond}>{cond}</option>{/each}
              </select>
            </td>
            <td class="c-act">
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
      Участников пока нет. Добавьте их формой ниже или кнопкой «В инициативу» на карточке портрета.
    </p>
  {/if}

  <form class="add" onsubmit={(e) => { e.preventDefault(); add(); }}>
    <input class="f-name" type="text" placeholder="Имя (например, Гоблин)" bind:value={form.name} />
    <select bind:value={form.side}>
      {#each Object.entries(SIDES) as [v, t] (v)}<option value={v}>{t}</option>{/each}
    </select>
    <input class="f-num" type="text" inputmode="numeric" placeholder="Иниц." title="Инициатива (можно бросить потом)" bind:value={form.init} />
    <input class="f-num" type="text" inputmode="numeric" placeholder="Бонус" title="Бонус инициативы" bind:value={form.bonus} />
    <input class="f-num" type="text" inputmode="numeric" placeholder="Хиты" bind:value={form.hp} />
    <input class="f-num" type="text" inputmode="numeric" placeholder="КД" bind:value={form.ac} />
    <input class="f-num" type="text" inputmode="numeric" placeholder="×1" title="Сколько таких добавить (Гоблин 1, Гоблин 2, …)" bind:value={form.count} />
    <button class="btn" type="submit" disabled={!form.name.trim()}><Plus size={14} /> Добавить</button>
  </form>
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
  tr.turn td {
    background: var(--accent-soft);
  }
  tr.turn td:first-child {
    box-shadow: inset 3px 0 0 var(--accent);
  }
  tr.down {
    opacity: 0.45;
  }
  tr.hidden-row .name {
    font-style: italic;
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
  .c-init {
    width: 56px;
  }
  .c-init input {
    font-size: 15px;
    font-weight: 600;
    text-align: center;
  }
  .c-name {
    min-width: 160px;
  }
  .side {
    display: block;
    padding-left: 6px;
    font-size: 11px;
  }
  .c-hp {
    width: 110px;
    white-space: nowrap;
  }
  .c-hp .max {
    width: 48px;
  }
  .low {
    color: var(--danger);
  }
  .c-dmg {
    width: 56px;
  }
  .c-dmg input {
    border-color: var(--border) !important;
    text-align: center;
  }
  .c-ac {
    width: 50px;
  }
  .c-ac input {
    text-align: center;
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
    cursor: pointer;
  }
  .add-cond {
    width: 36px;
    padding: 1px 4px;
    font-size: 12px;
  }
  .c-act {
    width: 64px;
    white-space: nowrap;
  }
  .empty {
    padding: 24px 0;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .f-name {
    flex: 1;
    min-width: 180px;
  }
  .f-num {
    width: 64px;
  }
</style>
