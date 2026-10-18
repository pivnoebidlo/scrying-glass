<!-- Окно «Что изменилось»: свежий экспорт персонажа из Long Story Short против его карточки — как слияние в git.
     У каждого изменения и каждой строки списка галочка «взять новое»: снятая — в карточке остаётся прежнее. Итог
     собирает mergeCharacter. Можно обновить карточку (прежняя версия — в корзину), создать новую (при импорте) или
     ничего не делать. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { TriangleAlert, X } from '@lucide/svelte';
  import { isCharacter } from '../../../systems/dnd5e/character';
  import { allIds, characterDiff, isEmptyDiff, lineId, mergeCharacter } from '../../../systems/dnd5e/diff';
  import { systemOf } from '../../../systems';
  import type { LssRequest } from './cards.svelte';

  let { request }: { request: LssRequest } = $props();

  const cur = $derived(request.current);
  const next = $derived(request.lss);
  const diff = $derived(isCharacter(cur.stats) && isCharacter(next.stats) ? characterDiff(cur.stats, next.stats) : null);
  const renamed = $derived(cur.name !== next.name);
  const resystem = $derived(cur.system !== next.system);
  const same = $derived(!!diff && isEmptyDiff(diff) && !renamed && !resystem);

  // Все пункты: имя и редакция — отдельно от листа.
  const ids = $derived([...(renamed ? ['name'] : []), ...(resystem ? ['system'] : []), ...(diff ? allIds(diff) : [])]);
  // Снятые галочки (по умолчанию берётся всё новое).
  let skipped = $state<string[]>([]);
  const taken = $derived(new Set(ids.filter((id) => !skipped.includes(id))));
  const on = (id: string) => taken.has(id);
  const toggle = (id: string) => (skipped = skipped.includes(id) ? skipped.filter((x) => x !== id) : [...skipped, id]);

  function update() {
    if (!diff || !isCharacter(cur.stats)) return request.resolve({ kind: 'update' });
    request.resolve({
      kind: 'update',
      merged: {
        name: on('name') ? next.name : cur.name,
        system: on('system') ? next.system : cur.system,
        stats: mergeCharacter(cur.stats, diff, taken),
      },
    });
  }
  const cancel = () => request.resolve({ kind: 'cancel' });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && cancel()} />

