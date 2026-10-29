<!-- What the repository is doing right now (packing, uploading, downloading) with a progress bar, or how it ended:
     a plate with the other notices (lib/dock.ts), wherever the work was started from. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { mb, repo } from './repo.svelte';
  import { dock } from '../../../renderer/lib/dock';

  const p = $derived(repo.busy?.progress);
  const share = $derived(p && p.total ? Math.min(1, p.done / p.total) : null);
</script>

{#if repo.busy}
  <div class="busy" use:dock>
    <div class="line">
      <span>{repo.busy.what}</span>
      {#if p}<span class="faint">{t(`repo.phase.${p.phase}`)} {p.total ? `${mb(p.done)} / ${mb(p.total)}` : mb(p.done)}</span>{/if}
    </div>
    <div class="bar" class:unknown={share === null}><div style:width={share === null ? '30%' : `${share * 100}%`}></div></div>
  </div>
{:else if repo.notice}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <p class="notice" use:dock onclick={() => (repo.notice = '')}>{repo.notice}</p>
{/if}

<style>
  .busy,
  .notice {
    width: min(380px, calc(100vw - 32px));
    margin: 0;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  }
  .notice {
    cursor: pointer;
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }
  .bar {
    height: 4px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--bg-active);
  }
  .bar div {
    height: 100%;
    background: var(--accent);
    transition: width 0.2s;
  }
  .bar.unknown div {
    animation: slide 1.2s ease-in-out infinite;
  }
  @keyframes slide {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(340%);
    }
  }
</style>
