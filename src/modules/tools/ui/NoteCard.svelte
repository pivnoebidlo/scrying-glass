<!-- Плитка записки: лист в миниатюре, название, кнопки «показать игрокам», «править», «в корзину» (подпись кнопки —
     сразу при наведении). Щелчок по листу игрокам ничего не показывает, двойной — открывает записку в редакторе. -->
<script lang="ts">
  import { Pencil, Scroll, Trash2 } from '@lucide/svelte';
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';
  import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { noteTitle, type Note } from '../../../shared/notes';
  import { editNote } from './ui.svelte';

  let { path, onopen }: { path: string; onopen?: () => void } = $props();

  connectNotes();
  let note = $state.raw<Note | null>(null);
  $effect(() => {
    const p = path;
    void notes.rev;
    let stale = false;
    window.api.readNote(p).then((n) => !stale && (note = n));
    return () => (stale = true);
  });

  const shown = $derived(store.state.handouts.current === path);

  // Подтверждение спросит само действие (системный диалог, файл уходит в корзину приложения).
  const trash = () => dispatch('vault', 'trash', { paths: [path] });
</script>

<div class="card" class:on={shown}>
  <button class="thumb" title="Двойной щелчок — открыть в редакторе" ondblclick={() => (onopen ? onopen() : editNote(path))}>
    {#if note}<NotePaper {note} />{/if}
  </button>
  {#if shown}<span class="badge">раздатка</span>{/if}
  <div class="actions">
    <button class="act" aria-label="Показать игрокам" class:active={shown} onclick={() => dispatch('handouts', 'toggle', { path })}
      ><Scroll size={14} /><span class="tip">{shown ? 'Убрать с экрана' : 'Показать игрокам'}</span></button
    >
    <button class="act" aria-label="Править" onclick={() => (onopen ? onopen() : editNote(path))}><Pencil size={14} /><span class="tip">Править</span></button>
    <button class="act" aria-label="В корзину" onclick={trash}><Trash2 size={14} /><span class="tip">В корзину</span></button>
  </div>
  <div class="caption" title={path}>{noteTitle(path)}</div>
</div>

<style>
  /* Без overflow: hidden — подписи кнопок выходят за плитку (лист скруглён сам). */
  .card {
    position: relative;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .card:hover {
    z-index: 5;
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
  .badge {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
  }
  .actions {
    position: absolute;
    top: 6px;
    left: 6px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .card:hover .actions {
    opacity: 1;
  }
  .act {
    position: relative;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: var(--radius-s);
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    cursor: pointer;
  }
  .act:hover,
  .act.active {
    background: var(--accent);
  }
  /* Подпись кнопки — под ней, сразу при наведении. */
  .tip {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 2;
    padding: 2px 8px;
    border-radius: var(--radius-s);
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font-size: 11px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.08s ease;
  }
  .act:hover .tip {
    opacity: 1;
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
