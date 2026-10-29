<!-- «Find adventures» — the catalog window, as Obsidian's community plugins: the entries of every source turned on on
     the left (search, source, system, language, downloaded / mine), the chosen one on the right — cover,
     description, download or update; the GM's own — take down; others' — complain. The admin of a repository sees
     complaints and takes any entry down. Opens on repo.browsing (openRepo). -->
<script lang="ts">
  import { SUPPLEMENT_KINDS, type SupplementKind } from '../../../shared/adventures';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { Ban, Check, LockOpen, CloudUpload, Download, Flag, ImageOff, RefreshCw, Settings, ShieldCheck, Trash2, TriangleAlert, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { store } from '../../../renderer/lib/store.svelte';
  import { openSettings } from '../../../renderer/lib/nav';
  import { enabledSystems, FAMILIES, familyOf, systems } from '../../../systems';
  import { LANGS } from '../../../shared/i18n/core';
  import { matchesQuery, shortKey } from '../../../shared/repo';
  import { adminRemove, allFound, bestiaryVersion, contentIdOf, contentVersion, removeContent, installSystem, missingSystem, removeBestiary, systemVersion, type What, unblock, updatesHere, type Blocked, coverOf, dismiss, install, installedFolder, isAdmin, loadCatalogs, mb, reportsOf, repo, sourceName, sourcesOn, unpublish, type Found } from './repo.svelte';

  let query = $state('');
  let source = $state('');
  let system = $state('');
  let lang = $state('');
  let show = $state<'all' | 'updates' | 'installed' | 'mine' | 'reported' | 'blocked'>(repo.startShow);
  // Adventures or system packs.
  let what = $state<What>(repo.startWhat);
  let chosen = $state<string | null>(null);

  const app = $derived(store.state);
  const enabled = $derived((app.vault.systemsOff, enabledSystems()));
  const current = $derived(app.adventures.current);
  const me = $derived(repo.info?.author ?? null);
  const on = $derived(repo.info ? sourcesOn() : []);
  const loading = $derived(on.some((s) => repo.catalogs[s.id]?.loading));
  const failed = $derived(on.filter((s) => repo.catalogs[s.id]?.error));
  const admin = $derived(on.some((s) => s.admin));
  const reportedCount = $derived(on.reduce((n, s) => n + (repo.reports[s.id]?.length ?? 0), 0));
  // Blocked entries of the repositories the GM is the admin of (they are not in the catalog).
  const blocked = $derived<Blocked[]>(
    on
      .flatMap((s) => (repo.blocked[s.id] ?? []).map((b) => ({ ...b, source: s.id })))
      .filter((b) => (!source || b.source === source) && matchesQuery({ ...b, description: '' }, query)),
  );

  const found = $derived(repo.info ? allFound() : []);
  const updates = $derived(repo.info ? updatesHere().map((u) => key(u.entry)) : []);
  // The kinds of things in the Community (bestiaries and more will come here).
  const KINDS: { id: What; title: string; fits: (e: Found) => boolean }[] = [
    {
      id: 'adventures',
      get title() {
        return t('repo.whatAdventures');
      },
      fits: (e) => !e.kind,
    },
    {
      id: 'supplements',
      get title() {
        return t('repo.whatSupplements');
      },
      fits: (e) => e.kind === 'supplement',
    },
    {
      id: 'bestiaries',
      get title() {
        return t('repo.whatBestiaries');
      },
      fits: (e) => e.kind === 'bestiary',
    },
    {
      id: 'systems',
      get title() {
        return t('repo.whatSystems');
      },
      // A system and its data (built-in creatures and books: D&D's SRD) — together.
      fits: (e) => e.kind === 'system' || e.kind === 'content',
    },
  ];
  const entries = $derived(
    found
      // Updates are of both kinds; otherwise — the kind chosen.
      .filter((e) => show === 'updates' || !!KINDS.find((k) => k.id === what)?.fits(e))
      // Adventures of systems turned off are nowhere to be seen (but the GM's own are).
      .filter((e) => e.kind === 'system' || e.author === me || enabled.some((s) => s.id === e.system) || !systems.some((s) => s.id === e.system))
      .filter((e) => !source || e.source === source)
      .filter((e) => e.kind === 'system' || !system || e.system === system || (e.kind === 'content' && e.system === familyOf(system)))
      .filter((e) => !lang || e.lang === lang)
      .filter((e) => show !== 'mine' || e.author === me)
      .filter((e) => show !== 'installed' || installedVersion(e) > 0)
      .filter((e) => show !== 'updates' || updates.includes(key(e)))
      .filter((e) => show !== 'reported' || reportsOf(e).length > 0)
      .filter((e) => matchesQuery(e, query))
      .sort((a, b) => b.updated - a.updated),
  );

  const key = (e: Found) => `${e.source}/${e.author}/${e.id}`;
  const picked = $derived(entries.find((e) => key(e) === chosen) ?? entries[0]);
  // A system this app hasn't: the title of its pack in a catalog, if one is there.
  const systemTitle = (id: string) => systems.find((s) => s.id === id)?.title ?? found.find((e) => e.kind === 'system' && e.system === id)?.title ?? id;
  const langTitle = (id: string) => LANGS[id as keyof typeof LANGS] ?? id;
  const sourceTitle = (id: string) => {
    const s = repo.info?.sources.find((x) => x.id === id);
    return s ? sourceName(s) : id;
  };
  const date = (ms: number) => new Date(ms).toLocaleDateString(getLang(), { day: 'numeric', month: 'short', year: 'numeric' });
  // Under the title: the system of an adventure, «Game system», «Bestiary · its system».
  const kindLine = (e: Found) =>
    e.kind === 'system'
      ? t('repo.kindSystem')
      : e.kind === 'bestiary'
        ? `${t('repo.kindBestiary')} · ${systemTitle(e.system)}`
        : e.kind === 'content'
          ? `${t('repo.kindContent')} · ${FAMILIES.find((f) => f.id === e.system)?.title ?? e.system}`
        : e.kind === 'supplement'
          ? `${t('repo.kindSupplement')}${SUPPLEMENT_KINDS.includes(e.subkind as SupplementKind) ? ` (${t(`adv.kind.${e.subkind as SupplementKind}`)})` : ''} · ${systemTitle(e.system)}`
          : systemTitle(e.system);
  const installedVersion = (e: Found) => {
    if (e.kind === 'system') return systemVersion(e);
    if (e.kind === 'bestiary') return bestiaryVersion(e);
    if (e.kind === 'content') return contentVersion(e);
    const f = installedFolder(e);
    return f ? (app.repo.installed[f]?.version ?? 0) : 0;
  };

  const close = () => (repo.browsing = false);
  const settings = () => (close(), openSettings('repo'));
  // Esc closes the window, unless a dialog above it is open.
  const onkey = (e: KeyboardEvent) => e.key === 'Escape' && !repo.publish && !repo.naming && !repo.reporting && close();
  const reasonDate = (ms: number) => new Date(ms).toLocaleDateString(getLang(), { day: 'numeric', month: 'short' });

  // An entry's menu (a right click): the same as the buttons under its details.
  let rowMenu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  function entryMenu(ev: MouseEvent, e: Found) {
    chosen = key(e);
    const have = installedVersion(e);
    const busy = !!repo.busy;
    const get = have && have >= e.version ? t('repo.again') : have ? t('repo.update', { n: e.version }) : e.kind === 'system' ? t('repo.installSystem') : e.kind === 'bestiary' ? t('repo.installBestiary') : e.kind === 'content' ? t('repo.installContent') : t('repo.download');
    rowMenu = {
      ...menuAt(ev),
      items: [
        { label: get, icon: Download, disabled: busy, action: () => void install(e) },
        ...(e.kind === 'bestiary' && have ? [{ label: t('repo.removeBestiary'), icon: Trash2, disabled: busy, action: () => void removeBestiary(e) }] : []),
        ...(e.kind === 'content' && contentIdOf(e) ? [{ label: t('repo.removeContent'), icon: Trash2, disabled: busy, action: () => void removeContent(contentIdOf(e)!, e.title) }] : []),
        e.author === me
          ? { label: t('repo.unpublish'), icon: Trash2, danger: true, disabled: busy, action: () => void unpublish(e) }
          : { label: t('repo.report.button'), icon: Flag, disabled: busy, action: () => (repo.reporting = e) },
      ],
    };
  }
</script>

<svelte:window onkeydown={onkey} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
  <div class="window" role="dialog" aria-modal="true" aria-label={t('repo.browse')}>
    <header>
      <h2>{t('repo.browse')}</h2>
      <div class="spacer"></div>
      {#if what === 'bestiaries'}
        <button class="btn" onclick={() => (repo.publishBestiary = true)} disabled={!!repo.busy || !on.length}><CloudUpload size={14} /> {t('repo.publishBestiary')}</button>
      {:else if current}
        <button class="btn" onclick={() => (repo.publish = current)} disabled={!!repo.busy || !on.length}>
          <CloudUpload size={14} />
          {app.repo.published[current] ? t('repo.updateMine', { name: current }) : t('repo.publishThis', { name: current })}
        </button>
      {/if}
      <button class="icon-btn" title={t('repo.refresh')} onclick={() => loadCatalogs()} disabled={loading}><RefreshCw size={15} /></button>
      <button class="icon-btn" title={t('repo.settings')} onclick={settings}><Settings size={15} /></button>
      <button class="icon-btn" title={t('repo.close')} onclick={close}><X size={16} /></button>
    </header>

    <!-- The same lists, always in their places: what doesn't apply is disabled, not hidden (nothing jumps). A new kind
         of thing in the Community is one more option of «What». -->
    <div class="filters">
      <!-- svelte-ignore a11y_autofocus -->
      <input type="text" class="search" placeholder={t('repo.search')} bind:value={query} autofocus />
      <select class="f" bind:value={what} title={t('repo.whatHint')}>
        {#each KINDS as k (k.id)}<option value={k.id}>{k.title} ({found.filter(k.fits).length})</option>{/each}
      </select>
      <select class="f" bind:value={show} title={t('repo.showHint')}>
        <option value="all">{t('repo.showAll')}</option>
        <option value="updates">{t('repo.showUpdates', { count: updates.length })}</option>
        <option value="installed">{t('repo.showInstalled')}</option>
        <option value="mine">{t('repo.showMine')}</option>
        {#if admin}
          <option value="reported">{t('repo.showReported', { count: reportedCount })}</option>
          <option value="blocked">{t('repo.showBlocked', { count: blocked.length })}</option>
        {/if}
      </select>
      <select class="f" bind:value={system} disabled={what === 'systems'}>
        <option value="">{t('repo.allSystems')}</option>
        {#each enabled as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
      </select>
      <select class="f" bind:value={lang}>
        <option value="">{t('repo.allLangs')}</option>
        {#each Object.entries(LANGS) as [id, title] (id)}<option value={id}>{title}</option>{/each}
      </select>
      <select class="f" bind:value={source} disabled={on.length < 2}>
        <option value="">{t('repo.allSources')}</option>
        {#each on as s (s.id)}<option value={s.id}>{sourceName(s)}</option>{/each}
      </select>
    </div>

    {#each failed as s (s.id)}
      <div class="problem">
        <TriangleAlert size={14} />
        <span><b>{sourceName(s)}:</b> {repo.catalogs[s.id]?.error}</span>
        <button class="btn small" onclick={() => loadCatalogs(s.id)}>{t('repo.retry')}</button>
      </div>
    {/each}

    {#if !on.length}
      <div class="empty">
        <p class="faint">{t('repo.noSources')}</p>
        <button class="btn" onclick={settings}>{t('repo.openSettings')}</button>
      </div>
    {:else if show === 'blocked'}
      {#if !blocked.length}
        <div class="empty"><p class="faint">{t('repo.admin.noBlocked')}</p></div>
      {:else}
        <div class="blocked">
          <p class="faint">{t('repo.admin.blockedAbout')}</p>
          {#each blocked as b (`${b.source}/${b.author}/${b.id}`)}
            <div class="blocked-row">
              <Ban size={16} />
              <span class="text">
                <span class="title">{b.title}</span>
                <span class="meta faint">
                  {t('repo.by', { name: b.authorName || t('repo.anonymous') })} <code>{shortKey(b.author)}</code>
                  {#if b.blocked} · {t('repo.admin.blockedOn', { date: date(b.blocked) })}{/if}
                  {#if on.length > 1} · {sourceTitle(b.source)}{/if}
                </span>
              </span>
              <button class="btn" disabled={!!repo.busy} onclick={() => unblock(b)}><LockOpen size={14} /> {t('repo.admin.unblock')}</button>
            </div>
          {/each}
        </div>
      {/if}
    {:else if !entries.length}
      <div class="empty">
        <p class="faint">{loading ? t('repo.loading') : found.length ? t('repo.nothingFound') : failed.length < on.length ? t('repo.emptyCatalog') : ''}</p>
      </div>
    {:else}
      <div class="body">
        <div class="list">
          {#each entries as e (key(e))}
            {@const cover = e.cover ? coverOf(e) : null}
            {@const have = installedVersion(e)}
            <button class="item" class:on={picked && key(picked) === key(e)} onclick={() => (chosen = key(e))} oncontextmenu={(ev) => entryMenu(ev, e)}>
              <span class="thumb">{#if cover}<img src={cover} alt="" />{:else}<ImageOff size={16} />{/if}</span>
              <span class="text">
                <span class="title">{e.title}</span>
                <span class="meta faint">{kindLine(e)} · {langTitle(e.lang)} · {mb(e.size)}</span>
              </span>
              {#if reportsOf(e).length}<span class="badge warn" title={t('repo.admin.reports')}><Flag size={10} /> {reportsOf(e).length}</span>{/if}
              {#if have && have < e.version}<span class="badge new">{t('repo.newVersion')}</span>
              {:else if have}<span class="badge">{t('repo.haveIt')}</span>
              {:else if e.author === me}<span class="badge">{t('repo.you')}</span>{/if}
            </button>
          {/each}
        </div>

        {#if picked}
          {@const e = picked}
          {@const cover = e.cover ? coverOf(e) : null}
          {@const have = installedVersion(e)}
          <section class="details">
            {#if cover}<img class="cover" src={cover} alt="" />{/if}
            <h3>{e.title}</h3>
            <div class="author faint" title={e.author}>
              {t('repo.by', { name: e.authorName || t('repo.anonymous') })} <code>{shortKey(e.author)}</code>
              {#if e.author === me}<span class="mine">{t('repo.you')}</span>{/if}
            </div>
            <div class="meta faint">
              <span>{kindLine(e)}</span>
              <span>{langTitle(e.lang)}</span>
              <span>{t('repo.version', { n: e.version })}</span>
              <span>{mb(e.size)}{e.music ? ` · ${t('repo.withMusic')}` : ''}</span>
              <span>{date(e.updated)}</span>
              <span>{t('repo.downloads', { count: e.downloads })}</span>
              {#if on.length > 1}<span>{sourceTitle(e.source)}</span>{/if}
            </div>
            <div class="actions">
              {#if have && have >= e.version}
                <span class="faint">{t('repo.haveIt')}</span>
                <button class="btn" disabled={!!repo.busy} onclick={() => install(e)}><Download size={14} /> {t('repo.again')}</button>
              {:else if have}
                <button class="btn primary" disabled={!!repo.busy} onclick={() => install(e)}><Download size={14} /> {t('repo.update', { n: e.version })}</button>
              {:else}
                <button class="btn primary" disabled={!!repo.busy} onclick={() => install(e)}><Download size={14} /> {e.kind === 'system' ? t('repo.installSystem') : e.kind === 'bestiary' ? t('repo.installBestiary') : e.kind === 'content' ? t('repo.installContent') : t('repo.download')}</button>
              {/if}
              {#if e.kind === 'bestiary' && have}
                <button class="btn" disabled={!!repo.busy} onclick={() => removeBestiary(e)}><Trash2 size={14} /> {t('repo.removeBestiary')}</button>
              {/if}
              {#if e.kind === 'content' && contentIdOf(e)}
                <button class="btn" disabled={!!repo.busy} onclick={() => removeContent(contentIdOf(e)!, e.title)}><Trash2 size={14} /> {t('repo.removeContent')}</button>
              {/if}
              {#if e.author === me}
                <button class="btn danger" disabled={!!repo.busy} onclick={() => unpublish(e)}><Trash2 size={14} /> {t('repo.unpublish')}</button>
              {:else}
                <button class="btn link" disabled={!!repo.busy} onclick={() => (repo.reporting = e)}><Flag size={13} /> {t('repo.report.button')}</button>
              {/if}
            </div>
            {#if (!e.kind || e.kind === 'supplement') && !systems.some((s) => s.id === e.system)}
              {@const need = missingSystem(e)}
              <p class="needs">
                {t('repo.needsSystem', { system: need?.title ?? e.system })}
                {#if need}<button class="btn" disabled={!!repo.busy} onclick={() => installSystem(need)}><Download size={14} /> {t('repo.installSystem')}</button>{/if}
              </p>
            {/if}
            {#if isAdmin(e.source)}
              {@const reports = reportsOf(e)}
              <div class="admin">
                <div class="admin-head"><ShieldCheck size={14} /> {t('repo.admin.title')}</div>
                {#if reports.length}
                  <ul>
                    {#each reports as r, i (i)}
                      <li><b>{t(`repo.report.${r.reason}`)}</b> <span class="faint">· {reasonDate(r.at)}</span>{#if r.text}<div class="said">{r.text}</div>{/if}</li>
                    {/each}
                  </ul>
                {:else}
                  <p class="faint">{t('repo.admin.noReports')}</p>
                {/if}
                <div class="actions">
                  {#if reports.length}<button class="btn" disabled={!!repo.busy} onclick={() => dismiss(e)}><Check size={14} /> {t('repo.admin.dismiss')}</button>{/if}
                  <button class="btn" disabled={!!repo.busy} onclick={() => adminRemove(e, false)}><Trash2 size={14} /> {t('repo.admin.remove')}</button>
                  <button class="btn danger" disabled={!!repo.busy} onclick={() => adminRemove(e, true)}><Ban size={14} /> {t('repo.admin.block')}</button>
                </div>
              </div>
            {/if}
            {#if e.description}<p class="desc">{e.description}</p>{/if}
          </section>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if rowMenu}<ContextMenu x={rowMenu.x} y={rowMenu.y} items={rowMenu.items} onclose={() => (rowMenu = null)} />{/if}

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 105;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .window {
    display: flex;
    flex-direction: column;
    width: min(1100px, 94vw);
    height: min(780px, 90vh);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 14px 8px 18px;
  }
  h2 {
    margin: 0;
    font-size: 17px;
  }
  .spacer {
    flex: 1;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 0 18px 12px;
    border-bottom: 1px solid var(--border);
  }
  .search {
    flex: 1 1 220px;
    min-width: 0;
  }
  .f {
    flex: none;
    width: 150px;
  }
  .problem {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 18px;
    border-bottom: 1px solid var(--border);
    color: var(--warning);
    font-size: 13px;
  }
  .problem span {
    flex: 1;
  }
  .btn.small {
    padding: 2px 8px;
    font-size: 12px;
  }
  .empty {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .empty p {
    margin: 0;
  }
  .body {
    display: grid;
    flex: 1;
    grid-template-columns: minmax(260px, 340px) 1fr;
    min-height: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    overflow-y: auto;
    border-right: 1px solid var(--border);
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--bg-active);
  }
  .thumb {
    display: grid;
    flex: none;
    place-items: center;
    width: 56px;
    height: 42px;
    overflow: hidden;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-faint);
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .title,
  .text .meta {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title {
    font-weight: 600;
  }
  .text .meta {
    font-size: 12px;
  }
  .badge {
    flex: none;
    padding: 0 6px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 11px;
  }
  .badge.new {
    background: var(--accent);
    color: var(--on-accent);
  }
  .badge.warn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--warning);
  }
  .btn.link {
    border-color: transparent;
    background: none;
    color: var(--text-muted);
  }
  .admin {
    margin: 0 0 16px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .admin-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .admin ul {
    margin: 0;
    padding-left: 18px;
  }
  .admin li {
    margin-bottom: 6px;
  }
  .admin p {
    margin: 0;
  }
  .said {
    white-space: pre-line;
  }
  .needs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
    color: var(--warning);
  }
  .admin .actions {
    margin: 10px 0 0;
  }
  .blocked {
    flex: 1;
    padding: 12px 18px;
    overflow-y: auto;
  }
  .blocked > p {
    margin: 0 0 10px;
  }
  .blocked-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-faint);
  }
  .blocked-row .text {
    color: var(--text-normal);
  }
  .details {
    padding: 18px 22px;
    overflow-y: auto;
  }
  .cover {
    display: block;
    max-width: 100%;
    max-height: 280px;
    margin-bottom: 14px;
    border-radius: var(--radius-m);
    object-fit: contain;
  }
  h3 {
    margin: 0 0 4px;
    font-size: 20px;
  }
  .author {
    font-size: 13px;
  }
  code {
    font-size: 11px;
  }
  .mine {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: var(--radius-s);
    background: var(--accent);
    color: var(--on-accent);
  }
  .details .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 6px;
    font-size: 12px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 14px 0;
  }
  .desc {
    margin: 0;
    white-space: pre-line;
    line-height: 1.5;
  }
</style>
