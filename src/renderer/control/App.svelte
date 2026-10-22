<!-- Окно управления: полоса модулей | боковая панель | вкладки | экран игроков. -->
<script lang="ts">
  import { matches } from '../../shared/hotkeys';
  import Ribbon from './Ribbon.svelte';
  import Sidebar from './Sidebar.svelte';
  import Tabs from './Tabs.svelte';
  import ScreenPanel from './ScreenPanel.svelte';
  import Settings from './Settings.svelte';
  import Welcome from './Welcome.svelte';
  import RollLog from '../lib/RollLog.svelte';
  import Lightbox from '../lib/Lightbox.svelte';
  import UpdateBanner from './UpdateBanner.svelte';
  import { dispatch, store } from '../lib/store.svelte';
  import { controlContributions } from '../lib/registry';

  const backgrounds = controlContributions.filter((c) => c.background);
  import { workspace } from './workspace.svelte';
  // The app menu's «About» and «Settings…» (main/menu.ts).
  window.api.onOpenSettings((section) => workspace.openSettings(section));
  // The window made anew by the title bar setting (Settings.svelte) opens the settings where they were.
  try {
    const section = localStorage.getItem('openSettings');
    if (section !== null) {
      localStorage.removeItem('openSettings');
      workspace.openSettings(section);
    }
  } catch {
    /* no storage — the settings stay closed */
  }

  function onkeydown(e: KeyboardEvent) {
    // ⌘, — настройки, как в Obsidian (shared/hotkeys.ts: сочетания мастер может поменять).
    if (matches(e, 'settings') && store.state.vault.root) {
      e.preventDefault();
      workspace.openSettings();
    }
    // ⌘B — погасить экран игроков и вернуть (не во время ввода текста).
    const t = e.target as HTMLElement | null;
    const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || !!t?.isContentEditable;
    if (matches(e, 'blackout') && store.state.vault.root && !typing) {
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
    {#if workspace.panelOpen}<ScreenPanel />{/if}
  </div>

  <!-- Невидимые части модулей, например проигрыватель музыки. -->
  {#each backgrounds as c (c.id)}
    {#if c.background}<c.background ms={store.state[c.id]} app={store.state} />{/if}
  {/each}

  <RollLog />
  <Lightbox />
  <UpdateBanner />

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
