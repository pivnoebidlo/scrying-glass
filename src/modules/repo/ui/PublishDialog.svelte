<!-- Publish an adventure to the repository (or a new version of the GM's own entry): title, description, language,
     cover, music, PDFs (the adventure's text is often a PDF in the journal). The author confirms the content is theirs
     to share. Opens on repo.publish = <adventure>. -->
<script lang="ts">
  import { isSupplement } from '../../../shared/adventures';
  import { CloudUpload, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { LANGS } from '../../../shared/i18n/core';
  import { LIMITS } from '../../../shared/repo';
  import { thumb, vaultUrl } from '../../../shared/vault';
  import { store } from '../../../renderer/lib/store.svelte';
  import { openSettings } from '../../../renderer/lib/nav';
  import CoverField from './CoverField.svelte';
  import { loadCatalogs, loadInfo, mb, publish, repo, sourceName, sourcesOn } from './repo.svelte';
  import { sourceOf, type RepoEntry } from '../../../shared/repo';

  const adventure = $derived(repo.publish);
  const app = $derived(store.state);
  const mark = $derived(adventure ? app.repo.published[adventure] : undefined);
  // A supplement goes as one too, but only to services that know them (an older one would take it for an adventure).
  const supplement = $derived(isSupplement(app.adventures, adventure));
  // Where to: the sources that take publishing (repositories), turned on.
  const targets = $derived(
    repo.info ? sourcesOn().filter((s) => s.kind === 'repo' && (!supplement || !!repo.catalogs[s.id]?.catalog?.features?.includes('supplements'))) : [],
  );
  let source = $state('');
  const catalog = $derived(repo.catalogs[source]?.catalog ?? null);
  // The entry as it is in that catalog: an update (to start from its texts). No mark in the vault (another copy of
  // the app wrote state.json over it, the folder was renamed) — the GM's own adventure of the same name is it, unless
  // they want a new entry.
  const mine = (e: RepoEntry) => e.author === repo.info?.author && (supplement ? e.kind === 'supplement' : !e.kind);
  const byMark = $derived(mark ? catalog?.entries.find((e) => mine(e) && e.id === mark.id) : undefined);
  const byName = $derived(
    !byMark && adventure ? catalog?.entries.find((e) => mine(e) && [adventure, title.trim()].some((n) => n && e.title.toLowerCase() === n.toLowerCase())) : undefined,
  );
  let asNew = $state(false);
  const entry = $derived(byMark ?? (asNew ? undefined : byName));

  let title = $state('');
  let description = $state('');
  let lang = $state('en');
  let music = $state(false);
  let pdf = $state(true);
  let cover = $state<string | null>(null);
  let author = $state('');
  let rights = $state(false);
  let sizes = $state<{ total: number; music: number; pdf: number; images: number; files: number } | null>(null);

  let shownFor: string | null = null;
  $effect(() => {
    const a = adventure;
    if (!a || a === shownFor) {
      if (!a) shownFor = null;
      return;
    }
    shownFor = a;
    title = a;
    description = '';
    lang = getLang();
    music = false;
    pdf = true;
    cover = null;
    rights = false;
    asNew = false;
    sizes = null;
    filledFrom = null;
    void loadInfo().then(() => {
      author = repo.info?.name ?? '';
      const m = app.repo.published[a];
      const on = sourcesOn().filter((s) => s.kind === 'repo');
      source = (m && on.find((s) => s.id === sourceOf(m))?.id) ?? on[0]?.id ?? '';
      void loadCatalogs();
    });
    void window.api.repoSizes(a).then((s) => (sizes = s));
  });

  // An update starts from the texts the entry has in that source (once it is known).
  let filledFrom: string | null = null;
  $effect(() => {
    const e = entry;
    if (!e || filledFrom === `${source}/${e.id}`) return;
    filledFrom = `${source}/${e.id}`;
    title = e.title;
    description = e.description;
    lang = e.lang;
    music = e.music;
  });

  const size = $derived(sizes ? sizes.total - (pdf ? 0 : sizes.pdf) - (music ? 0 : sizes.music) : 0);
  const max = $derived(catalog?.maxSize ?? 0);
  // Pictures are made lighter on the way (shrink.ts in the core): how much — unknown before, so only what surely
  // stays counts (PNGs from image generators lose ~85%).
  const tooBig = $derived(!!max && size - (sizes?.images ?? 0) * 0.8 > max);
  // Nothing in it — nothing to publish: no files of its own (the cover is not content) and, for an adventure, no scenes.
  const empty = $derived(!!sizes && !!adventure && sizes.files === 0 && (supplement || !app.scenes.scenes.some((x) => x.adventure === adventure)));
  const ready = $derived(!!source && !!title.trim() && rights && !tooBig && !empty && !repo.busy);

  const close = () => (repo.publish = null);

  async function send() {
    if (!adventure || !ready) return;
    const a = adventure;
    if (author.trim() !== (repo.info?.name ?? '')) repo.info = await window.api.setRepoName(author);
    close();
    // The id of the entry to update when the vault has no mark of it (null — a new entry).
    const id = byMark ? undefined : asNew ? null : byName?.id;
    await publish({ source, adventure: a, title: title.trim(), description: description.trim(), lang, music, pdf, ...(cover ? { cover } : {}), ...(id !== undefined ? { id } : {}) });
  }
</script>

{#if adventure}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), send())}>
      <header>
        <h3>{entry ? t('repo.dialog.update', { n: entry.version + 1 }) : t(supplement ? 'repo.dialog.titleSupplement' : 'repo.dialog.title')}</h3>
        <button type="button" class="icon-btn" onclick={close} title={t('repo.cancel')}><X size={14} /></button>
      </header>

      {#if targets.length > 1}
        <label class="field">
          <span>{t('repo.dialog.where')}</span>
          <select bind:value={source}>{#each targets as s (s.id)}<option value={s.id}>{sourceName(s)}</option>{/each}</select>
        </label>
      {:else if repo.info && !targets.length}
        <p class="warn">{t(supplement ? 'repo.dialog.noSupplementTargets' : 'repo.dialog.noTargets')}</p>
      {/if}
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

      <CoverField bind:cover tree={app.vault.tree} keep={!!entry?.cover} />

      {#if sizes}
        {#if sizes.music}
          <label class="check"><input type="checkbox" bind:checked={music} /> {t('repo.dialog.music', { size: mb(sizes.music) })}</label>
        {/if}
        {#if sizes.pdf}
          <label class="check"><input type="checkbox" bind:checked={pdf} /> {t('repo.dialog.pdf', { size: mb(sizes.pdf) })}</label>
        {/if}
        <p class="faint small">{t(sizes.images ? 'repo.dialog.sizeImages' : 'repo.dialog.size', { size: mb(size) })}</p>
        {#if tooBig}<p class="warn">{t('repo.dialog.tooBig', { max: mb(max) })}</p>{/if}
        {#if empty}<p class="warn">{t(supplement ? 'repo.dialog.emptySupplement' : 'repo.dialog.emptyAdventure')}</p>{/if}
      {/if}

      {#if byName && !byMark}
        <label class="check found">
          <input type="checkbox" bind:checked={asNew} />
          {t('repo.dialog.asNew', { name: byName.title, n: byName.version })}
        </label>
      {/if}
      <label class="check rights"><input type="checkbox" bind:checked={rights} /> {t('repo.dialog.rights')}</label>
      <p class="faint small">
        {t('repo.dialog.public')}
        {#if !repo.info?.author}{t('repo.dialog.newKey')} <button type="button" class="link" onclick={() => (close(), openSettings('repo'))}>{t('repo.dialog.keySettings')}</button>{/if}
      </p>

      <div class="row">
        <button class="btn" type="button" onclick={close}>{t('repo.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!ready}><CloudUpload size={14} /> {entry ? t('repo.dialog.sendUpdate') : t('repo.dialog.send')}</button>
      </div>
    </form>
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
  .check {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 6px 0;
  }
  .found {
    color: var(--warning);
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
