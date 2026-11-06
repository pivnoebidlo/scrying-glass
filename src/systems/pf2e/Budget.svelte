<!-- The threat of a fight in Pathfinder 2e: the common plaque with GM Core's numbers. -->
<script lang="ts">
  import type { Combatant } from '../../modules/initiative/types';
  import ThreatBadge from '../ThreatBadge.svelte';
  import { PF_THREAT } from './budget';

  let { list }: { list: Combatant[] } = $props();
</script>

<ThreatBadge {list} spec={PF_THREAT} />
