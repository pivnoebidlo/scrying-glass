// Parts of the interface the GM can hide (Settings → Parts of the app): a module (its id, `optional` in control.ts) or
// a tool (`tool:<id>`). Hidden means only that: its data stays and what other parts do with it still works, so turning
// it back on brings everything back.
export const toolPart = (id: string) => `tool:${id}`;
export const isOff = (off: string[], id: string) => off.includes(id);
export const switched = (off: string[], id: string, on: boolean) => (on ? off.filter((x) => x !== id) : [...new Set([...off, id])]);
