// Раздатка на экране игроков: над картой и портретами, под полосой инициативы.
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'handouts',
  order: 25,
  layer: Layer,
});
