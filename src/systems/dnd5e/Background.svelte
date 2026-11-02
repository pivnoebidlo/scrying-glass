<!-- D&D in the control window, always there: the spell names of the compendium for the links in stat blocks and
     sheets (the compendium's background loads the entries), and LSS's own Russian names from the LSS spell table — a
     sheet imported from LSS keeps them, the link goes to the entry by the English name. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { entryNames } from '../../modules/compendium/ui/store.svelte';
  import { lssImporter } from './importer';
  import type { LssSpellTable } from './lss';
  import { setSpellIndex } from './spellindex';

  let aliases = $state.raw<Record<string, string>>({});
  async function loadAliases() {
    const table = (await window.api.importerTable(lssImporter.id)) as LssSpellTable;
    aliases = Object.fromEntries(Object.values(table).flatMap((s) => (s.en && s.name !== s.en ? [[s.name, s.en]] : [])));
  }
  onMount(() => {
    void loadAliases();
    window.api.onImporterTableChanged((id) => id === lssImporter.id && void loadAliases());
  });

  $effect(() => setSpellIndex(entryNames('spell'), aliases));
</script>
