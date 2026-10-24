<!-- Publish a system pack of the GM's own (from the system builder) to a repository: where, the title, a description
     of what the system is, the language, the author, a cover (a picture of the vault); the author confirms the pack is theirs to share (for a closed
     game — only its structure, no rules text). Opens on repo.publishSystem = <pack id>. -->
<script lang="ts">
  import { CloudUpload, ImagePlus, X } from '@lucide/svelte';
  import FilePicker from '../../../renderer/lib/FilePicker.svelte';
  import { thumb, vaultUrl } from '../../../shared/vault';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { LANGS } from '../../../shared/i18n/core';
  import { LIMITS } from '../../../shared/repo';
  import { loc } from '../../../shared/syspack';
  import { store } from '../../../renderer/lib/store.svelte';
  import { loadCatalogs, loadInfo, publishSystem, repo, sourceName, sourcesOn } from './repo.svelte';

  const packId = $derived(repo.publishSystem);
  const pack = $derived(packId ? store.state.vault.systems.find((p) => p.id === packId && p.own) : undefined);
  const mark = $derived(packId ? repo.info?.systems.published[packId] : undefined);
  // Only repositories that know system packs (an older service would take one for an adventure).
  const targets = $derived(repo.info ? sourcesOn().filter((s) => s.kind === 'repo' && repo.catalogs[s.id]?.catalog?.features?.includes('systems')) : []);
  const loading = $derived(sourcesOn().some((s) => repo.catalogs[s.id]?.loading));
  let source = $state('');
  const entry = $derived(mark && source === mark.source ? repo.catalogs[source]?.catalog?.entries.find((e) => e.id === mark.id && e.author === repo.info?.author) : undefined);

  let title = $state('');
  let description = $state('');
  let lang = $state('en');
  let author = $state('');
  let rights = $state(false);
  let cover = $state<string | null>(null);
  let picking = $state(false);

  let shownFor: string | null = null;
  $effect(() => {
    const id = packId;
    if (!id || id === shownFor) {
      if (!id) shownFor = null;
      return;
    }
    shownFor = id;
    title = pack ? loc(pack.title, getLang()) : id;
    description = '';
    lang = getLang();
    rights = false;
    cover = null;
    void loadInfo().then(async () => {
      author = repo.info?.name ?? '';
      await loadCatalogs();
      const m = repo.info?.systems.published[id];
      source = (m && targets.find((s) => s.id === m.source)?.id) ?? targets[0]?.id ?? '';
    });
  });
  // An update starts from the texts it has in the catalog.
  let filled: string | null = null;
  $effect(() => {
    const e = entry;
    if (!e || filled === `${source}/${e.id}`) return;
    filled = `${source}/${e.id}`;
    title = e.title;
    description = e.description;
    lang = e.lang;
  });

  const ready = $derived(!!pack && !!source && !!title.trim() && rights && !repo.busy);
  const close = () => (repo.publishSystem = null);
  async function send() {
    if (!ready || !packId) return;
    const p = packId;
    if (author.trim() !== (repo.info?.name ?? '')) repo.info = await window.api.setRepoName(author);
    close();
    await publishSystem({ source, pack: p, title: title.trim(), description: description.trim(), lang, ...(cover ? { cover } : {}) });
  }
</script>

{#if packId}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), send())}>
      <header>
        <h3>{entry ? t('repo.dialog.update', { n: entry.version + 1 }) : t('repo.sysDialog.title')}</h3>
        <button type="button" class="icon-btn" onclick={close} title={t('repo.cancel')}><X size={14} /></button>
      </header>
      {#if targets.length > 1}
        <label class="field">
          <span>{t('repo.dialog.where')}</span>
          <select bind:value={source}>{#each targets as s (s.id)}<option value={s.id}>{sourceName(s)}</option>{/each}</select>
        </label>
      {:else if repo.info && !targets.length && !loading}
        <p class="warn">{t('repo.sysDialog.noTargets')}</p>
      {/if}
      <label class="field">
        <span>{t('repo.dialog.name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" bind:value={title} maxlength={LIMITS.title} autofocus />
      </label>
      <label class="field">
        <span>{t('repo.dialog.description')}</span>
        <textarea rows="5" bind:value={description} maxlength={LIMITS.description} placeholder={t('repo.sysDialog.descriptionPh')}></textarea>
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
            <button type="button" class="btn" onclick={() => (picking = true)} disabled={!store.state.vault.tree}><ImagePlus size={14} /> {t('repo.dialog.pickCover')}</button>
            {#if entry?.cover}<span class="faint small">{t('repo.dialog.coverKeep')}</span>{/if}
          {/if}
        </div>
      </div>
      <label class="check"><input type="checkbox" bind:checked={rights} /> {t('repo.sysDialog.rights')}</label>
      <p class="faint small">{t('repo.sysDialog.public')}</p>
      <div class="row">
        <button class="btn" type="button" onclick={close}>{t('repo.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!ready}><CloudUpload size={14} /> {entry ? t('repo.dialog.sendUpdate') : t('repo.dialog.send')}</button>
      </div>
    </form>
    <!-- Inside the backdrop: the picker's own z-index is below this dialog's. -->
    {#if picking && store.state.vault.tree}
      <FilePicker tree={store.state.vault.tree} prefer="backgrounds" onpick={(p) => ((cover = p[0] ?? null), (picking = false))} onclose={() => (picking = false)} />
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
  .small {
    margin: 4px 0;
    font-size: 12px;
  }
  .warn {
    color: var(--warning);
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
</style>
