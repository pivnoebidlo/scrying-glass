// Окно управления.
import { mount } from 'svelte';
import '../lib/theme.css';
import { connect } from '../lib/store.svelte';
import App from './App.svelte';

await connect({ displays: true });
mount(App, { target: document.body });
