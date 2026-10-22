<!-- Фоновый компонент справочника. Держит записи загруженными и указатель заклинаний свежим (ссылки в статблоках и
     листах). Рисует выдвижную панель записи поверх любой вкладки, у правой панели (как панель карточки): её открывают
     заклинание в статблоке, состояние в трекере, ⌘K. Одновременно открыта одна из двух панелей. -->
<script lang="ts">
  import { hint } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { fly } from 'svelte/transition';
  import { BookOpen, ChevronLeft, Eye, EyeOff, X } from '@lucide/svelte';
  import type { CardRef } from '../../../shared/cards';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import EntryCard from '../../../renderer/lib/entry/EntryCard.svelte';
  import { forPlayers } from '../../../renderer/lib/entry/types.svelte';
  import { closeEntryPeek, entryPeek, setSpellIndex } from '../../../renderer/lib/entry/peek.svelte';
  import { loadCustomTypes } from '../../../renderer/lib/entry/types.svelte';
  import type { Entry } from '../../../shared/compendium';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { book, entryAt, loadEntries, resolveEntry, spellNames, srd } from './store.svelte';
  import QuickSearch from './QuickSearch.svelte';
  import { openEntry } from './ui.svelte';

  let { app }: ModuleProps<'compendium'> = $props();

  const tree = $derived(app.vault.tree);
  const adv = $derived(app.adventures.current);
  $effect(() => {
    void tree;
    void adv;
    void notes.rev;
    void book.rev;
    loadEntries();
  });
  $effect(() => setSpellIndex(spellNames()));
  void loadCustomTypes();

  // Панель карточки и панель записи — на одном месте: открылась одна — закрываем другую.
  let lastEntry: string[] | null = null;
  let lastCard: CardRef | null = null;
  // Запись открыли из статблока или листа — кнопка «назад» к той карточке.
  let returnCard = $state.raw<{ ref: CardRef; name: string } | null>(null);
  $effect(() => {
    const e = entryPeek.names;
    const c = bestiary.peeked;
    if (e && e !== lastEntry) {
      if (c) {
        const ref = { scope: c.scope, id: c.id };
        returnCard = { ref, name: bestiary.all.find((x) => x.ref.scope === ref.scope && x.ref.id === ref.id)?.name ?? t('cmpui.card') };
        bestiary.peeked = null;
      } else if (!lastEntry) returnCard = null;
    } else if (c && c !== lastCard) {
      entryPeek.names = null;
      returnCard = null;
    }
    lastEntry = e;
    lastCard = c;
  });

  const item = $derived((book.vault, book.library, book.builtin, srd.edition, entryPeek.names ? ((entryPeek.path && entryAt(entryPeek.path)) || resolveEntry(entryPeek.names)) : null));
  const shown = $derived(!!item && app.handouts.current === item.path);

  // Не нашлось записи — может, это карточка (монстр, NPC): тогда её панель.
  $effect(() => {
    const names = entryPeek.names;
    if (!names || item || !book.builtin.length) return;
    void connectCards().then(() => {
      const card = bestiary.named(names);
      if (card && entryPeek.names === names) bestiary.show(card.ref);
    });
  });

  function follow(name: string) {
    entryPeek.names = [name];
    entryPeek.path = null;
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && entryPeek.names && !document.querySelector('.modal')) closeEntryPeek();
  }
</script>

<svelte:window {onkeydown} />

<QuickSearch />

{#if entryPeek.names}
  <aside class="drawer" transition:fly={{ x: 40, duration: 180 }} aria-label={t('cmpui.drawer')}>
    <header>
      {#if returnCard}
        {@const back = returnCard}
        <button class="btn" title={t('cmpui.backToCard')} onclick={() => (bestiary.peeked = back.ref)}><ChevronLeft size={14} /> {back.name}</button>
      {/if}
      {#if item}
        {@const it = item}
        <button class="btn" title={t('cmpui.inTabHint')} onclick={() => (openEntry(it.path), closeEntryPeek())}><BookOpen size={14} /> {t('cmpui.inTab')}</button>
        <button class="btn" onclick={() => dispatch('handouts', 'toggleEntry', { path: it.path, entry: forPlayers($state.snapshot(it.entry) as Entry) })}>
          {#if shown}<EyeOff size={14} /> {t('cmpui.removeFromPlayers')}{:else}<Eye size={14} /> {t('cmpui.showToPlayers')}{/if}
        </button>
        <span class="faint where">{it.en ? `${it.group} · ${it.en}` : it.group}</span>
      {/if}
      <div class="spacer"></div>
      <button class="icon-btn" title={hint(t('app.close'), 'close')} onclick={closeEntryPeek}><X size={16} /></button>
    </header>
    <div class="body">
      {#if item}
        <EntryCard entry={item.entry} onlink={follow} />
      {:else if !book.builtin.length}
        <p class="faint">{t('cmpui.loading')}</p>
      {:else}
        <p class="faint">{t('cmpui.notFound', { name: entryPeek.names[0] ?? '' })}</p>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .drawer {
    position: fixed;
    -webkit-app-region: no-drag;
    top: 0;
    bottom: 0;
    /* Вплотную к правой панели «Экран игроков» (280 + граница), как панель карточки. */
    right: 281px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    width: min(560px, calc(100vw - 281px - 60px));
    border-left: 1px solid var(--border);
    background: var(--bg-primary);
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
  }
  .where {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .spacer {
    flex: 1;
  }
  .body {
    flex: 1;
    min-height: 0;
    padding: 16px 20px;
    overflow: auto;
  }
</style>
