// Fate на экране игроков: аспекты сцены и жетоны судьбы — под таймером (35), над полосой инициативы (30).
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'fate',
  order: 32,
  layer: Layer,
});
