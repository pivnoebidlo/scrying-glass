<!-- Settings → Hotkeys: every shortcut of the app by groups (shared/hotkeys.ts), in the look of this system (⌘ or
     Ctrl). The ones marked `edit` can be changed: a click on the keys, then the new combo (Esc — cancel); a combo
     without a modifier, the system's own or another shortcut's is refused, one that text fields use too is warned
     about. The rest are listed for reference. -->
<script lang="ts">
  import { RotateCcw, Search } from '@lucide/svelte';
  import { t } from '../lib/i18n.svelte';
  import { dispatch, store } from '../lib/store.svelte';
  import {
    alsoUsedBy, comboLabel, comboOf, comboProblem, HOTKEY_GROUPS, HOTKEYS, hotkeyLabel, isCombo, isMac, type HotkeyDef,
  } from '../../shared/hotkeys';

  let query = $state('');
  // The shortcut waiting for its new combo; what went wrong with the last try; a warning after a change.
  let recording = $state<string | null>(null);
  let problem = $state<{ id: string; text: string } | null>(null);
  let warning = $state<{ id: string; text: string } | null>(null);

  const mods = { mod: isMac() ? '⌘' : 'Ctrl+', alt: isMac() ? '⌥' : 'Alt' };
  const title = (id: string) => t(`hk.${id}` as never, mods);
  const changed = (id: string) => id in store.state.vault.hotkeys;
  const keysOf = hotkeyLabel;
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return HOTKEY_GROUPS.map((g) => ({
      g,
      list: HOTKEYS.filter((h) => h.group === g && (!q || title(h.id).toLowerCase().includes(q) || keysOf(h.id).toLowerCase().includes(q))),
    })).filter((x) => x.list.length);
  });

  const save = (map: Record<string, string>) => dispatch('vault', 'setHotkeys', { map });
  function setCombo(h: HotkeyDef, combo: string | null) {
    const map = { ...store.state.vault.hotkeys };
    if (combo === null || combo === h.combo) delete map[h.id];
    else map[h.id] = combo;
    save(map);
  }

  function record(h: HotkeyDef) {
    recording = recording === h.id ? null : h.id;
    problem = null;
    warning = null;
  }
  // While recording, the press is the new combo — nothing else gets it (Esc does not close the settings).
  function onkeydown(e: KeyboardEvent) {
    if (!recording) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const h = HOTKEYS.find((x) => x.id === recording)!;
    if (e.code === 'Escape' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      recording = null;
      return;
    }
    const combo = comboOf(e);
    if (!combo) return;
    if (!isCombo(combo)) {
      problem = { id: h.id, text: t('hk.unsupported') };
      return;
    }
    const p = comboProblem(h.id, combo);
    if (p) {
      const keys = comboLabel(combo);
      problem = { id: h.id, text: p.kind === 'bare' ? t('hk.bare', { ...mods, mod: isMac() ? '⌘' : 'Ctrl' }) : p.kind === 'reserved' ? t('hk.reserved', { keys }) : t('hk.taken', { keys, name: title(p.by) }) };
      return;
    }
    recording = null;
    problem = null;
    const also = alsoUsedBy(h.id, combo);
    warning = also.length ? { id: h.id, text: t('hk.alsoUsed', { names: also.map(title).join(', ') }) } : null;
    setCombo(h, combo);
  }

  const anyChanged = $derived(Object.keys(store.state.vault.hotkeys).length > 0);
</script>

<svelte:window onkeydowncapture={onkeydown} />

<div class="head">
  <div class="search">
    <Search size={14} />
    <input type="search" placeholder={t('hk.searchPh')} bind:value={query} />
  </div>
  {#if anyChanged}
    <button class="btn" onclick={() => save({})}><RotateCcw size={14} /> {t('hk.resetAll')}</button>
  {/if}
</div>
<p class="desc">{t('hk.desc')}</p>

{#each shown as { g, list } (g)}
  <h3>{t(`hk.group.${g}` as never)}</h3>
  {#each list as h (h.id)}
    <div class="row">
      <div class="name">
        {title(h.id)}
        {#if problem?.id === h.id}<div class="note bad">{problem.text}</div>{/if}
        {#if warning?.id === h.id}<div class="note">{warning.text}</div>{/if}
      </div>
      {#if h.edit}
        {#if changed(h.id) && recording !== h.id}
          <button class="icon-btn" title={t('hk.reset', { keys: comboLabel(h.combo) })} onclick={() => ((warning = null), setCombo(h, null))}><RotateCcw size={13} /></button>
        {/if}
        <button class="keys edit" class:recording={recording === h.id} class:changed={changed(h.id)} title={t('hk.change')} onclick={() => record(h)}>
          {recording === h.id ? t('hk.press') : keysOf(h.id)}
        </button>
      {:else}
        <span class="keys">{keysOf(h.id)}</span>
      {/if}
    </div>
  {/each}
{/each}
{#if !shown.length}<p class="desc">{t('hk.nothing')}</p>{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .search {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    color: var(--text-faint);
  }
  .search input {
    flex: 1;
    border: 0;
    background: none;
    outline: none;
  }
  .desc {
    margin: 8px 0 4px;
    color: var(--text-muted);
    font-size: 13px;
  }
  h3 {
    margin: 18px 0 4px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 0;
    border-bottom: 1px solid var(--border);
  }
  .name {
    flex: 1;
  }
  .note {
    margin-top: 2px;
    color: var(--warning);
    font-size: 12px;
  }
  .note.bad {
    color: var(--danger, var(--warning));
  }
  .keys {
    min-width: 72px;
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s, 4px);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-family: inherit;
    font-size: 12px;
    text-align: center;
    white-space: nowrap;
  }
  .keys.edit {
    color: var(--text-normal);
    cursor: pointer;
  }
  .keys.edit:hover {
    border-color: var(--accent);
  }
  .keys.changed {
    border-color: color-mix(in srgb, var(--accent) 60%, var(--border));
  }
  .keys.recording {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
