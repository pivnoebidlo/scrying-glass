<!-- The player screen at a glance: a dot (closed — grey, open — green, blacked out — yellow), and with `controls` —
     open / close it and black it out. In the title of the right panel and, with the panel hidden, at the end of the
     tab bar. -->
<script lang="ts">
  import { Monitor, MonitorOff, Moon, Sun } from '@lucide/svelte';
  import { dispatch, store } from '../lib/store.svelte';
  import { t } from '../lib/i18n.svelte';
  import { workspace } from './workspace.svelte';

  let { controls = true }: { controls?: boolean } = $props();

  const display = $derived(workspace.display);
  const status = $derived(!store.displayOpen ? 'closed' : store.state.core.blackout ? 'dark' : 'open');
  const label = $derived(t(status === 'closed' ? 'screen.statusClosed' : status === 'dark' ? 'screen.statusDark' : 'screen.statusOpen'));

  function toggleDisplay() {
    if (store.displayOpen) window.api.closeDisplay();
    else if (display) window.api.openDisplay(display.id);
  }
</script>

<span class="status">
  <span class="dot {status}" title={label} role="img" aria-label={label}></span>
  {#if controls}
    <button class="icon-btn" title={store.displayOpen ? t('screen.closeHint') : t('screen.openHint')} disabled={!display} onclick={toggleDisplay}>
      {#if store.displayOpen}<MonitorOff size={16} />{:else}<Monitor size={16} />{/if}
    </button>
    <button class="icon-btn" class:on={store.state.core.blackout} title={store.state.core.blackout ? t('screen.restoreHint') : t('screen.blackoutHint')} onclick={() => dispatch('core', 'toggleBlackout')}>
      {#if store.state.core.blackout}<Sun size={16} />{:else}<Moon size={16} />{/if}
    </button>
  {/if}
</span>

<style>
  .status {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .dot {
    width: 8px;
    height: 8px;
    margin: 0 6px;
    border-radius: 50%;
    background: var(--text-faint);
  }
  .dot.open {
    background: var(--success);
    box-shadow: 0 0 6px color-mix(in srgb, var(--success) 60%, transparent);
  }
  .dot.dark {
    background: var(--warning);
  }
  .icon-btn {
    width: 28px;
    height: 28px;
  }
  .icon-btn.on {
    color: var(--warning);
  }
</style>
