<!-- Раздел настроек «Карточки»: где лежит библиотека карточек; таблица заклинаний Long Story Short. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';

  let {}: ModuleProps<'bestiary'> = $props();

  let lib = $state<{ path: string | null; isDefault: boolean }>({ path: null, isDefault: true });
  const refresh = async () => (lib = await window.api.library());
  onMount(refresh);

  // Заклинания LSS (номер → название): для персонажей, у которых книга заклинаний в LSS — карточками.
  let lssSpells = $state(0);
  let lssStatus = $state('');
  const refreshLss = async () => (lssSpells = await window.api.lssSpellCount());
  onMount(refreshLss);

  async function loadLss() {
    const r = await window.api.importLssSpells();
    if (!r) return;
    lssStatus = [t('best.lssAdded', { added: r.total - r.before, total: r.total }), ...r.errors].join(' ');
    await refreshLss();
  }

  async function clearLss() {
    if (!confirm(t('best.lssClear'))) return;
    await window.api.clearLssSpells();
    lssStatus = '';
    await refreshLss();
  }

  async function choose(reset = false) {
    await window.api.chooseLibrary(reset);
    await refresh();
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('best.library')}</div>
    <div class="desc path" title={lib.path ?? ''}>{lib.path}</div>
    <div class="desc">
      {t('best.libraryAbout')}
    </div>
  </div>
  <button class="btn" onclick={() => window.api.revealLibrary()}>{t('best.reveal')}</button>
  <button class="btn primary" onclick={() => choose()}>{t('best.chooseFolder')}</button>
</div>
{#if !lib.isDefault}
  <div class="setting">
    <div class="info"><div class="desc">{t('best.customFolder')}</div></div>
    <button class="btn" onclick={() => choose(true)}>{t('best.defaultFolder')}</button>
  </div>
{/if}

<div class="setting">
  <div class="info">
    <div class="name">{t('best.builtin')}</div>
    <div class="desc">
      {t('best.builtinAbout')}
    </div>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('best.lssSpells')}</div>
    <div class="desc">
      {lssSpells ? t('best.lssLoaded', { count: lssSpells }) : t('best.lssNone')} {t('best.lssAbout')}
    </div>
    {#if lssStatus}<div class="desc status">{lssStatus}</div>{/if}
  </div>
  {#if lssSpells}<button class="btn" onclick={clearLss}>{t('best.clear')}</button>{/if}
  <button class="btn primary" onclick={loadLss}>{t('best.loadFiles')}</button>
</div>

<style>
  .status {
    color: var(--accent);
  }
  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
