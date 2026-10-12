<!-- Вкладка бестиария: выбранная карточка, её версии на других языках и добавление в бой. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRightLeft, Copy, FolderOpen, HardDrive, ImagePlus, Pencil, Star, Swords, Trash2, Upload, X } from '@lucide/svelte';
  import ImagePicker from './ImagePicker.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { LANGUAGES, cardAsset, cardImageUrl, langName, sameRef, type CardScope, type CardSide, type CardSummary } from '../../../shared/cards';
  import { systemOf } from '../../../systems';
  import { statsView } from '../../../systems/ui';
  import { markdown } from '../../../renderer/lib/markdown';
  import { bestiary, connectCards } from './cards.svelte';
  import { addToInitiative } from './combat';
  import { folderLabel } from './places';
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
    return [systemOf(card.system).title, where(summary), src].filter(Boolean).join(' · ');
  });

  // Где лежит карточка: «Встроенный SRD», «Библиотека», «Тыквенный фестиваль / monsters».
  function where(c: CardSummary): string {
    if (c.ref.scope === 'srd') return 'Встроенный SRD';
    if (c.ref.scope === 'library') return 'Библиотека';
    return folderLabel(app, c.folder);
  }

  // Языки, на которые ещё нет перевода.
  const missingLangs = $derived(Object.keys(LANGUAGES).filter((l) => !bestiary.versions.some((v) => v.lang === l)));

  let portraitMenu = $state(false);
  let picking = $state(false);

  let count = $state(1);
  let rollHp = $state(false);

  // Портрет на экран игроков и обратно. Подпись — название карточки, если у картинки нет своей.
  async function togglePortrait(asset: string, name: string) {
    if (!app.portraits.onScreen.includes(asset) && !app.portraits.names[asset]) {
      await dispatch('portraits', 'rename', { path: asset, name });
    }
    await dispatch('portraits', 'toggle', { path: asset });
  }

  // Сторона в бою: из карточки, но перед добавлением её можно поменять.
  let side = $state<CardSide | null>(null);
  $effect(() => {
    void bestiary.selected;
    side = null;
  });

  async function toInitiative() {
    if (!summary) return;
    await addToInitiative(summary, { count, rollHp, side: side ?? summary.side });
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
        <div class="portraits">
          {#each card.portraits as p, i (p)}
            {@const asset = cardAsset(ref.scope, p)}
            {@const onScreen = app.portraits.onScreen.includes(asset)}
            <div class="portrait" class:main={i === 0} class:on={onScreen}>
              <button
                class="pic"
                title={onScreen ? 'Убрать с экрана игроков' : 'Показать игрокам'}
                onclick={() => togglePortrait(asset, card.name)}
              ><img src={cardImageUrl(ref.scope, p)} alt="" /></button>
              <div class="p-actions">
                {#if i > 0}<button class="icon-btn" title="Сделать основным" onclick={() => bestiary.makeMainPortrait(ref, p)}><Star size={12} /></button>{/if}
                <button class="icon-btn" title="Убрать портрет" onclick={() => bestiary.removePortrait(ref, p)}><X size={12} /></button>
              </div>
            </div>
          {/each}
          <div class="add-portrait" class:main={!card.portraits.length}>
            <button
              class="add-btn"
              title={ref.scope === 'srd' ? 'Портрет встроенной карточки хранится в библиотеке, он общий для всех её языков' : 'Добавить портрет'}
              onclick={() => (portraitMenu = !portraitMenu)}><ImagePlus size={16} /></button
            >
            {#if portraitMenu}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
              <div class="menu-backdrop" onclick={() => (portraitMenu = false)}></div>
              <div class="menu">
                <button disabled={!app.vault.tree} onclick={() => ((portraitMenu = false), (picking = true))}><FolderOpen size={13} /> Из хранилища</button>
                <button onclick={() => ((portraitMenu = false), bestiary.addPortrait(ref))}><HardDrive size={13} /> С диска…</button>
              </div>
            {/if}
          </div>
        </div>
        <div class="names">
          <h1>{card.name}</h1>
          <div class="info faint">{info}</div>
          <div class="manage">
            {#if ref.scope === 'srd'}
              <button
                class="btn"
                title="Встроенные карточки только для чтения. Копию можно править, переводить и дополнять портретами"
                onclick={() => bestiary.copy(ref)}><Copy size={13} /> Сделать копию…</button
              >
            {:else}
              <button class="btn" onclick={() => bestiary.edit(ref)}><Pencil size={13} /> Править</button>
              <button class="btn" title="Новая карточка на основе этой — в библиотеке или папке приключения" onclick={() => bestiary.copy(ref)}
                ><Copy size={13} /> Сделать копию…</button
              >
              <button class="btn" title="Переложить карточку в библиотеку или в папку другого приключения, без копии" onclick={() => bestiary.move(ref)}
                ><ArrowRightLeft size={13} /> Перенести…</button
              >
              <button class="icon-btn" title="Удалить карточку" onclick={() => bestiary.remove(ref)}><Trash2 size={14} /></button>
            {/if}
            <button
              class="icon-btn"
              title="Экспорт в файл (все языки, с портретами) — чтобы поделиться"
              onclick={() => window.api.exportCards({ refs: bestiary.versions.map((v) => v.ref), name: card.name })}
            ><Upload size={14} /></button>
          </div>
          <div class="actions">
            <div class="langs">
              {#each bestiary.versions as v (v.ref.scope + v.ref.id)}
                <button
                  class="chip"
                  class:active={sameRef(v.ref, summary.ref)}
                  title="{v.name} · {where(v)}"
                  onclick={() => bestiary.select(v.ref)}
                >
                  {langName(v.lang)}{#if bestiary.versions.filter((x) => x.lang === v.lang).length > 1}<span class="where">
                      · {where(v)}</span
                    >{/if}
                </button>
              {/each}
              <select
                class="add-lang"
                value=""
                title={ref.scope === 'srd' ? 'Перевод встроенной карточки сохранится в библиотеку' : 'Перевести на другой язык'}
                onchange={(e) => {
                  const l = e.currentTarget.value;
                  e.currentTarget.value = '';
                  if (l) bestiary.translate(ref, l);
                }}
              >
                <option value="">+ язык</option>
                {#each missingLangs as l (l)}<option value={l}>{langName(l)}</option>{/each}
              </select>
            </div>
            <div class="spacer"></div>
            <label class="hp" title={summary.combat.hpFormula ? `Бросить ${summary.combat.hpFormula} для каждого` : 'Нет формулы хитов'}>
              <input type="checkbox" bind:checked={rollHp} disabled={!summary.combat.hpFormula} /> случайные хиты
            </label>
            <input class="count" type="number" min="1" max="20" bind:value={count} title="Сколько добавить" />
            <select class="side" value={side ?? summary.side} onchange={(e) => (side = e.currentTarget.value as CardSide)} title="На чьей стороне в бою">
              <option value="enemy">противник</option>
              <option value="ally">союзник</option>
            </select>
            <button class="btn primary" onclick={toInitiative}><Swords size={14} /> В инициативу</button>
          </div>
        </div>
      </div>
    </header>

    {#if card.description?.trim()}
      <div class="description">{@html markdown(card.description)}</div>
    {/if}

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
{#if picking && app.vault.tree && summary}
  {@const ref = summary.ref}
  <ImagePicker tree={app.vault.tree} onpick={(p) => ((picking = false), bestiary.addPortrait(ref, p))} onclose={() => (picking = false)} />
{/if}
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
    position: relative;
    width: 52px;
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    overflow: hidden;
  }
  .portrait.main {
    width: 104px;
  }
  .portrait.on {
    border-color: var(--accent);
  }
  .portrait:hover {
    border-color: var(--accent-hover);
  }
  .pic {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .pic img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }
  .p-actions {
    position: absolute;
    top: 2px;
    right: 2px;
    display: none;
    gap: 2px;
  }
  .portrait:hover .p-actions {
    display: flex;
  }
  .p-actions .icon-btn {
    width: 20px;
    height: 20px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
  }
  .add-portrait {
    position: relative;
  }
  .add-btn {
    display: grid;
    place-items: center;
    width: 52px;
    aspect-ratio: 3 / 4;
    border: 1px dashed var(--border);
    border-radius: var(--radius-m);
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .add-portrait.main .add-btn {
    width: 104px;
  }
  .add-btn:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9;
  }
  .menu {
    position: absolute;
    top: 0;
    left: calc(100% + 4px);
    z-index: 10;
    display: flex;
    flex-direction: column;
    min-width: 160px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--bg-hover);
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
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .where {
    color: var(--text-faint);
    font-size: 11px;
  }
  .add-lang {
    padding: 2px 6px;
    border-style: dashed;
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
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
  .side {
    padding: 5px 6px;
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
  .description {
    max-width: 720px;
    margin-bottom: 14px;
    color: var(--text-muted);
    line-height: 1.55;
    user-select: text;
  }
  .description :global(p) {
    margin: 0 0 8px;
  }
  .placeholder {
    padding-top: 40px;
    text-align: center;
  }
</style>
