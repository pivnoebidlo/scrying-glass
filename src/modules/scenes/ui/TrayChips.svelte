<!-- Подборка без картинок (музыка, бои): строки-кнопки. Щелчок включает (что именно — toggle блока), включённое —
     с подсветкой; крестик убирает из подборки. «+» — выбор из списка (options). Пополняется и само (scenes/tray.ts). -->
<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import type { Component, Snippet } from 'svelte';
  import ListPicker, { type PickOption } from '../../../renderer/lib/ListPicker.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { AppState } from '../../../shared/types';
  import { currentTray, shown, trayOwner, type TrayPart } from '../tray';

  let {
    app,
    part,
    isOn,
    toggle,
    options,
    caption,
    iconOf,
    pickTitle,
    hint,
    children,
  }: {
    app: AppState;
    part: TrayPart;
    isOn: (id: string) => boolean;
    toggle: (id: string) => unknown;
    // Что можно добавить кнопкой «+».
    options: () => PickOption[];
    // Подпись; null — такого больше нет (заготовку удалили) — строка не показывается.
    caption: (id: string) => string | null;
    iconOf: (id: string) => Component;
    pickTitle: string;
    hint: string;
    children?: Snippet;
  } = $props();

  const owner = $derived(trayOwner(app.scenes, app.adventures));
  const tray = $derived(currentTray(app.scenes, app.adventures)[part]);
  const items = $derived([...tray, ...shown(app)[part].filter((p) => !tray.includes(p))].filter((id) => caption(id) !== null));

  let picking = $state(false);
  const add = (ids: string[]) => ids.length && dispatch('scenes', 'trayAdd', { owner: $state.snapshot(owner), part, paths: ids });
  const remove = (id: string) => dispatch('scenes', 'trayRemove', { owner: $state.snapshot(owner), part, path: id });
</script>

<div class="chips">
  {#each items as id (id)}
    {@const Icon = iconOf(id)}
    <div class="chip" class:on={isOn(id)}>
      <button class="main" title={caption(id)} onclick={() => toggle(id)}>
        <Icon size={13} />
        <span class="name">{caption(id)}</span>
      </button>
      {#if tray.includes(id)}
        <button class="remove" title="Убрать из подборки" onclick={() => remove(id)}><X size={11} /></button>
      {/if}
    </div>
  {/each}
  <button class="chip add" title="Добавить в подборку" onclick={() => (picking = true)}>
    <Plus size={13} />{#if !items.length}<span class="name">Добавить</span>{/if}
  </button>
</div>
{#if !items.length}<div class="faint hint">{hint}</div>{/if}
{@render children?.()}

{#if picking}
  <ListPicker title={pickTitle} options={options()} skip={tray} onpick={(ids) => ((picking = false), add(ids))} onclose={() => (picking = false)} />
{/if}

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-hover);
  }
  .chip:hover {
    border-color: var(--accent);
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .main {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 4px 8px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .main :global(svg) {
    flex: none;
    color: var(--text-faint);
  }
  .on .main :global(svg) {
    color: var(--accent);
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .remove {
    display: none;
    place-items: center;
    width: 18px;
    height: 18px;
    margin-right: 3px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .chip:hover .remove {
    display: grid;
  }
  .remove:hover {
    color: var(--danger);
  }
  .add {
    gap: 6px;
    padding: 4px 8px;
    border-style: dashed;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .hint {
    margin-top: 6px;
    font-size: 12px;
  }
</style>
