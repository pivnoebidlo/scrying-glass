<!-- A formula of a pack: typed with the fields by their titles in brackets («[Body] + [Strength] − 1»; the pack keeps
     the keys — formulaToText / formulaFromText; a key typed by hand becomes its title when the field is left), checked
     as it is typed (doesn't read / names a field the pack hasn't), read back in the words of a rule with its value on
     the sample card, and the fields to insert by a click — by their titles. `row` — the columns of a list row. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { formulaFromText, formulaLabels, formulaToText, parseFormula, readFormula, type FormulaWords } from '../../../shared/syspack';

  let {
    value,
    set,
    keys,
    row = [],
    names = {},
    example = null,
    numeric,
    disabled = false,
    placeholder = '',
  }: {
    value: string;
    set: (v: string) => void;
    keys: string[];
    row?: string[];
    // The titles of the fields by key (and of the columns by «row.<column>»).
    names?: Record<string, string>;
    // Its value on the sample card (null — none to show).
    example?: number | null;
    // The fields offered to insert (those with a number); none — all the keys.
    numeric?: string[];
    disabled?: boolean;
    placeholder?: string;
  } = $props();

  const FNS = new Set(['floor', 'ceil', 'round', 'abs', 'min', 'max']);
  const WORDS = /row\.[a-z_][a-z0-9_]*|[a-z_][a-z0-9_]*/gi;
  // The labels of the fields (and of the row's columns) in the text; the text itself — kept while it's typed.
  const labels = $derived(formulaLabels(Object.fromEntries([...keys.map((k) => [k, names[k] ?? k]), ...row.map((c) => [`row.${c}`, names[`row.${c}`] ?? c])]), [...(numeric ?? []), ...row.map((c) => `row.${c}`)]));
  let text = $state('');
  let editing = $state(false);
  $effect(() => {
    if (!editing) text = formulaToText(value, labels);
  });
  const put = (v: string) => {
    text = v;
    set(formulaFromText(v, labels));
  };
  const problem = $derived.by(() => {
    if (!value.trim()) return '';
    const strange = [...value.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]!);
    if (strange.length) return t('sb.unknown', { list: strange.join(', ') });
    if (!parseFormula(value)) return t('sb.broken');
    const used = (value.match(WORDS) ?? []).filter((w) => !FNS.has(w));
    const unknown = [...new Set(used.filter((n) => (n.startsWith('row.') ? !row.includes(n.slice(4)) : !keys.includes(n))))];
    return unknown.length ? t('sb.unknown', { list: unknown.join(', ') }) : '';
  });
  // The formula as the sheet says it: «min(15, body + strength - debuffs)» → «Тело + Сила − Дебафы, не больше 15».
  const words: FormulaWords = {
    atMost: (x, n) => t('sb.fw.atMost', { x, n }),
    atLeast: (x, n) => t('sb.fw.atLeast', { x, n }),
    least: (xs) => t('sb.fw.least', { list: xs.join('; ') }),
    most: (xs) => t('sb.fw.most', { list: xs.join('; ') }),
    floor: (x) => t('sb.fw.floor', { x }),
    ceil: (x) => t('sb.fw.ceil', { x }),
    round: (x) => t('sb.fw.round', { x }),
    abs: (x) => t('sb.fw.abs', { x }),
  };
  const read = $derived(value.trim() && !problem ? (readFormula(value, (k) => names[k] ?? k, words) ?? '') : '');
  // Said in words only when it says more than the text (functions, brackets of a rule).
  const differs = $derived(read && read.replace(/\s+/g, '') !== text.replace(/[[\]\s]/g, ''));
  let input = $state<HTMLInputElement>();
  function insert(key: string) {
    const name = `[${labels[key] ?? key}]`;
    const el = input;
    if (!el) return put(`${text}${text.trim() ? ' + ' : ''}${name}`);
    const at = el.selectionStart ?? text.length;
    const before = text.slice(0, at);
    // Between two names — a plus, so a click after a click still reads.
    const glue = /[\p{L}\p{N}_)\]]\s*$/u.test(before) ? ' + ' : '';
    put(before + glue + name + text.slice(el.selectionEnd ?? at));
    queueMicrotask(() => {
      el.focus();
      const end = at + glue.length + name.length;
      el.setSelectionRange(end, end);
    });
  }
</script>

<div class="formula">
  <input
    bind:this={input}
    type="text"
    class:bad={!!problem}
    {placeholder}
    {disabled}
    value={text}
    onfocus={() => (editing = true)}
    onblur={() => ((editing = false), (text = formulaToText(value, labels)))}
    oninput={(e) => put(e.currentTarget.value)}
  />
  {#if problem}
    <span class="bad-note">{problem}</span>
  {:else if differs || example !== null}
    <span class="read">
      {#if differs}{read}{/if}{#if example !== null}<span class="eg">{differs ? ' = ' : ''}{t('sb.now', { value: example })}</span>{/if}
    </span>
  {/if}
  {#if !disabled && (keys.length || row.length)}
    <details class="insert">
      <summary class="faint">{t('sb.insert')}</summary>
      <div class="chips">
        {#each row as c (c)}<button type="button" class="chip" title={`row.${c}`} onmousedown={(e) => e.preventDefault()} onclick={() => insert(`row.${c}`)}>{names[`row.${c}`] ?? `row.${c}`}</button>{/each}
        {#each numeric ?? keys as k (k)}<button type="button" class="chip" title={k} onmousedown={(e) => e.preventDefault()} onclick={() => insert(k)}>{names[k] ?? k}</button>{/each}
      </div>
    </details>
  {/if}
</div>

<style>
  .formula {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .bad {
    border-color: var(--warning) !important;
  }
  .bad-note {
    color: var(--warning);
    font-size: 11px;
  }
  .read {
    color: var(--text-normal);
    font-size: 12px;
  }
  .eg {
    color: var(--text-muted);
  }
  .insert summary {
    font-size: 11px;
    cursor: pointer;
  }
  .chips {
    margin-top: 3px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
    font-size: 11px;
  }
  .chip {
    padding: 0 6px;
    border: 1px dashed var(--border);
    border-radius: 10px;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
</style>
