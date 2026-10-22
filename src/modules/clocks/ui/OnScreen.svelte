<!-- Right panel: the progress clocks of the current adventure. A click on a clock ticks it forward, a right click — back;
     the eye shows it to the players. At the header — the corner and size on the player screen. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Eye, EyeOff, Plus, X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import CornerPick from '../../fate/ui/CornerPick.svelte';
  import ClockFace from './ClockFace.svelte';
  import { CLOCK_SIZES, CLOCK_TONES, type ClocksState, type ClockTone } from '../types';

  let { ms, app }: ModuleProps<'clocks'> = $props();

  const adventure = $derived(app.adventures.current);
  const clocks = $derived(ms.byAdventure[adventure ?? ''] ?? []);
  const TONE_VAR: Record<ClockTone, string> = { danger: 'var(--danger)', progress: 'var(--accent)', neutral: 'var(--text-muted)' };

  let segments = $state(4);
  let newTitle = $state<HTMLInputElement>();
  let tone = $state<ClockTone>('danger');
  function add(input: HTMLInputElement) {
    const title = input.value.trim();
    if (!title) return;
    dispatch('clocks', 'add', { adventure, title, segments, tone });
    input.value = '';
  }
  const tick = (id: string, by: number) => dispatch('clocks', 'tick', { adventure, id, by });
  const update = (id: string, changes: object) => dispatch('clocks', 'update', { adventure, id, changes });
  function remove(id: string, title: string) {
    if (confirm(t('clocks.removeQ', { title }))) dispatch('clocks', 'remove', { adventure, id });
  }
</script>

<div class="head">
  <CornerPick value={ms.place} what={t('clocks.what')} onpick={(c) => dispatch('clocks', 'setPlace', { place: c })} />
  <div class="seg" role="radiogroup" aria-label={t('clocks.size')}>
    {#each ['small', 'medium', 'large'] as s (s)}
      <button role="radio" aria-checked={ms.size === s} class:on={ms.size === s} title={t(`clocks.size.${s}` as never)} onclick={() => dispatch('clocks', 'setSize', { size: s as ClocksState['size'] })}>{t(`clocks.sizeShort.${s}` as never)}</button>
    {/each}
  </div>
</div>

{#each clocks as c (c.id)}
  <div class="clock" class:hidden={!c.shown} class:full={c.filled >= c.segments}>
    <button
      class="face"
      title={t('clocks.tickHint', { n: c.filled, of: c.segments })}
      style:color={TONE_VAR[c.tone]}
      onclick={(e) => tick(c.id, e.shiftKey ? -1 : 1)}
      oncontextmenu={(e) => (e.preventDefault(), tick(c.id, -1))}
    >
      <ClockFace segments={c.segments} filled={c.filled} color={TONE_VAR[c.tone]} rim="var(--text-normal)" empty="var(--bg-primary)" />
    </button>
    <div class="body">
      <div class="line">
        <input class="title" type="text" value={c.title} title={t('clocks.rename')} onchange={(e) => update(c.id, { title: e.currentTarget.value })} />
        <button class="icon-btn" title={c.shown ? t('clocks.hide') : t('clocks.show')} onclick={() => update(c.id, { shown: !c.shown })}>
          {#if c.shown}<Eye size={13} />{:else}<EyeOff size={13} />{/if}
        </button>
        <button class="icon-btn" title={t('clocks.remove')} onclick={() => remove(c.id, c.title)}><X size={13} /></button>
      </div>
      <div class="meta">
        <select value={c.segments} title={t('clocks.segments')} onchange={(e) => update(c.id, { segments: +e.currentTarget.value })}>
          {#each CLOCK_SIZES as n (n)}<option value={n}>{n}</option>{/each}
        </select>
        <select value={c.tone} title={t('clocks.tone')} onchange={(e) => update(c.id, { tone: e.currentTarget.value })}>
          {#each CLOCK_TONES as k (k)}<option value={k}>{t(`clocks.tone.${k}` as never)}</option>{/each}
        </select>
        <span class="n">{c.filled}/{c.segments}</span>
      </div>
    </div>
  </div>
{/each}

<div class="add">
  <input type="text" bind:this={newTitle} placeholder={t('clocks.new')} title={t('clocks.newHint')} onkeydown={(e) => e.key === 'Enter' && add(e.currentTarget)} />
</div>
<div class="add">
  <select bind:value={segments} title={t('clocks.segments')}>
    {#each CLOCK_SIZES as n (n)}<option value={n}>{n}</option>{/each}
  </select>
  <select bind:value={tone} title={t('clocks.tone')}>
    {#each CLOCK_TONES as k (k)}<option value={k}>{t(`clocks.tone.${k}` as never)}</option>{/each}
  </select>
  <button class="icon-btn" title={t('clocks.add')} onclick={() => newTitle && add(newTitle)}><Plus size={14} /></button>
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .seg {
    display: flex;
    margin-left: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    padding: 1px 7px;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
  }
  .seg button.on {
    background: var(--accent);
    color: var(--on-accent);
  }
  .clock {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }
  .clock.hidden .face,
  .clock.hidden .title {
    opacity: 0.5;
  }
  .face {
    flex: none;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    cursor: pointer;
  }
  .clock.full .face {
    filter: drop-shadow(0 0 4px currentColor);
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .line {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .title {
    flex: 1;
    min-width: 0;
    padding: 1px 4px;
    border-color: transparent;
    background: none;
    font-weight: 600;
  }
  .title:hover,
  .title:focus {
    border-color: var(--border);
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
  .meta select {
    padding: 0 2px;
    font-size: 11px;
  }
  .n {
    margin-left: auto;
    color: var(--text-faint);
    font-size: 11px;
  }
  .add {
    display: flex;
    gap: 4px;
    margin-top: 6px;
  }
  .add input {
    flex: 1;
    min-width: 0;
  }
  .add select {
    flex: 1;
    font-size: 12px;
  }
</style>
