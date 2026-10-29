// Systems brought by code. A new one — a folder in src/systems/ and one line here (its windows' part — in ui.ts).
import type { SystemPlugin } from './plugin';
import { dnd5ePlugin } from './dnd5e/plugin';
import { pf2ePlugin } from './pf2e/plugin';

export const PLUGINS: SystemPlugin[] = [dnd5ePlugin, pf2ePlugin];
