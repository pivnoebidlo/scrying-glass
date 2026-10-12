// Полоса очерёдности на экране игроков: поверх всего, кроме затемнения.
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'initiative',
  order: 30,
  layer: Layer,
});