{#snippet row(id: string, label: string, before: string, after: string)}
  <tr class:off={!on(id)}>
    <td class="check"><input type="checkbox" checked={on(id)} onchange={() => toggle(id)} title={t('best.takeNew')} /></td>
    <th>{label}</th>
    <td class="was">{before}</td>
    <td class="now">{after}</td>
  </tr>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && cancel()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={t('best.changes')}>
    <header>
      <h3>{request.import ? t('best.exists', { name: cur.name }) : t('best.updateFrom', { name: cur.name })}</h3>
      <button class="icon-btn" title={t('best.cancel')} onclick={cancel}><X size={16} /></button>
    </header>
    <div class="body">
      {#if request.import}
        <p class="faint lead">
          {t('best.alreadyImported')}
        </p>
      {/if}
      {#each next.warnings as w, i (i)}
        <p class="warn"><TriangleAlert size={14} /> {w}</p>
      {/each}

      {#if same}
        <p class="same">{t('best.noChanges')}</p>
      {:else}
        <div class="head">
          <h4>{t('best.changes')}</h4>
          <span class="faint">{t('best.markHint')}</span>
          <button class="link" onclick={() => (skipped = [])}>{t('best.all')}</button>
          <button class="link" onclick={() => (skipped = [...ids])}>{t('best.none')}</button>
        </div>
        <table>
          <tbody>
            {#if renamed}{@render row('name', t('best.rowName'), cur.name, next.name)}{/if}
            {#if resystem}{@render row('system', t('best.rowEdition'), systemOf(cur.system).title, systemOf(next.system).title)}{/if}
            {#each diff?.changes ?? [] as c (c.id)}{@render row(c.id, c.label, c.before, c.after)}{/each}
          </tbody>
        </table>
        {#each diff?.lists ?? [] as l (l.id)}
          <div class="list">
            <div class="label">{l.label}</div>
            {#each l.added as x (x)}
              {@const id = lineId(l, true, x)}
              <label class="line add" class:off={!on(id)} title={on(id) ? t('best.willAdd') : t('best.dontAdd')}>
                <input type="checkbox" checked={on(id)} onchange={() => toggle(id)} /> + {x}
              </label>
            {/each}
            {#each l.removed as x (x)}
              {@const id = lineId(l, false, x)}
              <label class="line del" class:off={!on(id)} title={on(id) ? t('best.willRemove') : t('best.keepInCard')}>
                <input type="checkbox" checked={on(id)} onchange={() => toggle(id)} /> − {x}
              </label>
            {/each}
          </div>
        {/each}
        {#if !diff}
          <p class="faint">{t('best.cantCompare')}</p>
        {/if}
      {/if}

      <p class="faint hint">
        {t('best.keeps')}
      </p>
    </div>
    <footer>
      <button class="btn" onclick={cancel}>{request.import ? t('best.skip') : t('best.cancel')}</button>
      {#if request.import}<button class="btn" title={t('best.createNewHint')} onclick={() => request.resolve({ kind: 'new' })}>{t('best.createNew')}</button>{/if}
      <button class="btn primary" disabled={!same && ids.length > 0 && taken.size === 0} onclick={update}>
        {taken.size < ids.length ? t('best.applySome', { n: taken.size, total: ids.length }) : t('best.updateCard')}
      </button>
    </footer>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.55);
  }
  .modal {
    display: flex;
    flex-direction: column;
    width: min(680px, calc(100vw - 80px));
    max-height: calc(100vh - 80px);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  header {
    display: flex;
    align-items: center;
    padding: 12px 12px 8px 16px;
  }
  h3 {
    flex: 1;
    margin: 0;
    font-size: 15px;
  }
  .body {
    padding: 0 16px 8px;
    overflow: auto;
    user-select: text;
  }
  .lead {
    margin: 0 0 10px;
  }
  .warn {
    display: flex;
    gap: 6px;
    margin: 0 0 10px;
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: color-mix(in srgb, var(--warning) 12%, transparent);
    color: var(--warning);
    font-size: 13px;
  }
  .warn :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 8px 0 6px;
  }
  .head .faint {
    flex: 1;
    font-size: 12px;
  }
  h4 {
    margin: 0;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font-size: 12px;
    cursor: pointer;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 3px 6px;
    border-top: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }
  .check {
    width: 20px;
    padding-right: 0;
  }
  th {
    width: 34%;
    color: var(--text-muted);
    font-weight: 400;
  }
  .was {
    color: var(--text-faint);
    text-decoration: line-through;
  }
  .now {
    font-weight: 600;
  }
  /* Галочка снята: остаётся прежнее — оно и выделено. */
  tr.off .was {
    color: var(--text-normal);
    font-weight: 600;
    text-decoration: none;
  }
  tr.off .now {
    color: var(--text-faint);
    font-weight: 400;
    text-decoration: line-through;
  }
  .list {
    margin-top: 10px;
  }
  .label {
    margin-bottom: 2px;
    color: var(--text-muted);
  }
  .line {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding-left: 6px;
    white-space: pre-wrap;
    cursor: pointer;
  }
  .add {
    color: var(--success);
  }
  .del {
    color: var(--danger);
  }
  /* Снятая строка: не добавится (новая) или останется (пропавшая) — просто бледная. */
  .line.off {
    color: var(--text-faint);
  }
  .same {
    margin: 4px 0 8px;
  }
  .hint {
    margin: 14px 0 6px;
    font-size: 12px;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 16px 14px;
    border-top: 1px solid var(--border);
  }
</style>
