// The party's QR codes on the players' screen: above everything else.
import { defineDisplay } from '../../renderer/lib/contrib';
import Codes from './ui/Codes.svelte';

export default defineDisplay({
  id: 'players',
  order: 40,
  layer: Codes,
});
