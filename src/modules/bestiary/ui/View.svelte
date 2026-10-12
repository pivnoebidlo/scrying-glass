<!-- Вкладка бестиария: выбранная карточка, её версии на других языках и добавление в бой. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRightLeft, Copy, Pencil, Swords, Trash2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { cardImageUrl, sameRef, type CardScope } from '../../../shared/cards';
  import { systemOf } from '../../../systems';
  import { statsView } from '../../../systems/ui';
  import { markdown } from '../../../renderer/lib/markdown';
  import { bestiary, connectCards } from './cards.svelte';
  import { rollFormula } from './dice';
  import CardEditor from './CardEditor.svelte';

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

  // Портрет для трекера: картинка хранилища — путём (её можно показать игрокам), библиотеки — адресом.
  function portraitFor(scope: CardScope, p: string | undefined) {
    if (!p) return {};
    return scope === 'vault' ? { portrait: p } : { image: cardImageUrl(scope, p) };
  }

  async function toInitiative() {
    if (!card || !summary) return;
    const n = Math.max(1, Math.min(20, Math.round(count) || 1));
    const { hp, ac, initiative, hpFormula } = summary.combat;
    for (const name of names(card.name, n)) {
      const maxHp = rollHp && hpFormula ? (rollFormula(hpFormula) ?? hp) : hp;
      await dispatch('initiative', 'add', {
        c: { name, maxHp, ac, bonus: initiative, side: 'enemy', card: summary.ref, ...portraitFor(summary.ref.scope, card.portraits[0]) },
      });
    }
    openTab('initiative');
  }
</script>

{#if bestiary.draft}
  <CardEditor {app} draft={bestiary.draft} />
{:else}
<div class="view">
  {#if card && summary && Stats}
    {@const ref = summary.ref}
    <header>
      <div class="title">
        {#if card.portraits.length}
          <div class="portraits">
            {#each card.portraits as p, i (p)}
              {@const onScreen = ref.scope === 'vault' && app.portraits.onScreen.includes(p)}
              {#if ref.scope === 'vault'}
                <button
                  class="portrait"
                  class:main={i === 0}
                  class:on={onScreen}
                  title={onScreen ? 'Убрать с экрана игроков' : 'Показать игрокам'}
                  onclick={() => dispatch('portraits', 'toggle', { path: p })}
                ><img src={cardImageUrl(ref.scope, p)} alt="" /></button>
              {:else}
                <span class="portrait" class:main={i === 0}><img src={cardImageUrl(ref.scope, p)} alt="" /></span>
              {/if}
            {/each}
          </div>
        {/if}
        <div class="names">
          <h1>{card.name}</h1>
          <div class="info faint">{info}</div>
          <div class="manage">
            {#if ref.scope === 'srd'}
              <button class="btn" title="Копию можно править, переводить и дополнять портретами" onclick={() => bestiary.copy(ref, 'library')}><Copy size={13} /> Копия в библиотеку</button>
              <button class="btn" onclick={() => bestiary.copy(ref, 'vault')}><Copy size={13} /> Копия в кампанию</button>
            {:else}
              <button class="btn" onclick={() => bestiary.edit(ref)}><Pencil size={13} /> Править</button>
              <button class="btn" onclick={() => bestiary.copy(ref, ref.scope)}><Copy size={13} /> Копия</button>
              {#if ref.scope === 'vault'}
                <button class="btn" title="Карточка станет доступна во всех кампаниях" onclick={() => bestiary.move(ref, 'library')}><ArrowRightLeft size={13} /> В библиотеку</button>
              {:else}
                <button class="btn" title="Скопировать в эту кампанию" onclick={() => bestiary.copy(ref, 'vault')}><Copy size={13} /> Копия в кампанию</button>
              {/if}
              <button class="icon-btn" title="Удалить карточку" onclick={() => bestiary.remove(ref, card.name)}><Trash2 size={14} /></button>
            {/if}
          </div>
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
        </div>
      </div>
    </header>

    <Stats {card} />

    {#if card.notes}
      <h3>Заметки</h3>
      <div class="notes">{@html markdown(card.notes)}</div>
    {/if}
  {:else if bestiary.selected && sameRef(bestiary.selected, bestiary.cardRef)}
    <p class="faint placeholder">Карточка не найдена: её удалили или перенесли в другое место.</p>
  {:else if bestiary.selected}
    <p class="faint placeholder">Загрузка…</p>
  {:else}
    <p class="faint placeholder">Выберите существо в списке слева или создайте своё кнопкой «+».</p>
  {/if}
</div>
{/if}

<style>
  .view {
    padding: 16px 24px 32px;
  }
  .title {
    display: flex;
    gap: 16px;
    margin-bottom: 14px;
  }
  .portraits {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .portrait {
    display: block;
    width: 52px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    background: none;
    overflow: hidden;
  }
  button.portrait {
    cursor: pointer;
  }
  .portrait.main {
    width: 104px;
  }
  .portrait.on {
    border-color: var(--accent);
  }
  .portrait img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }
  .names {
    flex: 1;
    min-width: 0;
  }
  .manage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .manage .btn {
    padding: 3px 10px;
    font-size: 12px;
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
    margin-top: 10px;
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
