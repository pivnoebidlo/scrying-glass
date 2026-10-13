<!-- Выбор картинки из хранилища: сначала папки персонажей, поиск по имени и пути. -->
<script lang="ts">
  import { Search, X } from '@lucide/svelte';
  import { allFiles, folderRole, vaultUrl, type VaultFolder, thumb } from '../../../shared/vault';
  import { visibleIn } from '../../../shared/adventures';
  import { store } from '../../../renderer/lib/store.svelte';

  let { tree, onpick, onclose }: { tree: VaultFolder; onpick: (path: string) => void; onclose: () => void } = $props();
  const adv = $derived(store.state.adventures);

  let search = $state('');
  const fold = (s: string) => s.normalize('NFC').toLowerCase().replace(/ё/g, 'е');

  // Картинки из папок персонажей — первыми: портреты чаще всего лежат там.
  const images = $derived(
    allFiles(tree, 'image')
      .filter((f) => visibleIn(adv, f.path))
      .map((f) => ({ ...f, portrait: f.path.split('/').some((p) => folderRole(p) === 'characters') }))
      .sort((a, b) => Number(b.portrait) - Number(a.portrait))
  );
  const visible = $derived(images.filter((f) => !search.trim() || fold(f.path).includes(fold(search.trim()))).slice(0, 300));
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label="Картинка из хранилища">
    <header>
      <label class="search">
        <Search size={13} />
        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" placeholder="Поиск по имени файла или папке" bind:value={search} autofocus />
      </label>
      <button class="icon-btn" title="Закрыть (Esc)" onclick={onclose}><X size={16} /></button>
    </header>
    <div class="grid">
      {#each visible as f (f.path)}
        <button class="item" title={f.path} onclick={() => onpick(f.path)}>
          <img src={thumb(vaultUrl(f.path), 200)} alt="" loading="lazy" />
          <span>{f.name}</span>
        </button>
      {:else}
        <p class="faint">В хранилище нет подходящих картинок.</p>
      {/each}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
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
  .item span {
    overflow: hidden;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-muted);
  }
</style>
