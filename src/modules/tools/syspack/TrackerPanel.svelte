<!-- The builder: what the initiative tracker takes from a card of the system — the order of turns, health, what a
     combatant's row shows, the conditions. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { fieldMap, loc, type SystemPack } from '../../../shared/syspack';
  import FormulaInput from './FormulaInput.svelte';

  let { pack = $bindable(), disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  const fields = $derived([...fieldMap(pack).values()]);
  const keys = $derived(fields.map((f) => f.key));
  const shown = $derived(fields.filter((f) => ['number', 'track', 'dots', 'formula'].includes(f.type)));
  const title = (k: string) => loc(fieldMap(pack).get(k)?.title, getLang()) || k;
  const tr = $derived(pack.tracker);
  // One condition a line; «Frightened #» — it carries a number.
  const valuedNames = $derived(new Set((tr.conditions?.valued ?? []).map((c) => loc(c, getLang()))));
  const condText = $derived((tr.conditions?.list ?? []).map((c) => loc(c, getLang())).map((c) => (valuedNames.has(c) ? `${c} #` : c)).join('\n'));

  function setInit(type: string) {
    tr.init = type === 'roll' ? { type: 'roll', dice: '1d20' } : type === 'value' ? { type: 'value', value: keys[0] ?? '0' } : { type: 'none' };
  }
  function toggleCell(k: string, on: boolean) {
    const cells = (tr.cells ?? []).filter((x) => x !== k);
    tr.cells = on ? [...cells, k] : cells;
  }
  function setConditions(text: string) {
    const lines = text.split('\n').map((x) => x.trim()).filter(Boolean);
    const valued = lines.filter((x) => /\s#$/.test(x)).map((x) => x.replace(/\s*#$/, ''));
    tr.conditions = { list: lines.map((x) => x.replace(/\s*#$/, '')), free: tr.conditions?.free ?? true, ...(valued.length ? { valued } : {}) };
  }
</script>

<div class="panel">
  <label class="row">
    <span>{t('sb.init')}</span>
    <select {disabled} value={tr.init.type} onchange={(e) => setInit(e.currentTarget.value)}>
      <option value="roll">{t('sb.initRoll')}</option>
      <option value="value">{t('sb.initValue')}</option>
      <option value="none">{t('sb.initNone')}</option>
    </select>
  </label>
  {#if tr.init.type === 'roll'}
    {@const init = tr.init}
    <label class="row"><span>{t('sb.initDice')}</span><input type="text" class="mono" {disabled} value={init.dice} onchange={(e) => (init.dice = e.currentTarget.value.trim() || '1d20')} /></label>
    <div class="row"><span>{t('sb.initBonus')}</span><FormulaInput value={init.bonus ?? ''} set={(v) => (init.bonus = v || undefined)} {keys} {disabled} /></div>
  {:else if tr.init.type === 'value'}
    {@const init = tr.init}
    <div class="row"><span>{t('sb.initValueF')}</span><FormulaInput value={init.value} set={(v) => (init.value = v)} {keys} {disabled} /></div>
  {/if}

  <label class="row">
    <span>{t('sb.hp')}</span>
    <select {disabled} value={tr.hp ?? ''} onchange={(e) => (tr.hp = e.currentTarget.value || undefined)}>
      <option value="">{t('sb.hpNone')}</option>
      {#each shown as f (f.key)}<option value={f.key}>{title(f.key)}</option>{/each}
    </select>
  </label>

  <div class="row">
    <span>{t('sb.cells')}</span>
    {#each shown.filter((f) => f.key !== tr.hp) as f (f.key)}
      <label class="check"><input type="checkbox" {disabled} checked={tr.cells?.includes(f.key) ?? false} onchange={(e) => toggleCell(f.key, e.currentTarget.checked)} /> {title(f.key)}</label>
    {/each}
  </div>

  <label class="row"><span>{t('sb.conditions')}</span><textarea rows="5" {disabled} value={condText} onchange={(e) => setConditions(e.currentTarget.value)}></textarea></label>
  <p class="faint small">{t('sb.conditionsValued')}</p>
  <label class="check">
    <input type="checkbox" {disabled} checked={tr.conditions?.free ?? true} onchange={(e) => (tr.conditions = { ...tr.conditions, list: tr.conditions?.list ?? [], free: e.currentTarget.checked })} />
    {t('sb.conditionsFree')}
  </label>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .row > span:first-child {
    color: var(--text-faint);
    font-size: 11px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mono {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
  }
  textarea {
    resize: vertical;
  }
</style>
