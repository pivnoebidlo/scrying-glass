<!-- The GM's weapons for Reshape a stat block: a row of names, the picked one below — name, dice, damage type, melee or
     ranged, finesse, reach, thrown or shot range, two hands, a magic bonus and more damage of another type. Saved by
     itself into the library beside the templates (common to all campaigns); offered in the weapon pickers. -->
<script lang="ts">
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { Trash2, X } from '@lucide/svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { dict } from '../../stats';
  import { DAMAGE_TYPES, diceOf, type DamageType, type OwnWeapon } from '../../reshape';
  import { addOwnWeapon, own, removeOwnWeapon, saveOwn } from './store.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const L = $derived(dict(locale.lang));
  let picked = $state<string | null>(own.weapons[0]?.id ?? null);
  const wp = $derived(own.weapons.find((x) => x.id === picked) ?? null);
  // Dice fields keep what is typed until it reads as dice («2d6», «1к8»); then it is saved.
  let wrong = $state<Record<string, boolean>>({});

  function add() {
    picked = addOwnWeapon(t('reshape.ow.new'));
  }
  function remove(x: OwnWeapon) {
    if (!confirm(t('reshape.ow.deleteQ', { name: x.name }))) return;
    removeOwnWeapon(x.id);
    picked = own.weapons[0]?.id ?? null;
  }
  function setDice(x: OwnWeapon, field: 'dice' | 'versatile' | 'extra', text: string) {
    const d = diceOf(text);
    wrong = { ...wrong, [field]: !!text.trim() && !d };
    if (field === 'dice') {
      if (d) x.dice = d;
    } else if (field === 'versatile') {
      if (d) x.versatile = d;
      else if (!text.trim()) delete x.versatile;
    } else if (d) x.extra = { dice: d, type: x.extra?.type ?? 'fire' };
    else if (!text.trim()) delete x.extra;
    saveOwn();
  }
  // Thrown (melee) or a shot (ranged): normal / long range; empty — none.
  function setRange(x: OwnWeapon, i: 0 | 1, v: string) {
    const r: [number, number] = [...(x.range ?? [x.kind === 'ranged' ? 80 : 20, x.kind === 'ranged' ? 320 : 60])] as [number, number];
    r[i] = Number(v) || 0;
    if (r[0] > 0 && r[1] >= r[0]) x.range = r;
    else if (!r[0] && !r[1]) delete x.range;
    saveOwn();
  }
  function setKind(x: OwnWeapon, kind: 'melee' | 'ranged') {
    x.kind = kind;
    // A shot needs a range; a melee weapon keeps one only when thrown.
    if (kind === 'ranged' && !x.range) x.range = [80, 320];
    saveOwn();
  }
  function setFlag(x: OwnWeapon, k: 'finesse' | 'reach' | 'thrown', on: boolean) {
    if (k === 'thrown') {
      if (on) x.range = x.range ?? [20, 60];
      else delete x.range;
    } else if (on) x[k] = true;
    else delete x[k];
    saveOwn();
  }
  function setBonus(x: OwnWeapon, v: string) {
    if (Number(v)) x.bonus = Number(v);
    else delete x.bonus;
    saveOwn();
  }
</script>

