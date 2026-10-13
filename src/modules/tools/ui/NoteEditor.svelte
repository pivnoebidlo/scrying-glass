<!-- Редактор записки: слева текст и оформление, справа лист, как его увидят игроки. Сохраняется само
     (через полсекунды после правки); если записка у игроков, она обновляется у них тоже. -->
<script lang="ts">
  import { AlignCenter, AlignJustify, AlignLeft, ChevronLeft, Dices, Eye, EyeOff, TriangleAlert } from '@lucide/svelte';
  import { onDestroy, untrack } from 'svelte';
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import {
    NOTE_EDGES, NOTE_FONTS, NOTE_INKS, NOTE_PAPERS, NOTE_SEALS, NOTE_SHAPES, noteTitle,
    type Note, type NoteEdge, type NoteFont, type NoteInk, type NotePaper as Paper, type NoteSeal, type NoteShape,
  } from '../../../shared/notes';
  import { ui } from './ui.svelte';

  let { path }: { path: string } = $props();

  let note = $state<Note | null>(null);
  let missing = $state(false);
  let overflow = $state(false);
  let saved = $state(true);
  let title = $state(untrack(() => noteTitle(path)));

  // Записка читается один раз при открытии; дальше источник правды — редактор.
  window.api.readNote(untrack(() => path)).then((n) => {
    if (n) note = n;
    else missing = true;
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  let first = true;
  $effect(() => {
    const snap = note && $state.snapshot(note);
    if (!snap) return;
    if (first) {
      first = false;
      return;
    }
    saved = false;
    clearTimeout(timer);
    timer = setTimeout(() => save(snap as Note), 500);
  });

  let pending: Note | null = null;
  async function save(n: Note) {
    pending = n;
    await window.api.writeNote(path, n);
    if (pending === n) saved = true;
  }

  // Ушли из редактора — несохранённое дописываем сразу.
  onDestroy(() => {
    clearTimeout(timer);
    if (note && !saved) window.api.writeNote(path, $state.snapshot(note) as Note);
  });

  async function rename() {
    const t = title.trim();
    if (!t || t === noteTitle(path)) return (title = noteTitle(path));
    const next = await window.api.renameNote(path, t);
    if (next) ui.note = next;
  }

  const shown = $derived(store.state.handouts.current === path);

  // Шрифты по группам для списка.
  const fontGroups = Object.entries(NOTE_FONTS).reduce<Record<string, [NoteFont, string][]>>((acc, [id, f]) => {
    (acc[f.group] ??= []).push([id as NoteFont, f.title]);
    return acc;
  }, {});

  const SEAL_TITLES: Record<NoteSeal, string> = { none: 'Без печати', red: 'Красная', black: 'Чёрная', green: 'Зелёная', blue: 'Синяя', gold: 'Золотая' };
</script>

<div class="editor">
  <header class="bar">
    <button class="icon-btn" title="Ко всем запискам" onclick={() => (ui.note = null)}><ChevronLeft size={16} /></button>
    <input class="title" type="text" bind:value={title} title="Название записки (и имя файла)" onchange={rename} onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
    <span class="faint status">{missing ? '' : saved ? 'сохранено' : 'сохраняется…'}</span>
    <div class="spacer"></div>
    <button class="btn" class:primary={!shown} disabled={!note} onclick={() => dispatch('handouts', 'toggle', { path })}>
      {#if shown}<EyeOff size={14} /> Убрать у игроков{:else}<Eye size={14} /> Показать игрокам{/if}
    </button>
  </header>

  {#if missing}
    <p class="faint empty">Не удалось прочитать записку: файла нет или он повреждён.</p>
  {:else if note}
    <div class="columns">
      <form class="form" onsubmit={(e) => e.preventDefault()}>
        <label class="field">
          <span>Текст</span>
          <textarea rows="12" bind:value={note.text} placeholder={'# Письмо\n\nДорогой друг, *спешу сообщить*…\n\n---\n\nПустая строка — новый абзац.'}></textarea>
          <small class="faint">«# » — заголовок, «## » — подзаголовок, *курсив*, **жирный**, «- » — список, «---» — украшение.</small>
        </label>

        <div class="row">
          <label class="field grow">
            <span>Шрифт</span>
            <select bind:value={note.font}>
              {#each Object.entries(fontGroups) as [g, list] (g)}
                <optgroup label={g}>{#each list as [id, t] (id)}<option value={id}>{t}</option>{/each}</optgroup>
              {/each}
            </select>
          </label>
          <div class="field">
            <span>Выравнивание</span>
            <div class="seg">
              <button type="button" class:active={note.align === 'left'} title="По левому краю" onclick={() => (note!.align = 'left')}><AlignLeft size={14} /></button>
              <button type="button" class:active={note.align === 'center'} title="По центру" onclick={() => (note!.align = 'center')}><AlignCenter size={14} /></button>
              <button type="button" class:active={note.align === 'justify'} title="По ширине" onclick={() => (note!.align = 'justify')}><AlignJustify size={14} /></button>
            </div>
          </div>
        </div>

        <div class="field">
          <span>Размер текста</span>
          <div class="size"><Slider value={note.size} min={2} max={10} step={0.1} oninput={(v) => (note!.size = v)} /><span class="faint">{note.size.toFixed(1)}</span></div>
        </div>

        <div class="row">
          <label class="field grow">
            <span>Бумага</span>
            <select value={note.paper} onchange={(e) => (note!.paper = e.currentTarget.value as Paper)}>
              {#each Object.entries(NOTE_PAPERS) as [id, t] (id)}<option value={id}>{t}</option>{/each}
            </select>
          </label>
          <label class="field grow">
            <span>Край</span>
            <select value={note.edge} onchange={(e) => (note!.edge = e.currentTarget.value as NoteEdge)}>
              {#each Object.entries(NOTE_EDGES) as [id, t] (id)}<option value={id}>{t}</option>{/each}
            </select>
          </label>
          <label class="field grow">
            <span>Форма</span>
            <select value={note.shape} onchange={(e) => (note!.shape = e.currentTarget.value as NoteShape)}>
              {#each Object.entries(NOTE_SHAPES) as [id, s] (id)}<option value={id}>{s.title}</option>{/each}
            </select>
          </label>
        </div>

        <div class="row">
          <label class="field grow">
            <span>Чернила</span>
            <select value={note.ink} onchange={(e) => (note!.ink = e.currentTarget.value as NoteInk)}>
              {#each Object.entries(NOTE_INKS) as [id, i] (id)}<option value={id}>{i.title}</option>{/each}
            </select>
          </label>
          <div class="field">
            <span>Пятна и края</span>
            <button type="button" class="btn" title="Другие пятна и другой рисунок края" onclick={() => (note!.seed = Math.floor(Math.random() * 10000))}><Dices size={14} /> Перемешать</button>
          </div>
        </div>

        <div class="row">
          <label class="field grow">
            <span>Подпись</span>
            <input type="text" bind:value={note.signature} placeholder="Ваш друг, Гилберт" />
          </label>
          <label class="field">
            <span>Шрифт подписи</span>
            <select bind:value={note.signatureFont}>
              {#each Object.entries(fontGroups) as [g, list] (g)}
                <optgroup label={g}>{#each list as [id, t] (id)}<option value={id}>{t}</option>{/each}</optgroup>
              {/each}
            </select>
          </label>
        </div>

        <div class="row">
          <label class="field grow">
            <span>Сургучная печать</span>
            <select value={note.seal} onchange={(e) => (note!.seal = e.currentTarget.value as NoteSeal)}>
              {#each Object.keys(NOTE_SEALS) as id (id)}<option value={id}>{SEAL_TITLES[id as NoteSeal]}</option>{/each}
            </select>
          </label>
          {#if note.seal !== 'none'}
            <label class="field">
              <span>Буква</span>
              <input class="letter" type="text" maxlength="2" bind:value={note.sealLetter} placeholder="Г" />
            </label>
          {/if}
        </div>
      </form>

      <div class="preview">
        <div class="paper"><NotePaper note={note} shadow bind:overflow /></div>
        {#if overflow}
          <p class="warn"><TriangleAlert size={14} /> Текст не помещается на лист: уменьшите размер текста, сократите текст или выберите форму побольше.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  .title {
    min-width: 220px;
    padding: 3px 6px;
    border-color: transparent;
    background: none;
    font-size: 17px;
    font-weight: 600;
  }
  .title:hover,
  .title:focus {
    border-color: var(--border);
  }
  .status {
    font-size: 12px;
  }
  .spacer {
    flex: 1;
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(320px, 440px) 1fr;
    flex: 1;
    min-height: 0;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    overflow: auto;
    border-right: 1px solid var(--border);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }
  .grow {
    flex: 1;
    min-width: 0;
  }
  textarea {
    width: 100%;
    resize: vertical;
    font: inherit;
    line-height: 1.45;
  }
  small {
    font-size: 11px;
  }
  .size {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .size > :global(*:first-child) {
    flex: 1;
  }
  .size span {
    width: 28px;
    font-size: 12px;
    text-align: right;
  }
  .seg {
    display: flex;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 24px;
    border: 0;
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg button.active {
    background: var(--accent);
    color: #fff;
  }
  .letter {
    width: 56px;
    text-align: center;
  }
  .preview {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    padding: 24px;
    background: #17130f;
  }
  .paper {
    flex: 1;
    min-height: 0;
  }
  .warn {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: #f0c45a;
    font-size: 12px;
  }
  .empty {
    padding: 40px;
    text-align: center;
  }
</style>
