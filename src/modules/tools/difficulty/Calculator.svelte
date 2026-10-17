<!-- Калькулятор сложности боя: набросать противников из карточек (с количеством), увидеть сложность для партии
     приключения (или своей) и сохранить набросок заготовкой боя. Набросок живёт, пока открыто окно. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Minus, Plus, Swords, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { cardImageUrl, refKey, sameRef, type CardSummary } from '../../../shared/cards';
  import { thumb } from '../../../shared/vault';
  import { RATING_TITLES } from '../../../systems/dnd5e/difficulty';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { addToInitiative } from '../../bestiary/ui/combat';
  import { analyze } from '../../initiative/difficulty';
  import type { Combatant } from '../../initiative/types';
  import DifficultyDetails from '../../initiative/ui/DifficultyDetails.svelte';
  import { adventureHeroes, cardInfo } from '../../initiative/ui/heroes';
  import { newEncounterName, ui as initiativeUi } from '../../initiative/ui/ui.svelte';
  import CardSearch from '../../maps/ui/CardSearch.svelte';
  import { calc } from './calc.svelte';

  onMount(connectCards);

  const app = $derived(store.state);
  const rows = $derived(calc.rows.map((r) => ({ ...r, card: bestiary.all.find((c) => sameRef(c.ref, r.ref)) })));
  // Противники как участники боя — для общего расчёта (у калькулятора героев «в бою» нет).
  const list = $derived(
    rows.flatMap((r) => Array.from({ length: r.count }, () => ({ name: r.card?.name ?? '?', side: 'enemy', card: r.ref }) as Combatant))
  );
  const a = $derived((bestiary.all, analyze(list, (c) => cardInfo(c.card), calc.ownParty ? [] : adventureHeroes(app), app.initiative.party)));
  const fmt = (n: number) => n.toLocaleString('ru');

  function add(c: CardSummary) {
    const row = calc.rows.find((r) => sameRef(r.ref, c.ref));
    if (row) row.count++;
    else calc.rows.push({ ref: $state.snapshot(c.ref), count: 1 });
  }

  let saving = $state(false);
  async function save() {
    saving = true;
    const id = crypto.randomUUID();
    await dispatch('initiative', 'createEncounter', { id, name: newEncounterName(app.initiative), adventure: app.adventures.current });
    for (const r of rows) if (r.card) await addToInitiative(r.card, { count: r.count, encounter: id });
    saving = false;
    initiativeUi.encounter = id;
    openTab('initiative');
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('tools.calc.title')}</h2>
    <div class="spacer"></div>
    <button class="btn primary" disabled={!rows.length || saving} title={t('tools.calc.saveHint')} onclick={save}>
      <Swords size={14} /> {t('tools.calc.save')}
    </button>
  </header>
  <p class="faint intro">
    {t('tools.calc.about')}
  </p>

  <div class="cols">
    <section class="enemies">
      <CardSearch placeholder={t('tools.calc.add')} onpick={add} />
      {#if rows.length}
        <ul>
          {#each calc.rows as r, i (refKey(r.ref))}
            {@const card = rows[i]?.card}
            <li>
              {#if card?.portrait}<img src={thumb(cardImageUrl(card.ref.scope, card.portrait), 32)} alt="" />{:else}<span class="noimg"></span>{/if}
              <span class="name">
                {card?.name ?? t('tools.calc.cardGone')}
                <span class="faint sub">{card?.subtitle ?? ''}</span>
              </span>
              <span class="faint xp">{t('tools.calc.xp', { n: fmt(card?.combat.xp ?? 0) })}</span>
              <div class="count">
                <button class="icon-btn" title={t('tools.calc.less')} onclick={() => (r.count > 1 ? r.count-- : calc.rows.splice(i, 1))}><Minus size={13} /></button>
                <span>{r.count}</span>
                <button class="icon-btn" title={t('tools.calc.more')} onclick={() => r.count < 30 && r.count++}><Plus size={13} /></button>
              </div>
              <button class="icon-btn" title={t('tools.calc.remove')} onclick={() => calc.rows.splice(i, 1)}><X size={13} /></button>
            </li>
          {/each}
        </ul>
        <button class="btn clear" onclick={() => calc.rows.splice(0)}>{t('tools.calc.clear')}</button>
      {:else}
        <p class="faint">{t('tools.calc.none')}</p>
      {/if}
    </section>

    <section class="result">
      <div class="rating {a.rating}">
        <span class="r">{RATING_TITLES[a.rating]}</span>
        <span class="faint">{t('tools.calc.forHeroes', { xp: fmt(a.xp), count: a.levels.length })}</span>
      </div>
      <label class="own">
        <input type="checkbox" bind:checked={calc.ownParty} />
        {t('tools.calc.ownParty')}
      </label>
      <DifficultyDetails {a} />
    </section>
  </div>
</div>

<style>
  .view {
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .intro {
    max-width: 680px;
    margin: 8px 0 16px;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(300px, 380px);
    gap: 20px;
    align-items: start;
  }
  ul {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    border-bottom: 1px solid var(--border);
  }
  li img,
  .noimg {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    background: var(--bg-active);
  }
  .name {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .sub {
    overflow: hidden;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .xp {
    font-size: 12px;
    white-space: nowrap;
  }
  .count {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .count span {
    min-width: 20px;
    font-weight: 600;
    text-align: center;
  }
  .clear {
    margin-top: 10px;
  }
  .result {
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    font-size: 13px;
  }
  .rating {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 12px;
  }
  .rating .r {
    color: var(--c);
    font-size: 22px;
    font-weight: 600;
  }
  .trivial {
    --c: #9aa0a8;
  }
  .low {
    --c: #4caf6a;
  }
  .moderate {
    --c: #e0b23a;
  }
  .high {
    --c: #e57a2e;
  }
  .beyond {
    --c: #e04545;
  }
  .own {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }
</style>
