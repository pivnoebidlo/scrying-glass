<!-- Publish a bestiary: the GM's own cards (library and vault; not the built-in SRD), chosen by ticks with a search,
     as one entry of the Community — new, or a new version of one published before (its cards ticked again). Where,
     title, description, language, author, cover; the author confirms the cards are theirs to share. Opens on
     repo.publishBestiary. -->
<script lang="ts">
  import { CloudUpload, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import CoverField from './CoverField.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { refKey, type CardRef, type CardSummary } from '../../../shared/cards';
  import { getLang } from '../../../shared/i18n';
  import { LANGS } from '../../../shared/i18n/core';
  import { LIMITS } from '../../../shared/repo';
  import { COVER_FILE } from '../../../shared/adventures';
  import { thumb, vaultUrl } from '../../../shared/vault';
  import { systems } from '../../../systems';
  import { loadCatalogs, loadInfo, publishBestiary, repo, sourceName, sourcesOn } from './repo.svelte';

  // Repositories that take bestiaries (an older service would take one for an adventure).
  const targets = $derived(repo.info ? sourcesOn().filter((s) => s.kind === 'repo' && repo.catalogs[s.id]?.catalog?.features?.includes('bestiaries')) : []);
  const loading = $derived(sourcesOn().some((s) => repo.catalogs[s.id]?.loading));
  let source = $state('');
  // A new entry ('') or a new version of one published before (its id).
  let target = $state('');
  const published = $derived(Object.values(repo.info?.bestiaries.published ?? {}).filter((m) => m.source === source));

  let cards = $state<CardSummary[]>([]);
  let chosen = $state<Set<string>>(new Set());
  let query = $state('');
  let title = $state('');
  let description = $state('');
  let lang = $state('en');
  let author = $state('');
  let rights = $state(false);
  let cover = $state<string | null>(null);

  let opened = false;
  $effect(() => {
    if (!repo.publishBestiary) {
      opened = false;
      return;
    }
    if (opened) return;
    opened = true;
    target = '';
    chosen = new Set();
    query = '';
    title = '';
    description = '';
    lang = getLang();
    rights = false;
    cover = null;
    // A bestiary folder (the Adventures tab): its cards ticked, its name for the title, its entry if published.
    const folder = typeof repo.publishBestiary === 'string' ? repo.publishBestiary : null;
    void window.api.listCards().then(async (list) => {
      cards = list.filter((c) => c.ref.scope !== 'srd');
      if (!folder) return;
      const mine = cards.filter((c) => c.ref.scope === 'vault' && (c.folder === folder || c.folder?.startsWith(folder + '/')));
      chosen = new Set(mine.map((c) => refKey(c.ref)));
      title = folder;
      // Its cover, if it has one (cover.jpg, as adventures).
      if (store.state.vault.tree?.folders.find((f) => f.path === folder)?.files.some((f) => f.name === COVER_FILE)) cover = `${folder}/${COVER_FILE}`;
      await loadInfo();
      const was = Object.values(repo.info?.bestiaries.published ?? {}).find((m) => m.cards.some((r) => chosen.has(refKey(r))));
      if (was) pickTarget(was.id), (chosen = new Set(mine.map((c) => refKey(c.ref))));
    });
    void loadInfo().then(async () => {
      author = repo.info?.name ?? '';
      await loadCatalogs();
      source = targets[0]?.id ?? '';
    });
  });
  // An update: its cards ticked, its texts back.
  function pickTarget(id: string) {
    target = id;
    const m = repo.info?.bestiaries.published[id];
    if (!m) return;
    chosen = new Set(m.cards.map((r) => refKey(r)));
    title = m.title;
    const e = repo.catalogs[m.source]?.catalog?.entries.find((x) => x.id === id);
    if (e) (description = e.description), (lang = e.lang);
  }

  const place = (c: CardSummary) => (c.ref.scope === 'library' ? t('repo.bestiary.library') : (c.folder ?? ''));
  const systemTitle = (id: string) => systems.find((s) => s.id === id)?.title ?? id;
  const shown = $derived(
    cards
      .filter((c) => !query.trim() || `${c.name} ${c.subtitle} ${place(c)}`.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => place(a).localeCompare(place(b)) || a.name.localeCompare(b.name)),
  );
  const toggle = (c: CardSummary) => {
    const k = refKey(c.ref);
    const next = new Set(chosen);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    chosen = next;
  };
  const refs = $derived(cards.filter((c) => chosen.has(refKey(c.ref))).map((c) => c.ref));

  const ready = $derived(!!source && refs.length > 0 && !!title.trim() && rights && !repo.busy);
  const close = () => (repo.publishBestiary = false);
  async function send() {
    if (!ready) return;
    if (author.trim() !== (repo.info?.name ?? '')) repo.info = await window.api.setRepoName(author);
    const p = { source, refs: $state.snapshot(refs) as CardRef[], title: title.trim(), description: description.trim(), lang, ...(cover ? { cover } : {}), ...(target ? { id: target } : {}) };
    close();
    await publishBestiary(p);
  }
</script>

{#if repo.publishBestiary}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), send())}>
      <header>
        <h3>{t('repo.bestiary.title')}</h3>
        <button type="button" class="icon-btn" onclick={close} title={t('repo.cancel')}><X size={14} /></button>
      </header>
      {#if repo.info && !targets.length && !loading}
        <p class="warn">{t('repo.bestiary.noTargets')}</p>
      {/if}
      <div class="two">
        {#if targets.length > 1}
          <label class="field">
            <span>{t('repo.dialog.where')}</span>
            <select bind:value={source}>{#each targets as s (s.id)}<option value={s.id}>{sourceName(s)}</option>{/each}</select>
          </label>
        {/if}
        {#if published.length}
          <label class="field">
            <span>{t('repo.bestiary.what')}</span>
            <select value={target} onchange={(e) => pickTarget(e.currentTarget.value)}>
              <option value="">{t('repo.bestiary.new')}</option>
              {#each published as m (m.id)}<option value={m.id}>{t('repo.bestiary.updateOf', { name: m.title, n: m.version + 1 })}</option>{/each}
            </select>
          </label>
        {/if}
      </div>

      <div class="field">
        <span>{t('repo.bestiary.cards', { count: refs.length })}</span>
        <input type="text" placeholder={t('repo.bestiary.search')} bind:value={query} />
        <div class="cards">
          {#each shown as c (refKey(c.ref))}
            <label class="card">
              <input type="checkbox" checked={chosen.has(refKey(c.ref))} onchange={() => toggle(c)} />
              <span class="name">{c.name}</span>
              <span class="faint small">{systemTitle(c.system)} · {place(c)}</span>
            </label>
          {:else}
            <p class="faint small">{t('repo.bestiary.noCards')}</p>
          {/each}
        </div>
      </div>

      <label class="field">
        <span>{t('repo.dialog.name')}</span>
        <input type="text" bind:value={title} maxlength={LIMITS.title} placeholder={t('repo.bestiary.titlePh')} />
      </label>
      <label class="field">
        <span>{t('repo.dialog.description')}</span>
        <textarea rows="3" bind:value={description} maxlength={LIMITS.description} placeholder={t('repo.bestiary.descriptionPh')}></textarea>
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
      <CoverField bind:cover tree={store.state.vault.tree} keep={!!target} />
      <label class="check"><input type="checkbox" bind:checked={rights} /> {t('repo.bestiary.rights')}</label>
      <p class="faint small">{t('repo.bestiary.public')}</p>
      <div class="row">
        <button class="btn" type="button" onclick={close}>{t('repo.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!ready}><CloudUpload size={14} /> {target ? t('repo.dialog.sendUpdate') : t('repo.dialog.send')}</button>
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
    width: min(560px, 92vw);
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
  .two {
    display: flex;
    gap: 10px;
  }
  .cards {
    display: flex;
    flex-direction: column;
    max-height: 220px;
    padding: 4px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .card {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 2px 4px;
  }
  .card .name {
    flex: none;
  }
  .card .small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  textarea {
    resize: vertical;
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
