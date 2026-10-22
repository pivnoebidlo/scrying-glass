// Canvases in the control window: created in the handouts folder of the current adventure (like the notes), reread
// when the core has rescanned the vault (notes.rev).
import { t } from '../i18n.svelte';
import { notesFolder } from '../note/notes.svelte';
import { newSketch, type Sketch } from '../../../shared/sketch';
import type { VaultFolder } from '../../../shared/vault';
import type { AdventuresState } from '../../../shared/adventures';

export { connectNotes as connectSketches, notes as sketchesRev } from '../note/notes.svelte';

export async function createSketch(tree: VaultFolder | null, adv: AdventuresState, title = t('lib.newSketch'), sketch: Sketch = newSketch()) {
  return window.api.createSketch(notesFolder(tree, adv), title, sketch);
}

// The proportions of a picture (to draw over it without stretching).
export function imageAspect(url: string): Promise<number> {
  return new Promise((done) => {
    const img = new Image();
    img.onload = () => done(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 4 / 3);
    img.onerror = () => done(4 / 3);
    img.src = url;
  });
}
