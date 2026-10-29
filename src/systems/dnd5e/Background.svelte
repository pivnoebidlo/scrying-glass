<!-- D&D in the control window, always there: the spell names of the compendium for the links in stat blocks and
     sheets (the compendium's background loads the entries). -->
<script lang="ts">
  import { entryNames } from '../../modules/compendium/ui/store.svelte';
  import { setSpellIndex } from './spellindex';

  $effect(() => setSpellIndex(entryNames('spell')));
</script>
