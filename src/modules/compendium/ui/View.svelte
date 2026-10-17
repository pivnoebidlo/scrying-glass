<!-- Вкладка «Справочник»: открытая запись (ссылки внутри ведут к другим записям или карточкам) или её редактор;
     ничего не открыто — подсказка. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { ChevronLeft, ExternalLink, Eye, EyeOff, Pencil, RotateCcw, Send, Trash2 } from '@lucide/svelte';
  import { entryToTelegram } from '../../../shared/telegram';
  import { sendToTelegram, tgReady } from '../../telegram/ui/tg.svelte';
  import EntryCard from '../../../renderer/lib/entry/EntryCard.svelte';
  import { forPlayers, typeDef } from '../../../renderer/lib/entry/types.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { OVERRIDES, serializeEntry, type Entry } from '../../../shared/compendium';
  import { allFiles } from '../../../shared/vault';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import CopyToMenu from '../../tools/ui/CopyToMenu.svelte';
  import EntryEditor from './EntryEditor.svelte';
  import TypesEditor from './TypesEditor.svelte';
  import { book, entriesFolder, entryAt, hereFamily, isBuiltinEntry, isLibraryEntry, loadEntries, overrideOf, resolveEntry, srd } from './store.svelte';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { openEntry, ui } from './ui.svelte';

  let { app }: ModuleProps<'compendium'> = $props();

  // Записи загружаются и без боковой панели (вкладка могла открыться по ссылке из другого раздела).
  const tree = $derived(app.vault.tree);
  const adv = $derived(app.adventures.current);
  $effect(() => {
    void tree;
    void adv;
    void notes.rev;
    void book.rev;
    loadEntries();
  });

  const item = $derived((book.vault, book.library, book.builtin, srd.edition, ui.open ? entryAt(ui.open) : undefined));
  const builtin = $derived(!!item && isBuiltinEntry(item.path));
  // Правка встроенной записи: путь встроенной, которую она заменяет.
  const replaces = $derived(item ? overrideOf(item) : null);
  const shown = $derived(!!item && app.handouts.current === item.path);
  let status = $state('');

  function flash(text: string) {
    status = text;
    setTimeout(() => (status = ''), 4000);
  }

  // [[Ссылка]]: запись справочника, иначе карточка (монстр, NPC) с таким именем.
  async function follow(name: string) {
    const e = resolveEntry(name);
    if (e) return openEntry(e.path);
    await connectCards();
    const card = bestiary.all.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (card) return bestiary.show(card.ref);
    flash(t('cmpui.notInCompendium', { name }));
  }

  function back() {
    const prev = ui.back.at(-1);
    if (!prev) return;
    ui.back = ui.back.slice(0, -1);
    ui.open = prev;
  }

  async function copyTo(place: string | null) {
    if (!item) return;
    // Копия — самостоятельная запись, а не ещё одна замена встроенной.
    const entry = $state.snapshot(item.entry) as Entry;
    const { [OVERRIDES]: _, ...fields } = entry.fields;
    const path = await window.api.createEntry(entriesFolder(place), item.entry.title, serializeEntry({ ...entry, fields }, typeDef(entry.type)));
    if (path && builtin) openEntry(path);
    else if (path) flash(t('cmpui.copied'));
  }

  async function trash() {
    if (!item) return;
    const p = item.path;
    if (isLibraryEntry(p)) {
      if (await window.api.trashLibraryTable(p)) ui.open = replaces;
      return;
    }
    const s = await dispatch('vault', 'trash', { paths: [p] });
    if (!s.vault.tree || !allFiles(s.vault.tree).some((f) => f.path === p)) ui.open = null;
  }
</script>

{#if ui.page === 'types'}
  <TypesEditor />
{:else if item && ui.editing}
  {#key item.path}<EntryEditor {item} />{/key}
{:else if item}
  <div class="view">
    <header class="bar">
      <button class="icon-btn" title={t('cmpui.back')} disabled={!ui.back.length} onclick={back}><ChevronLeft size={16} /></button>
      <span class="faint where" title={builtin ? t('cmpui.builtinHint') : item.path}>{item.en ? `${item.group} · ${item.en}` : item.group}</span>
      {#if status}<span class="status">{status}</span>{/if}
      <div class="spacer"></div>
      <button class="btn" class:primary={!shown} onclick={() => dispatch('handouts', 'toggleEntry', { path: item.path, entry: forPlayers($state.snapshot(item.entry) as Entry) })}>
        {#if shown}<EyeOff size={14} /> {t('cmpui.removeFromPlayers')}{:else}<Eye size={14} /> {t('cmpui.showToPlayers')}{/if}
      </button>
      {#if tgReady()}
        <button class="icon-btn" title={t('tg.entryHint')} onclick={() => sendToTelegram({ kind: 'text', title: item.entry.title, html: entryToTelegram($state.snapshot(item.entry) as Entry, typeDef(item.entry.type)) })}><Send size={15} /></button>
      {/if}
      <button class="btn" onclick={() => (ui.editing = true)}><Pencil size={14} /> {t('cmpui.edit')}</button>
      <CopyToMenu title={t('cmpui.copyTo')} library onpick={copyTo} />
      {#if !builtin}
        <button class="icon-btn" title={t('cmpui.openExternal')} onclick={() => window.api.openFile(item.path)}><ExternalLink size={15} /></button>
        {#if replaces}
          <button class="btn" title={t('cmpui.revertHint')} onclick={trash}><RotateCcw size={14} /> {t('cmpui.revertSrd')}</button>
        {:else}
          <button class="icon-btn" title={t('cmpui.toTrash')} onclick={trash}><Trash2 size={15} /></button>
        {/if}
      {/if}
    </header>
    <div class="page">
      <EntryCard entry={item.entry} onlink={follow} />
    </div>
  </div>
{:else}
  <div class="empty">
    <h2>{t('module.compendium')}</h2>
    <p class="faint">
      {t('cmpui.about1')} <RoleFolderNames role="compendium" /> {t('cmpui.about2')}
    </p>
    <p class="faint">
      {t('cmpui.about3')}
    </p>
    {#if hereFamily() === 'fate'}
      <p class="faint">
        {t('cmpui.aboutFate')}
      </p>
    {:else}
      <p class="faint">
        {t('cmpui.aboutDnd')}
      </p>
    {/if}
  </div>
{/if}

<style>
  .view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
  }
  .where {
    font-size: 12px;
  }
  .status {
    color: var(--accent);
    font-size: 12px;
  }
  .spacer {
    flex: 1;
  }
  .page {
    max-width: 760px;
    padding: 20px 28px;
    overflow: auto;
  }
  .empty {
    max-width: 620px;
    margin: 48px auto;
    padding: 0 20px;
  }
  .empty h2 {
    margin: 0 0 10px;
  }
</style>
