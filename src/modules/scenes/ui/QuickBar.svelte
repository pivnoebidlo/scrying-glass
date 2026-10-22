<!-- Right panel: scenes as a vertical list, one click each (⌘1…⌘9 — the first nine, shown in the hint). The last row
     saves the current screen as a scene (asks for a name first); double-click a scene to rename it. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { comboLabel, combosOf } from '../../../shared/hotkeys';
  import { Plus, X } from '@lucide/svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { activate } from '../apply';
  import { saveCurrent, suggestCurrent } from './ui.svelte';
  import { scenesFor } from '../types';

  let { ms, app }: ModuleProps<'scenes'> = $props();
  const list = $derived(scenesFor(ms, app.adventures));

  // Поле имени: новая сцена ('new') или переименование (id сцены).
  let editing = $state<string | null>(null);
  let draft = $state('');
  function startNew() {
    draft = suggestCurrent();
    editing = 'new';
  }
  function startRename(id: string, name: string) {
    draft = name;
    editing = id;
  }
  async function commit() {
    const what = editing;
    editing = null;
    if (what === 'new') await saveCurrent(draft, false);
    else if (what && draft.trim()) await dispatch('scenes', 'rename', { id: what, name: draft.trim() });
  }
  function onkey(e: KeyboardEvent) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') editing = null;
  }
  const focus = (node: HTMLInputElement) => {
    node.focus();
    node.select();
  };
</script>

{#snippet field(placeholder: string)}
  <input class="field" type="text" bind:value={draft} {placeholder} use:focus onkeydown={onkey} onblur={() => (editing = null)} />
{/snippet}

<div class="scenes">
  {#each list as sc, i (sc.id)}
    {#if editing === sc.id}
      {@render field(t('scenes.nameField'))}
    {:else}
    <div class="scene" class:live={ms.active === sc.id}>
      <button
        class="main"
        title={t('scenes.renameHint', { name: i < 9 ? `${sc.name} · ${comboLabel(combosOf('scene')[i]!)}` : sc.name })}
        onclick={() => activate(app, sc)}
        ondblclick={() => startRename(sc.id, sc.name)}
      >
        <span class="name">{sc.name}</span>
      </button>
      {#if ms.active === sc.id}
        <!-- Экран не меняется: в панели снова подборка приключения (например, чтобы собрать следующую сцену). -->
        <button class="leave" title={t('scenes.leave')} onclick={() => dispatch('scenes', 'markActive', { id: null })}><X size={11} /></button>
      {/if}
    </div>
    {/if}
  {/each}
  {#if editing === 'new'}
    {@render field(t('scenes.newNameField'))}
  {:else}
    <button class="scene add" title={t('scenes.saveNewHint')} onclick={startNew}>
      <Plus size={13} /><span class="name">{t('scenes.saveCurrent')}</span>
    </button>
  {/if}
</div>

<style>
  .scenes {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .scene {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .scene:hover {
    background: var(--bg-hover);
  }
  .scene.live {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .scene:has(.main) {
    padding: 0;
  }
  .main {
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;
    padding: 5px 8px;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .leave {
    display: grid;
    flex: none;
    place-items: center;
    width: 18px;
    height: 18px;
    margin-right: 5px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .leave:hover {
    color: var(--text-normal);
    background: var(--bg-hover);
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .field {
    padding: 4px 8px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
  }
  .add {
    color: var(--text-muted);
  }
</style>
