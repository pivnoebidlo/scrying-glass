// The notices of the control window stand in one place: a column in the bottom right corner (the app's update, new
// versions from the Community, the author's key, the Community's work, a player's message). `use:dock` moves a
// notice's element there; several stand one above another instead of covering each other.
let box: HTMLElement | null = null;

function dockBox(): HTMLElement {
  if (!box || !box.isConnected) {
    box = document.createElement('div');
    box.className = 'sg-dock';
    document.body.append(box);
  }
  return box;
}

export function dock(node: HTMLElement) {
  dockBox().append(node);
  // Moved out of its place: Svelte won't find it there, so it leaves by itself.
  return { destroy: () => node.remove() };
}
