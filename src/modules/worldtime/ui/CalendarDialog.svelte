<!-- The world's calendar of an adventure, written as text: a line a month («Hammer | 30»), a moon, a holiday. A sample
     fills it to start from; below — what day 1 and today are by it. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { locale } from '../../../renderer/lib/i18n.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import {
    dateOf, dateText, holidaysOfText, monthsOfText, moonsOfText, PHASE_ICON, textOfHolidays, textOfMonths, textOfMoons, validCalendar,
    type Calendar,
  } from '../calendar';
  import { PRESETS, presetCalendar, type Preset } from '../presets';

  let { adventure, calendar, today, onclose }: { adventure: string | null; calendar: Calendar | null; today: number; onclose: () => void } = $props();

  let months = $state('');
  let weekdays = $state('');
  let year = $state(1);
  let era = $state('');
  let startMonth = $state(0);
  let startDay = $state(1);
  let moons = $state('');
  let holidays = $state('');

  function fill(c: Calendar) {
    months = textOfMonths(c.months);
    weekdays = (c.weekdays ?? []).join(', ');
    year = c.year;
    era = c.era ?? '';
    startMonth = c.month;
    startDay = c.day;
    moons = textOfMoons(c.moons ?? []);
    holidays = textOfHolidays(c.holidays ?? [], c.months);
  }
  untrack(() => fill(calendar ?? presetCalendar('fantasy', locale.lang)));

  const monthList = $derived(monthsOfText(months));
  const draft = $derived(
    validCalendar({
      months: monthList,
      weekdays: weekdays.split(',').map((w) => w.trim()).filter(Boolean),
      year: Number(year),
      era,
      month: startMonth,
      day: Number(startDay),
      moons: moonsOfText(moons),
      holidays: holidaysOfText(holidays, monthList),
    }),
  );
  const line = (day: number) => {
    if (!draft) return '';
    const d = dateOf(draft, day);
    return [dateText(draft, d), d.weekday, ...d.moons.map((m) => `${PHASE_ICON[m.phase]} ${m.name}`), ...d.holidays].filter(Boolean).join(' · ');
  };

  function save() {
    if (!draft) return;
    void dispatch('worldtime', 'setCalendar', { adventure, calendar: $state.snapshot(draft) });
    onclose();
  }
  function remove() {
    void dispatch('worldtime', 'setCalendar', { adventure, calendar: null });
    onclose();
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <form class="modal" onsubmit={(e) => (e.preventDefault(), save())}>
    <header>
      <h3>{t('worldtime.cal.title')}</h3>
      <select onchange={(e) => (fill(presetCalendar(e.currentTarget.value as Preset, locale.lang)), (e.currentTarget.value = ''))}>
        <option value="">{t('worldtime.cal.sample')}</option>
        {#each PRESETS as p (p)}<option value={p}>{t(`worldtime.cal.preset.${p}`)}</option>{/each}
      </select>
    </header>
    <div class="cols">
      <label class="field">
        <span>{t('worldtime.cal.months')}</span>
        <textarea rows="12" bind:value={months} placeholder="Frostmoot | 30"></textarea>
        <span class="hint">{t('worldtime.cal.monthsHint')}</span>
      </label>
      <div class="side">
        <label class="field">
          <span>{t('worldtime.cal.weekdays')}</span>
          <input type="text" bind:value={weekdays} placeholder="Moonday, Ironday, Windsday" />
        </label>
        <div class="row">
          <label class="field">
            <span>{t('worldtime.cal.year')}</span>
            <input type="number" bind:value={year} />
          </label>
          <label class="field">
            <span>{t('worldtime.cal.era')}</span>
            <input type="text" bind:value={era} placeholder="DR" />
          </label>
        </div>
        <div class="row">
          <label class="field grow">
            <span>{t('worldtime.cal.startMonth')}</span>
            <select bind:value={startMonth}>
              {#each monthList as m, i (i)}<option value={i}>{m.name}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span>{t('worldtime.cal.startDay')}</span>
            <input type="number" min="1" max={monthList[startMonth]?.days ?? 1} bind:value={startDay} />
          </label>
        </div>
        <label class="field">
          <span>{t('worldtime.cal.moons')}</span>
          <textarea rows="3" bind:value={moons} placeholder="Selûne | 30 | 0"></textarea>
        </label>
        <label class="field">
          <span>{t('worldtime.cal.holidays')}</span>
          <textarea rows="4" bind:value={holidays} placeholder="Midwinter | Longnight | 30"></textarea>
        </label>
      </div>
    </div>
    {#if draft}
      <p class="preview"><b>{t('worldtime.day', { day: 1 })}:</b> {line(1)}</p>
      {#if today > 1}<p class="preview"><b>{t('worldtime.day', { day: today })}:</b> {line(today)}</p>{/if}
    {:else}
      <p class="warning">{t('worldtime.cal.noMonths')}</p>
    {/if}
    <footer>
      {#if calendar}<button class="btn" type="button" onclick={remove}>{t('worldtime.cal.remove')}</button>{/if}
      <span class="spacer"></span>
      <button class="btn" type="button" onclick={onclose}>{t('worldtime.cal.cancel')}</button>
      <button class="btn primary" type="submit" disabled={!draft}>{t('worldtime.cal.save')}</button>
    </footer>
  </form>
</div>

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(760px, 94vw);
    max-height: 92vh;
    overflow: auto;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  h3 {
    margin: 0;
    font-size: 16px;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 12px;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .field.grow {
    flex: 1;
  }
  .field span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .field input[type='number'] {
    width: 90px;
  }
  .field .hint {
    color: var(--text-faint);
    font-size: 11px;
  }
  textarea {
    resize: vertical;
    font-family: var(--font-ui);
  }
  .preview {
    margin: 0;
    color: var(--text-muted);
  }
  .warning {
    margin: 0;
    color: var(--warning);
  }
  footer {
    display: flex;
    gap: 6px;
  }
  .spacer {
    flex: 1;
  }
</style>
