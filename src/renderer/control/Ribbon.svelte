<!-- Узкая полоса слева: модули сверху, настройки снизу. «Файлы» — в строке заголовка над боковой панелью (Sidebar). -->
<script lang="ts">
  import { Settings } from '@lucide/svelte';
  import { controlContributions } from '../lib/registry';
  import { TITLE_ROW, workspace } from './workspace.svelte';
  import { t } from '../lib/i18n.svelte';

  // В полосе только модули, у которых есть вкладка или боковая панель.
  const items = controlContributions.filter((c) => (c.view || c.sidebar) && !TITLE_ROW.includes(c.id));
</script>

<nav class="ribbon">
  <!-- The title row (the traffic lights stand here in macOS without the system title bar; drags the window). -->
  <div class="title-space drag"></div>
  {#each items as c (c.id)}
    <button
      class="icon-btn"
      class:active={workspace.sidebar === c.id && workspace.sidebarOpen}
      title={c.title}
      onclick={() => workspace.select(c.id)}
    >
      <c.icon size={18} />
    </button>
  {/each}
  <div class="spacer"></div>
  <button class="icon-btn" title={t('app.settingsHotkey')} onclick={() => workspace.openSettings()}>
    <Settings size={18} />
  </button>
</nav>

<style>
  .ribbon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 44px;
    flex: none;
    padding: 10px 0;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
  }
  .spacer {
    flex: 1;
  }
  /* One strip with the tab bar, as in Obsidian: over the ribbon's border, with the line under the whole title row. */
  .title-space {
    display: block;
    flex: none;
    align-self: stretch;
    height: var(--title-h);
    margin: -10px -1px 0 0;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
  }
  .icon-btn {
    width: 32px;
    height: 32px;
  }
</style>
