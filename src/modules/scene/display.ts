// Фон на экране игроков: самый нижний слой.
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'scene',
  order: 10,
  layer: Layer,
});
