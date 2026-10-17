<!-- Правая панель (приключения Fate): аспекты сцены с бесплатными призывами и жетоны судьбы персонажей и мастера.
     У заголовка — в каком углу экрана игроков и показывать ли это им. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Eye, EyeOff, Minus, Plus, RefreshCw, UsersRound, X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { assetUrl, thumb } from '../../../shared/vault';
  import { MAX_INVOKES } from '../types';
  import { addParty } from './party';
  import CornerPick from './CornerPick.svelte';

  let { ms }: ModuleProps<'fate'> = $props();

  let hiddenNew = $state(false);
  let status = $state('');
  const flash = (t: string) => ((status = t), setTimeout(() => (status = ''), 3000));

  function add(input: HTMLInputElement) {
    if (!input.value.trim()) return;
    dispatch('fate', 'addAspect', { text: input.value, hidden: hiddenNew });
    input.value = '';
  }

  async function party() {
    const n = await addParty();
    flash(n ? t('fate.charactersN', { count: n }) : t('fate.noFateCards'));
  }

  function clearAspects() {
    if (confirm(t('fate.clearConfirm'))) dispatch('fate', 'clearAspects');
  }
</script>

<div class="head">
  <span class="label">{t('fate.sceneAspects')}</span>
  <CornerPick value={ms.place.aspects} what={t('fate.aspects')} onpick={(c) => dispatch('fate', 'setPlace', { aspects: c })} />
  <button
    class="icon-btn"
    class:off={!ms.show.aspects}
    title={ms.show.aspects ? t('fate.aspectsShown') : t('fate.aspectsHidden')}
    onclick={() => dispatch('fate', 'setShow', { aspects: !ms.show.aspects })}
  >
    {#if ms.show.aspects}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
  </button>
  {#if ms.aspects.length}<button class="icon-btn" title={t('fate.newSceneAspects')} onclick={clearAspects}><RefreshCw size={13} /></button>{/if}
</div>

{#each ms.aspects as a (a.id)}
  <div class="aspect" class:hidden={a.hidden}>
    <input
      class="text"
      type="text"
      value={a.text}
      title={t('fate.editAspect')}
      onchange={(e) => dispatch('fate', 'updateAspect', { id: a.id, changes: { text: e.currentTarget.value } })}
    />
    <span class="invokes" title={t('fate.invokesHint')}>
      {#each { length: a.invokes } as _, i (i)}
        <button class="dot" aria-label={t('fate.spendInvoke')} onclick={() => dispatch('fate', 'updateAspect', { id: a.id, changes: { invokes: a.invokes - 1 } })}></button>
      {/each}
      {#if a.invokes < MAX_INVOKES}
        <button class="more" title={t('fate.addInvoke')} onclick={() => dispatch('fate', 'updateAspect', { id: a.id, changes: { invokes: a.invokes + 1 } })}>+</button>
      {/if}
    </span>
    <button
      class="icon-btn"
      title={a.hidden ? t('fate.aspectHidden') : t('fate.hideFromPlayers')}
      onclick={() => dispatch('fate', 'updateAspect', { id: a.id, changes: { hidden: !a.hidden } })}
    >
      {#if a.hidden}<EyeOff size={13} />{:else}<Eye size={13} />{/if}
    </button>
    <button class="icon-btn" title={t('fate.remove')} onclick={() => dispatch('fate', 'removeAspect', { id: a.id })}><X size={13} /></button>
  </div>
{/each}

<div class="add">
  <input
    type="text"
    placeholder={t('fate.newAspect')}
    title={t('fate.newAspectHint')}
    onkeydown={(e) => e.key === 'Enter' && add(e.currentTarget)}
  />
  <button
    class="icon-btn"
    class:off={hiddenNew}
    title={hiddenNew ? t('fate.newHidden') : t('fate.newShown')}
    onclick={() => (hiddenNew = !hiddenNew)}
  >
    {#if hiddenNew}<EyeOff size={13} />{:else}<Eye size={13} />{/if}
  </button>
</div>

<div class="head points-head">
  <span class="label">{t('fate.fatePoints')}</span>
  <CornerPick value={ms.place.points} what={t('fate.points')} onpick={(c) => dispatch('fate', 'setPlace', { points: c })} />
  <button
    class="icon-btn"
    class:off={!ms.show.points}
    title={ms.show.points ? t('fate.pointsShown') : t('fate.pointsHidden')}
    onclick={() => dispatch('fate', 'setShow', { points: !ms.show.points })}
  >
    {#if ms.show.points}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
  </button>
</div>

{#each ms.holders as h (h.id)}
  <div class="holder">
    <span class="avatar">{#if h.portrait}<img src={thumb(assetUrl(h.portrait), 48)} alt="" />{:else}{h.name.slice(0, 1).toUpperCase()}{/if}</span>
    <span class="name" title={t('fate.refresh', { n: h.refresh })}>{h.name}</span>
    <button class="icon-btn" title={t('fate.spendPoint')} disabled={!h.points} onclick={() => dispatch('fate', 'points', { id: h.id, delta: -1 })}><Minus size={13} /></button>
    <span class="n">{h.points}</span>
    <button class="icon-btn" title={t('fate.givePoint')} onclick={() => dispatch('fate', 'points', { id: h.id, delta: 1 })}><Plus size={13} /></button>
    <button class="icon-btn rm" title={t('fate.removeFromList')} onclick={() => dispatch('fate', 'removeHolder', { id: h.id })}><X size={13} /></button>
  </div>
{/each}

<div class="holder gm">
  <span class="name">{t('fate.gm')}</span>
  <button class="icon-btn" title={t('fate.spendPoint')} disabled={!ms.gm} onclick={() => dispatch('fate', 'gm', { delta: -1 })}><Minus size={13} /></button>
  <span class="n">{ms.gm}</span>
  <button class="icon-btn" title={t('fate.addPoint')} onclick={() => dispatch('fate', 'gm', { delta: 1 })}><Plus size={13} /></button>
  <button class="icon-btn rm" title={t('fate.gmNewScene')} onclick={() => dispatch('fate', 'newScene')}><RefreshCw size={13} /></button>
</div>

<div class="row">
  <button class="btn" title={t('fate.partyHint')} onclick={party}><UsersRound size={13} /> {t('fate.party')}</button>
  <button
    class="btn"
    disabled={!ms.holders.length}
    title={t('fate.newSessionHint')}
    onclick={() => dispatch('fate', 'newSession')}
  >
    {t('fate.newSession')}
  </button>
</div>
{#if status}<p class="faint status">{status}</p>{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-bottom: 4px;
  }
  .points-head {
    margin-top: 12px;
  }
  .label {
    flex: 1;
    color: var(--text-muted);
    font-size: 12px;
  }
  .off {
    color: var(--accent);
  }
  .aspect {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .aspect.hidden .text {
    color: var(--text-faint);
    font-style: italic;
  }
  .text {
    flex: 1;
    min-width: 0;
    padding: 2px 4px;
    border-color: transparent;
    background: none;
    font-style: italic;
  }
  .text:hover,
  .text:focus {
    border-color: var(--border);
  }
  .invokes {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .dot {
    width: 10px;
    height: 10px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }
  .dot:hover {
    opacity: 0.5;
  }
  .more {
    width: 16px;
    height: 16px;
    padding: 0;
    border: 1px dashed var(--border);
    border-radius: 50%;
    background: none;
    color: var(--text-faint);
    font-size: 11px;
    line-height: 1;
    cursor: pointer;
  }
  .more:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .add {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }
  .add input {
    flex: 1;
    min-width: 0;
  }
  .holder {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 2px 0;
  }
  .avatar {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg-active);
    font-size: 11px;
    font-weight: 600;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .gm .name {
    padding-left: 28px;
    color: var(--text-muted);
  }
  .n {
    min-width: 18px;
    font-weight: 600;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .rm {
    color: var(--text-faint);
  }
  .row {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }
  .status {
    margin: 4px 0 0;
    font-size: 12px;
  }
</style>
