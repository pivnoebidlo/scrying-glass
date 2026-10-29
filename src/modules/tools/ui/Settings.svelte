<!-- Раздел настроек «Инструменты»: инструменты другой системы, которые нужны и в этой (например, генератор имён D&D
     в приключениях Fate). Запоминает окно (registry.svelte.ts). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { enabledSystems, FAMILIES } from '../../../systems';
  import { extra, setExtra, TOOLS } from './registry.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';

  let {}: ModuleProps<'tools'> = $props();

  // Families of the enabled systems (vault.systemsOff — to follow the settings).
  const families = $derived((store.state.vault.systemsOff, FAMILIES.filter((f) => enabledSystems().some((s) => s.family === f.id))));
  // Tools of other systems turned on (a tool of systems all off is not offered).
  const others = (family: string) => TOOLS.filter((d) => d.families && !d.families.includes(family) && d.families.some((x) => families.some((f) => f.id === x)));
  const title = (id: string) => FAMILIES.find((f) => f.id === id)?.title ?? id;
</script>

<h3>{t('tools.set.title')}</h3>
<p class="desc faint">{t('tools.set.desc')}</p>

{#each families as f (f.id)}
  {#if others(f.id).length}
    <h4>{t('tools.set.inSystem', { system: f.title })}</h4>
    <div class="grid">
      {#each others(f.id) as d (d.id)}
        <label class="check">
          <input type="checkbox" checked={(extra[f.id] ?? []).includes(d.id)} onchange={(e) => setExtra(f.id, d.id, e.currentTarget.checked)} />
          {d.title} <span class="faint">· {d.families!.map(title).join(', ')}</span>
        </label>
      {/each}
    </div>
  {/if}
{/each}

<style>
  .desc {
    margin: 0 0 12px;
    font-size: 13px;
  }
  h4 {
    margin: 14px 0 6px;
    font-size: 13px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 4px 12px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
  }
</style>
