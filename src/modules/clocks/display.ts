// Progress clocks on the player screen: over the initiative strip (30) and the Fate aspects (32), under the timer (35).
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'clocks',
  order: 33,
  layer: Layer,
});
