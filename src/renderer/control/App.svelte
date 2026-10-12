<!-- Окно управления: полоса модулей | боковая панель | вкладки | экран игроков. -->
<script lang="ts">
  import Ribbon from './Ribbon.svelte';
  import Sidebar from './Sidebar.svelte';
  import Tabs from './Tabs.svelte';
  import ScreenPanel from './ScreenPanel.svelte';
  import Settings from './Settings.svelte';
  import { workspace } from './workspace.svelte';

  function onkeydown(e: KeyboardEvent) {
    // Cmd/Ctrl + , — настройки, как в Obsidian.
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      workspace.openSettings();
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="app">
  <Ribbon />
  {#if workspace.sidebarOpen && workspace.sidebar}
    <Sidebar />
  {/if}
  <Tabs />
  <ScreenPanel />
</div>

{#if workspace.settingsOpen}
  <Settings />
{/if}

<style>
  .app {
    display: flex;
    height: 100vh;
  }
</style>
