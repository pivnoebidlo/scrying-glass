<!-- Publish an adventure to the repository (or a new version of the GM's own entry): title, description, language,
     cover, music; PDFs never go (books in a journal are seldom the GM's to share). The author confirms the content is
     theirs to share. Opens on repo.publish = <adventure>. -->
<script lang="ts">
  import { CloudUpload, ImagePlus, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { LANGS } from '../../../shared/i18n/core';
  import { LIMITS } from '../../../shared/repo';
  import { thumb, vaultUrl } from '../../../shared/vault';
  import { store } from '../../../renderer/lib/store.svelte';
  import { openSettings } from '../../../renderer/lib/nav';
  import FilePicker from '../../../renderer/lib/FilePicker.svelte';
  import { loadInfo, mb, publish, repo } from './repo.svelte';

  const adventure = $derived(repo.publish);
  const app = $derived(store.state);
  const mark = $derived(adventure ? app.repo.published[adventure] : undefined);
  // The entry as it is in the catalog (to start from its texts on an update).
  const entry = $derived(mark && repo.info?.author ? repo.catalog?.entries.find((e) => e.author === repo.info!.author && e.id === mark.id) : undefined);

  let title = $state('');
  let description = $state('');
  let lang = $state('en');
  let music = $state(false);
  let cover = $state<string | null>(null);
  let author = $state('');
  let rights = $state(false);
  let picking = $state(false);
  let sizes = $state<{ total: number; music: number; pdf: number } | null>(null);

  let shownFor: string | null = null;
  $effect(() => {
    const a = adventure;
    if (!a || a === shownFor) {
      if (!a) shownFor = null;
      return;
    }
    shownFor = a;
    title = entry?.title ?? a;
    description = entry?.description ?? '';
    lang = entry?.lang ?? getLang();
    music = entry?.music ?? false;
    cover = null;
    rights = false;
    sizes = null;
    void loadInfo().then(() => (author = repo.info?.name ?? ''));
    void window.api.repoSizes(a).then((s) => (sizes = s));
  });

  const size = $derived(sizes ? sizes.total - sizes.pdf - (music ? 0 : sizes.music) : 0);
  const max = $derived(repo.catalog?.maxSize ?? 0);
  const tooBig = $derived(!!max && size > max);
  const ready = $derived(!!title.trim() && rights && !tooBig && !repo.busy);

  const close = () => (repo.publish = null);

  async function send() {
    if (!adventure || !ready) return;
    const a = adventure;
    if (author.trim() !== (repo.info?.name ?? '')) await window.api.setRepoSettings({ name: author });
    close();
    await publish({ adventure: a, title: title.trim(), description: description.trim(), lang, music, ...(cover ? { cover } : {}) });
  }
</script>

{#if adventure}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), send())}>
      <header>
        <h3>{mark ? t('repo.dialog.update', { n: mark.version + 1 }) : t('repo.dialog.title')}</h3>
        <button type="button" class="icon-btn" onclick={close} title={t('repo.cancel')}><X size={14} /></button>
      </header>

      <label class="field">
        <span>{t('repo.dialog.name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" bind:value={title} maxlength={LIMITS.title} autofocus />
      </label>
      <label class="field">
        <span>{t('repo.dialog.description')}</span>
        <textarea rows="5" bind:value={description} maxlength={LIMITS.description} placeholder={t('repo.dialog.descriptionPh')}></textarea>
      </label>
      <div class="two">
        <label class="field">
          <span>{t('repo.dialog.lang')}</span>
          <select bind:value={lang}>{#each Object.entries(LANGS) as [id, name] (id)}<option value={id}>{name}</option>{/each}</select>
        </label>
        <label class="field">
          <span>{t('repo.dialog.author')}</span>
          <input type="text" bind:value={author} maxlength={LIMITS.authorName} placeholder={t('repo.anonymous')} />
        </label>
      </div>

      <div class="field">
        <span>{t('repo.dialog.cover')}</span>
        <div class="cover-row">
          {#if cover}
            <img src={thumb(vaultUrl(cover), 240)} alt="" />
            <button type="button" class="btn" onclick={() => (cover = null)}>{t('repo.dialog.noCover')}</button>
          {:else}
            <button type="button" class="btn" onclick={() => (picking = true)} disabled={!app.vault.tree}><ImagePlus size={14} /> {t('repo.dialog.pickCover')}</button>
            {#if mark}<span class="faint small">{t('repo.dialog.coverKeep')}</span>{/if}
          {/if}
        </div>
      </div>

      {#if sizes}
        {#if sizes.music}
          <label class="check"><input type="checkbox" bind:checked={music} /> {t('repo.dialog.music', { size: mb(sizes.music) })}</label>
        {/if}
        <p class="faint small">
          {t('repo.dialog.size', { size: mb(size) })}
          {#if sizes.pdf}{t('repo.dialog.noPdf', { size: mb(sizes.pdf) })}{/if}
        </p>
        {#if tooBig}<p class="warn">{t('repo.dialog.tooBig', { max: mb(max) })}</p>{/if}
      {/if}

      <label class="check rights"><input type="checkbox" bind:checked={rights} /> {t('repo.dialog.rights')}</label>
      <p class="faint small">
        {t('repo.dialog.public')}
        {#if !repo.info?.author}{t('repo.dialog.newKey')} <button type="button" class="link" onclick={() => (close(), openSettings('repo'))}>{t('repo.dialog.keySettings')}</button>{/if}
      </p>

      <div class="row">
        <button class="btn" type="button" onclick={close}>{t('repo.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!ready}><CloudUpload size={14} /> {mark ? t('repo.dialog.sendUpdate') : t('repo.dialog.send')}</button>
      </div>
    </form>
    <!-- Inside the backdrop: the picker's own z-index is below this dialog's. -->
    {#if picking && app.vault.tree}
      <FilePicker tree={app.vault.tree} prefer="backgrounds" onpick={(p) => ((cover = p[0] ?? null), (picking = false))} onclose={() => (picking = false)} />
    {/if}
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    width: min(520px, 92vw);
    max-height: calc(100vh - 40px);
    overflow: auto;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  h3 {
    margin: 0;
    font-size: 15px;
  }
  .field {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  textarea {
    resize: vertical;
  }
  .two {
    display: flex;
    gap: 10px;
  }
  .cover-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cover-row img {
    width: 120px;
    height: 90px;
    border-radius: var(--radius-s);
    object-fit: cover;
  }
  .check {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 6px 0;
  }
  .rights {
    margin-top: 10px;
  }
  .small {
    margin: 4px 0;
    font-size: 12px;
  }
  .warn {
    margin: 4px 0;
    color: var(--warning);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
</style>
