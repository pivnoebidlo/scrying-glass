<!-- Редактор записки: слева текст и оформление, справа лист, как его увидят игроки. Сохраняется само
     (через полсекунды после правки); если записка у игроков, она обновляется у них тоже. -->
<script lang="ts">
  import { AlignCenter, AlignJustify, AlignLeft, ArrowUpToLine, ChevronLeft, Dices, Eraser, Eye, EyeOff, Trash2, TriangleAlert } from '@lucide/svelte';
  import { onDestroy, untrack } from 'svelte';
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import {
    MARK_SIZE, NOTE_CREASES, NOTE_EDGES, NOTE_FONTS, NOTE_INKS, NOTE_MARKS, NOTE_PAPERS, NOTE_SEALS, NOTE_SHAPES, NOTE_TINTS, MAX_MARKS,
    markTint, newMark, noteTitle,
    type Note, type NoteCrease, type NoteEdge, type NoteFont, type NoteInk, type NoteMarkKind, type NotePaper as Paper, type NoteSeal,
    type NoteShape, type NoteTint,
  } from '../../../shared/notes';
  import { markDefs, markShape } from '../../../renderer/lib/note/marks';
  import { ui } from './ui.svelte';
  import CopyToMenu from './CopyToMenu.svelte';
  import { notesFolder } from '../../../renderer/lib/note/notes.svelte';

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

  // Копия записки в папку раздатки другого приключения (или общую). В текущее — открываем копию.
  let status = $state('');
  async function copyTo(target: string | null) {
    if (!note) return;
    const app = store.state;
    const folder = notesFolder(app.vault.tree, { ...app.adventures, current: target });
    const copy = await window.api.createNote(folder, noteTitle(path), { ...$state.snapshot(note), seed: note.seed } as Note);
    if (!copy) return;
    if (target === app.adventures.current || app.adventures.current === null) ui.note = copy;
    else {
      status = `Копия — в «${target ?? 'Общее'}»`;
      setTimeout(() => (status = ''), 4000);
    }
  }

  // Шрифты по группам для списка.
  const fontGroups = Object.entries(NOTE_FONTS).reduce<Record<string, [NoteFont, string][]>>((acc, [id, f]) => {
    (acc[f.group] ??= []).push([id as NoteFont, f.title]);
    return acc;
  }, {});

  // ---- Следы ----
  // Выбранный в палитре вид: щелчок по листу ставит такой след (пока вид не снят — Esc или ещё щелчок по нему).
  let tool = $state<NoteMarkKind | null>(null);
  let selected = $state<string | null>(null);
  const mark = $derived(note?.marks.find((m) => m.id === selected) ?? null);

  const markGroups = Object.entries(NOTE_MARKS).reduce<Record<string, NoteMarkKind[]>>((acc, [id, k]) => {
    (acc[k.group] ??= []).push(id as NoteMarkKind);
    return acc;
  }, {});
  // Значок вида в палитре — сам след в миниатюре.
  const icon = (kind: NoteMarkKind) => {
    const p = markShape({ ...newMark(kind, 0, 0), id: kind, seed: 7, angle: 0 }, 'pal', '#9c6a2e');
    return `<defs>${markDefs('pal')}</defs>${p.multiply}${p.normal}`;
  };

  function onpick(e: PointerEvent, id: string | null, x: number, y: number) {
    if (!note) return;
    if (tool) {
      if (note.marks.length >= MAX_MARKS) return;
      const m = newMark(tool, x, y);
      note.marks.push(m);
      selected = m.id;
      return;
    }
    selected = id;
    if (!id) return;
    // Перетаскивание: сдвиг в долях листа от точки нажатия.
    const box = (e.currentTarget as Element).closest('svg')!.getBoundingClientRect();
    const m = note.marks.find((x) => x.id === id)!;
    const start = { x: m.x, y: m.y, cx: e.clientX, cy: e.clientY };
    const move = (ev: PointerEvent) => {
      m.x = Math.min(1.1, Math.max(-0.1, start.x + (ev.clientX - start.cx) / box.width));
      m.y = Math.min(1.1, Math.max(-0.1, start.y + (ev.clientY - start.cy) / box.height));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function removeMark() {
    if (!note || !selected) return;
    note.marks = note.marks.filter((m) => m.id !== selected);
    selected = null;
  }

  function toTop() {
    if (!note || !mark) return;
    const m = mark;
    note.marks = [...note.marks.filter((x) => x.id !== m.id), m];
  }

  // Колёсико над листом: размер выбранного следа, с Shift — поворот.
  function onwheel(e: WheelEvent) {
    if (!mark) return;
    const d = Math.sign(e.deltaY || e.deltaX);
    if (e.shiftKey) mark.angle = (mark.angle + d * 5 + 360) % 360;
    else mark.size = Math.min(MARK_SIZE.max, Math.max(MARK_SIZE.min, +(mark.size * (d > 0 ? 0.92 : 1.08)).toFixed(3)));
  }

  function onkeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'Escape' && (tool || selected)) {
      e.stopPropagation();
      if (tool) tool = null;
      else selected = null;
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
      e.preventDefault();
      removeMark();
    }
  }

  const SEAL_TITLES: Record<NoteSeal, string> = { none: 'Без печати', red: 'Красная', black: 'Чёрная', green: 'Зелёная', blue: 'Синяя', gold: 'Золотая' };
