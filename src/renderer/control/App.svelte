<!-- Окно управления: полоса модулей | боковая панель | вкладки | экран игроков. -->
<script lang="ts">
  import Ribbon from './Ribbon.svelte';
  import Sidebar from './Sidebar.svelte';
  import Tabs from './Tabs.svelte';
  import ScreenPanel from './ScreenPanel.svelte';
  import Settings from './Settings.svelte';
  import Welcome from './Welcome.svelte';
  import { store } from '../lib/store.svelte';
  import { controlContributions } from '../lib/registry';

  const backgrounds = controlContributions.filter((c) => c.background);
  import { workspace } from './workspace.svelte';

  function onkeydown(e: KeyboardEvent) {
    // Cmd/Ctrl + , — настройки, как в Obsidian.
    if ((e.metaKey || e.ctrlKey) && e.key === ',' && store.state.vault.root) {
      e.preventDefault();
      workspace.openSettings();
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
