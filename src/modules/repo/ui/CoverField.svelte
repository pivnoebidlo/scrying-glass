<!-- The cover of a publish dialog: a picture of the vault, a file of the disk or a picture of the clipboard (the core
     makes it a JPEG and keeps it till the publish: «outside:…»). keep — the published entry has a cover already. -->
<script lang="ts">
  import { ClipboardPaste, FolderOpen, ImagePlus } from '@lucide/svelte';
  import FilePicker from '../../../renderer/lib/FilePicker.svelte';
  import { thumb, vaultUrl, type VaultFolder } from '../../../shared/vault';
  import { t } from '../../../renderer/lib/i18n.svelte';

  let { cover = $bindable(), tree, keep = false }: { cover: string | null; tree: VaultFolder | null; keep?: boolean } = $props();

  let picking = $state(false);
  let preview = $state('');
  let problem = $state('');
  const outside = $derived(!!cover?.startsWith('outside:'));

  async function take(got: Promise<{ cover: string; preview: string } | null>, none: string) {
    problem = '';
    const r = await got;
    if (!r) return void (problem = none);
    cover = r.cover;
    preview = r.preview;
  }
</script>

<div class="field">
  <span>{t('repo.dialog.cover')}</span>
  <div class="cover-row">
    {#if cover}
      <img src={outside ? preview : thumb(vaultUrl(cover), 240)} alt="" />
      <button type="button" class="btn" onclick={() => (cover = null)}>{t('repo.dialog.noCover')}</button>
    {:else}
      <button type="button" class="btn" onclick={() => (picking = true)} disabled={!tree}><ImagePlus size={14} /> {t('repo.dialog.coverVault')}</button>
      <button type="button" class="btn" onclick={() => take(window.api.repoCoverFile(), '')}><FolderOpen size={14} /> {t('repo.dialog.coverFile')}</button>
      <button type="button" class="btn" onclick={() => take(window.api.repoCoverPaste(), t('repo.dialog.coverNoPicture'))}><ClipboardPaste size={14} /> {t('repo.dialog.coverPaste')}</button>
      {#if keep}<span class="faint small">{t('repo.dialog.coverKeep')}</span>{/if}
    {/if}
  </div>
  {#if problem}<span class="faint small">{problem}</span>{/if}
</div>
{#if picking && tree}
  <FilePicker {tree} prefer="backgrounds" onpick={(p) => ((cover = p[0] ?? null), (picking = false))} onclose={() => (picking = false)} />
{/if}

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .cover-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .cover-row img {
    width: 120px;
    height: 90px;
    border-radius: var(--radius-s);
    object-fit: cover;
  }
</style>
