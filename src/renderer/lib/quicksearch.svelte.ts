// ⌘K from a button (the title row over the side panel): the search itself is the compendium's QuickSearch.svelte,
// which opens on every new request.
export const quickSearch = $state({ seq: 0 });
export const openQuickSearch = () => quickSearch.seq++;
