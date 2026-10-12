// Портреты на экране игроков.
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'portraits',
  order: 20,
  layer: Layer,
});
