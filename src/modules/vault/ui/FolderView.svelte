<!-- Вкладка «Файлы»: содержимое выбранной папки хранилища. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { hint } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { BookOpen, ChevronRight, ClipboardPaste, Download, FilePlus, FolderOpen, Map, Music, Trash2 } from '@lucide/svelte';
  import { badgeOf, type ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { findFolder, folderRole } from '../../../shared/vault';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import NameField from '../../../renderer/lib/NameField.svelte';
  import { audioActions } from '../../../renderer/lib/registry';
  import { store } from '../../../renderer/lib/store.svelte';
  import { trackName } from '../../../shared/vault';
  import { folderIcon, followAdventure, ui } from './ui.svelte';
  import CardRow from './CardRow.svelte';
  import TrashView from './TrashView.svelte';
  import NoteCard from '../../tools/ui/NoteCard.svelte';
  import { onMount } from 'svelte';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { dirname } from '../../../shared/vault';
  import ThumbSize from '../../../renderer/lib/ThumbSize.svelte';
  import { thumbs } from '../../../renderer/lib/thumbs.svelte';
  import { sortable } from '../../../renderer/lib/sortable';
  import { applyOrder } from '../../../shared/order';
  import { adventureHidden, adventureOf, isSupplement, visibleIn } from '../../../shared/adventures';

  let { ms, app }: ModuleProps<'vault'> = $props();

  // Если выбранную папку удалили или она внутри скрытого приключения (его система отключена), показываем корень.
  const folder = $derived(
    ms.tree ? ((!adventureHidden(app.adventures, adventureOf(app.adventures, ui.folder)) && findFolder(ms.tree, ui.folder)) || ms.tree) : null
  );
  const subfolders = $derived(folder ? folder.folders.filter((f) => visibleIn({ ...app.adventures, current: null }, f.path)) : []);

  // Папка первого уровня может быть приключением: отсюда его отмечают и открывают.
  const topLevel = $derived(!!folder?.path && !folder.path.includes('/') && !folderRole(folder.name));
  const isAdventure = $derived(!!folder && app.adventures.list.includes(folder.path));
  const supplement = $derived(!!folder && isSupplement(app.adventures, folder.path));
  const crumbs = $derived.by(() => {
    if (!folder?.path) return [];
    const parts = folder.path.split('/');
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }));
  });
  // Порядок плиток — общий с вкладками («Персонажи», «Фоны», «Раздатка»): группа — путь папки. Записки
  // (раздатка из «Инструментов») — плитками вместе с картинками.
  const images = $derived(
    folder ? applyOrder(folder.files.filter((f) => f.kind === 'image' || f.kind === 'note' || f.kind === 'sketch'), (f) => f.path, app.order.groups[folder.path]) : []
  );

  // Карточки (*.json) этой папки — их знает бестиарий, дерево хранилища показывает только картинки и музыку.
  onMount(connectCards);
  // Порядок карточек — общий с монстрами во вкладке «Персонажи» (группа «monsters:<папка>»).
  const cardsGroup = $derived(folder ? 'monsters:' + folder.path : '');
  const cards = $derived(
    folder
      ? applyOrder(
          bestiary.all.filter((c) => c.ref.scope === 'vault' && c.file && dirname(c.file) === folder.path).sort((a, b) => a.name.localeCompare(b.name, 'ru')),
          (c) => c.ref.id,
          app.order.groups[cardsGroup]
        )
      : []
  );
  // Папка карточек — монстры, персонажи или партия (или вложенная в такую): сюда можно создавать и импортировать.
  const cardFolder = $derived(
    !!folder?.path && folder.path.split('/').some((p) => ['bestiary', 'characters', 'party'].includes(folderRole(p) ?? ''))
  );
  // Имя ввели вместе с расширением (как оно и показано) — расширение ядро допишет само.
  const withoutExt = (name: string, file: string) => {
    const ext = file.slice(file.lastIndexOf('.'));
    return file.includes('.') && name.toLowerCase().endsWith(ext.toLowerCase()) ? name.slice(0, -ext.length) : name;
  };
  const audio = $derived(folder?.files.filter((f) => f.kind === 'audio') ?? []);
  // Главная кнопка плитки (первая): в папках персонажей — портрет, в папках карт — карта, в остальных — на весь экран.
  const role = $derived(folder ? folderRole(folder.name) : null);
  const primary = $derived(
    role === 'characters' || role === 'party' ? 'portrait' : role === 'maps' ? 'map' : role === 'handouts' ? 'handout' : 'background'
  );

  // ⌘V во вкладке «Файлы» — вставить картинку из буфера в открытую папку (если фокус не в поле ввода).
  function onkeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    if (!(e.metaKey || e.ctrlKey) || e.code !== 'KeyV' || !folder || ui.trash) return;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    dispatch('vault', 'pasteImage', { folder: folder.path });
  }

  function go(path: string) {
    ui.folder = path;
    followAdventure(path);
    // Раскрываем ветку в дереве, чтобы было видно, где мы.
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) ui.expanded[parts.slice(0, i).join('/')] = true;
  }
