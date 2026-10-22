<!-- Выбор файлов из хранилища (картинки, записки): сначала папки нужной роли, поиск по имени и пути. multi — можно
     отметить несколько и добавить разом. Файлы текущего приключения и общие. -->
<script lang="ts">
  import { t } from './i18n.svelte';
  import { Check, ScrollText, Search, X } from '@lucide/svelte';
  import { allFiles, folderRole, vaultUrl, type FileKind, type FolderRole, type VaultFolder, thumb, prettyName } from '../../shared/vault';
  import { visibleIn } from '../../shared/adventures';
  import { store } from './store.svelte';

  let {
    tree,
    onpick,
    onclose,
    kinds = ['image'],
    prefer = 'characters',
    multi = false,
    skip = [],
  }: {
    tree: VaultFolder;
    onpick: (paths: string[]) => void;
    onclose: () => void;
    kinds?: FileKind[];
    // Папки этой роли — первыми.
    prefer?: FolderRole;
    multi?: boolean;
    // Уже выбранное раньше (в подборке): отмечено и не предлагается.
    skip?: string[];
  } = $props();
  const adv = $derived(store.state.adventures);

  let search = $state('');
  let chosen = $state<string[]>([]);
  const fold = (s: string) => s.normalize('NFC').toLowerCase().replace(/ё/g, 'е');

  const files = $derived(
    allFiles(tree)
      .filter((f) => kinds.includes(f.kind) && visibleIn(adv, f.path))
      .map((f) => ({ ...f, first: f.path.split('/').some((p) => folderRole(p) === prefer) }))
      .sort((a, b) => Number(b.first) - Number(a.first))
  );
  const visible = $derived(files.filter((f) => !search.trim() || fold(f.path).includes(fold(search.trim()))).slice(0, 300));

  function pick(path: string) {
    if (skip.includes(path)) return;
    if (!multi) return onpick([path]);
    chosen = chosen.includes(path) ? chosen.filter((x) => x !== path) : [...chosen, path];
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={t('lib.vaultFiles')}>
    <header>
      <label class="search">
        <Search size={13} />
        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" placeholder={t('lib.searchFiles')} bind:value={search} autofocus />
      </label>
      <button class="icon-btn" title={t('app.closeEsc')} onclick={onclose}><X size={16} /></button>
    </header>
    <div class="grid">
      {#each visible as f (f.path)}
        {@const on = chosen.includes(f.path) || skip.includes(f.path)}
        <button class="item" class:on class:skip={skip.includes(f.path)} title={skip.includes(f.path) ? t('lib.alreadyAddedPath', { path: f.path }) : f.path} onclick={() => pick(f.path)}>
          {#if f.kind === 'image'}
            <img src={thumb(vaultUrl(f.path), 200)} alt="" loading="lazy" />
          {:else}
            <div class="doc"><ScrollText size={28} /><b>{prettyName(f.path)}</b></div>
          {/if}
          <span>{f.name}</span>
          {#if on}<i class="mark"><Check size={12} /></i>{/if}
        </button>
      {:else}
        <p class="faint">{t('lib.noFiles')}</p>
      {/each}
    </div>
    {#if multi}
      <footer>
        <span class="faint">{chosen.length ? t('lib.selected', { count: chosen.length }) : t('lib.clickFiles')}</span>
        <button class="btn" onclick={onclose}>{t('lib.cancel')}</button>
        <button class="btn primary" disabled={!chosen.length} onclick={() => onpick($state.snapshot(chosen))}>{t('lib.add')}</button>
      </footer>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.55);
  }
  .modal {
    display: flex;
    flex-direction: column;
    width: min(860px, calc(100vw - 80px));
    height: min(620px, calc(100vh - 80px));
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  header {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }
  .search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    color: var(--text-faint);
  }
  .search input {
    flex: 1;
    padding: 5px 0;
    border: 0;
    background: none;
  }
  .search input:focus {
    outline: none;
  }
  .grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    align-content: start;
    gap: 10px;
    padding: 12px;
    overflow: auto;
  }
  .item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    cursor: pointer;
  }
  .item:hover {
    border-color: var(--accent);
  }
  .item img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: var(--radius-s);
  }
  .item {
    position: relative;
  }
  .item.on {
    border-color: var(--accent);
  }
  .item.skip {
    opacity: 0.45;
    cursor: default;
  }
  .mark {
    position: absolute;
    top: 8px;
    right: 8px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--on-accent);
  }
  .doc {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    aspect-ratio: 3 / 4;
    padding: 8px;
    border-radius: var(--radius-s);
    background: var(--bg-hover);
    color: var(--text-faint);
  }
  .doc b {
    overflow: hidden;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 500;
    text-align: center;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid var(--border);
  }
  footer .faint {
    flex: 1;
  }
  .item span {
    overflow: hidden;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-muted);
  }
</style>
