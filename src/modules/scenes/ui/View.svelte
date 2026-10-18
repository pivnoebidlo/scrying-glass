<!-- Вкладка «Сцены»: редактор выбранной сцены. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { AlertTriangle, Play, RefreshCw, Trash2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { activate, capture, describe, missing, partTitle } from '../apply';
  import { PARTS, scenesFor, type Part } from '../types';
  import { shownAdventures } from '../../../shared/adventures';
  import { createEmpty, saveCurrent, ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'scenes'> = $props();

  // Сцены текущего приключения и общие.
  const list = $derived(scenesFor(ms, app.adventures));
  const sc = $derived(list.find((x) => x.id === ui.selected) ?? list.find((x) => x.id === ms.active) ?? list[0]);
  const lost = $derived(sc ? missing(app, sc) : []);

  function takeCurrent(part?: Part) {
    if (!sc) return;
    const c = capture(app);
    dispatch('scenes', 'setContent', { id: sc.id, content: part ? { [part]: c[part] } : c });
    // Взяли часть с экрана — значит, она сцене нужна (у пустой сцены все части выключены). «Взять текущее» целиком
    // отметки не трогает (в «Бой!» может быть нужна только музыка), разве что выключено всё — как у пустой сцены.
    const on = part ? [part] : PARTS.every((p) => !sc.include[p]) ? PARTS : [];
    for (const p of on) if (!sc.include[p]) dispatch('scenes', 'setInclude', { id: sc.id, part: p, value: true });
  }

  function remove() {
    if (sc && confirm(t('scenes.confirmDelete', { name: sc.name }))) dispatch('scenes', 'remove', { id: sc.id });
  }
</script>

<div class="view">
  {#if sc}
    <header class="head">
      <input
        class="title"
        type="text"
        value={sc.name}
        onchange={(e) => dispatch('scenes', 'rename', { id: sc.id, name: e.currentTarget.value.trim() || sc.name })}
      />
      <button class="btn primary" onclick={() => activate(app, sc)}><Play size={14} /> {t('scenes.switchOn')}</button>
      <button class="btn" title={t('scenes.takeAllHint')} onclick={() => takeCurrent()}>
        <RefreshCw size={14} /> {t('scenes.takeAll')}
      </button>
      <button class="icon-btn" title={t('scenes.delete')} onclick={remove}><Trash2 size={15} /></button>
    </header>

    {#if app.adventures.list.length}
      <label class="adventure">
        <span class="faint">{t('scenes.adventure')}</span>
        <select
          value={sc.adventure ?? ''}
          onchange={(e) => dispatch('scenes', 'setAdventure', { id: sc.id, adventure: e.currentTarget.value || null })}
        >
          <option value="">{t('scenes.shared')}</option>
          {#each shownAdventures(app.adventures) as a (a)}<option value={a}>{a}</option>{/each}
        </select>
      </label>
    {/if}

    <p class="faint hint">
      {t('scenes.partsHint')}
    </p>

    {#each PARTS as part (part)}
      <div class="part" class:off={!sc.include[part]}>
        <label class="check">
          <input
            type="checkbox"
            checked={sc.include[part]}
            onchange={(e) => dispatch('scenes', 'setInclude', { id: sc.id, part, value: e.currentTarget.checked })}
          />
          <span class="name">{partTitle(part)}</span>
        </label>
        <span class="value" title={describe(app, sc, part)}>{describe(app, sc, part)}</span>
        <button class="icon-btn" title={t('scenes.takePart')} onclick={() => takeCurrent(part)}><RefreshCw size={14} /></button>
      </div>
    {/each}

    {#if lost.length}
      <div class="lost">
        <AlertTriangle size={14} />
        <div>
          {t('scenes.missing')}
          <ul>{#each lost as p (p)}<li>{p}</li>{/each}</ul>
        </div>
      </div>
    {/if}
  {:else}
    <div class="empty">
      <p>{t('scenes.none')}</p>
      <p class="faint">
        {t('scenes.intro')}
      </p>
      <div class="buttons">
        <button class="btn primary" onclick={() => saveCurrent()}>{t('scenes.saveAsScene')}</button>
        <button class="btn" onclick={createEmpty}>{t('scenes.createEmpty')}</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .adventure {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .view {
    max-width: 760px;
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title {
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    border-color: transparent;
    background: none;
    font-size: 18px;
    font-weight: 600;
  }
  .title:hover {
    border-color: var(--border);
  }
  .hint {
    margin: 8px 0 16px;
    font-size: 12px;
  }
  .part {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr) 28px;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
  }
  .part.off .value {
    color: var(--text-faint);
    text-decoration: line-through;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-muted);
  }
  .lost {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--warning) 45%, transparent);
    border-radius: var(--radius-m);
    background: color-mix(in srgb, var(--warning) 8%, transparent);
    color: var(--warning);
    font-size: 12px;
  }
  .lost ul {
    margin: 4px 0 0;
    padding-left: 16px;
  }
  .empty {
    max-width: 480px;
    margin: 40px auto;
    text-align: center;
  }
  .buttons {
    display: flex;
    justify-content: center;
    gap: 8px;
  }
</style>
