<!-- Раздел настроек «Карточки»: где лежит библиотека карточек. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';

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
      <Lead text={t('best.libraryAbout')} />
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
      <Lead text={t('best.builtinAbout')} />
    </div>
  </div>
</div>

<style>
  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
