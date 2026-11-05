<!-- The description of a spell or a condition, over the sheet: a link opens it (entry/peek.svelte.ts, the same as in the
     GM's window) and the core answers only for what this sheet names. -->
<script lang="ts">
  import type { Component } from 'svelte';
  import { X } from '@lucide/svelte';
  import type { Entry } from '../../shared/compendium';
  import { closeEntryPeek, entryPeek } from '../lib/entry/peek.svelte';
  import { t } from '../lib/i18n.svelte';

  let { api }: { api: (what: string) => string } = $props();

  const name = $derived(entryPeek.names?.[0] ?? null);
  let entry = $state.raw<Entry | null>(null);
  let missing = $state(false);
  let Card = $state.raw<Component<{ entry: Entry }> | null>(null);

  $effect(() => {
    const asked = name;
    entry = null;
    missing = false;
    if (!asked) return;
    let stale = false;
    void (async () => {
      try {
        const res = await fetch(`${api('entry')}?name=${encodeURIComponent(asked)}`);
        const found = res.ok ? ((await res.json()) as Entry) : null;
        Card ??= (await import('../lib/entry/EntryCard.svelte')).default as Component<{ entry: Entry }>;
        if (stale) return;
        entry = found;
        missing = !found;
      } catch {
        if (!stale) missing = true;
      }
    })();
    return () => (stale = true);
  });

  // The sheet stays where it was under the panel.
  $effect(() => {
    if (!name) return;
    document.documentElement.classList.add('locked');
    return () => document.documentElement.classList.remove('locked');
  });
</script>

{#if name}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && closeEntryPeek()}>
    <div class="panel" role="dialog" aria-label={name}>
      <button class="close" aria-label={t('pl.close')} onclick={closeEntryPeek}><X size={20} /></button>
      {#if entry && Card}
        <Card {entry} />
      {:else if missing}
        <h2>{name}</h2>
        <p>{t('pl.page.noEntry')}</p>
      {:else}
        <p>{t('pl.page.loading')}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(html:root.locked) {
    overflow: hidden;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .panel {
    position: relative;
    width: 100%;
    max-width: 760px;
    max-height: 85dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--border);
    border-radius: var(--radius-m) var(--radius-m) 0 0;
    background: var(--bg-primary);
  }
  .close {
    position: sticky;
    top: 0;
    z-index: 1;
    float: right;
    display: grid;
    place-items: center;
    padding: 6px;
    border: none;
    border-radius: 50%;
    background: var(--bg-hover);
  }
  h2 {
    margin: 0 0 8px;
    font-size: 18px;
  }
  p {
    margin: 0;
    color: var(--text-muted);
  }
</style>
