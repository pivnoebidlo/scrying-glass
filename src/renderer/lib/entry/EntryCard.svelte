<!-- Запись справочника: название, строка типа («3 уровень, воплощение»), поля, текст. Общая для окна мастера
     (onlink — щелчок по [[ссылке]]) и экрана игроков (players: вписывается в экран, размеры от экрана, без меток
     и источника). -->
<script lang="ts">
  import '../note/fonts.css';
  import { COMMON_FIELDS, entrySubtitle, fieldText, typeOf, type Entry } from '../../../shared/compendium';
  import { entryHtml } from './markup';

  let { entry, players = false, onlink }: { entry: Entry; players?: boolean; onlink?: (name: string) => void } = $props();

  const def = $derived(typeOf(entry.type));
  // Поля для показа: по описанию типа (кроме того, что уже в строке типа), у неизвестного типа — все.
  const IN_SUBTITLE: Record<string, string[]> = { spell: ['level', 'school', 'ritual', 'concentration'], item: ['category', 'rarity', 'attunement'], feat: ['category', 'prerequisite'], rule: ['category'] };
  const rows = $derived.by(() => {
    const skip = new Set([...(IN_SUBTITLE[entry.type] ?? []), 'tags', 'source']);
    const known = def.fields.filter((f) => !skip.has(f.key) && entry.fields[f.key] !== undefined && entry.fields[f.key] !== '' && entry.fields[f.key] !== false);
    const extra = Object.keys(entry.fields).filter((k) => !skip.has(k) && !def.fields.some((f) => f.key === k) && !COMMON_FIELDS.some((f) => f.key === k));
    return [...known.map((f) => ({ title: f.title, value: fieldText(entry.fields[f.key]!) })), ...extra.map((k) => ({ title: k, value: fieldText(entry.fields[k]!) }))];
  });
  const html = $derived(entryHtml(entry.body));
  const tags = $derived(Array.isArray(entry.fields['tags']) ? (entry.fields['tags'] as string[]) : []);

  // На экране игроков длинная запись должна поместиться целиком: уменьшаем шрифт, пока текст не влезет.
  let el = $state<HTMLElement>();
  let fontScale = $state(1);
  $effect(() => {
    void html;
    void rows;
    const node = el;
    if (!players || !node) return;
    let k = 1;
    const fit = () => {
      k = 1;
      fontScale = 1;
      // Шаг за шагом вниз, но не мельче 45 % (дальше читать с экрана уже нельзя).
      requestAnimationFrame(function step() {
        if (node.scrollHeight > node.clientHeight + 1 && k > 0.45) {
          k -= 0.05;
          fontScale = k;
          requestAnimationFrame(step);
        }
      });
    };
    fit();
    document.fonts?.ready.then(fit);
  });

  function click(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest('a.wikilink') as HTMLElement | null;
    if (!a || !onlink) return;
    e.preventDefault();
    onlink(a.dataset['link'] ?? '');
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<article class="entry" class:players onclick={click} bind:this={el} style:--k={fontScale}>
  <header>
    <h1>{entry.title}</h1>
    <div class="sub">{entrySubtitle(entry)}</div>
  </header>
  {#if rows.length}
    <dl>
      {#each rows as r (r.title)}<div><dt>{r.title}</dt><dd>{r.value}</dd></div>{/each}
    </dl>
  {/if}
  <!-- Текст экранирован в entryHtml. -->
  <div class="body">{@html html}</div>
  {#if !players && (tags.length || entry.fields['source'])}
    <footer>
      {#each tags as t (t)}<span class="tag">{t}</span>{/each}
      {#if entry.fields['source']}<span class="source">{fieldText(entry.fields['source'])}</span>{/if}
    </footer>
  {/if}
</article>

<style>
  .entry {
    line-height: 1.5;
  }
  header {
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  }
  h1 {
    margin: 0;
    font-size: 22px;
  }
  .sub {
    color: var(--text-muted);
    font-style: italic;
  }
  dl {
    margin: 0 0 10px;
  }
  dl div {
    display: flex;
    gap: 6px;
  }
  dt {
    font-weight: 600;
  }
  dt::after {
    content: ':';
  }
  dd {
    margin: 0;
  }
  .body :global(p) {
    margin: 0 0 0.6em;
  }
  .body :global(h2),
  .body :global(h3),
  .body :global(h4) {
    margin: 0.8em 0 0.3em;
    font-size: 1.05em;
  }
  .body :global(table) {
    margin: 0.4em 0 0.8em;
    border-collapse: collapse;
  }
  .body :global(th),
  .body :global(td) {
    padding: 2px 10px 2px 0;
    border-bottom: 1px solid var(--border);
    text-align: left;
  }
  .body :global(blockquote) {
    margin: 0 0 0.6em;
    padding-left: 10px;
    border-left: 3px solid var(--border);
    color: var(--text-muted);
  }
  .body :global(a.wikilink) {
    color: var(--accent);
    text-decoration: underline dotted;
    cursor: pointer;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
    font-size: 12px;
  }
  .tag {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--bg-active);
  }
  .source {
    margin-left: auto;
    color: var(--text-faint);
  }

  /* Экран игроков: лист старой бумаги по центру, размеры от экрана. */
  .entry.players {
    max-width: 70cqmin;
    max-height: 88cqh;
    overflow: hidden;
    padding: 3.5cqmin 4cqmin;
    border-radius: 0.8cqmin;
    background: radial-gradient(ellipse at 50% 40%, #f1e4c6 55%, #d9c193);
    box-shadow: 0 1.5cqmin 4cqmin rgba(0, 0, 0, 0.7);
    color: #2b1d10;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: calc(2.3cqmin * var(--k, 1));
    --accent: #7a1a12;
    --text-muted: #5a4630;
    --border: rgba(90, 60, 30, 0.35);
  }
  .players h1 {
    font-family: 'Old Standard TT', Georgia, serif;
    font-size: 1.75em;
  }
  .players header {
    margin-bottom: 1.5cqmin;
    padding-bottom: 1cqmin;
  }
  .players .body :global(a.wikilink) {
    color: inherit;
    text-decoration: none;
    font-style: italic;
  }
</style>