</script>

<svelte:window {onkeydown} />

{#if ui.trash && ms.tree}
  <TrashView vaultName={ms.name} />
{:else if folder}
  <div class="view">
    <header class="toolbar">
      <nav class="crumbs">
        <button class="crumb" onclick={() => go('')}>{ms.name}</button>
        {#each crumbs as c (c.path)}
          <ChevronRight size={12} class="faint" />
          <button class="crumb" onclick={() => go(c.path)}>{c.name}</button>
        {/each}
      </nav>
      <div class="spacer"></div>
      {#if cardFolder}
        <button class="btn" title={t('vault.newCardHere')} onclick={() => bestiary.create({ scope: 'vault', folder: folder.path })}>
          <FilePlus size={14} /> {t('vault.newCard')}
        </button>
        <button
          class="btn"
          title={t('vault.importCardsHint')}
          onclick={() => bestiary.importFiles({ scope: 'vault', folder: folder.path })}
        >
          <Download size={14} /> {t('vault.importCards')}
        </button>
      {/if}
      {#if topLevel && isAdventure}
        <!-- Приключение открывается само, когда выбрана его папка в дереве. -->
        <span class="badge-adv" title={t('vault.adventureBadgeHint')}>
          {#if supplement}<BookOpen size={12} /> {t('vault.supplementBadge')}{:else}<Map size={12} /> {t('vault.adventureBadge')}{/if}
        </span>
        <button
          class="btn"
          title={t(supplement ? 'vault.unmarkSupplementHint' : 'vault.unmarkHint')}
          onclick={() => dispatch('adventures', 'unmark', { path: folder.path })}>{t(supplement ? 'vault.unmarkSupplement' : 'vault.unmark')}</button
        >
      {:else if topLevel}
        <button
          class="btn"
          title={t('vault.markHint')}
          onclick={() => dispatch('adventures', 'mark', { path: folder.path })}><Map size={14} /> {t('vault.mark')}</button
        >
        <button
          class="btn"
          title={t('vault.markSupplementHint')}
          onclick={() => dispatch('adventures', 'mark', { path: folder.path, supplement: 'collection' })}><BookOpen size={14} /> {t('vault.markSupplement')}</button
        >
      {/if}
      <button class="btn" title={hint(t('vault.pasteHint'), 'paste')} onclick={() => dispatch('vault', 'pasteImage', { folder: folder.path })}>
        <ClipboardPaste size={14} /> {t('vault.paste')}
      </button>
      <button class="btn" onclick={() => dispatch('vault', 'importFiles', { folder: folder.path })}>
        <FilePlus size={14} /> {t('vault.addFiles')}
      </button>
      <button class="icon-btn" title={t('vault.reveal')} onclick={() => dispatch('vault', 'reveal', { folder: folder.path })}>
        <FolderOpen size={16} />
      </button>
    </header>

    {#if subfolders.length}
      <div class="folders">
        {#each subfolders as f (f.path)}
          {@const Icon = folderIcon(f.name)}
          <button class="folder" onclick={() => go(f.path)}>
            <Icon size={16} />
            <span class="name">{f.name}</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if cards.length}
      <h3>{t('vault.cards')} <span class="faint">{cards.length}</span></h3>
      <ul class="cards">
        {#each cards as c (c.ref.id)}
          <CardRow card={c} sort={{ group: cardsGroup, id: c.ref.id, ids: cards.map((x) => x.ref.id), vertical: true }} />
        {/each}
      </ul>
    {/if}

    {#if images.length}
      <div class="images-head">
        <h3>{images.some((f) => f.kind === 'note' || f.kind === 'sketch') ? t('vault.imagesAndNotes') : t('vault.images')} <span class="faint">{images.length}</span></h3>
        <ThumbSize grid="files" />
      </div>
      <p class="faint hint">
        <Lead text={t('vault.imagesHint')} />
      </p>
      <div class="grid" style:--thumb="{thumbs.files}px">
        {#each images as f (f.path)}
          <div use:sortable={{ group: folder.path, id: f.path, ids: images.map((x) => x.path), file: f.path }}>
            {#if f.kind === 'note' || f.kind === 'sketch'}
              <NoteCard path={f.path} />
            {:else}
              <ImageCard path={f.path} {primary} aspect={role === 'characters' || role === 'party' || role === 'handouts' ? '3 / 4' : '4 / 3'}>
                <NameField value={f.name} title={t('vault.renameFile')} onrename={(name) => window.api.renameFile(f.path, withoutExt(name, f.name))} />
              </ImageCard>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if audio.length}
      <h3>{t('vault.music')} <span class="faint">{audio.length}</span></h3>
      <ul class="audio">
        {#each audio as f (f.path)}
          {@const on = audioActions.filter((a) => a.active(store.state, f.path))}
          <li class:on={on.length > 0}>
            <Music size={14} />
            <span class="track" title={f.name}>{trackName(f.path)}</span>
            {#each on as a (a.id)}<span class="badge">{badgeOf(a, store.state, f.path)}</span>{/each}
            {#each audioActions as a (a.id)}
              <button class="icon-btn" class:active={a.active(store.state, f.path)} title={a.title} onclick={() => a.toggle(store.state, f.path)}>
                <a.icon size={14} />
              </button>
            {/each}
            <button class="icon-btn trash" title={t('vault.toTrash')} onclick={() => dispatch('vault', 'trash', { paths: [f.path] })}>
              <Trash2 size={14} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if !folder.folders.length && !folder.files.length && !cards.length}
      <div class="empty faint">{t('vault.emptyFolder')}</div>
    {/if}
  </div>
{/if}

<style>
  .trash:hover {
    color: var(--danger);
  }
  .view {
    padding: 0 20px 20px;
  }
  .badge-adv {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-hover);
    font-size: 12px;
  }
  /* Кнопок бывает много (папка карточек, приключение): они переносятся на вторую строку, а путь не сжимается. */
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    background: var(--bg-primary);
  }
  .spacer {
    flex: 1;
  }
  .crumbs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
    min-width: 0;
  }
  .crumb {
    white-space: nowrap;
    padding: 3px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .crumb:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .crumb:last-child {
    color: var(--text-normal);
    font-weight: 600;
  }
  .folders {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
    margin-bottom: 8px;
  }
  .folder {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .folder:hover {
    border-color: var(--accent);
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cards {
    margin: 4px 0 8px;
    padding: 0;
    list-style: none;
  }
  .images-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
  }
  .images-head h3 {
    margin-top: 0;
  }
  h3 {
    margin: 20px 0 2px;
    font-size: 14px;
  }
  .hint {
    margin: 0 0 10px;
    font-size: 12px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--thumb), 1fr));
    gap: 12px;
  }
  .audio {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .audio li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px 2px 8px;
    border-radius: var(--radius-s);
    color: var(--text-muted);
  }
  .audio li:hover {
    background: var(--bg-hover);
  }
  .audio li.on {
    color: var(--accent);
  }
  .track {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 11px;
  }
  .empty {
    padding: 40px 0;
    text-align: center;
  }
</style>
