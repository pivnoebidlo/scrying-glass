// Экран игроков: только рисует то, что пришло в состоянии. Никакой логики.
import { mount } from 'svelte';
import { connect, store } from '../lib/store.svelte';
import { sheetUsage } from '../lib/sheetusage.svelte';
import Display from './Display.svelte';

await connect();
// A sheet on the screen (a handout) shows what is spent at the table; nothing here can change it.
sheetUsage.host = { view: true, used: (card) => store.state.players.used[card.id] ?? {}, set: () => undefined, reset: () => undefined };
mount(Display, { target: document.body });

// Esc закрывает экран игроков.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.api.closeDisplay();
});
