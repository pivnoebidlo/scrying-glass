<!-- Плитка записки (or a canvas — by the file's suffix): лист в миниатюре, название; always visible at the top —
     «Show» (the main action) and «⋯» (show, edit, Telegram, to trash; a right click opens it too). Щелчок по листу
     игрокам ничего не показывает, двойной — открывает записку в редакторе. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Pencil, Scroll, Send, Trash2 } from '@lucide/svelte';
  import type { MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import TileBar from '../../../renderer/lib/TileBar.svelte';
  import { sendToTelegram, tgReady } from '../../telegram/ui/tg.svelte';
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';
  import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { noteTitle, type Note } from '../../../shared/notes';
  import { isSketchPath, sketchTitle, type Sketch } from '../../../shared/sketch';
  import SketchView from '../../../renderer/lib/sketch/SketchView.svelte';
  import { editNote } from './ui.svelte';

  let { path, onopen }: { path: string; onopen?: () => void } = $props();

  connectNotes();
  const sketchy = $derived(isSketchPath(path));
  const title = $derived(sketchy ? sketchTitle(path) : noteTitle(path));
  let note = $state.raw<Note | null>(null);
  let sketch = $state.raw<Sketch | null>(null);
  $effect(() => {
    const p = path;
    void notes.rev;
    let stale = false;
    if (isSketchPath(p)) window.api.readSketch(p).then((s) => !stale && (sketch = s));
    else window.api.readNote(p).then((n) => !stale && (note = n));
    return () => (stale = true);
  });

  const shown = $derived(store.state.handouts.current === path);

  // Подтверждение спросит само действие (системный диалог, файл уходит в корзину приложения).
  const trash = () => dispatch('vault', 'trash', { paths: [path] });
  const toggle = () => dispatch('handouts', 'toggle', { path });
  const edit = () => (onopen ? onopen() : editNote(path));
  const items = (): MenuItem[] => [
    { label: shown ? t('tools.card.removeFromScreen') : t('tools.card.show'), icon: Scroll, action: toggle },
    { label: t('tools.card.edit'), icon: Pencil, action: edit },
    ...(tgReady() ? [{ label: t('tg.sendShort'), icon: Send, action: () => sendToTelegram({ kind: 'note', path, title }) }] : []),
    { label: t('tools.card.toTrash'), icon: Trash2, danger: true, action: trash },
  ];
  let bar = $state<TileBar>();
</script>

<div class="card" class:on={shown} oncontextmenu={(e) => bar?.openMenu(e)} role="none">
  <button class="thumb" title={t('tools.card.zoom')} ondblclick={edit}>
    {#if sketchy}{#if sketch}<SketchView {sketch} small />{/if}{:else if note}<NotePaper {note} />{/if}
  </button>
  <TileBar bind:this={bar} main={{ icon: Scroll, label: shown ? t('tools.card.removeFromScreen') : t('tools.card.show'), on: shown, run: toggle }} {items} />
  <div class="caption" title={path}>{title}</div>
</div>

<style>
  .card {
    position: relative;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .card.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .thumb {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    padding: 6%;
    border: 0;
    background: #17130f;
    cursor: zoom-in;
    border-radius: var(--radius-m) var(--radius-m) 0 0;
    overflow: hidden;
  }
  .caption {
    padding: 6px 8px;
    border-top: 1px solid var(--border);
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
