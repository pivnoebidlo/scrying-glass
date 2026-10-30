<!-- Подборка без картинок (музыка, бои): строки-кнопки. Щелчок включает (что именно — toggle блока), включённое —
     с подсветкой; крестик убирает из подборки. «+» — выбор из списка (options). Пополняется и само (scenes/tray.ts). -->
<script lang="ts">
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { Power, PowerOff } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Plus, X } from '@lucide/svelte';
  import type { Component, Snippet } from 'svelte';
  import ListPicker, { type PickOption } from '../../../renderer/lib/ListPicker.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { sortable } from '../../../renderer/lib/sortable';
  import type { AppState } from '../../../shared/types';
  import { currentTray, trayOwner, type TrayPart } from '../tray';

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
    extra,
    onremove,
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
    // Своя кнопка у строки (звёздочка основной музыки сцены).
    extra?: Snippet<[string]>;
    // Taken out of the tray: what else goes with it (a loop leaves the ambience, a playlist — the player).
    onremove?: (id: string) => unknown;
    children?: Snippet;
  } = $props();

  const owner = $derived(trayOwner(app.scenes, app.adventures));
  const tray = $derived(currentTray(app.scenes, app.adventures)[part]);
  // Только подборка: то, что играет или идёт вне её, видно в проигрывателе и в бою.
  const items = $derived(tray.filter((id) => caption(id) !== null));

  let picking = $state(false);
  const add = (ids: string[]) => ids.length && dispatch('scenes', 'trayAdd', { owner: $state.snapshot(owner), part, paths: ids });
  const reorder = (ids: string[]) => dispatch('scenes', 'traySet', { owner: $state.snapshot(owner), part, ids });
  const remove = (id: string) => (onremove?.(id), dispatch('scenes', 'trayRemove', { owner: $state.snapshot(owner), part, path: id }));
  // A chip's menu (a right click): turn it on or off, take it out of the tray.
  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const chipMenu = (e: MouseEvent, id: string) =>
    (menu = {
      ...menuAt(e),
      items: [
        isOn(id) ? { label: t('scenes.chipOff'), icon: PowerOff, action: () => void toggle(id) } : { label: t('scenes.chipOn'), icon: Power, action: () => void toggle(id) },
        { label: t('scenes.removeFromTray'), icon: X, action: () => void remove(id) },
      ],
    });
</script>

<div class="chips">
  {#each items as id (id)}
    {@const Icon = iconOf(id)}
    <div class="chip" class:on={isOn(id)} use:sortable={{ group: `tray:${part}`, id, ids: tray, disabled: !tray.includes(id), onmove: reorder }} oncontextmenu={(e) => chipMenu(e, id)} role="none">
      <button class="main" title={caption(id)} onclick={() => toggle(id)}>
        <Icon size={13} />
        <span class="name">{caption(id)}</span>
      </button>
      {@render extra?.(id)}
      <button class="remove" title={t('scenes.removeFromTray')} onclick={() => remove(id)}><X size={11} /></button>
    </div>
  {/each}
  <button class="chip add" title={t('scenes.addToTray')} onclick={() => (picking = true)}>
    <Plus size={13} />{#if !items.length}<span class="name">{t('scenes.add')}</span>{/if}
  </button>
</div>
{#if !items.length}<div class="faint hint">{hint}</div>{/if}
{@render children?.()}

{#if picking}
  <ListPicker title={pickTitle} options={options()} skip={tray} onpick={(ids) => ((picking = false), add(ids))} onclose={() => (picking = false)} />
{/if}

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

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
    display: grid;
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
