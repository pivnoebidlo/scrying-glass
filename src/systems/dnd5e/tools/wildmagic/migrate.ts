// The GM's wild magic tables (library: wild-magic.json, until 0.91) become tables of the compendium's library, once.
// The file stays: nothing of the GM's is removed.
import { serializeEntry } from '../../../../shared/compendium';
import { entriesFolder } from '../../../../modules/compendium/ui/store.svelte';
import { LIBRARY } from '../../../../shared/vault';
import { parseOwnTables, tableBody } from './tables';

const DONE = 'sg.wildmagic.moved';

export async function moveOwnTables() {
  try {
    if (localStorage.getItem(DONE)) return;
    const own = parseOwnTables(await window.api.readLibraryData('wild-magic.json'));
    for (const o of own) {
      const t = tableBody(o);
      if (t) await window.api.createEntry(entriesFolder(LIBRARY), o.title, serializeEntry({ title: o.title, type: 'table', fields: { roll: `d${t.die}` }, body: t.body }));
    }
    localStorage.setItem(DONE, '1');
  } catch {
    // Tried again on the next launch.
  }
}
