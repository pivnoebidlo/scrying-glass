<!-- Корзина приложения (main/trash.ts): удалённые файлы, карточки, записи и приключения хранилища и библиотеки.
     Вернуть на прежнее место, удалить насовсем, очистить. -->
<script lang="ts">
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { BookOpen, Dices, File, Folder, FolderOpen, Image, Map, Music, RotateCcw, Skull, Trash2, X } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import { AUDIO_EXT, IMAGE_EXT, thumb } from '../../../shared/vault';
  import type { TrashItem, TrashPlace } from '../../../shared/trash';
  import { daysTitle, trash, trashCount } from './trash.svelte';
  import { ui } from './ui.svelte';

  let { vaultName }: { vaultName: string } = $props();

  let message = $state('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  function say(text: string) {
    message = text;
    clearTimeout(timer);
    timer = setTimeout(() => (message = ''), 6000);
  }

  const ext = (p: string) => (p.match(/\.[^./]+$/)?.[0] ?? '').toLowerCase();
  const isImage = (it: TrashItem) => it.kind === 'file' && IMAGE_EXT.includes(ext(it.paths[0] ?? ''));
  function icon(it: TrashItem): Component {
    if (it.kind === 'adventure') return Map;
    if (it.kind === 'card') return Skull;
    if (it.kind === 'folder') return Folder;
    const p = it.paths[0] ?? '';
    if (IMAGE_EXT.includes(ext(p))) return Image;
    if (AUDIO_EXT.includes(ext(p))) return Music;
    if (/(^|\/)tables\//.test(p)) return Dices;
    if (ext(p) === '.md') return BookOpen;
    return File;
  }
  const KIND: Record<string, () => string> = { adventure: () => t('vault.trash.kind.adventure'), card: () => t('vault.trash.kind.card'), folder: () => t('vault.trash.kind.folder') };
  // Откуда: папка главного пути (у библиотеки — с пометкой).
  function from(it: TrashItem) {
    const p = it.paths[0] ?? '';
    const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
    if (it.place === 'library') return dir ? `${t('vault.trash.library')} / ${dir}` : t('vault.trash.library');
    return dir || vaultName;
  }
  // Миниатюра удалённой картинки — прямо из .trash.
  const preview = (it: TrashItem) =>
    thumb(`sg-asset://${it.place === 'vault' ? 'v' : 'l'}/` + encodeURIComponent(`.trash/${it.id}/${it.paths[0]}`), 48);

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 864e5).toDateString();
  function when(ms: number) {
    const d = new Date(ms);
    const time = d.toLocaleTimeString(locale.lang, { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === today) return t('vault.trash.today', { time });
    if (d.toDateString() === yesterday) return t('vault.trash.yesterday', { time });
    return d.toLocaleDateString(locale.lang, { day: 'numeric', month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }) + `, ${time}`;
  }
  const size = (b: number) => (b < 1024 * 1024 ? t('vault.trash.kb', { n: Math.max(1, Math.round(b / 1024)) }) : t('vault.trash.mb', { n: (b / 1024 / 1024).toFixed(1) }));
  const total = $derived([...trash.vault, ...trash.library].reduce((s, it) => s + it.size, 0));

  async function restore(it: TrashItem) {
    const res = await window.api.restoreTrash(it.place, it.id);
    if (!res) return;
    const where = res.path.includes('/') ? res.path.slice(0, res.path.lastIndexOf('/')).replace(/^library:/, t('vault.trash.library') + ' / ') : res.path.startsWith('library:') ? t('vault.trash.library') : vaultName;
    say(res.kind === 'adventure' ? t('vault.trash.adventureBack', { name: res.path }) : t('vault.trash.back', { title: res.title, where }));
  }

  const groups = $derived(
    [
      { place: 'vault' as TrashPlace, title: t('vault.trash.vaultGroup', { name: vaultName }), items: trash.vault },
      { place: 'library' as TrashPlace, title: t('vault.trash.libraryGroup'), items: trash.library },
    ].filter((g) => g.items.length)
  );
</script>

<div class="view">
  <header class="toolbar">
    <h2><Trash2 size={16} /> {t('vault.trash.title')}</h2>
    {#if trashCount()}<span class="faint">{trashCount()} · {size(total)}</span>{/if}
    <div class="spacer"></div>
    <button class="btn" disabled={!trashCount()} onclick={() => window.api.emptyTrash()}><Trash2 size={14} /> {t('vault.trash.empty')}</button>
    <button class="icon-btn" title={t('vault.trash.revealHint')} onclick={() => window.api.revealTrash('vault')}><FolderOpen size={16} /></button>
    <button class="icon-btn" title={t('vault.trash.close')} onclick={() => (ui.trash = false)}><X size={16} /></button>
  </header>

  <p class="faint hint">
    {t('vault.trash.about')}
    {#if !trash.settings.keep}
      <strong>{t('vault.trash.off')}</strong>
    {:else if trash.settings.days}
      {t('vault.trash.autoPrune', { when: daysTitle(trash.settings.days).toLowerCase() })}
    {/if}
    {t('vault.trash.changeIn')}
  </p>
  {#if message}<p class="message">{message}</p>{/if}

  {#each groups as g (g.place)}
    <h3>{g.title} <span class="faint">{g.items.length}</span></h3>
    <ul>
      {#each g.items as it (it.place + it.id)}
        {@const Icon = icon(it)}
        <li>
          {#if isImage(it)}
            <img class="thumb" src={preview(it)} alt="" loading="lazy" />
          {:else}
            <span class="thumb"><Icon size={16} /></span>
          {/if}
          <div class="info">
            <div class="title">{it.title}{#if KIND[it.kind]} <span class="faint kind">{KIND[it.kind]?.()}</span>{/if}</div>
            <div class="faint sub">{from(it)} · {when(it.deleted)} · {size(it.size)}</div>
          </div>
          <button class="btn" title={t('vault.trash.restoreHint')} onclick={() => restore(it)}><RotateCcw size={14} /> {t('vault.trash.restore')}</button>
          <button class="icon-btn danger" title={t('vault.trash.purge')} onclick={() => window.api.purgeTrash(it.place, it.id, it.title)}><X size={16} /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="empty faint">{t('vault.trash.isEmpty')}</div>
  {/each}
</div>

<style>
  .view {
    padding: 0 20px 20px;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    background: var(--bg-primary);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 15px;
  }
  .spacer {
    flex: 1;
  }
  .hint {
    max-width: 720px;
    margin: 0 0 12px;
    font-size: 12px;
  }
  .message {
    margin: 0 0 12px;
    padding: 6px 10px;
    border-radius: var(--radius-s);
    background: var(--accent-soft);
    color: var(--text-normal);
  }
  h3 {
    margin: 16px 0 6px;
    font-size: 13px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: var(--radius-s);
  }
  li:hover {
    background: var(--bg-hover);
  }
  .thumb {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-muted);
    object-fit: cover;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .title,
  .sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .kind,
  .sub {
    font-size: 12px;
  }
  .kind {
    margin-left: 6px;
  }
  .danger:hover {
    color: var(--danger);
  }
  .empty {
    padding: 40px 0;
    text-align: center;
  }
</style>
