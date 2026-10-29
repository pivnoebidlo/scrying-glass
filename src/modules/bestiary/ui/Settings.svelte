<!-- Раздел настроек «Карточки»: где лежит библиотека карточек; разделы систем (SystemUi.cardSettings). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { systemUis } from '../../../systems/ui';

  let {}: ModuleProps<'bestiary'> = $props();

  let lib = $state<{ path: string | null; isDefault: boolean }>({ path: null, isDefault: true });
  const refresh = async () => (lib = await window.api.library());
  onMount(refresh);

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

<!-- What the systems add here (D&D: the LSS spell table). -->
{#each systemUis as u (u.family)}
  {#if u.cardSettings}<u.cardSettings />{/if}
{/each}

<style>
  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
