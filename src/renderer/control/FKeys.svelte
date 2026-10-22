<!-- The old school theme's bottom bar, as in a DOS file manager: ten F-keys, the working ones with a label — F1 help
     (Settings → Hotkeys), F2 settings, F7 search, F10 exit (back to the theme before). A click does the same. -->
<script lang="ts">
  import { t } from '../lib/i18n.svelte';
  import { openQuickSearch } from '../lib/quicksearch.svelte';
  import { dispatch, store } from '../lib/store.svelte';
  import { workspace } from './workspace.svelte';

  const ACTIONS: Record<number, { label: string; run: () => void }> = {
    1: { label: 'fkeys.help', run: () => workspace.openSettings('hotkeys') },
    2: { label: 'fkeys.settings', run: () => workspace.openSettings() },
    7: { label: 'fkeys.search', run: openQuickSearch },
    10: { label: 'fkeys.exit', run: () => dispatch('vault', 'setTheme', { theme: store.state.vault.themeBefore }) },
  };
  const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  function onkeydown(e: KeyboardEvent) {
    const n = /^F(\d{1,2})$/.exec(e.key)?.[1];
    const a = n && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey ? ACTIONS[Number(n)] : undefined;
    if (!a) return;
    e.preventDefault();
    a.run();
  }
</script>

<svelte:window {onkeydown} />

<nav class="fkeys">
  {#each KEYS as n (n)}
    {@const a = ACTIONS[n]}
    <button disabled={!a} onclick={() => a?.run()}><span class="n">{n}</span><span class="label">{a ? t(a.label as never) : ''}</span></button>
  {/each}
</nav>

<style>
  .fkeys {
    display: flex;
    flex: none;
    height: 20px;
    background: #000000;
    font-family: var(--font-ui);
    font-size: 16px;
    line-height: 20px;
  }
  button {
    display: flex;
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  button:disabled {
    cursor: default;
  }
  .n {
    padding: 0 2px 0 6px;
    color: #c0c0c0;
  }
  .label {
    flex: 1;
    overflow: hidden;
    background: #00aaaa;
    color: #000000;
    text-align: left;
    white-space: nowrap;
  }
  button:not(:disabled):hover .label {
    background: #55ffff;
  }
</style>
