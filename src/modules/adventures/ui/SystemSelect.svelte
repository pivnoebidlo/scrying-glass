<!-- Выбор ролевой системы: группами по семействам (D&D 5e — две редакции, Fate). -->
<script lang="ts">
  import { FAMILIES, systems } from '../../../systems';

  let { value, onchange }: { value: string; onchange: (system: string) => void } = $props();
  const known = $derived(systems.some((s) => s.id === value));
</script>

<select {value} onchange={(e) => onchange(e.currentTarget.value)}>
  {#each FAMILIES as f (f.id)}
    <optgroup label={f.title}>
      {#each systems.filter((s) => s.family === f.id) as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
    </optgroup>
  {/each}
  {#if !known}<option {value}>{value}</option>{/if}
</select>