</script>

<svelte:window {onkeydown} />

<div class="editor">
  <header class="bar">
    <button class="icon-btn" title="Ко всем запискам" onclick={() => (ui.note = null)}><ChevronLeft size={16} /></button>
    <input class="title" type="text" bind:value={title} title="Название записки (и имя файла)" onchange={rename} onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
    <span class="faint status">{missing ? '' : saved ? 'сохранено' : 'сохраняется…'}</span>
    {#if status}<span class="copied">{status}</span>{/if}
    <div class="spacer"></div>
    <CopyToMenu title="Скопировать записку в раздатку другого приключения" onpick={copyTo} />
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
          <label class="field grow">
            <span>Состояние</span>
            <select value={note.crease} onchange={(e) => (note!.crease = e.currentTarget.value as NoteCrease)}>
              {#each Object.entries(NOTE_CREASES) as [id, t] (id)}<option value={id}>{t}</option>{/each}
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

        <section class="marks">
          <div class="marks-head">
            <span>Следы</span>
            {#if note.marks.length}
              <button type="button" class="link" title="Убрать с листа все следы" onclick={() => ((note!.marks = []), (selected = null))}><Eraser size={12} /> Убрать все</button>
            {/if}
          </div>
          {#each Object.entries(markGroups) as [g, kinds] (g)}
            <div class="palette" aria-label={g}>
              {#each kinds as k (k)}
                <button type="button" class:active={tool === k} title={tool === k ? 'Хватит ставить (Esc)' : `${NOTE_MARKS[k].title}: щёлкните по листу`} onclick={() => ((tool = tool === k ? null : k), (selected = null))}>
                  <svg viewBox="-110 -110 220 220" aria-hidden="true">{@html icon(k)}</svg>
                  <span>{NOTE_MARKS[k].title}</span>
                </button>
              {/each}
            </div>
          {/each}
          <small class="faint">
            {#if tool}Щёлкайте по листу, чтобы поставить «{NOTE_MARKS[tool].title.toLowerCase()}». Esc — хватит.
            {:else}Выберите след и щёлкните по листу. Поставленный след можно перетащить; колёсико — размер, Shift + колёсико — поворот, Delete — убрать.{/if}
          </small>

          {#if mark}
            {@const tints: readonly NoteTint[] = NOTE_MARKS[mark.kind].tints}
            <div class="selected">
              <div class="sel-head">
                <strong>{NOTE_MARKS[mark.kind].title}</strong>
                <div class="spacer"></div>
                <button type="button" class="icon-btn" title="Другой рисунок" onclick={() => (mark!.seed = Math.floor(Math.random() * 1e6))}><Dices size={14} /></button>
                <button type="button" class="icon-btn" title="Поверх остальных следов" onclick={toTop}><ArrowUpToLine size={14} /></button>
                <button type="button" class="icon-btn" title="Убрать след (Delete)" onclick={removeMark}><Trash2 size={14} /></button>
              </div>
              {#if tints.length > 1}
                <label class="field">
                  <span>Цвет</span>
                  <select value={markTint(mark)} onchange={(e) => (mark!.tint = e.currentTarget.value as NoteTint)}>
                    {#each tints as t (t)}<option value={t}>{NOTE_TINTS[t].title}</option>{/each}
                  </select>
                </label>
              {/if}
              <div class="field">
                <span>Размер</span>
                <div class="size"><Slider value={mark.size} min={MARK_SIZE.min} max={MARK_SIZE.max} step={0.005} oninput={(v) => (mark!.size = v)} /><span class="faint">{Math.round(mark.size * 100)}</span></div>
              </div>
              <div class="field">
                <span>Поворот</span>
                <div class="size"><Slider value={mark.angle} min={0} max={360} step={1} oninput={(v) => (mark!.angle = v)} /><span class="faint">{Math.round(mark.angle)}°</span></div>
              </div>
              <div class="field">
                <span>Насыщенность</span>
                <div class="size"><Slider value={mark.opacity} min={0.1} max={1} step={0.01} oninput={(v) => (mark!.opacity = v)} /><span class="faint">{Math.round(mark.opacity * 100)}</span></div>
              </div>
            </div>
          {/if}
        </section>
      </form>

      <div class="preview">
        <div class="paper" {onwheel}><NotePaper note={note} shadow bind:overflow edit={{ selected, placing: !!tool, onpick }} /></div>
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
  .copied {
    color: var(--accent);
    font-size: 12px;
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
  .marks {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .marks-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-muted);
    font-size: 12px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .link:hover {
    color: var(--text-normal);
  }
  .palette {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
  }
  .palette button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: #e3c58f;
    color: #3b2412;
    font-size: 10.5px;
    line-height: 1.15;
    cursor: pointer;
  }
  .palette button:hover {
    border-color: var(--text-muted);
  }
  .palette button.active {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .palette svg {
    width: 34px;
    height: 34px;
  }
  .selected {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .sel-head {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .empty {
    padding: 40px;
    text-align: center;
  }
</style>
