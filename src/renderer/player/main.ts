// A player's page: their own character in a browser, served by the GM's app (main/playerserver.ts). There is no
// window.api here: everything comes over HTTP, and only what shared/players.ts lets through.
import { mount } from 'svelte';
import { resolveLang } from '../../shared/i18n';
import '../lib/theme.css';
import { applyLang } from '../lib/i18n.svelte';
import Player from './Player.svelte';

document.documentElement.dataset['theme'] = 'auto';
// Until the sheet says the GM's language.
applyLang(resolveLang('auto', navigator.languages));
mount(Player, { target: document.body });
