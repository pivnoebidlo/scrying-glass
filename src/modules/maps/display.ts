// Карта на экране игроков: над фоном, под портретами.
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'maps',
  order: 15,
  layer: Layer,
});
