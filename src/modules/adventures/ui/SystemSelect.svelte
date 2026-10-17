<!-- Выбор ролевой системы: группами по семействам (D&D 5e — две редакции, Fate). Отключённые в настройках не
     предлагаются; уже выбранная остаётся в списке, даже если её отключили. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { enabledSystems, FAMILIES, systems } from '../../../systems';
  import { store } from '../../../renderer/lib/store.svelte';

  let { value, onchange }: { value: string; onchange: (system: string) => void } = $props();
  // vault.systemsOff — чтобы список обновился после смены настроек.
  const list = $derived((store.state.vault.systemsOff, enabledSystems()));
  const known = $derived(list.some((s) => s.id === value));
</script>

<select {value} onchange={(e) => onchange(e.currentTarget.value)}>
  {#each FAMILIES.filter((f) => list.some((s) => s.family === f.id)) as f (f.id)}
    <optgroup label={f.title}>
      {#each list.filter((s) => s.family === f.id) as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
    </optgroup>
  {/each}
  {#if !known}<option {value}>{systems.find((s) => s.id === value)?.title ?? value}{systems.some((s) => s.id === value) ? t('adv.systemOff') : ''}</option>{/if}
</select>
