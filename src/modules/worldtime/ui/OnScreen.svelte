<!-- Right panel: time in the game world of the current adventure. Steps move it on (a right click — back), a click on
     the time sets it by hand; the eye shows the day and the time of day to the players, in the chosen corner. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Eye, EyeOff, Moon, RotateCcw, Sun, Sunrise, Sunset } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import CornerPick from '../../fate/ui/CornerPick.svelte';
  import { clockOf, hhmm, minutesOf, partOf, START, type DayPart } from '../types';

  let { ms, app }: ModuleProps<'worldtime'> = $props();

  const adventure = $derived(app.adventures.current);
  const w = $derived(ms.byAdventure[adventure ?? '']);
  const now = $derived(clockOf(w?.minutes ?? START));
  const part = $derived(partOf(now.hour));
  const ICON: Record<DayPart, typeof Sun> = { night: Moon, morning: Sunrise, day: Sun, evening: Sunset };
  const Icon = $derived(ICON[part]);

  const STEPS = [
    { label: 'worldtime.plus10', hint: 'worldtime.plus10Hint', minutes: 10 },
    { label: 'worldtime.plus60', hint: 'worldtime.plus60Hint', minutes: 60 },
    { label: 'worldtime.longRest', hint: 'worldtime.longRestHint', minutes: 8 * 60 },
  ] as const;
  const advance = (minutes: number) => dispatch('worldtime', 'advance', { adventure, minutes });

  let editing = $state(false);
  let day = $state(1);
  let time = $state('08:00');
  function edit() {
    day = now.day;
    time = hhmm(now.hour, now.minute);
    editing = true;
  }
  function save() {
    const [h, m] = time.split(':').map(Number);
    dispatch('worldtime', 'set', { adventure, minutes: minutesOf(Math.round(day) || 1, h ?? 0, m ?? 0) });
    editing = false;
  }
  function reset() {
    if (confirm(t('worldtime.resetQ'))) dispatch('worldtime', 'reset', { adventure });
  }
</script>

{#if !w}
  <button class="btn" title={t('worldtime.startHint')} onclick={() => dispatch('worldtime', 'set', { adventure, minutes: START })}>
    <Sunrise size={14} />
    {t('worldtime.start')}
  </button>
{:else}
  <div class="head">
    {#if editing}
      <form class="edit" onsubmit={(e) => (e.preventDefault(), save())}>
        <label>{t('worldtime.dayField')} <input type="number" min="1" bind:value={day} /></label>
        <label>{t('worldtime.timeField')} <input type="time" bind:value={time} /></label>
        <button class="btn" type="submit">{t('worldtime.save')}</button>
      </form>
    {:else}
      <button class="now" title={t('worldtime.edit')} onclick={edit}>
        <Icon size={18} />
        <span class="day">{t('worldtime.day', { day: now.day })}</span>
        <span class="time">{hhmm(now.hour, now.minute)}</span>
        <span class="part">{t(`worldtime.part.${part}`)}</span>
      </button>
      <span class="tools">
        <CornerPick value={ms.place} what={t('worldtime.what')} onpick={(c) => dispatch('worldtime', 'setPlace', { place: c })} />
        <button class="icon-btn" title={w.shown ? t('worldtime.hide') : t('worldtime.show')} onclick={() => dispatch('worldtime', 'show', { adventure, shown: !w.shown })}>
          {#if w.shown}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
        </button>
        <button class="icon-btn" title={t('worldtime.reset')} onclick={reset}><RotateCcw size={13} /></button>
      </span>
    {/if}
  </div>
  <div class="steps">
    {#each STEPS as s (s.minutes)}
      <button
        class="btn"
        title={t('worldtime.stepHint', { what: t(s.hint) })}
        onclick={() => advance(s.minutes)}
        oncontextmenu={(e) => (e.preventDefault(), advance(-s.minutes))}>{t(s.label)}</button
      >
    {/each}
    <button class="btn" title={t('worldtime.morningHint')} onclick={() => dispatch('worldtime', 'untilMorning', { adventure })}>{t('worldtime.morning')}</button>
  </div>
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 30px;
  }
  .now {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    padding: 2px 4px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    cursor: pointer;
  }
  .now:hover {
    border-color: var(--border);
  }
  .now :global(svg) {
    align-self: center;
    color: var(--text-muted);
  }
  .day {
    font-weight: 600;
    white-space: nowrap;
  }
  .time {
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }
  .part {
    color: var(--text-muted);
    font-size: 12px;
  }
  .tools {
    display: flex;
    align-items: center;
    margin-left: auto;
  }
  .edit {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .edit label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .edit input[type='number'] {
    width: 52px;
  }
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }
  .steps .btn {
    flex: 1;
    justify-content: center;
    padding-left: 6px;
    padding-right: 6px;
    white-space: nowrap;
  }
</style>
