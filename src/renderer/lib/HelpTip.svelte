<!-- A «(?)» button: a click opens a card with the explanation next to it (not on hover — nothing hides until hover
     here). Esc or a click outside closes it. The text is plain, an empty line starts a paragraph; `children` — any
     markup instead. -->
<script lang="ts">
  import { CircleHelp } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { t } from './i18n.svelte';

  let { text = '', title, size = 14, children }: { text?: string; title?: string; size?: number; children?: Snippet } = $props();

  let open = $state(false);
  let btn = $state<HTMLButtonElement>();
  let card = $state<HTMLDivElement>();
  let pos = $state({ left: 0, top: 0 });

  // Under the button, kept inside the window; above it when there is no room below.
  $effect(() => {
    if (!open || !card || !btn) return;
    const b = btn.getBoundingClientRect();
    const r = card.getBoundingClientRect();
    const below = b.bottom + 6 + r.height <= innerHeight - 4;
    pos = {
      left: Math.max(4, Math.min(b.left + b.width / 2 - r.width / 2, innerWidth - r.width - 4)),
      top: below ? b.bottom + 6 : Math.max(4, b.top - 6 - r.height),
    };
  });
  const paragraphs = $derived(text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean));

  function onkeydown(e: KeyboardEvent) {
    if (!open || e.key !== 'Escape') return;
    e.stopPropagation();
    e.preventDefault();
    open = false;
  }
  function onpointerdown(e: PointerEvent) {
    const target = e.target as Node;
    if (open && !card?.contains(target) && !btn?.contains(target)) open = false;
  }
</script>

<svelte:window onkeydowncapture={onkeydown} onpointerdowncapture={onpointerdown} onblur={() => (open = false)} />

<button
  bind:this={btn}
  type="button"
  class="help-tip"
  class:open
  title={title ?? t('lib.help')}
  aria-label={title ?? t('lib.help')}
  aria-expanded={open}
  onclick={(e) => (e.stopPropagation(), (open = !open))}><CircleHelp {size} /></button
>

{#if open}
  <div class="help-card" role="dialog" bind:this={card} style:left="{pos.left}px" style:top="{pos.top}px">
    {#if children}
      {@render children()}
    {:else}
      {#each paragraphs as p, i (i)}<p>{p}</p>{/each}
    {/if}
  </div>
{/if}

<style>
  .help-tip {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--text-faint);
    vertical-align: middle;
    cursor: pointer;
  }
  .help-tip:hover,
  .help-tip.open {
    color: var(--accent);
  }
  .help-card {
    position: fixed;
    -webkit-app-region: no-drag;
    z-index: 210;
    width: max-content;
    max-width: min(380px, calc(100vw - 8px));
    max-height: 60vh;
    padding: 10px 12px;
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    color: var(--text-normal);
    font-size: 13px;
    font-weight: normal;
    line-height: 1.45;
    letter-spacing: normal;
    text-align: left;
    text-transform: none;
    white-space: pre-line;
  }
  .help-card p {
    margin: 0;
  }
  .help-card p + p {
    margin-top: 8px;
  }
</style>
