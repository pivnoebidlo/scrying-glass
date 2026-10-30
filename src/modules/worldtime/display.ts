// Time in the game world on the player screen: over the clocks (33), under the timer (35).
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'worldtime',
  order: 34,
  layer: Layer,
});
