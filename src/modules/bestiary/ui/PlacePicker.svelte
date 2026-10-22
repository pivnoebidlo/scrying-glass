<!-- Окно «Где хранить?»: библиотека (для всех кампаний) или папка бестиария приключения в хранилище.
     Если подходящей папки ещё нет, её можно создать в любой папке хранилища. -->
<script lang="ts">
  import { hint } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { FolderPlus, Library, Skull, Users, X } from '@lucide/svelte';
  import type { AppState } from '../../../shared/types';
  import { dirname, roleFolders, walk } from '../../../shared/vault';
  import { placeOrder, placeTitle, visibleIn } from '../../../shared/adventures';
  import { samePlace, type Place, type PlaceRequest } from './cards.svelte';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';

  let { app, request }: { app: AppState; request: PlaceRequest } = $props();

  // Новая папка бестиария — с первым из названий роли (настройки «Файлы»).
  const NEW_FOLDER = $derived(app.vault.roles.bestiary[0]!);

  // Папки бестиария текущего приключения (первыми) и общие; чужих приключений здесь нет.
  const adv = $derived(app.adventures);
  // Монстров кладут в папки бестиария, NPC — в папки персонажей рядом с портретами, персонажей игроков — в party.
  const folders = $derived(
    (app.vault.tree
      ? [
          ...roleFolders(app.vault.tree, 'bestiary', app.vault.name).map((f) => ({ ...f, npc: false })),
          ...roleFolders(app.vault.tree, 'characters', app.vault.name).map((f) => ({ ...f, npc: true })),
          ...roleFolders(app.vault.tree, 'party', app.vault.name).map((f) => ({ ...f, npc: true, party: true })),
        ]
      : []
    )
      .filter((f) => visibleIn(adv, f.folder.path))
      .map((f) => {
        const dir = dirname(f.folder.path);
        return { ...f, title: placeTitle(adv, dir, app.vault.name), order: placeOrder(adv, dir) };
      })
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ru') || Number(a.npc) - Number(b.npc))
  );
  // Где можно создать новую папку бестиария: любая папка хранилища, кроме уже бестиарных.
  const parents = $derived.by(() => {
    const out: { path: string; title: string }[] = [];
    if (app.vault.tree) {
      walk(app.vault.tree, (f) => {
        if (!visibleIn(adv, f.path)) return;
        if (!folders.some((b) => f.path === b.folder.path || f.path.startsWith(b.folder.path + '/'))) {
          out.push({ path: f.path, title: f.path ? f.path.split('/').join(' / ') : t('best.root', { vault: app.vault.name }) });
        }
      });
    }
    return out;
  });
  // Папку для новой «monsters» выбирают явно: раньше по умолчанию стоял корень, и карточки уходили не туда.
  // В приключении папка monsters есть всегда (её создаёт проверка при запуске), так что этот выбор нужен
  // для глав и общих папок.
  let parent = $state<string | null>(null);

  const pick = (p: Place) => request.resolve(p);
  const disabled = (p: Place) => samePlace(p, request.exclude);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && request.resolve(null)} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && request.resolve(null)}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={request.title}>
    <header>
      <h3>{request.title}</h3>
      <button class="icon-btn" title={hint(t('lib.cancel'), 'close')} onclick={() => request.resolve(null)}><X size={16} /></button>
    </header>

    <div class="body">
      {#if request.library}
        <button class="place" disabled={disabled({ scope: 'library' })} onclick={() => pick({ scope: 'library' })}>
          <Library size={16} />
          <span class="text">
            <span class="name">{t('best.libraryShort')}</span>
            <span class="desc">{t('best.libraryAll')}</span>
          </span>
        </button>
      {/if}

      <div class="section">{t('best.vaultNamed', { name: app.vault.name })}</div>
      {#each folders as f (f.folder.path)}
        {@const p = { scope: 'vault', folder: f.folder.path } as Place}
        <button class="place" disabled={disabled(p)} onclick={() => pick(p)}>
          {#if f.npc}<Users size={16} />{:else}<Skull size={16} />{/if}
          <span class="text">
            <span class="name">{f.title} · {'party' in f ? t('best.folderParty') : f.npc ? t('best.folderCharacters') : t('best.folderMonsters')}</span>
            <span class="desc">{f.folder.path}{disabled(p) ? t('best.alreadyHere') : ''}</span>
          </span>
        </button>
      {:else}
        <p class="faint hint">
          {t('best.noFolders')} <RoleFolderNames role="bestiary" />.
        </p>
      {/each}

      <div class="new">
        <FolderPlus size={16} />
        <span>{t('best.newFolder')} <code>{NEW_FOLDER}</code> {t('best.newFolderIn')}</span>
        <select bind:value={parent}>
          <option value={null} disabled>{t('best.pickFolder')}</option>
          {#each parents as p (p.path)}<option value={p.path}>{p.title}</option>{/each}
        </select>
        <button
          class="btn"
          disabled={parent === null}
          onclick={() => parent !== null && pick({ scope: 'vault', folder: parent ? `${parent}/${NEW_FOLDER}` : NEW_FOLDER })}
        >
          {request.action}
        </button>
      </div>
    </div>
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
    width: min(560px, calc(100vw - 80px));
    max-height: calc(100vh - 80px);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  header {
    display: flex;
    align-items: center;
    padding: 12px 12px 8px 16px;
  }
  h3 {
    flex: 1;
    margin: 0;
    font-size: 15px;
  }
  .body {
    padding: 0 12px 14px;
    overflow: auto;
  }
  .section {
    margin: 10px 4px 4px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .place {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: var(--radius-m);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .place:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .place:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    color: var(--text-normal);
  }
  .desc {
    overflow: hidden;
    color: var(--text-faint);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint {
    margin: 4px 10px;
    font-size: 12px;
  }
  .new {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 10px;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
  }
  .new select {
    flex: 1;
    min-width: 160px;
  }
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
