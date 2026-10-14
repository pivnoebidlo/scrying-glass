<!-- Общий поиск ⌘K (Ctrl+K): записи справочника и карточки (монстры, NPC, персонажи) из любой вкладки.
     Enter — в выдвижной панели, ⌘Enter — во вкладке; стрелки — выбор, Esc — закрыть. -->
<script lang="ts">
  import { BookOpen, Search, Skull } from '@lucide/svelte';
  import { tick } from 'svelte';
  import { peekEntryAt } from '../../../renderer/lib/entry/peek.svelte';
  import { typeDef } from '../../../renderer/lib/entry/types.svelte';
  import { entrySubtitle, searchKey } from '../../../shared/compendium';
  import type { CardSummary } from '../../../shared/cards';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { allEntries, altNames, book, isBuiltinEntry, search, srd, type EntryItem } from './store.svelte';
  import { openEntry } from './ui.svelte';

  type Hit = { kind: 'entry'; e: EntryItem; score: number } | { kind: 'card'; c: CardSummary; score: number };

  let open = $state(false);
  let query = $state('');
  let index = $state(0);
  let input = $state<HTMLInputElement>();

  const LIMIT = 40;
  // Совпадение названия: целиком — 0, с начала — 1, внутри — 2; запись найдена по меткам или тексту — 3–4.
  function nameScore(name: string, q: string) {
    const t = searchKey(name);
    return t === q ? 0 : t.startsWith(q) ? 1 : t.includes(q) ? 2 : -1;
  }
  const hits = $derived.by((): Hit[] => {
    const q = searchKey(query.trim());
    if (!q) return [];
    void book.vault, book.library, book.builtin, srd.edition;
    const entries: Hit[] = search(allEntries(), query).map((e) => {
      const alt = Math.min(...altNames(e).map((n) => nameScore(n, q)).filter((x) => x >= 0), 3);
      const s = nameScore(e.entry.title, q);
      return { kind: 'entry' as const, e, score: s < 0 ? alt : s };
    });
    const cards: Hit[] = bestiary.all
      .map((c) => ({ kind: 'card' as const, c, score: nameScore(c.name, q) }))
      .filter((h) => h.score >= 0);
    // При равном совпадении: свои записи и карточки — раньше встроенных, английские карточки — последними.
    const rank = (h: Hit) => h.score * 10 + (h.kind === 'entry' ? (isBuiltinEntry(h.e.path) ? 1 : 0) : (h.c.ref.scope === 'srd' ? 1 : 0) + (h.c.lang === 'ru' ? 0 : 2));
    return [...entries, ...cards].sort((a, b) => rank(a) - rank(b)).slice(0, LIMIT);
  });

  $effect(() => {
    void hits;
    index = 0;
  });

  async function show() {
    open = true;
    query = '';
    void connectCards();
    await tick();
    input?.focus();
  }

  function choose(h: Hit | undefined, inTab: boolean) {
    if (!h) return;
    open = false;
    if (h.kind === 'entry') {
      if (inTab) openEntry(h.e.path);
      else peekEntryAt(h.e.path, h.e.entry.title);
    } else if (inTab) bestiary.openInBestiary(h.c.ref);
    else bestiary.peeked = { scope: h.c.ref.scope, id: h.c.ref.id };
  }

  function onwindowkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
      e.preventDefault();
      if (open) open = false;
      else void show();
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      open = false;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = Math.min(index + 1, hits.length - 1);
      scrollTo();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      index = Math.max(index - 1, 0);
      scrollTo();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(hits[index], e.metaKey || e.ctrlKey);
    }
  }

  let list = $state<HTMLElement>();
  async function scrollTo() {
    await tick();
    list?.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
  }

  const LANGS: Record<string, string> = { ru: '', en: 'англ.' };
  const cardWhere = (c: CardSummary) => [c.ref.scope === 'srd' ? (c.system === 'dnd5e-2014' ? 'SRD 5.1' : 'SRD 5.2.1') : c.ref.scope === 'library' ? 'Библиотека' : c.folder ?? 'Хранилище', LANGS[c.lang] ?? c.lang].filter(Boolean).join(', ');
</script>

<svelte:window onkeydown={onwindowkey} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={() => (open = false)}>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="palette" onclick={(e) => e.stopPropagation()}>
      <label class="field">
        <Search size={16} />
        <input bind:this={input} bind:value={query} {onkeydown} placeholder="Заклинание, предмет, состояние, монстр, NPC…" />
      </label>
      {#if hits.length}
        <ul bind:this={list}>
          {#each hits as h, i (h.kind === 'entry' ? 'e:' + h.e.path : 'c:' + h.c.ref.scope + h.c.ref.id)}
            <li>
              <button class:active={i === index} onmousemove={() => (index = i)} onclick={(e) => choose(h, e.metaKey || e.ctrlKey)}>
                {#if h.kind === 'entry'}
                  <BookOpen size={14} />
                  <span class="t">{h.e.entry.title}</span>
                  <span class="s">{entrySubtitle(h.e.entry, typeDef(h.e.entry.type))} · {h.e.group}</span>
                {:else}
                  <Skull size={14} />
                  <span class="t">{h.c.name}</span>
                  <span class="s">{h.c.subtitle} · {cardWhere(h.c)}</span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {:else if query.trim()}
        <p class="faint hint">Ничего не нашлось.</p>
      {/if}
      <p class="faint hint">Enter — открыть сбоку, ⌘Enter — во вкладке, Esc — закрыть</p>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 12vh;
    background: rgba(0, 0, 0, 0.35);
  }
  .palette {
    display: flex;
    flex-direction: column;
    width: min(620px, calc(100vw - 40px));
    max-height: 70vh;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    color: var(--text-faint);
  }
  .field input {
    flex: 1;
    border: 0;
    background: none;
    font-size: 15px;
    outline: none;
  }
  ul {
    margin: 0;
    padding: 4px;
    overflow: auto;
    list-style: none;
  }
  li button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  li button.active {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .t {
    color: var(--text-normal);
    white-space: nowrap;
  }
  .s {
    overflow: hidden;
    color: var(--text-faint);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint {
    margin: 0;
    padding: 6px 14px;
    font-size: 12px;
  }
</style>
