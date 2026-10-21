<!-- Mausritter card editor: the stat block (a text stat block from the SRD can be pasted in) and, optionally, the
     sheet of a mouse — level, pips, background and inventory slots. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { Plus, X, ClipboardPaste } from '@lucide/svelte';
  import { ATTR_TITLES, ATTRS, blankSheet, CONDITION_TITLES, gritFor, levelFor, parseStatBlock, SLOT_COUNT, slotGroup, type MausStats } from './stats';

  let { stats = $bindable() }: { stats: MausStats; system: string } = $props();

  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));

  // Paste a stat block: «12hp, STR 12, DEX 15, WIL 15, Armour 1 / Attacks: d8 peck / …».
  let pasting = $state(false);
  let pasted = $state('');
  function applyPasted() {
    const p = parseStatBlock(pasted);
    Object.assign(stats, { ...p, sheet: stats.sheet, wants: stats.wants || p.wants });
    pasting = false;
    pasted = '';
  }

  function setSheet(on: boolean) {
    if (on) stats.sheet = blankSheet();
    else delete stats.sheet;
  }

  function setXp(v: string) {
    if (!stats.sheet) return;
    stats.sheet.xp = Math.max(0, num(v) ?? 0);
    // More XP — the level follows (a lower level stays: maybe the GM keeps it).
    stats.sheet.level = Math.max(stats.sheet.level, levelFor(stats.sheet.xp));
  }

  const conditions = Object.values(CONDITION_TITLES);
</script>

