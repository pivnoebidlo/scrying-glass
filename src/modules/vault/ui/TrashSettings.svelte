<!-- Настройки корзины (раздел «Файлы»): удалять в корзину или сразу, автоочистка. Общие для всех хранилищ. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { onMount } from 'svelte';
  import { daysTitle, loadTrash, setTrashSettings, trash, TRASH_DAYS } from './trash.svelte';

  onMount(loadTrash);
</script>

<h3>{t('vault.trash.title')}</h3>
<div class="setting">
  <div class="info">
    <div class="name">{t('vault.trash.deleted')}</div>
    <div class="desc">
      <Lead text={t('vault.trash.deletedDesc')} />
    </div>
  </div>
  <select value={trash.settings.keep ? 'trash' : 'delete'} onchange={(e) => setTrashSettings({ keep: e.currentTarget.value === 'trash' })}>
    <option value="trash">{t('vault.trash.toTrash')}</option>
    <option value="delete">{t('vault.trash.deleteNow')}</option>
  </select>
</div>
<div class="setting">
  <div class="info">
    <div class="name">{t('vault.trash.prune')}</div>
    <div class="desc">{t('vault.trash.pruneDesc')}</div>
  </div>
  <select value={trash.settings.days} onchange={(e) => setTrashSettings({ days: Number(e.currentTarget.value) })}>
    {#each TRASH_DAYS as d (d)}<option value={d}>{daysTitle(d)}</option>{/each}
  </select>
</div>

<style>
  select {
    max-width: 240px;
  }
</style>
