<!-- The Integrations settings section: what the systems turned on bring (SystemUi.integrations; D&D: Long Story Short). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { systemUis } from '../../../systems/ui';
  import { store } from '../../../renderer/lib/store.svelte';
  import { enabledSystems } from '../../../systems';

  let {}: ModuleProps<'integrations'> = $props();

  // vault.systemsOff — to follow the settings.
  const shown = $derived((store.state.vault.systemsOff, systemUis.filter((u) => u.integrations && enabledSystems().some((s) => s.family === u.family))));
</script>

{#each shown as u (u.family)}
  {#if u.integrations}<u.integrations />{/if}
{:else}
  <p class="faint">{t('intg.none')}</p>
{/each}
