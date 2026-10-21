// Mouse generator in the control window: the current mouse (remembered by the window). Its text follows the
// interface language — the mouse is indices into the tables.
import { generateMouse, rerollName, swap, type Attr, type Mouse } from './generate';

const KEY = 'mouse.state';

function load(): Mouse | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') as Mouse | null;
  } catch {
    return null;
  }
}

export const mice = $state({ mouse: load() });

function set(m: Mouse) {
  mice.mouse = m;
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* not remembered — not a problem */
  }
}

export const newMouse = () => set(generateMouse());
export const newName = () => mice.mouse && set(rerollName($state.snapshot(mice.mouse) as Mouse));
export const swapAttrs = (a: Attr, b: Attr) => mice.mouse && set(swap($state.snapshot(mice.mouse) as Mouse, a, b));