<datalist id="maus-conditions">
  {#each conditions as c (c)}<option value={c}></option>{/each}
</datalist>

<section>
  <div class="grid">
    <label class="field small" title={t('maus.hpTitle')}>
      <span>{t('maus.hp')}</span>
      <input type="number" min="0" placeholder="—" value={stats.hp ?? ''} onchange={(e) => (stats.hp = num(e.currentTarget.value))} />
    </label>
    {#each ATTRS as a (a)}
      <label class="field small">
        <span>{ATTR_TITLES[a]}</span>
        <input type="number" min="0" max="20" placeholder="—" value={stats[a] ?? ''} onchange={(e) => (stats[a] = num(e.currentTarget.value))} />
      </label>
    {/each}
    <label class="field small" title={t('maus.armourHint')}>
      <span>{t('maus.armour')}</span>
      <input type="number" min="0" value={stats.armour} onchange={(e) => (stats.armour = num(e.currentTarget.value) ?? 0)} />
    </label>
    <label class="check" title={t('maus.warbandHint')}>
      <input type="checkbox" bind:checked={stats.warband} />
      {t('maus.warband')}
    </label>
    <button type="button" class="btn paste" title={t('maus.ed.pasteHint')} onclick={() => (pasting = !pasting)}><ClipboardPaste size={14} /> {t('maus.ed.paste')}</button>
  </div>
  {#if pasting}
    <div class="pasting">
      <textarea rows="4" placeholder={t('maus.ed.pastePh')} bind:value={pasted}></textarea>
      <button type="button" class="btn primary" disabled={!pasted.trim()} onclick={applyPasted}>{t('maus.ed.apply')}</button>
    </div>
  {/if}
</section>

<section>
  <h4>{t('maus.attacks')}</h4>
  {#each stats.attacks as a, i (i)}
    <div class="attack">
      <input type="text" class="dice" placeholder="d6" bind:value={a.dice} />
      <input type="text" placeholder={t('maus.ed.attackPh')} bind:value={a.name} />
      <button type="button" class="icon-btn" title={t('maus.remove')} onclick={() => stats.attacks.splice(i, 1)}><X size={14} /></button>
    </div>
  {/each}
  <button type="button" class="btn add" onclick={() => stats.attacks.push({ dice: 'd6', name: '' })}><Plus size={14} /> {t('maus.ed.attack')}</button>
</section>

<section>
  <div class="rows">
    <label class="row"><span class="lbl">{t('maus.critical')}</span><input type="text" placeholder={t('maus.ed.criticalPh')} bind:value={stats.critical} /></label>
    <label class="row"><span class="lbl">{t('maus.wants')}</span><input type="text" placeholder={t('maus.ed.wantsPh')} bind:value={stats.wants} /></label>
    {#each stats.abilities as _, i (i)}
      <div class="row">
        <span class="lbl">{t('maus.ed.ability')}</span>
        <span class="pair">
          <input type="text" bind:value={stats.abilities[i]} />
          <button type="button" class="icon-btn" title={t('maus.remove')} onclick={() => stats.abilities.splice(i, 1)}><X size={14} /></button>
        </span>
      </div>
    {/each}
  </div>
  <button type="button" class="btn add" onclick={() => stats.abilities.push('')}><Plus size={14} /> {t('maus.ed.ability')}</button>
</section>

<section>
  <label class="check">
    <input type="checkbox" checked={!!stats.sheet} onchange={(e) => setSheet(e.currentTarget.checked)} />
    {t('maus.ed.sheet')}
  </label>
  {#if stats.sheet}
    {@const sh = stats.sheet}
    <div class="grid">
      <label class="field small">
        <span>{t('maus.level')}</span>
        <input type="number" min="1" value={sh.level} onchange={(e) => (sh.level = Math.max(1, num(e.currentTarget.value) ?? 1))} />
      </label>
      <label class="field small">
        <span>{t('maus.xp')}</span>
        <input type="number" min="0" value={sh.xp} onchange={(e) => setXp(e.currentTarget.value)} />
      </label>
      <label class="field small">
        <span>{t('maus.pips')}</span>
        <input type="number" min="0" value={sh.pips} onchange={(e) => (sh.pips = Math.max(0, num(e.currentTarget.value) ?? 0))} />
      </label>
      <label class="field">
        <span>{t('maus.background')}</span>
        <input type="text" bind:value={sh.background} />
      </label>
      <label class="field">
        <span>{t('maus.birthsign')}</span>
        <input type="text" bind:value={sh.birthsign} />
      </label>
      <label class="field">
        <span>{t('maus.coat')}</span>
        <input type="text" bind:value={sh.coat} />
      </label>
      <label class="field wide">
        <span>{t('maus.look')}</span>
        <input type="text" bind:value={sh.look} />
      </label>
    </div>

    <h4>{t('maus.inventory')}</h4>
    <div class="slots">
      {#each sh.slots as x, i (i)}
        <div class="slot" class:condition={x.condition}>
          <span class="where">{i < SLOT_COUNT ? t(`maus.slot.${slotGroup(i)}`) : t('maus.extra')}</span>
          <input type="text" list={x.condition ? 'maus-conditions' : undefined} bind:value={x.name} />
          <div class="slot-row">
            <label class="mini" title={t('maus.ed.conditionHint')}><input type="checkbox" bind:checked={x.condition} /> {t('maus.ed.condition')}</label>
            {#if !x.condition}
              <select title={t('maus.usage')} value={x.usage ?? 0} onchange={(e) => (x.usage = Number(e.currentTarget.value))}>
                {#each [0, 1, 2, 3] as n (n)}<option value={n}>{'●'.repeat(n)}{'○'.repeat(3 - n)}</option>{/each}
              </select>
            {/if}
            {#if i >= SLOT_COUNT}
              <button type="button" class="icon-btn" title={t('maus.remove')} onclick={() => sh.slots.splice(i, 1)}><X size={13} /></button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    <button type="button" class="btn add" title={t('maus.ed.extraHint')} onclick={() => sh.slots.push({ name: '' })}><Plus size={14} /> {t('maus.extra')}</button>

    {#if gritFor(sh.level)}
      <label class="row grit">
        <span class="lbl">{t('maus.grit')} ({gritFor(sh.level)})</span>
        <input
          type="text"
          placeholder={t('maus.ed.gritPh')}
          value={sh.grit.join(', ')}
          onchange={(e) => (sh.grit = e.currentTarget.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, gritFor(sh.level)))}
        />
      </label>
    {/if}
  {/if}
</section>

<style>
  section {
    margin-bottom: 18px;
  }
  h4 {
    margin: 12px 0 8px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 8px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 160px;
  }
  .field.small {
    width: 72px;
  }
  .field.wide {
    flex: 1;
    min-width: 220px;
  }
  .field > span:first-child,
  .lbl,
  .where {
    color: var(--text-faint);
    font-size: 11px;
  }
  .paste {
    margin-left: auto;
  }
  .pasting {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  textarea {
    width: 100%;
  }
  .attack {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }
  .attack input {
    flex: 1;
    min-width: 0;
  }
  .attack .dice {
    flex: 0 0 70px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 130px 1fr;
    align-items: center;
    gap: 8px;
  }
  .grit {
    margin-top: 10px;
  }
  .pair {
    display: flex;
    gap: 4px;
  }
  .pair > input {
    flex: 1;
    min-width: 0;
  }
  .add {
    margin-top: 8px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
  }
  .slots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 6px;
  }
  .slot {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 4px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .slot.condition {
    border-color: var(--danger);
  }
  .slot-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mini {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--text-muted);
    font-size: 11px;
  }
  .slot-row select {
    margin-left: auto;
    font-size: 11px;
  }
</style>
