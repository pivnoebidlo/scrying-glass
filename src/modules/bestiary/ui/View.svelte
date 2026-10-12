<!-- Вкладка бестиария: выбранная карточка, её версии на других языках и добавление в бой. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Swords } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { sameRef, type CardScope } from '../../../shared/cards';
  import { systemOf } from '../../../systems';
  import { statsView } from '../../../systems/ui';
  import { markdown } from '../../../renderer/lib/markdown';
  import { bestiary, connectCards } from './cards.svelte';
  import { rollFormula } from './dice';

  let { app }: ModuleProps<'bestiary'> = $props();

  onMount(connectCards);

  const card = $derived(bestiary.card);
  const summary = $derived(bestiary.all.find((c) => sameRef(c.ref, bestiary.selected)));
  const Stats = $derived(card ? statsView(card.system) : null);
  // «D&D 5e (2024) · Встроенный SRD · SRD 5.2.1 (Wizards of the Coast)»
  const info = $derived.by(() => {
    if (!card || !summary) return '';
    const src = card.source && card.source.title + (card.source.attribution ? ` (${card.source.attribution})` : '');
    return [systemOf(card.system).title, SCOPES[summary.ref.scope], src].filter(Boolean).join(' · ');
  });

  const SCOPES: Record<CardScope, string> = { srd: 'Встроенный SRD', library: 'Моя библиотека', vault: 'Эта кампания' };
  const LANGS: Record<string, string> = { ru: 'Русский', en: 'English' };

  let count = $state(1);
  let rollHp = $state(false);

  // «Гоблин», «Гоблин 2», …: нумерация продолжает тех, кто уже в бою.
  function names(base: string, n: number): string[] {
    const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: (\\d+))?$`);
    let max = 0;
    for (const c of app.initiative.combatants) {
      const m = re.exec(c.name);
      if (m) max = Math.max(max, m[1] ? Number(m[1]) : 1);
    }
    if (n === 1 && max === 0) return [base];
    return Array.from({ length: n }, (_, i) => `${base} ${max + i + 1}`);
  }

  async function toInitiative() {
    if (!card || !summary) return;
    const n = Math.max(1, Math.min(20, Math.round(count) || 1));
    const { hp, ac, initiative, hpFormula } = summary.combat;
    for (const name of names(card.name, n)) {
      const maxHp = rollHp && hpFormula ? (rollFormula(hpFormula) ?? hp) : hp;
      await dispatch('initiative', 'add', {
        c: { name, maxHp, ac, bonus: initiative, side: 'enemy', card: summary.ref },
      });
    }
    openTab('initiative');
  }
</script>

<div class="view">
  {#if card && summary && Stats}
    <header>
      <h1>{card.name}</h1>
      <div class="info faint">{info}</div>
      <div class="actions">
        {#if bestiary.versions.length > 1}
          <div class="langs">
            {#each bestiary.versions as v (v.ref.id)}
              <button class="chip" class:active={sameRef(v.ref, summary.ref)} onclick={() => bestiary.select(v.ref)}>
                {LANGS[v.lang] ?? v.lang}
              </button>
            {/each}
          </div>
        {/if}
        <div class="spacer"></div>
        <label class="hp" title={summary.combat.hpFormula ? `Бросить ${summary.combat.hpFormula} для каждого` : 'Нет формулы хитов'}>
          <input type="checkbox" bind:checked={rollHp} disabled={!summary.combat.hpFormula} /> случайные хиты
        </label>
        <input class="count" type="number" min="1" max="20" bind:value={count} title="Сколько добавить" />
        <button class="btn primary" onclick={toInitiative}><Swords size={14} /> В инициативу</button>
      </div>
    </header>

    <Stats {card} />

    {#if card.notes}
      <h3>Заметки</h3>
      <div class="notes">{@html markdown(card.notes)}</div>
    {/if}
  {:else if bestiary.selected}
    <p class="faint placeholder">Загрузка…</p>
  {:else}
    <p class="faint placeholder">Выберите существо в списке слева.</p>
  {/if}
</div>

<style>
  .view {
    padding: 16px 24px 32px;
  }
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    user-select: text;
  }
  .info {
    margin: 2px 0 10px;
    font-size: 12px;
  }
  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }
  .langs {
    display: flex;
    gap: 4px;
  }
  .chip {
    padding: 2px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .chip.active {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .spacer {
    flex: 1;
  }
  .hp {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
  }
  .count {
    width: 52px;
    padding: 5px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
  }
  h3 {
    margin: 20px 0 6px;
    font-size: 15px;
  }
  .notes {
    user-select: text;
  }
  .placeholder {
    padding-top: 40px;
    text-align: center;
  }
</style>
