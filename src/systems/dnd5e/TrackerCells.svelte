<!-- Трекер инициативы, D&D: ячейки строки участника — хиты, урон и лечение, КД (head — заголовки столбцов). -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { dispatch } from '../../renderer/lib/store.svelte';
  import type { Combatant } from '../../modules/initiative/types';

  let { c, head = false }: { c?: Combatant; head?: boolean } = $props();

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
</script>

{#if head}
  <th class="c-hp">{t('dnd.hp')}</th>
  <th class="c-dmg" title={t('dnd.tr.dmgHint')}>±</th>
  <th class="c-ac" title={t('dnd.armorClass')}>{t('dnd.ac')}</th>
{:else if c}
  <td class="c-hp">
    {#if c.maxHp !== null}
      <span class:low={c.hp !== null && c.hp <= c.maxHp / 2}>{c.hp ?? '—'}</span><span class="faint">/</span><input
        class="max"
        type="text"
        inputmode="numeric"
        value={c.maxHp}
        title={t('dnd.maxHp')}
        onchange={(e) => update(c, { maxHp: num(e.currentTarget.value), hp: Math.min(c.hp ?? 0, num(e.currentTarget.value) ?? Infinity) })}
      />
    {:else}
      <input class="max" type="text" inputmode="numeric" placeholder="—" title={t('dnd.maxHp')} onchange={(e) => update(c, { maxHp: num(e.currentTarget.value), hp: num(e.currentTarget.value) })} />
    {/if}
  </td>
  <td class="c-dmg">
    <input type="text" placeholder="±" disabled={c.maxHp === null} onkeydown={(e) => e.key === 'Enter' && applyHp(c, e.currentTarget)} onblur={(e) => applyHp(c, e.currentTarget)} />
  </td>
  <td class="c-ac">
    <input type="text" inputmode="numeric" value={c.ac ?? ''} placeholder="—" onchange={(e) => update(c, { ac: num(e.currentTarget.value) })} />
  </td>
{/if}

<style>
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
</style>
