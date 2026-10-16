<!-- Раздел настроек «Файлы»: какое хранилище открыто. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import RoleNames from './RoleNames.svelte';
  import TrashSettings from './TrashSettings.svelte';

  let { ms }: ModuleProps<'vault'> = $props();
  const others = $derived(ms.recent.filter((r) => r !== ms.root));
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('vault.settings.vault')}</div>
    <div class="desc path" title={ms.root}>{ms.root}</div>
  </div>
  <button class="btn" onclick={() => dispatch('vault', 'reveal', { folder: '' })}>{t('vault.reveal')}</button>
  <button class="btn primary" onclick={() => dispatch('vault', 'choose')}>{t('vault.settings.openOther')}</button>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('vault.settings.howTitle')}</div>
    <div class="desc">
      {t('vault.settings.how')}
    </div>
  </div>
</div>

{#if others.length}
  <h3>{t('vault.settings.recent')}</h3>
  {#each others as r (r)}
    <div class="setting">
      <div class="info"><div class="desc path" title={r}>{r}</div></div>
      <button class="btn" onclick={() => dispatch('vault', 'open', { root: r })}>{t('vault.settings.open')}</button>
      <button class="btn" onclick={() => dispatch('vault', 'forget', { root: r })}>{t('vault.settings.forget')}</button>
    </div>
  {/each}
{/if}

<RoleNames {ms} />

<TrashSettings />

<style>
  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
