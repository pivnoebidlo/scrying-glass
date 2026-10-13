<!-- Окно управления: полоса модулей | боковая панель | вкладки | экран игроков. -->
<script lang="ts">
  import Ribbon from './Ribbon.svelte';
  import Sidebar from './Sidebar.svelte';
  import Tabs from './Tabs.svelte';
  import ScreenPanel from './ScreenPanel.svelte';
  import Settings from './Settings.svelte';
  import Welcome from './Welcome.svelte';
  import RollLog from '../lib/RollLog.svelte';
  import { dispatch, store } from '../lib/store.svelte';
  import { controlContributions } from '../lib/registry';

  const backgrounds = controlContributions.filter((c) => c.background);
  import { workspace } from './workspace.svelte';

  function onkeydown(e: KeyboardEvent) {
    // Cmd/Ctrl + , — настройки, как в Obsidian.
    if ((e.metaKey || e.ctrlKey) && e.key === ',' && store.state.vault.root) {
      e.preventDefault();
      workspace.openSettings();
    }
    // Cmd/Ctrl + B — погасить экран игроков и вернуть (не во время ввода текста).
    const t = e.target as HTMLElement | null;
    const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || !!t?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.code === 'KeyB' && store.state.vault.root && !typing) {
      e.preventDefault();
      dispatch('core', 'toggleBlackout');
    }
  }
</script>

<svelte:window {onkeydown} />

{#if !store.state.vault.root}
  <Welcome />
{:else}
  <div class="app">
    <Ribbon />
    {#if workspace.sidebarOpen && workspace.sidebar}
      <Sidebar />
    {/if}
    <Tabs />
    <ScreenPanel />
  </div>

  <!-- Невидимые части модулей, например проигрыватель музыки. -->
  {#each backgrounds as c (c.id)}
    {#if c.background}<c.background ms={store.state[c.id]} app={store.state} />{/if}
  {/each}

  <RollLog />

  {#if workspace.settingsOpen}
    <Settings />
  {/if}
{/if}

<style>
  .app {
    display: flex;
    height: 100vh;
  }
</style>
