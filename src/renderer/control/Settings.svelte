<!-- Settings window: the General section (interface language, theme, updates), a section of every module that has
     settings, and About (version, links, license, credits). -->
<script lang="ts">
  import { THEMES, type ThemeSetting } from '../../shared/vault';
  import { Globe, Info, X } from '@lucide/svelte';
  import About from './About.svelte';
  import { controlContributions } from '../lib/registry';
  import { dispatch, store } from '../lib/store.svelte';
  import { t } from '../lib/i18n.svelte';
  import { LANGS, type LangSetting } from '../../shared/i18n';
  import { workspace } from './workspace.svelte';
  import { onMount } from 'svelte';
  import type { UpdateInfo, UpdateSettings } from '../../shared/updates';
  import type { TitleBarSetting } from '../../shared/api';

  // Updates: the setting and the result of «Check now».
  let updates = $state<UpdateSettings>({ check: true });
  let version = $state('');
  let checking = $state(false);
  let found = $state<UpdateInfo | null>(null);
  // The title bar: works after a restart; in Windows and Linux — a beta.
  let titleBar = $state<TitleBarSetting | null>(null);
  const titleBarChanged = $derived(!!titleBar && (titleBar.now !== 'system') !== titleBar.on);
  onMount(async () => {
    titleBar = await window.api.titleBar();
    updates = await window.api.updateSettings();
    version = await window.api.appVersion();
  });
  async function checkNow() {
    checking = true;
    found = await window.api.checkForUpdates();
    version = found.current;
    checking = false;
  }

  const GENERAL = 'general';
  const ABOUT = 'about';
  const moduleSections = controlContributions.filter((c) => c.settings);
  const about = $derived(workspace.settingsSection === ABOUT);
  // A section that is not set or gone — the first one.
  const general = $derived(workspace.settingsSection === GENERAL || !workspace.settingsSection);
  const current = $derived(general ? null : (moduleSections.find((c) => c.id === workspace.settingsSection) ?? null));

  const close = () => (workspace.settingsOpen = false);

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={t('app.settings')}>
    <nav class="nav">
      <div class="pane-title">{t('app.settings')}</div>
      <button class="nav-item" class:active={!about && (general || !current)} onclick={() => (workspace.settingsSection = GENERAL)}>
        <Globe size={14} />
        {t('settings.general')}
      </button>
      {#each moduleSections as c (c.id)}
        {@const Icon = c.settingsIcon ?? c.icon}
        <button class="nav-item" class:active={current?.id === c.id} onclick={() => (workspace.settingsSection = c.id)}>
          <Icon size={14} />
          {c.settingsTitle ?? c.title}
        </button>
      {/each}
      <button class="nav-item about-item" class:active={about} onclick={() => (workspace.settingsSection = ABOUT)}>
        <Info size={14} />
        {t('settings.about')}
      </button>
    </nav>

    <section class="content">
      <button class="icon-btn close" title={t('app.closeEsc')} onclick={close}><X size={16} /></button>

      {#if about}
        <h2>{t('settings.about')}</h2>
        <About />
      {:else if general || !current}
        <h2>{t('settings.general')}</h2>
        <div class="setting">
          <div class="info">
            <div class="name">{t('settings.language')}</div>
            <div class="desc">{t('settings.languageDesc')}</div>
          </div>
          <select
            value={store.state.vault.language}
            onchange={(e) => dispatch('vault', 'setLanguage', { language: e.currentTarget.value as LangSetting })}
          >
            <option value="auto">{t('settings.languageAuto', { lang: LANGS[store.state.vault.lang] })}</option>
            {#each Object.entries(LANGS) as [id, name] (id)}<option value={id}>{name}</option>{/each}
          </select>
        </div>
        <div class="setting">
          <div class="info">
            <div class="name">{t('settings.theme')}</div>
            <div class="desc">{t('settings.themeDesc')}</div>
          </div>
          <select value={store.state.vault.theme} onchange={(e) => dispatch('vault', 'setTheme', { theme: e.currentTarget.value as ThemeSetting })}>
            {#each THEMES as id (id)}<option value={id}>{t(`settings.theme.${id}` as never)}</option>{/each}
          </select>
        </div>
        {#if titleBar}
          <div class="setting">
            <div class="info">
              <div class="name">{t('settings.titleBar')}{#if !titleBar.byDefault}<span class="beta">{t('settings.beta')}</span>{/if}</div>
              <div class="desc">{t(titleBar.byDefault ? 'settings.titleBarDesc' : 'settings.titleBarDescBeta')}</div>
              {#if titleBarChanged}
                <div class="desc status">{t('settings.titleBarRestart')} <button class="link" onclick={() => window.api.relaunch()}>{t('settings.restartNow')}</button></div>
              {/if}
            </div>
            <label class="check"><input type="checkbox" checked={titleBar.on} onchange={async (e) => (titleBar = await window.api.setTitleBar(e.currentTarget.checked))} /> {t('settings.titleBarOn')}</label>
          </div>
        {/if}
        <div class="setting">
          <div class="info">
            <div class="name">{t('updates.title')}</div>
            <div class="desc">{t('updates.desc', { version })}</div>
            {#if checking}<div class="desc">{t('updates.checking')}</div>
            {:else if found}
              <div class="desc status">
                {#if found.latest === null}{t('updates.failed')}
                {:else if found.newer}{t('updates.newer', { version: found.latest })}
                  <button class="link" onclick={() => found && window.api.openRelease(found.url)}>{t('updates.download')}</button>
                {:else}{t('updates.upToDate')}{/if}
              </div>
            {/if}
          </div>
          <label class="check"><input type="checkbox" checked={updates.check} onchange={async (e) => (updates = await window.api.setUpdateSettings({ check: e.currentTarget.checked }))} /> {t('updates.onLaunch')}</label>
          <button class="btn" disabled={checking} onclick={checkNow}>{t('updates.checkNow')}</button>
        </div>
      {:else if current?.settings}
        <h2>{current.settingsTitle ?? current.title}</h2>
        <current.settings ms={store.state[current.id]} app={store.state} />
      {/if}
    </section>
  </div>
</div>

<style>
  .beta {
    margin-left: 6px;
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--accent-soft, var(--bg-active));
    color: var(--accent);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    vertical-align: 1px;
  }
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
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
    display: flex;
    flex-direction: column;
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
  .about-item {
    margin-top: auto;
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
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .status {
    color: var(--text-normal);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
</style>