<div class="own">
  <header>
    <h3>{t('reshape.ow.title')}</h3>
    <button class="icon-btn" title={t('maps.close')} onclick={onclose}><X size={15} /></button>
  </header>
  <ul class="list">
    {#each own.weapons as x (x.id)}
      <li><button class:active={x.id === picked} onclick={() => ((picked = x.id), (wrong = {}))}>{x.name || '—'}</button></li>
    {/each}
    <li><button class="add" onclick={add}>{t('reshape.ow.add')}</button></li>
  </ul>

  {#if wp}
    <div class="form">
      <div class="row">
        <input class="name" type="text" bind:value={wp.name} oninput={saveOwn} placeholder={t('reshape.ow.namePh')} />
        <button class="icon-btn" title={t('reshape.ow.delete')} onclick={() => remove(wp)}><Trash2 size={14} /></button>
      </div>
      <div class="row">
        <label>{t('reshape.ow.dice')} <input class="dice" class:bad={wrong['dice']} type="text" value={wp.dice} oninput={(e) => setDice(wp, 'dice', e.currentTarget.value)} /></label>
        <select value={wp.type} onchange={(e) => ((wp.type = e.currentTarget.value as DamageType), saveOwn())}>
          {#each DAMAGE_TYPES as d (d)}<option value={d}>{L.damage[d] ?? d}</option>{/each}
        </select>
        <select value={wp.kind} onchange={(e) => setKind(wp, e.currentTarget.value as 'melee' | 'ranged')}>
          <option value="melee">{t('reshape.ow.melee')}</option>
          <option value="ranged">{t('reshape.ow.ranged')}</option>
        </select>
      </div>
      <div class="row flags">
        <label><input type="checkbox" checked={!!wp.finesse} onchange={(e) => setFlag(wp, 'finesse', e.currentTarget.checked)} /> {t('reshape.ow.finesse')}</label>
        {#if wp.kind === 'melee'}
          <label><input type="checkbox" checked={!!wp.reach} onchange={(e) => setFlag(wp, 'reach', e.currentTarget.checked)} /> {t('reshape.ow.reach')}</label>
          <label><input type="checkbox" checked={!!wp.range} onchange={(e) => setFlag(wp, 'thrown', e.currentTarget.checked)} /> {t('reshape.ow.thrown')}</label>
        {/if}
      </div>
      {#if wp.range}
        <div class="row">
          <label>{t('reshape.ow.range')}
            <input class="num" type="number" min="5" step="5" value={wp.range[0]} onchange={(e) => setRange(wp, 0, e.currentTarget.value)} /> /
            <input class="num" type="number" min="5" step="5" value={wp.range[1]} onchange={(e) => setRange(wp, 1, e.currentTarget.value)} />
          </label>
        </div>
      {/if}
      <div class="row">
        <label title={t('reshape.ow.versatileHint')}>{t('reshape.ow.versatile')} <input class="dice" class:bad={wrong['versatile']} type="text" placeholder="1d10" value={wp.versatile ?? ''} oninput={(e) => setDice(wp, 'versatile', e.currentTarget.value)} /></label>
        <label>{t('reshape.ow.bonus')}
          <select value={String(wp.bonus ?? 0)} onchange={(e) => setBonus(wp, e.currentTarget.value)}>
            {#each [0, 1, 2, 3] as b (b)}<option value={String(b)}>{b ? `+${b}` : '—'}</option>{/each}
          </select>
        </label>
      </div>
      <div class="row">
        <label title={t('reshape.ow.extraHint')}>{t('reshape.ow.extra')} <input class="dice" class:bad={wrong['extra']} type="text" placeholder="2d6" value={wp.extra?.dice ?? ''} oninput={(e) => setDice(wp, 'extra', e.currentTarget.value)} /></label>
        {#if wp.extra}
          <select value={wp.extra.type} onchange={(e) => wp.extra && ((wp.extra = { ...wp.extra, type: e.currentTarget.value as DamageType }), saveOwn())}>
            {#each DAMAGE_TYPES as d (d)}<option value={d}>{L.damage[d] ?? d}</option>{/each}
          </select>
        {/if}
      </div>
      <p class="faint hint"><Lead text={t('reshape.ow.hint')} /></p>
    </div>
  {/if}
</div>

<style>
  .own {
    margin-bottom: 16px;
    padding: 10px 12px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h3 {
    margin: 0;
    font-size: 13px;
  }
  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 8px 0;
    padding: 0;
    list-style: none;
  }
  .list button {
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .list button.active {
    border-color: var(--accent);
    font-weight: 600;
  }
  .list .add {
    color: var(--accent);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .row label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .name {
    flex: 1;
  }
  .dice {
    width: 64px;
  }
  .dice.bad {
    border-color: var(--danger);
  }
  .num {
    width: 60px;
  }
  .hint {
    margin: 0;
    font-size: 12px;
  }
</style>
