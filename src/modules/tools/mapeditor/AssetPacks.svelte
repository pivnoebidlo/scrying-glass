<!-- Packs of assets: the packs installed, the GM's own folders that can go as a pack («.sgassets»), a pack to install.
     A pack is a folder of <library>/assets/ (main/assetpacks.ts); the palette shows it as any folder. -->
<script lang="ts">
  import { CloudUpload, Download, PackagePlus, Trash2 } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { loadCatalogs, publishAssets, repo, sourceName, sourcesOn } from '../../repo/ui/repo.svelte';
  import type { AssetPackManifest } from '../../../shared/mapassets';
  import { assets } from './assets.svelte';

  let { onclose }: { onclose: () => void } = $props();

  // The folders right inside assets/: a pack, or the GM's own pictures that may become one.
  const folders = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const a of assets.list) {
      const top = a.path.includes('/') ? a.path.slice(0, a.path.indexOf('/')) : '';
      if (top) counts.set(top, (counts.get(top) ?? 0) + 1);
    }
    const packs = new Map(assets.packs.map((p) => [p.folder, p.manifest]));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([folder, count]) => ({ folder, count, pack: packs.get(folder) ?? null }));
  });

  // The pack being saved: its folder and words; for the Community — a description and where.
  let saving = $state<{ folder: string; title: string; author: string; license: string; description: string; source: string } | null>(null);
  // The repositories that take packs of assets (service 0.10.0 and later).
  const targets = $derived(repo.info ? sourcesOn().filter((s) => s.kind === 'repo' && repo.catalogs[s.id]?.catalog?.features?.includes('assets')) : []);
  $effect(() => {
    if (saving && !saving.source && targets[0]) saving.source = targets[0].id;
  });
  // Published from here: the version in the Community.
  const publishedOf = (id: string) => repo.info?.assets.published[id];
  let busy = $state(false);
  let said = $state<string | null>(null);
  let error = $state<string | null>(null);

  const fail = (e: unknown) => {
    const code = /assetpack:([a-z]+)/.exec(String(e))?.[1];
    error = t(code ? (`mapedit.pack.err.${code}` as never) : 'mapedit.pack.err.other');
  };
  function save(folder: string, pack: AssetPackManifest | null) {
    said = error = null;
    saving = { folder, title: pack?.title ?? folder, author: pack?.author ?? '', license: pack?.license ?? '', description: '', source: '' };
    void loadCatalogs();
  }
  async function share() {
    if (!saving || !saving.title.trim() || !saving.source) return;
    busy = true;
    error = null;
    const s = $state.snapshot(saving);
    const ok = await publishAssets({ source: s.source, folder: s.folder, title: s.title, description: s.description, lang: locale.lang, author: s.author, license: s.license });
    busy = false;
    if (ok) {
      said = t('mapedit.pack.shared', { title: s.title });
      saving = null;
      await assets.load(true);
    } else error = repo.notice || t('mapedit.pack.err.other');
  }
  async function write() {
    if (!saving || !saving.title.trim()) return;
    busy = true;
    try {
      const m = await window.api.exportAssetPack(saving.folder, { title: saving.title, author: saving.author, license: saving.license });
      if (m) {
        said = t('mapedit.pack.saved', { title: m.title, count: m.count ?? 0, release: m.release });
        saving = null;
        await assets.load(true);
      }
    } catch (e) {
      fail(e);
    } finally {
      busy = false;
    }
  }
  async function install() {
    said = error = null;
    busy = true;
    try {
      const r = await window.api.installAssetPack();
      if (r) {
        said = t(r.replaced ? 'mapedit.pack.updated' : 'mapedit.pack.installed', { title: r.manifest.title, folder: r.folder });
        await assets.load(true);
      }
    } catch (e) {
      fail(e);
    } finally {
      busy = false;
    }
  }
  async function remove(folder: string, title: string) {
    if (!confirm(t('mapedit.pack.removeQ', { title }))) return;
    said = error = null;
    if (await window.api.removeAssetPack(folder)) await assets.load(true);
  }
</script>

