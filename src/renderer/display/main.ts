// Экран игроков: только рисует то, что пришло в состоянии. Никакой логики.
import { mount } from 'svelte';
import { connect } from '../lib/store.svelte';
import Display from './Display.svelte';

await connect();
mount(Display, { target: document.body });

// Esc закрывает экран игроков.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.api.closeDisplay();
});
