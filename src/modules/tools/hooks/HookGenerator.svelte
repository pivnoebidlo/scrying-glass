<!-- Adventure hook generator (Tools → Adventure hooks): a theme → who asks and how, the task with a deadline and what
     is at stake, the place, the foe, a twist and the reward. Each part can be rerolled or pinned; to the journal or
     copy. The current hook is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { Check, Copy, Compass, NotebookPen, Pin, RefreshCw } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { approachText } from './generate';
  import { createHook, hooks, rerollPart, rerollUnpinned, save, togglePin } from './store.svelte';
  import { hookMarkdown, type HookLabels } from './text';
  import { THEMES, type Hook, type HookPart } from './types';

  const h = $derived(hooks.hook);
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const labels = (x: Hook): HookLabels => ({
    theme: t(`hooks.theme.${x.theme}` as never),
    patron: t('hooks.part.patron'),
    task: t('hooks.part.task'),
    deadline: t('hooks.deadline'),
    stakes: t('hooks.stakes'),
    place: t('hooks.part.place'),
    foe: t('hooks.part.foe'),
    twist: t('hooks.part.twist'),
    reward: t('hooks.part.reward'),
  });
  // The journal page is named after the task: «Hook: find the missing caravan…».
  const title = (x: Hook) => {
    const words = x.task.split(' ');
    return t('hooks.pageTitle', { task: words.length > 7 ? `${words.slice(0, 7).join(' ')}…` : x.task });
  };

  let copied = $state(false);
  function copy() {
    if (!h) return;
    void navigator.clipboard.writeText(hookMarkdown(h, labels(h), title(h)));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!h) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), title(h).replace(/[\\/:*?"<>|]/g, ''), hookMarkdown(h, labels(h)));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

{#snippet part(id: HookPart, body: Snippet, wide = false)}
  <section class="part" class:wide class:pinned={hooks.pinned.includes(id)}>
    <header>
      <h3>{t(`hooks.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => rerollPart(id)}><RefreshCw size={13} /></button>
      <button class="icon-btn pin" class:on={hooks.pinned.includes(id)} title={hooks.pinned.includes(id) ? t('tavern.unpin') : t('tavern.pin')} onclick={() => togglePin(id)}>
        <Pin size={13} />
      </button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('hooks.title')}</h2>
    <div class="spacer"></div>
    {#if h}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('hooks.about')} /></p>

  <div class="options">
    <label>{t('hooks.theme')}
      <select bind:value={hooks.theme} onchange={save}>
        <option value="random">{t('settlement.random')}</option>
        {#each THEMES as id (id)}<option value={id}>{t(`hooks.theme.${id}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={createHook}><Compass size={16} /> {t('hooks.create')}</button>
    {#if h}<button class="btn" onclick={rerollUnpinned}><RefreshCw size={14} /> {t('tavern.reroll')}</button>{/if}
  </div>

  {#if !h}
    <p class="faint placeholder">{t('hooks.empty')}</p>
  {:else}
    <div class="sheet">
      {#snippet patronBody()}
        <p class="opening">{cap(approachText(h))}.</p>
        <p class="faint">{h.patron.name} — {h.patron.trait}.</p>
      {/snippet}
      {@render part('patron', patronBody, true)}
      {#snippet taskBody()}
        <p class="task">{cap(h.task)}.</p>
        <p><b>{t('hooks.deadline')}:</b> {h.deadline}</p>
        <p><b>{t('hooks.stakes')}:</b> {h.stakes}</p>
        <p class="faint">{t(`hooks.theme.${h.theme}` as never)}</p>
      {/snippet}
      {@render part('task', taskBody, true)}
      {#snippet placeBody()}<p>{cap(h.place)}.</p>{/snippet}
      {@render part('place', placeBody)}
      {#snippet foeBody()}<p>{cap(h.foe)}.</p>{/snippet}
      {@render part('foe', foeBody)}
      {#snippet twistBody()}<p>{cap(h.twist)}.</p>{/snippet}
      {@render part('twist', twistBody)}
      {#snippet rewardBody()}<p>{cap(h.reward)}.</p>{/snippet}
      {@render part('reward', rewardBody)}
    </div>
  {/if}
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .about {
    margin: 6px 0 12px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
  }
  .options label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin: 12px 0 16px;
  }
  .big {
    padding: 6px 18px;
    font-size: 15px;
  }
  .placeholder {
    font-style: italic;
  }
  .sheet {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 10px;
  }
  .part {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .part.wide {
    grid-column: 1 / -1;
  }
  .part.pinned {
    border-color: var(--accent);
  }
  .part header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .part h3 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .pin {
    color: var(--text-faint);
  }
  .pin.on {
    color: var(--accent);
  }
  .part p {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .opening {
    padding: 4px 10px;
    border-left: 3px solid var(--accent);
    background: var(--bg-primary);
    font-style: italic;
  }
  .task {
    font-size: 16px;
  }
</style>
