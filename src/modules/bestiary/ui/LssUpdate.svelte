<!-- Окно «Что изменилось»: свежий экспорт персонажа из Long Story Short против его карточки. Мастер видит, учёл ли
     игрок замечания, и решает — обновить карточку (прежняя версия — в корзину), создать новую (при импорте) или
     ничего не делать. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { isCharacter } from '../../../systems/dnd5e/character';
  import { characterDiff, isEmptyDiff } from '../../../systems/dnd5e/diff';
  import { systemOf } from '../../../systems';
  import type { LssRequest } from './cards.svelte';

  let { request }: { request: LssRequest } = $props();

  const cur = $derived(request.current);
  const next = $derived(request.lss);
  const diff = $derived(isCharacter(cur.stats) && isCharacter(next.stats) ? characterDiff(cur.stats, next.stats) : null);
  const renamed = $derived(cur.name !== next.name);
  const resystem = $derived(cur.system !== next.system);
  const same = $derived(!!diff && isEmptyDiff(diff) && !renamed && !resystem);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && request.resolve('cancel')} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && request.resolve('cancel')}>
  <div class="modal" role="dialog" aria-modal="true" aria-label="Что изменилось">
    <header>
      <h3>{request.import ? `«${cur.name}» уже есть` : `Обновить «${cur.name}» из LSS`}</h3>
      <button class="icon-btn" title="Отмена" onclick={() => request.resolve('cancel')}><X size={16} /></button>
    </header>
    <div class="body">
      {#if request.import}
        <p class="faint lead">
          Этот персонаж уже импортирован сюда. Обновить его карточку новой версией из Long Story Short или создать ещё одну?
        </p>
      {/if}

      {#if same}
        <p class="same">Изменений нет: лист в LSS такой же, как в карточке.</p>
      {:else}
        <h4>Что изменилось</h4>
        <table>
          <tbody>
            {#if renamed}<tr><th>Имя</th><td class="was">{cur.name}</td><td class="now">{next.name}</td></tr>{/if}
            {#if resystem}<tr><th>Редакция</th><td class="was">{systemOf(cur.system).title}</td><td class="now">{systemOf(next.system).title}</td></tr>{/if}
            {#each diff?.changes ?? [] as c (c.label)}
              <tr><th>{c.label}</th><td class="was">{c.before}</td><td class="now">{c.after}</td></tr>
            {/each}
          </tbody>
        </table>
        {#each diff?.lists ?? [] as l (l.label)}
          <div class="list">
            <div class="label">{l.label}</div>
            {#each l.added as x, i (i)}<div class="add">+ {x}</div>{/each}
            {#each l.removed as x, i (i)}<div class="del">− {x}</div>{/each}
          </div>
        {/each}
        {#if !diff}
          <p class="faint">Сравнить листы не получилось: в карточке не лист персонажа D&D.</p>
        {/if}
      {/if}

      <p class="faint hint">
        Обновляются имя, редакция и лист; портреты, заметки, теги и сторона остаются. Прежняя версия карточки уйдёт в корзину
        приложения — её можно вернуть.
      </p>
    </div>
    <footer>
      <button class="btn" onclick={() => request.resolve('cancel')}>{request.import ? 'Пропустить' : 'Отмена'}</button>
      {#if request.import}<button class="btn" onclick={() => request.resolve('new')}>Создать новую</button>{/if}
      <button class="btn primary" onclick={() => request.resolve('update')}>Обновить карточку</button>
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
    width: min(640px, calc(100vw - 80px));
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
  h4 {
    margin: 8px 0 6px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
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
  th {
    width: 38%;
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
  .list {
    margin-top: 10px;
  }
  .label {
    margin-bottom: 2px;
    color: var(--text-muted);
  }
  .add,
  .del {
    padding-left: 10px;
    white-space: pre-wrap;
  }
  .add {
    color: #5cb85c;
  }
  .del {
    color: var(--danger);
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
