<!-- Корзина приложения (main/trash.ts): удалённые файлы, карточки, записи и приключения хранилища и библиотеки.
     Вернуть на прежнее место, удалить насовсем, очистить. -->
<script lang="ts">
  import { BookOpen, Dices, File, Folder, FolderOpen, Image, Map, Music, RotateCcw, Skull, Trash2, X } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import { AUDIO_EXT, IMAGE_EXT, thumb } from '../../../shared/vault';
  import type { TrashItem, TrashPlace } from '../../../shared/trash';
  import { trash, trashCount } from './trash.svelte';
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
  const KIND: Record<string, string> = { adventure: 'приключение', card: 'карточка', folder: 'папка' };
  // Откуда: папка главного пути (у библиотеки — с пометкой).
  function from(it: TrashItem) {
    const p = it.paths[0] ?? '';
    const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
    if (it.place === 'library') return dir ? `библиотека / ${dir}` : 'библиотека';
    return dir || vaultName;
  }
  // Миниатюра удалённой картинки — прямо из .trash.
  const preview = (it: TrashItem) =>
    thumb(`sg-asset://${it.place === 'vault' ? 'v' : 'l'}/` + encodeURIComponent(`.trash/${it.id}/${it.paths[0]}`), 48);

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 864e5).toDateString();
  function when(ms: number) {
    const d = new Date(ms);
    const time = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === today) return `сегодня, ${time}`;
    if (d.toDateString() === yesterday) return `вчера, ${time}`;
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }) + `, ${time}`;
  }
  const size = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} КБ` : `${(b / 1024 / 1024).toFixed(1)} МБ`);
  const total = $derived([...trash.vault, ...trash.library].reduce((s, it) => s + it.size, 0));

  async function restore(it: TrashItem) {
    const res = await window.api.restoreTrash(it.place, it.id);
    if (!res) return;
    const where = res.path.includes('/') ? res.path.slice(0, res.path.lastIndexOf('/')).replace(/^library:/, 'библиотека / ') : res.path.startsWith('library:') ? 'библиотека' : vaultName;
    say(res.kind === 'adventure' ? `Приключение «${res.path}» возвращено вместе со сценами и заготовками боёв.` : `«${res.title}» — снова в «${where}».`);
  }

  const groups = $derived(
    [
      { place: 'vault' as TrashPlace, title: `Хранилище «${vaultName}»`, items: trash.vault },
      { place: 'library' as TrashPlace, title: 'Библиотека — общая для всех кампаний', items: trash.library },
    ].filter((g) => g.items.length)
  );
</script>

<div class="view">
  <header class="toolbar">
    <h2><Trash2 size={16} /> Корзина</h2>
    {#if trashCount()}<span class="faint">{trashCount()} · {size(total)}</span>{/if}
    <div class="spacer"></div>
    <button class="btn" disabled={!trashCount()} onclick={() => window.api.emptyTrash()}><Trash2 size={14} /> Очистить корзину</button>
    <button class="icon-btn" title="Показать папку корзины хранилища в Finder" onclick={() => window.api.revealTrash('vault')}><FolderOpen size={16} /></button>
    <button class="icon-btn" title="Закрыть корзину" onclick={() => (ui.trash = false)}><X size={16} /></button>
  </header>

  <p class="faint hint">
    Удалённое в приложении лежит здесь, пока корзину не очистят: в скрытой папке <code>.trash</code> хранилища (или библиотеки — для
    общих таблиц, записей и карточек). Приключение возвращается вместе со сценами, заготовками боёв и разметкой карт.
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
            <div class="title">{it.title}{#if KIND[it.kind]} <span class="faint kind">{KIND[it.kind]}</span>{/if}</div>
            <div class="faint sub">{from(it)} · {when(it.deleted)} · {size(it.size)}</div>
          </div>
          <button class="btn" title="Вернуть на прежнее место" onclick={() => restore(it)}><RotateCcw size={14} /> Вернуть</button>
          <button class="icon-btn danger" title="Удалить навсегда" onclick={() => window.api.purgeTrash(it.place, it.id, it.title)}><X size={16} /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="empty faint">Корзина пуста.</div>
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
