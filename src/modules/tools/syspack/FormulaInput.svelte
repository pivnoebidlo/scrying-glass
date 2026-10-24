<!-- A formula of a pack: checked as it is typed (doesn't read / names a field the pack hasn't), and the fields to
     insert by a click. `row` — the columns of a list row (row.<column>). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { parseFormula } from '../../../shared/syspack';

  let {
    value,
    set,
    keys,
    row = [],
    disabled = false,
    placeholder = '',
  }: { value: string; set: (v: string) => void; keys: string[]; row?: string[]; disabled?: boolean; placeholder?: string } = $props();

  const FNS = new Set(['floor', 'ceil', 'round', 'abs', 'min', 'max']);
  const problem = $derived.by(() => {
    if (!value.trim()) return '';
    if (!parseFormula(value)) return t('sb.broken');
    const names = (value.match(/row\.[a-z_][a-z0-9_]*|[a-z_][a-z0-9_]*/gi) ?? []).filter((w) => !FNS.has(w));
    const unknown = [...new Set(names.filter((n) => (n.startsWith('row.') ? !row.includes(n.slice(4)) : !keys.includes(n))))];
    return unknown.length ? t('sb.unknown', { list: unknown.join(', ') }) : '';
  });
  let input = $state<HTMLInputElement>();
  function insert(name: string) {
    const el = input;
    if (!el) return set(`${value}${value.trim() ? ' + ' : ''}${name}`);
    const at = el.selectionStart ?? value.length;
    set(value.slice(0, at) + name + value.slice(el.selectionEnd ?? at));
    queueMicrotask(() => {
      el.focus();
      el.setSelectionRange(at + name.length, at + name.length);
    });
  }
</script>

<div class="formula">
  <input bind:this={input} type="text" class="mono" class:bad={!!problem} {placeholder} {disabled} {value} oninput={(e) => set(e.currentTarget.value)} />
  {#if problem}<span class="bad-note">{problem}</span>{/if}
  {#if !disabled && (keys.length || row.length)}
    <div class="chips">
      <span class="faint">{t('sb.insert')}</span>
      {#each row as c (c)}<button type="button" class="chip" onclick={() => insert(`row.${c}`)}>row.{c}</button>{/each}
      {#each keys as k (k)}<button type="button" class="chip" onclick={() => insert(k)}>{k}</button>{/each}
    </div>
  {/if}
</div>

<style>
  .formula {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .mono {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
  }
  .bad {
    border-color: var(--warning) !important;
  }
  .bad-note {
    color: var(--warning);
    font-size: 11px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
    font-size: 11px;
  }
  .chip {
    padding: 0 5px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11px;
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
</style>
