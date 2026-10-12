<!-- Список значений из справочника (типы урона, состояния) плюс свободный текст: «дробящий от немагических атак». -->
<script lang="ts">
  import { X } from '@lucide/svelte';

  let {
    values = $bindable(),
    table,
    custom = true,
  }: { values: string[]; table: Record<string, string>; custom?: boolean } = $props();

  let text = $state('');
  const label = (v: string) => table[v] ?? v;

  function add(v: string) {
    v = v.trim();
    if (v && !values.includes(v)) values.push(v);
  }
</script>

<div class="terms">
  {#each values as v, i (v)}
    <button type="button" class="chip" title="Убрать" onclick={() => values.splice(i, 1)}>{label(v)} <X size={10} /></button>
  {/each}
  <select
    value=""
    onchange={(e) => {
      add(e.currentTarget.value);
      e.currentTarget.value = '';
    }}
  >
    <option value="">+</option>
    {#each Object.entries(table).filter(([k]) => !values.includes(k)) as [k, l] (k)}<option value={k}>{l}</option>{/each}
  </select>
  {#if custom}
    <input
      type="text"
      placeholder="свой вариант, Enter"
      bind:value={text}
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          add(text);
          text = '';
        }
      }}
    />
  {/if}
</div>

<style>
  .terms {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 8px;
    border: 0;
    border-radius: 999px;
    background: var(--bg-active);
    font-size: 12px;
    cursor: pointer;
  }
  select {
    width: 40px;
    padding: 2px 4px;
  }
  input {
    flex: 1;
    min-width: 140px;
    padding: 3px 6px !important;
  }
</style>
