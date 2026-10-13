<!-- Журнал бросков мастера: всплывает при броске, новые снизу. Игрокам не виден. -->
<script lang="ts">
  import { Dices, Trash2, X } from '@lucide/svelte';
  import { diceText } from '../../shared/dice';
  import { rolls, type RollEntry } from './rolls.svelte';

  let list = $state<HTMLElement>();

  // Новый бросок — прокрутить вниз.
  $effect(() => {
    rolls.list.length;
    if (list) list.scrollTop = list.scrollHeight;
  });

  const signed = (n: number) => (n >= 0 ? `+ ${n}` : `− ${-n}`);
  const d20Note = (e: RollEntry) =>
    e.d20 ? `к20: ${e.d20.rolls.join(' | ')}${e.d20.mode === 'advantage' ? ' (преим.)' : e.d20.mode === 'disadvantage' ? ' (помеха)' : ''} ${signed(e.d20.bonus)}` : '';
  const crit = (e: RollEntry) => !!e.attack && e.d20?.natural === 20;
  const fumble = (e: RollEntry) => !!e.attack && e.d20?.natural === 1;
</script>

{#if rolls.open && rolls.list.length}
  <section class="log" aria-label="Броски">
    <header>
      <Dices size={14} />
      <span class="title">Броски</span>
      <button class="icon-btn" title="Очистить" onclick={() => rolls.clear()}><Trash2 size={13} /></button>
      <button class="icon-btn" title="Скрыть (журнал откроется при следующем броске)" onclick={() => (rolls.open = false)}><X size={14} /></button>
    </header>
    <ol bind:this={list}>
      {#each rolls.list as e (e.id)}
        <li class:last={e === rolls.list.at(-1)}>
          <div class="what"><span class="who">{e.who}</span> · {e.what}</div>
          {#if e.d20}
            <div class="line">
              <span class="total" class:crit={crit(e) || (!e.attack && e.d20.natural === 20)} class:fumble={fumble(e) || (!e.attack && e.d20.natural === 1)}
                >{e.d20.total}</span
              >
              <span class="note">{d20Note(e)}</span>
              {#if crit(e)}<span class="tag crit">крит!</span>{:else if fumble(e)}<span class="tag fumble">промах</span>{/if}
            </div>
          {/if}
          {#each e.damage as d, i (i)}
            <div class="line dmg">
              <span class="total">{d.total}</span>
              <span class="note">
                {e.d20 ? 'урон ' : ''}{diceText(d.expr)}{d.crit ? ' ×2 кубов' : ''}: {d.rolls.map((r) => r.join(', ')).join(' | ')}
              </span>
            </div>
          {/each}
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .log {
    position: fixed;
    right: 292px;
    bottom: 12px;
    z-index: 60;
    display: flex;
    flex-direction: column;
    width: 270px;
    max-height: min(300px, 50vh);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px 4px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
  }
  .title {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  ol {
    margin: 0;
    padding: 4px 0;
    overflow: auto;
    list-style: none;
    user-select: text;
  }
  li {
    padding: 3px 10px;
    opacity: 0.6;
  }
  li.last {
    opacity: 1;
  }
  li + li {
    border-top: 1px solid var(--border);
  }
  .what {
    font-size: 12px;
    color: var(--text-muted);
  }
  .who {
    color: var(--text-normal);
  }
  .line {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .total {
    min-width: 28px;
    font-size: 18px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .dmg .total {
    font-size: 16px;
    color: var(--danger);
  }
  .note {
    font-size: 12px;
    color: var(--text-faint);
  }
  .crit {
    color: var(--accent-hover);
  }
  .fumble {
    color: var(--text-faint);
  }
  .tag {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
</style>
