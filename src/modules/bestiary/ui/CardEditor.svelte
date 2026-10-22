<!-- Визуальный редактор карточки: общая часть (название, вид, система, язык, портреты, заметки)
     и характеристики от системы. Справа — как карточка будет выглядеть. -->
<script lang="ts">
  import { hotkeyLabel } from '../../../shared/hotkeys';
  import { markdownKeys } from '../../../renderer/lib/markdownKeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { thumb } from '../../../shared/vault';
  import { ClipboardPaste, FolderOpen, HardDrive, Save, Star, X } from '@lucide/svelte';
  import type { AppState } from '../../../shared/types';
  import { LANGUAGES, SIDE_TITLES, cardImageUrl, defaultSide, imageScope, langName, type CardKind, type CardSide } from '../../../shared/cards';
  import { folderLabel } from './places';
  import { familyOf, isDnd, systemOf, systems } from '../../../systems';
  import { statsEditor, statsView } from '../../../systems/ui';
  import { isCharacter } from '../../../systems/dnd5e/character';
  import { bestiary, type Draft } from './cards.svelte';
  import ImagePicker from '../../../renderer/lib/FilePicker.svelte';
  import { markdown } from '../../../renderer/lib/markdown';

  let { app, draft }: { app: AppState; draft: Draft } = $props();

  // «в библиотеке», «в Тыквенный фестиваль / monsters»
  const placeText = $derived(
    draft.scope === 'srd' ? t('best.place.srd') : draft.scope === 'library' ? t('best.place.library') : t('best.place.folder', { folder: folderLabel(app, draft.folder) })
  );
  const SIDES: CardSide[] = ['party', 'ally', 'neutral', 'enemy'];
  const KINDS: CardKind[] = ['monster', 'npc', 'character'];

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
    const sameFamily = familyOf(id) === familyOf(card.system);
    if (!sameFamily && !confirm(t('best.otherSystem'))) return;
    if (!sameFamily) card.stats = systemOf(id).blank(card.kind);
    card.system = id;
  }

  // У персонажа игрока — лист, у монстра и NPC — статблок: при смене вида между ними характеристики начинаются
  // заново (с подтверждением). Сторона в бою — по новому виду, если её не меняли.
  function changeKind(select: HTMLSelectElement, kind: CardKind) {
    const sheet = kind === 'character';
    // У Fate один вид для всех — характеристики остаются.
    if (isDnd(card.system) && sheet !== isCharacter(card.stats)) {
      if (!confirm(sheet ? t('best.toSheet') : t('best.toBlock'))) {
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
    const res = await window.api.addCardImage(imageScope(draft.scope), vaultPath, draft.folder, fromClipboard);
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
      error = t('best.needName');
      return;
    }
    saving = true;
    error = '';
    try {
      await bestiary.save();
    } catch (e) {
      error = t('best.saveFailed', { error: String(e) });
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
        ? draft.scope === 'srd'
          ? t('best.editBuiltin')
          : t('best.editCard')
        : card.origin?.relation === 'translation'
          ? t('best.translation', { lang: langName(card.lang) })
          : card.origin
            ? t('best.copyCard')
            : t('best.newCard')} <span class="faint">{placeText}</span>
    </div>
    {#if error}<span class="error">{error}</span>{/if}
    <div class="spacer"></div>
    <button class="btn" onclick={() => bestiary.cancel()}>{t('best.cancel')}</button>
    <button class="btn primary" disabled={saving} onclick={save} title={hotkeyLabel('save')}><Save size={14} /> {t('best.save')}</button>
  </header>

  {#if bestiary.external}
    <div class="external">
      {#if bestiary.external === 'deleted'}
        <span>{t('best.extDeleted')}</span>
        <button class="btn" onclick={() => bestiary.keepMine()}>{t('best.gotIt')}</button>
      {:else}
        <span>{t('best.extChanged')}</span>
        <button class="btn" onclick={() => bestiary.takeExternal()} title={t('best.loadNewHint')}>{t('best.loadNew')}</button>
        <button class="btn" onclick={() => bestiary.keepMine()} title={t('best.keepHint')}>{t('best.keepMine')}</button>
      {/if}
    </div>
  {/if}

  <div class="columns">
    <form class="form" onsubmit={(e) => e.preventDefault()}>
      <section>
        <div class="grid">
          <label class="field wide">
            <span>{t('best.name')}</span>
            <!-- svelte-ignore a11y_autofocus -->
            <input class="name" type="text" placeholder={t('best.namePh')} bind:value={card.name} autofocus={!card.name} />
          </label>
          <label class="field">
            <span>{t('best.kind')}</span>
            <select value={card.kind} onchange={(e) => changeKind(e.currentTarget, e.currentTarget.value as CardKind)}>
              {#each KINDS as k (k)}<option value={k}>{t(`best.kind.${k}`)}</option>{/each}
            </select>
          </label>
          <label class="field" title={t('best.sideHint')}>
            <span>{t('best.side')}</span>
            <select value={card.side ?? defaultSide(card.kind)} onchange={(e) => (card.side = e.currentTarget.value as CardSide)}>
              {#each SIDES as s (s)}<option value={s}>{SIDE_TITLES[s]}</option>{/each}
            </select>
          </label>
        </div>
        <div class="grid">
          <label class="field">
            <span>{t('best.system')}</span>
            <select value={card.system} onchange={(e) => changeSystem(e.currentTarget.value)}>
              {#each systems as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
              {#if !systems.some((s) => s.id === card.system)}<option value={card.system}>{card.system}</option>{/if}
            </select>
          </label>
          <label class="field">
            <span>{t('best.lang')}</span>
            <select bind:value={card.lang}>
              {#each Object.entries(LANGUAGES) as [k, l] (k)}<option value={k}>{l}</option>{/each}
              {#if !LANGUAGES[card.lang]}<option value={card.lang}>{card.lang}</option>{/if}
            </select>
          </label>
          <label class="field wide">
            <span>{t('best.tags')}</span>
            <input
              type="text"
              placeholder={t('best.tagsPh')}
              value={card.tags.join(', ')}
              onchange={(e) => (card.tags = e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean))}
            />
          </label>
        </div>
        {#if card.origin?.relation === 'translation'}
          <div class="origin faint">
            {t('best.isTranslation')}
          </div>
        {:else}
          <div class="origin faint">{t('best.translateLater')}</div>
        {/if}
        {#if card.origin}
          <div class="origin faint">
            {t('best.basedOn')} <code>{card.origin.id}</code> —
            <select bind:value={card.origin.relation}>
              <option value="variant">{t('best.variant')}</option>
              <option value="translation">{t('best.translationRel')}</option>
            </select>
            <button type="button" class="icon-btn" title={t('best.forgetOrigin')} onclick={() => delete card.origin}><X size={13} /></button>
          </div>
        {/if}
        {#if card.source}
          <div class="origin faint">
            {t('best.source', { source: card.source.title + (card.source.attribution ? ` (${card.source.attribution})` : '') })}
            {#if card.source.license}· {card.source.license}{/if} {t('best.licenseNote')}
          </div>
        {/if}
      </section>

      <section>
        <h4>{t('best.portraits')}</h4>
        <div class="portraits">
          {#each card.portraits as p, i (p)}
            <div class="portrait" class:main={i === 0}>
              <img src={thumb(cardImageUrl(draft.scope, p), 160)} alt="" />
              <div class="p-actions">
                {#if i > 0}<button type="button" class="icon-btn" title={t('best.makeMain')} onclick={() => makeMain(i)}><Star size={13} /></button>{/if}
                <button type="button" class="icon-btn" title={t('best.removeKeepFile')} onclick={() => card.portraits.splice(i, 1)}><X size={13} /></button>
              </div>
            </div>
          {/each}
          <div class="p-add">
            <button type="button" class="btn" disabled={!app.vault.tree} onclick={() => (picking = true)}><FolderOpen size={14} /> {t('best.fromVault')}</button>
            <button type="button" class="btn" onclick={() => addImage(undefined, true)}><ClipboardPaste size={14} /> {t('best.fromClipboard')}</button>
            <button type="button" class="btn" onclick={() => addImage()}><HardDrive size={14} /> {t('best.fromDisk')}</button>
            <span class="faint hint">
              {draft.scope !== 'vault'
                ? t('best.imgLibrary')
                : t('best.imgVault')}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h4>{t('best.description')}</h4>
        <textarea use:markdownKeys
          rows="4"
          placeholder={t('best.descriptionPh')}
          bind:value={card.description}
        ></textarea>
      </section>

      <Editor bind:stats={card.stats} system={card.system} lang={card.lang} />

      <section>
        <h4>{t('best.gmNotes')}</h4>
        <textarea use:markdownKeys rows="5" placeholder={t('best.gmNotesPh')} bind:value={card.notes}></textarea>
      </section>
    </form>

    <aside class="preview">
      <div class="pv-head">
        {#if card.portraits[0]}<img class="pv-portrait" src={cardImageUrl(draft.scope, card.portraits[0])} alt="" />{/if}
        <h2>{card.name || t('best.untitled')}</h2>
      </div>
      {#if card.description?.trim()}<div class="pv-desc">{@html markdown(card.description)}</div>{/if}
      {#key card.system}
        <Preview card={preview} />
      {/key}
    </aside>
  </div>
</div>

{#if picking && app.vault.tree}
  <ImagePicker tree={app.vault.tree} onpick={([p]) => addImage(p)} onclose={() => (picking = false)} />
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