<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()} role="presentation">
  <div class="modal" role="dialog" aria-label={t('mapedit.pack.title')}>
    <h3>{t('mapedit.pack.title')}</h3>
    <p class="faint small">{t('mapedit.pack.about')}</p>
    {#if saving}
      <form class="save" onsubmit={(e) => (e.preventDefault(), void write())}>
        <label>{t('mapedit.pack.name')} <input bind:value={saving.title} maxlength="120" required /></label>
        <label>{t('mapedit.pack.author')} <input bind:value={saving.author} maxlength="120" placeholder={t('mapedit.pack.authorPh')} /></label>
        <label>{t('mapedit.pack.license')} <textarea bind:value={saving.license} rows="3" maxlength="2000" placeholder={t('mapedit.pack.licensePh')}></textarea></label>
        <label>{t('mapedit.pack.description')} <textarea bind:value={saving.description} rows="3" maxlength="4000" placeholder={t('mapedit.pack.descriptionPh')}></textarea></label>
        {#if targets.length > 1}
          <label>{t('mapedit.pack.where')}
            <select bind:value={saving.source}>{#each targets as s (s.id)}<option value={s.id}>{sourceName(s)}</option>{/each}</select>
          </label>
        {/if}
        <p class="faint small">{t('mapedit.pack.rights')}</p>
        <div class="row">
          <button class="btn primary" type="submit" disabled={busy || !saving.title.trim()}><Download size={14} /> {t('mapedit.pack.saveFile')}</button>
          <button class="btn" type="button" disabled={busy || !saving.title.trim() || !targets.length || !!repo.busy} title={targets.length ? '' : t('mapedit.pack.noTargets')} onclick={() => void share()}><CloudUpload size={14} /> {t('mapedit.pack.publish')}</button>
          <button class="btn" type="button" onclick={() => (saving = null)}>{t('mapedit.cancel')}</button>
        </div>
        {#if !targets.length}<p class="faint small">{t('mapedit.pack.noTargets')}</p>{/if}
      </form>
    {:else}
      <ul class="list">
        {#each folders as f (f.folder)}
          <li>
            <div class="what">
              <strong>{f.pack?.title ?? f.folder}</strong>
              <span class="faint small">
                {f.pack ? t('mapedit.pack.release', { release: f.pack.release }) + ' · ' : ''}{t('mapedit.pack.count', { count: f.count })}{f.pack?.author ? ` · ${f.pack.author}` : ''}{f.pack && publishedOf(f.pack.id) ? ` · ${t('mapedit.pack.inCommunity', { version: publishedOf(f.pack.id)!.version })}` : ''}
              </span>
              {#if f.pack?.license}<span class="faint small license" title={f.pack.license}>{f.pack.license}</span>{/if}
            </div>
            <button class="btn" disabled={busy} onclick={() => save(f.folder, f.pack)}>{f.pack ? t('mapedit.pack.again') : t('mapedit.pack.save')}</button>
            {#if f.pack}<button class="icon-btn" title={t('mapedit.pack.remove')} disabled={busy} onclick={() => void remove(f.folder, f.pack!.title)}><Trash2 size={14} /></button>{/if}
          </li>
        {:else}
          <li class="faint small">{t('mapedit.pack.none')}</li>
        {/each}
      </ul>
    {/if}
    {#if said}<p class="small ok">{said}</p>{/if}
    {#if error}<p class="small warning">{error}</p>{/if}
    <div class="row end">
      {#if !saving}<button class="btn" disabled={busy} onclick={() => void install()}><PackagePlus size={14} /> {t('mapedit.pack.install')}</button>{/if}
      <button class="btn primary" onclick={onclose}>{t('mapedit.pack.close')}</button>
    </div>
  </div>
</div>

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
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(520px, 92vw);
    max-height: 88vh;
    overflow: auto;
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  h3 {
    margin: 0;
    font-size: 16px;
  }
  p {
    margin: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
  }
  .what {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .license {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .save {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .save label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .save input,
  .save select,
  .save textarea {
    width: 100%;
    font: inherit;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .row.end {
    justify-content: flex-end;
  }
  .ok {
    color: var(--success);
  }
  .warning {
    color: var(--warning);
  }
</style>
