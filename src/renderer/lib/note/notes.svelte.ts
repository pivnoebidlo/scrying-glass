// Записки в окне управления: содержимое читается из файла по требованию и перечитывается, когда ядро
// перечитало хранилище (записку сохранили здесь или поправили снаружи).
import { t } from '../i18n.svelte';
import { NOTE_SUFFIX, newNote, type Note } from '../../../shared/notes';
import { roleNames, type VaultFolder } from '../../../shared/vault';
import { roleFolderHere, type AdventuresState } from '../../../shared/adventures';

export const notes = $state({ rev: 0 });

let hooked = false;
export function connectNotes() {
  if (hooked) return;
  hooked = true;
  window.api.onVaultRescan(() => notes.rev++);
}

// Куда класть новую записку: папка раздатки текущего приключения (или корня хранилища), её нет — создаётся
// с основным названием роли.
export function notesFolder(tree: VaultFolder | null, adv: AdventuresState): string {
  const here = tree ? roleFolderHere(tree, adv, 'handouts') : null;
  if (here) return here.path;
  const name = roleNames().handouts[0]!;
  return adv.current ? `${adv.current}/${name}` : name;
}

export async function createNote(tree: VaultFolder | null, adv: AdventuresState, title = t('lib.newNote'), note: Note = newNote()) {
  return window.api.createNote(notesFolder(tree, adv), title, note);
}

export const isNoteFile = (name: string) => name.toLowerCase().endsWith(NOTE_SUFFIX);
