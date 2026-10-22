// Окно управления.
import { mount } from 'svelte';
import '../lib/theme.css';
import { connect } from '../lib/store.svelte';
import App from './App.svelte';

// The theme of the last launch at once, before the state arrives (no flash of the wrong colours).
try {
  document.documentElement.dataset['theme'] = localStorage.getItem('theme') ?? 'auto';
} catch {
  /* the state sets it in a moment */
}

// The title bar (main/windows.ts): the tab bar is the window's title bar unless it is the system one; full screen in
// macOS hides the traffic lights. CSS reads <html data-frame data-fullscreen>.
document.documentElement.dataset['frame'] = window.api.frame;
window.api.onFullscreen((on) => (document.documentElement.dataset['fullscreen'] = String(on)));

await connect({ displays: true });
mount(App, { target: document.body });
