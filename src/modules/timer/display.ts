// Таймер на экране игроков: поверх полосы инициативы (её order 30), под затемнением.
import { defineDisplay } from '../../renderer/lib/contrib';
import Layer from './ui/Layer.svelte';

export default defineDisplay({
  id: 'timer',
  order: 35,
  layer: Layer,
});
