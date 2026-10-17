<!-- Вкладка «Журнал»: открытая заметка — в оформленном виде или в правке (⌘E); ничего не открыто — подсказка. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { ChevronLeft, Eye, ExternalLink, Pencil, Pin, PinOff, Trash2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { allFiles } from '../../../shared/vault';
  import PageBody from './PageBody.svelte';
  import PageEditor from './PageEditor.svelte';
  import { loadPages, pageAt } from './store.svelte';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'journal'> = $props();

  // Заметки загружаются и без боковой панели (вкладка могла открыться из правой панели).
  const tree = $derived(app.vault.tree);
  const adv = $derived(app.adventures.current);
  $effect(() => {
    void tree;
    void adv;
    void notes.rev;
    void loadPages();
  });

  const page = $derived(pageAt(ui.open));
  const pinKey = $derived(adv ?? '');
  const pinned = $derived(!!page && ms.pinned[pinKey] === page.path);
  let editor = $state<PageEditor>();
  let title = $state('');
  let titleInput = $state<HTMLInputElement>();
  $effect(() => {
    title = page?.title ?? '';
  });
  $effect(() => {
    if (!ui.fresh || !titleInput) return;
    ui.fresh = false;
    const input = titleInput;
    // После того как поле получит название (bind:value), иначе выделение сбросится.
    setTimeout(() => {
      input.focus();
      input.select();
    });
  });

  async function rename() {
    if (!page) return;
    const next = title.trim();
    if (!next || next === page.title) return void (title = page.title);
    await editor?.flush();
    const path = await window.api.renamePage(page.path, next);
    if (path) ui.open = path;
  }

  function back() {
    const prev = ui.back.at(-1);
    if (!prev) return;
    ui.back = ui.back.slice(0, -1);
    ui.open = prev;
  }

  async function trash() {
    if (!page) return;
    const p = page.path;
    const s = await dispatch('vault', 'trash', { paths: [p] });
    if (!s.vault.tree || !allFiles(s.vault.tree).some((f) => f.path === p)) {
      ui.open = null;
      if (pinned) dispatch('journal', 'pin', { adventure: adv, path: null });
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (page && (e.metaKey || e.ctrlKey) && e.code === 'KeyE') {
      e.preventDefault();
      ui.editing = !ui.editing;
    }
  }
</script>

<svelte:window {onkeydown} />

{#if page}
  <div class="view">
    <header class="bar">
      <button class="icon-btn" title={t('journal.back')} disabled={!ui.back.length} onclick={back}><ChevronLeft size={16} /></button>
      <input
        class="title"
        type="text"
        bind:this={titleInput}
        bind:value={title}
        title={t('journal.titleHint')}
        onchange={rename}
        onkeydown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), document.querySelector<HTMLTextAreaElement>('.journal-text')?.focus())}
      />
      <button class="btn" class:primary={!ui.editing} title="⌘E" onclick={() => (ui.editing = !ui.editing)}>
        {#if ui.editing}<Eye size={14} /> {t('journal.preview')}{:else}<Pencil size={14} /> {t('journal.edit')}{/if}
      </button>
      <button
        class="icon-btn"
        class:on={pinned}
        title={pinned ? t('journal.unpinHint') : t('journal.pinHint')}
        onclick={() => dispatch('journal', 'pin', { adventure: adv, path: pinned ? null : page.path })}
      >
        {#if pinned}<PinOff size={15} />{:else}<Pin size={15} />{/if}
      </button>
      <button class="icon-btn" title={t('journal.openExternal')} onclick={() => window.api.openFile(page.path)}><ExternalLink size={15} /></button>
      <button class="icon-btn" title={t('journal.deleteNote')} onclick={trash}><Trash2 size={15} /></button>
    </header>
    <div class="page" class:editing={ui.editing}>
      {#if ui.editing}
        {#key page.path}<PageEditor bind:this={editor} {page} />{/key}
      {:else}
        <PageBody {page} />
      {/if}
    </div>
  </div>
{:else}
  <div class="empty">
    <h2>{t('journal.title')}</h2>
    <p class="faint">
      {t('journal.about1')} <RoleFolderNames role="journal" /> {t('journal.about2')}
    </p>
    <p class="faint">
      {t('journal.about3')}
    </p>
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
  .title {
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    border-color: transparent;
    background: none;
    font-size: 18px;
    font-weight: 600;
  }
  .title:hover,
  .title:focus {
    border-color: var(--border);
  }
  .icon-btn.on {
    color: var(--accent);
  }
  .page {
    flex: 1;
    min-height: 0;
    max-width: 780px;
    width: 100%;
    padding: 20px 28px;
    overflow: auto;
  }
  .page.editing {
    padding: 12px 16px;
    overflow: hidden;
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
