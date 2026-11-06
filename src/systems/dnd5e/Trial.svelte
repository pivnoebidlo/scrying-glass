<!-- The new look of a D&D card, to compare with the old one: the pack over the card's fields. Read only, nothing is
     written. Goes away when the packs replace the plugin's sheets. -->
<script lang="ts">
  import type { Card } from '../../shared/cards';
  import { validatePack, type PackStats, type SystemPack } from '../../shared/syspack';
  import Sheet from '../pack/Sheet.svelte';
  import { dndFields } from './fields';
  import y2014 from '../../../resources/systems/dnd5e-2014.json';
  import y2024 from '../../../resources/systems/dnd5e-2024.json';

  let { card }: { card: Card } = $props();
  const pack = $derived(validatePack(card.system === 'dnd5e-2014' ? y2014 : y2024) as SystemPack);
  const shown = $derived({ ...card, stats: dndFields(card.stats, card.lang, card.system) as PackStats } as Card<PackStats>);
</script>

<Sheet card={shown} draft={pack} />
