// How the Markdown editors look for this GM (localStorage of the window): the toolbar above the text — on by default,
// switched off in Settings → Journal.
const KEY = 'editor.toolbar';
function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false';
  } catch {
    return true;
  }
}
export const editorPrefs = $state({ toolbar: read() });
export function setToolbar(on: boolean) {
  editorPrefs.toolbar = on;
  try {
    localStorage.setItem(KEY, String(on));
  } catch {
    /* not remembered — not a problem */
  }
}
