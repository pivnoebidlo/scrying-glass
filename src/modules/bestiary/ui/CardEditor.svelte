<!-- Визуальный редактор карточки: общая часть (название, вид, система, язык, портреты, заметки)
     и характеристики от системы. Справа — как карточка будет выглядеть. -->
<script lang="ts">
  import { ClipboardPaste, FolderOpen, HardDrive, Save, Star, X } from '@lucide/svelte';
  import type { AppState } from '../../../shared/types';
  import { LANGUAGES, cardImageUrl, defaultSide, langName, type CardKind, type CardSide } from '../../../shared/cards';
  import { folderLabel } from './places';
  import { systemOf, systems } from '../../../systems';
  import { statsEditor, statsView } from '../../../systems/ui';
  import { isCharacter } from '../../../systems/dnd5e/character';
  import { bestiary, type Draft } from './cards.svelte';
  import ImagePicker from './ImagePicker.svelte';
  import { markdown } from '../../../renderer/lib/markdown';

  let { app, draft }: { app: AppState; draft: Draft } = $props();

  // «в библиотеке», «в Тыквенный фестиваль / monsters»
  const placeText = $derived(draft.scope === 'library' ? 'в библиотеке' : `в папке ${folderLabel(app, draft.folder)}`);
  const KINDS: Record<CardKind, string> = { monster: 'Монстр', npc: 'NPC', character: 'Персонаж игрока' };

  const card = $derived(draft.card);
  const Editor = $derived(statsEditor(card.system, card.stats));
  const Preview = $derived(statsView(card.system, card.stats));
  // Предпросмотр получает снимок: компонент статблока не должен держать живой прокси черновика.
  const preview = $derived($state.snapshot(card));

  let picking = $state(false);
  let saving = $state(false);
  let error = $state('');

  // Смена системы: характеристики другой системы несовместимы, начинаем с пустых (с подтверждением).
  function changeSystem(id: string) {
    const sameFamily = id.startsWith('dnd5e-') && card.system.startsWith('dnd5e-');
    if (!sameFamily && !confirm('У другой системы другие характеристики. Начать их заново?')) return;
    if (!sameFamily) card.stats = systemOf(id).blank(card.kind);
    card.system = id;
  }

  // У персонажа игрока — лист, у монстра и NPC — статблок: при смене вида между ними характеристики начинаются
  // заново (с подтверждением). Сторона в бою — по новому виду, если её не меняли.
  function changeKind(select: HTMLSelectElement, kind: CardKind) {
    const sheet = kind === 'character';
    if (sheet !== isCharacter(card.stats)) {
      if (!confirm(sheet ? 'У персонажа игрока вместо статблока — лист. Начать его заново?' : 'У монстра и NPC вместо листа — статблок. Начать его заново?')) {
        select.value = card.kind;
        return;
      }
      card.stats = systemOf(card.system).blank(kind);
    }
    if (!card.side || card.side === defaultSide(card.kind)) card.side = defaultSide(kind);
    card.kind = kind;
  }

  async function addImage(vaultPath?: string, fromClipboard = false) {
    picking = false;
    const res = await window.api.addCardImage(draft.scope, vaultPath, draft.folder, fromClipboard);
    if (!res) return;
    if (res.copied) draft.copied.push(res.path);
    if (!card.portraits.includes(res.path)) card.portraits.push(res.path);
  }

  function makeMain(i: number) {
    const [p] = card.portraits.splice(i, 1);
    if (p) card.portraits.unshift(p);
  }

  async function save() {
    if (!card.name.trim()) {
      error = 'Укажите название.';
      return;
    }
    saving = true;
    error = '';
    try {
      await bestiary.save();
    } catch (e) {
      error = `Не удалось сохранить: ${String(e)}`;
    } finally {
      saving = false;
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="editor">
  <header class="bar">
    <div class="title">
      {draft.original
        ? 'Правка карточки'
        : card.origin?.relation === 'translation'
          ? `Перевод на ${langName(card.lang)}`
          : card.origin
            ? 'Копия карточки'
            : 'Новая карточка'} <span class="faint">{placeText}</span>
    </div>
    {#if error}<span class="error">{error}</span>{/if}
    <div class="spacer"></div>
    <button class="btn" onclick={() => bestiary.cancel()}>Отмена</button>
    <button class="btn primary" disabled={saving} onclick={save} title="⌘S"><Save size={14} /> Сохранить</button>
  </header>

  {#if bestiary.external}
    <div class="external">
      {#if bestiary.external === 'deleted'}
        <span>Файл карточки удалили в другой программе. «Сохранить» создаст его заново.</span>
        <button class="btn" onclick={() => bestiary.keepMine()}>Понятно</button>
      {:else}
        <span>Файл карточки изменили в другой программе.</span>
        <button class="btn" onclick={() => bestiary.takeExternal()} title="Правки в редакторе пропадут">Загрузить новую версию</button>
        <button class="btn" onclick={() => bestiary.keepMine()} title="При сохранении они заменят версию с диска">Оставить мои правки</button>
      {/if}
    </div>
  {/if}

  <div class="columns">
    <form class="form" onsubmit={(e) => e.preventDefault()}>
      <section>
        <div class="grid">
          <label class="field wide">
            <span>Название</span>
            <!-- svelte-ignore a11y_autofocus -->
            <input class="name" type="text" placeholder="Вождь огров" bind:value={card.name} autofocus={!card.name} />
          </label>
          <label class="field">
            <span>Вид</span>
            <select value={card.kind} onchange={(e) => changeKind(e.currentTarget, e.currentTarget.value as CardKind)}>
              {#each Object.entries(KINDS) as [k, l] (k)}<option value={k}>{l}</option>{/each}
            </select>
          </label>
          <label class="field" title="Кем существо попадает в трекер инициативы. В бою сторону можно поменять">
            <span>Сторона в бою</span>
            <select value={card.side ?? defaultSide(card.kind)} onchange={(e) => (card.side = e.currentTarget.value as CardSide)}>
              <option value="party">Партия</option>
              <option value="ally">Союзник</option>
              <option value="neutral">Нейтрал</option>
              <option value="enemy">Противник</option>
            </select>
          </label>
        </div>
        <div class="grid">
          <label class="field">
            <span>Система</span>
            <select value={card.system} onchange={(e) => changeSystem(e.currentTarget.value)}>
              {#each systems as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
              {#if !systems.some((s) => s.id === card.system)}<option value={card.system}>{card.system}</option>{/if}
            </select>
          </label>
          <label class="field">
            <span>Язык</span>
            <select bind:value={card.lang}>
              {#each Object.entries(LANGUAGES) as [k, l] (k)}<option value={k}>{l}</option>{/each}
              {#if !LANGUAGES[card.lang]}<option value={card.lang}>{card.lang}</option>{/if}
            </select>
          </label>
          <label class="field wide">
            <span>Теги, через запятую</span>
            <input
              type="text"
              placeholder="гоблиноиды, Тыквенный фестиваль"
              value={card.tags.join(', ')}
              onchange={(e) => (card.tags = e.currentTarget.value.split(',').map((t) => t.trim()).filter(Boolean))}
            />
          </label>
        </div>
        {#if card.origin?.relation === 'translation'}
          <div class="origin faint">
            Это перевод: переведите название, описание и тексты действий. Числа скопированы из оригинала.
          </div>
        {:else}
          <div class="origin faint">Перевести карточку на другой язык можно после сохранения — кнопкой «+ язык».</div>
        {/if}
        {#if card.origin}
          <div class="origin faint">
            На основе карточки <code>{card.origin.id}</code> —
            <select bind:value={card.origin.relation}>
              <option value="variant">вариант</option>
              <option value="translation">перевод</option>
            </select>
            <button type="button" class="icon-btn" title="Забыть связь с оригиналом" onclick={() => delete card.origin}><X size={13} /></button>
          </div>
        {/if}
        {#if card.source}
          <div class="origin faint">
            Источник: {card.source.title}{card.source.attribution ? ` (${card.source.attribution})` : ''}
            {#if card.source.license}· {card.source.license}{/if} — указание авторства требует лицензия, оно сохранится в карточке.
          </div>
        {/if}
      </section>

      <section>
        <h4>Портреты</h4>
        <div class="portraits">
          {#each card.portraits as p, i (p)}
            <div class="portrait" class:main={i === 0}>
              <img src={cardImageUrl(draft.scope, p)} alt="" />
              <div class="p-actions">
                {#if i > 0}<button type="button" class="icon-btn" title="Сделать основным" onclick={() => makeMain(i)}><Star size={13} /></button>{/if}
                <button type="button" class="icon-btn" title="Убрать (файл останется)" onclick={() => card.portraits.splice(i, 1)}><X size={13} /></button>
              </div>
            </div>
          {/each}
          <div class="p-add">
            <button type="button" class="btn" disabled={!app.vault.tree} onclick={() => (picking = true)}><FolderOpen size={14} /> Из хранилища</button>
            <button type="button" class="btn" onclick={() => addImage(undefined, true)}><ClipboardPaste size={14} /> Из буфера</button>
            <button type="button" class="btn" onclick={() => addImage()}><HardDrive size={14} /> С диска…</button>
            <span class="faint hint">
              {draft.scope === 'library'
                ? 'Картинки копируются в папку библиотеки, чтобы карточка работала в любой кампании.'
                : 'Картинки с диска копируются в папку карточки.'}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h4>Описание</h4>
        <textarea
          rows="4"
          placeholder="Как выглядит, чем живёт, что о нём рассказывают. *Курсив*, **жирный**, строки «- …» — список."
          bind:value={card.description}
        ></textarea>
      </section>

      <Editor bind:stats={card.stats} system={card.system} />

      <section>
        <h4>Заметки мастера</h4>
        <textarea rows="5" placeholder="Тактика, мотивы, связи. Игроки этого не видят." bind:value={card.notes}></textarea>
      </section>
    </form>

    <aside class="preview">
      <div class="pv-head">
        {#if card.portraits[0]}<img class="pv-portrait" src={cardImageUrl(draft.scope, card.portraits[0])} alt="" />{/if}
        <h2>{card.name || 'Без названия'}</h2>
      </div>
      {#if card.description?.trim()}<div class="pv-desc">{@html markdown(card.description)}</div>{/if}
      {#key card.system}
        <Preview card={preview} />
      {/key}
    </aside>
  </div>
</div>

{#if picking && app.vault.tree}
  <ImagePicker tree={app.vault.tree} onpick={(p) => addImage(p)} onclose={() => (picking = false)} />
{/if}

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
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
  }
  .title {
    font-size: 15px;
    font-weight: 600;
  }
  .title .faint {
    font-weight: 400;
  }
  .error {
    color: var(--danger);
  }
  .spacer {
    flex: 1;
  }
  .columns {
    flex: 1;
    min-height: 0;
    display: flex;
  }
  .form {
    flex: 1 1 560px;
    min-width: 0;
    padding: 16px 20px 40px;
    overflow: hidden auto;
  }
  .preview {
    flex: 1 1 440px;
    min-width: 0;
    padding: 16px 20px 40px;
    border-left: 1px solid var(--border);
    background: var(--bg-secondary);
    overflow: auto;
  }
  /* Предпросмотр — только если вкладке хватает ширины на две колонки. */
  .editor {
    container-type: inline-size;
  }
  @container (max-width: 960px) {
    .preview {
      display: none;
    }
  }
  section {
    margin-bottom: 18px;
  }
  h4 {
    margin: 0 0 8px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 8px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 150px;
  }
  .field.wide {
    flex: 1;
    min-width: 200px;
  }
  .field > span:first-child {
    color: var(--text-faint);
    font-size: 11px;
  }
  .name {
    font-size: 16px;
    font-weight: 600;
  }
  .origin {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
    font-size: 12px;
  }
  .origin select {
    padding: 1px 4px;
  }
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
  .portraits {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .portrait {
    position: relative;
    width: 90px;
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    overflow: hidden;
  }
  .portrait.main {
    border-color: var(--accent);
  }
  .portrait img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }
  .p-actions {
    position: absolute;
    top: 2px;
    right: 2px;
    display: flex;
    gap: 2px;
  }
  .p-actions .icon-btn {
    width: 22px;
    height: 22px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
  }
  .p-add {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    max-width: 260px;
  }
  .hint {
    font-size: 11px;
  }
  textarea {
    width: 100%;
  }
  .pv-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .pv-portrait {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
  }
  h2 {
    margin: 0;
    font-size: 22px;
  }
  .pv-desc {
    margin-bottom: 10px;
    color: var(--text-muted);
    line-height: 1.5;
  }
  .pv-desc :global(p) {
    margin: 0 0 6px;
  }
  .external {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
  .external span {
    flex: 1;
    min-width: 200px;
  }
</style>
