<!-- Окно настроек: общие разделы + раздел каждого модуля. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { controlContributions } from '../lib/registry';
  import { store } from '../lib/store.svelte';
  import { workspace } from './workspace.svelte';

  const moduleSections = controlContributions.filter((c) => c.settings);
  const current = $derived(moduleSections.find((c) => c.id === workspace.settingsSection));

  const close = () => (workspace.settingsOpen = false);

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label="Настройки">
    <nav class="nav">
      <div class="pane-title">Настройки</div>
      <button class="nav-item" class:active={workspace.settingsSection === 'general'} onclick={() => (workspace.settingsSection = 'general')}>
        Общие
      </button>
      {#if moduleSections.length}
        <div class="pane-title">Модули</div>
        {#each moduleSections as c (c.id)}
          <button class="nav-item" class:active={workspace.settingsSection === c.id} onclick={() => (workspace.settingsSection = c.id)}>
            <c.icon size={14} />
            {c.title}
          </button>
        {/each}
      {/if}
    </nav>

    <section class="content">
      <button class="icon-btn close" title="Закрыть (Esc)" onclick={close}><X size={16} /></button>

      {#if current?.settings}
        <h2>{current.title}</h2>
        <current.settings ms={store.state[current.id]} state={store.state} />
      {:else}
        <h2>Общие</h2>
        <div class="setting">
          <div class="info">
            <div class="name">Папка с данными кампании</div>
            <div class="desc">Здесь хранятся настройки и картинки, добавленные вручную.</div>
          </div>
          <button class="btn" onclick={() => window.api.revealCampaign()}>Открыть папку</button>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.55);
  }
  .modal {
    display: flex;
    width: min(900px, calc(100vw - 80px));
    height: min(640px, calc(100vh - 80px));
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .nav {
    width: 200px;
    flex: none;
    padding: 4px 8px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    overflow: auto;
  }
  .nav .pane-title {
    padding-left: 8px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .nav-item.active {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .content {
    position: relative;
    flex: 1;
    padding: 20px 28px;
    overflow: auto;
    user-select: text;
  }
  .close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  h2 {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
  }
  /* Строка настройки в духе Obsidian: описание слева, элемент управления справа.
     :global — чтобы разделы модулей могли использовать ту же разметку. */
  .content :global(.setting) {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    border-top: 1px solid var(--border);
  }
  .content :global(.setting .info) {
    flex: 1;
    min-width: 0;
  }
  .content :global(.setting .name) {
    margin-bottom: 3px;
  }
  .content :global(.setting .desc) {
    color: var(--text-muted);
    font-size: 12px;
  }
  .content :global(h3) {
    margin: 24px 0 4px;
    font-size: 14px;
    font-weight: 600;
  }
</style>
