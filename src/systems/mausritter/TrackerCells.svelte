<!-- Mausritter tracker: cells of a combatant row — HP (damage past it goes to STR), STR / DEX / WIL now and max,
     armour (head — column headers). -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { dispatch } from '../../renderer/lib/store.svelte';
  import type { Combatant } from '../../modules/initiative/types';
  import { ATTR_SHORT, ATTR_TITLES, type MausAttr } from './stats';
  import { defaultAttrs } from './tracker';

  let { c, head = false }: { c?: Combatant; head?: boolean } = $props();

  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));
  const update = (c: Combatant, changes: Partial<Omit<Combatant, 'id'>>) => dispatch('initiative', 'update', { id: c.id, changes });

  // «-4» or «4» — damage (armour is already taken off), «+3» — healing.
  function applyHp(c: Combatant, input: HTMLInputElement) {
    const v = input.value.trim();
    const n = Number(v);
    if (!v || isNaN(n)) return;
    dispatch('initiative', 'changeHp', { id: c.id, amount: v.startsWith('+') ? Math.abs(n) : -Math.abs(n) });
    input.value = '';
  }
</script>

{#if head}
  <th class="c-hp" title={t('maus.hpTitle')}>{t('maus.hp')}</th>
  <th class="c-dmg" title={t('maus.tc.dmgHint')}>±</th>
  <th class="c-attrs" title={t('maus.tc.attrsHint')}>{t('maus.tc.attrs')}</th>
  <th class="c-ac" title={t('maus.armour')}>{t('maus.armourShort')}</th>
{:else if c}
  {@const it = c}
  <td class="c-hp">
    {#if c.maxHp !== null}
      <span class:low={c.hp !== null && c.hp <= 0}>{c.hp ?? '—'}</span><span class="faint">/</span><input
        class="max"
        type="text"
        inputmode="numeric"
        value={c.maxHp}
        title={t('maus.tc.maxHp')}
        onchange={(e) => update(it, { maxHp: num(e.currentTarget.value), hp: Math.min(it.hp ?? 0, num(e.currentTarget.value) ?? Infinity) })}
      />
    {:else}
      <input class="max" type="text" inputmode="numeric" placeholder="—" title={t('maus.tc.maxHp')} onchange={(e) => update(it, { maxHp: num(e.currentTarget.value), hp: num(e.currentTarget.value) })} />
    {/if}
  </td>
  <td class="c-dmg">
    <input type="text" placeholder="±" disabled={c.maxHp === null} onkeydown={(e) => e.key === 'Enter' && applyHp(it, e.currentTarget)} onblur={(e) => applyHp(it, e.currentTarget)} />
  </td>
  <td class="c-attrs">
    {#if c.attrs?.length}
      <div class="attrs">
        {#each c.attrs as a (a.id)}
          <label class="attr" class:hurt={a.value < a.max} class:zero={a.value <= 0} title={t('maus.tc.attrTitle', { title: ATTR_TITLES[a.id as MausAttr] ?? a.id, max: a.max })}>
            <span class="k faint">{ATTR_SHORT[a.id as MausAttr] ?? a.id}</span>
            <input
              type="text"
              inputmode="numeric"
              value={a.value}
              onchange={(e) => dispatch('initiative', 'setAttr', { id: it.id, attr: a.id, value: num(e.currentTarget.value) ?? a.value })}
            />
          </label>
        {/each}
      </div>
    {:else}
      <button class="link faint" title={t('maus.tc.addAttrsHint')} onclick={() => update(it, { attrs: defaultAttrs(it) })}>{t('maus.tc.addAttrs')}</button>
    {/if}
  </td>
  <td class="c-ac">
    <input type="text" inputmode="numeric" value={c.ac ?? ''} placeholder="—" onchange={(e) => update(it, { ac: num(e.currentTarget.value) })} />
  </td>
{/if}

<style>
  .c-hp {
    width: 90px;
    white-space: nowrap;
  }
  .c-hp .max {
    width: 40px;
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
  .c-attrs {
    white-space: nowrap;
  }
  .attrs {
    display: flex;
    gap: 4px;
  }
  .attr {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .attr .k {
    font-size: 10px;
  }
  .attr input {
    width: 30px !important;
    text-align: center;
  }
  .attr.hurt input {
    color: var(--warning);
  }
  .attr.zero input {
    color: var(--danger);
  }
  .c-ac {
    width: 50px;
  }
  .c-ac input {
    text-align: center;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    font-size: 12px;
    cursor: pointer;
  }
  .link:hover {
    color: var(--accent);
  }
</style>
