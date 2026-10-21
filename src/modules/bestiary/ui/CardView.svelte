<!-- Карточка целиком: портреты, языки, управление, «в бой», статблок или лист, заметки. Показывается во вкладке
     бестиария и в выдвижной панели (CardDrawer). Сама загружает карточку по ссылке и перечитывает после изменений. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { thumb } from '../../../shared/vault';
  import { untrack } from 'svelte';
  import { ArrowRightLeft, ClipboardPaste, Copy, FolderOpen, HardDrive, ImagePlus, Monitor, Pencil, RefreshCw, RotateCcw, Star, Swords, Trash2, Upload, Wand2, X } from '@lucide/svelte';
  import { reshapeFrom } from '../../tools/reshape/store.svelte';
  import ImagePicker from '../../../renderer/lib/FilePicker.svelte';
  import type { AppState } from '../../../shared/types';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { LANGUAGES, SIDE_TITLES, cardAsset, cardImageUrl, langName, sameRef, type Card, type CardRef, type CardSide, type CardSummary } from '../../../shared/cards';
  import { isDnd, systemOf } from '../../../systems';
  import { statsView } from '../../../systems/ui';
  import { markdown } from '../../../renderer/lib/markdown';
  import { viewImage } from '../../../renderer/lib/view-image.svelte';
  import { bestiary } from './cards.svelte';
  import { addToInitiative } from './combat';
  import { folderLabel } from './places';

  // Чем закончилось «Обновить из LSS…» (пропадает через несколько секунд).
  const SIDES: CardSide[] = ['enemy', 'ally', 'neutral', 'party'];
  let lssStatus = $state('');
  $effect(() => {
    if (!lssStatus) return;
    const t = setTimeout(() => (lssStatus = ''), 5000);
    return () => clearTimeout(t);
  });

  let {
    app,
    ref,
    onselect,
    compact = false,
    empty = '',
  }: {
    app: AppState;
    ref: CardRef | null;
    // Переключение на другую версию карточки (другой язык).
    onselect: (ref: CardRef) => void;
    // Узкая выдвижная панель.
    compact?: boolean;
    empty?: string;
  } = $props();

  // Полная карточка. loadedFor — для какой ссылки загружена (card = null при loadedFor — карточки нет).
  let card = $state.raw<Card | null>(null);
  let loadedFor = $state.raw<CardRef | null>(null);
  $effect(() => {
    const r = ref;
    void bestiary.rev;
    if (!r || !sameRef(r, untrack(() => loadedFor))) {
      card = null;
      loadedFor = null;
    }
    if (!r) return;
    let stale = false;
    // Копия: ссылка могла прийти реактивным прокси, а его через IPC не передать.
    window.api.getCard({ scope: r.scope, id: r.id }).then((c) => {
      if (stale) return;
      card = c;
      loadedFor = r;
    });
    return () => (stale = true);
  });

  const summary = $derived(bestiary.all.find((c) => sameRef(c.ref, ref)));
  const versions = $derived(ref ? bestiary.versionsOf(ref) : []);
  const Stats = $derived(card ? statsView(card.system, card.stats) : null);
  // «D&D 5e (2024) · Встроенный SRD · SRD 5.2.1 (Wizards of the Coast)»
  const info = $derived.by(() => {
    if (!card || !summary) return '';
    const src = card.source && card.source.title + (card.source.attribution ? ` (${card.source.attribution})` : '');
    return [systemOf(card.system).title, where(summary), src].filter(Boolean).join(' · ');
  });

  // Где лежит карточка: «Встроенный SRD», «Библиотека», «Тыквенный фестиваль / monsters».
  function where(c: CardSummary): string {
    if (c.ref.scope === 'srd') return c.edited ? t('best.srdEdited') : t('best.srdBuiltin');
    if (c.ref.scope === 'library') return t('best.libraryShort');
    return folderLabel(app, c.folder);
  }

  // Языки, на которые ещё нет перевода.
  const missingLangs = $derived(Object.keys(LANGUAGES).filter((l) => !versions.some((v) => v.lang === l)));

  let portraitMenu = $state(false);
  let picking = $state(false);

  let count = $state(1);
  let rollHp = $state(false);

  // Портрет на экран игроков и обратно. Подпись — название карточки (если у картинки нет своей), её
  // подставляют сами портреты.
  const togglePortrait = (asset: string) => dispatch('portraits', 'toggle', { path: asset });

  // Сторона в бою: из карточки, но перед добавлением её можно поменять.
  let side = $state<CardSide | null>(null);
  $effect(() => {
    void ref;
    side = null;
  });

  async function toInitiative() {
    if (!summary) return;
    const single = summary.kind === 'character';
    await addToInitiative(summary, { count: single ? 1 : count, rollHp: !single && rollHp, side: side ?? summary.side });
    openTab('initiative');
  }
</script>
<div class="card-view" class:compact>
  {#if card && summary && Stats}
    {@const cref = summary.ref}
    <header>
      <div class="names">
        <h1>{card.name}</h1>
        <div class="info faint">{info}</div>
        <div class="manage">
          {#if cref.scope === 'srd'}
            <button class="btn" title={t('best.editSrdHint')} onclick={() => bestiary.edit(cref)}
              ><Pencil size={13} /> {t('best.edit')}</button
            >
            <button class="btn" title={t('best.copySrdHint')} onclick={() => bestiary.copy(cref)}
              ><Copy size={13} /> {t('best.makeCopy')}</button
            >
            {#if summary.edited}
              <button class="btn" title={t('best.revertHint')} onclick={() => bestiary.revert(cref)}
                ><RotateCcw size={13} /> {t('best.revert')}</button
              >
            {/if}
          {:else}
            <button class="btn" onclick={() => bestiary.edit(cref)}><Pencil size={13} /> {t('best.edit')}</button>
            <button class="btn" title={t('best.copyHint')} onclick={() => bestiary.copy(cref)}
              ><Copy size={13} /> {t('best.makeCopy')}</button
            >
            <button class="btn" title={t('best.moveHint')} onclick={() => bestiary.move(cref)}
              ><ArrowRightLeft size={13} /> {t('best.move')}</button
            >
            {#if summary.kind === 'character' && isDnd(summary.system)}
              <button
                class="btn"
                title={t('best.lssHint')}
                onclick={async () => (lssStatus = (await bestiary.updateFromLss(cref)) ?? '')}
                ><RefreshCw size={13} /> {t('best.fromLss')}</button
              >
            {/if}
            <button class="icon-btn" title={t('best.delete')} onclick={() => bestiary.remove(cref)}><Trash2 size={14} /></button>
          {/if}
          {#if isDnd(summary.system) && summary.kind !== 'character'}
            <button class="btn" title={t('reshape.fromCardHint')} onclick={() => reshapeFrom(cref)}><Wand2 size={13} /> {t('reshape.fromCard')}</button>
          {/if}
          <button
            class="icon-btn"
            title={t('best.exportHint')}
            onclick={() => window.api.exportCards({ refs: versions.map((v) => v.ref), name: summary.name })}
          ><Upload size={14} /></button>
        </div>
        {#if lssStatus}<div class="lss-status faint">{lssStatus}</div>{/if}
        <div class="actions">
          <div class="langs">
            {#each versions as v (v.ref.scope + v.ref.id)}
              <button
                class="chip"
                class:active={sameRef(v.ref, summary.ref)}
                title="{v.name} · {where(v)}"
                onclick={() => onselect(v.ref)}
              >
                {langName(v.lang)}{#if versions.filter((x) => x.lang === v.lang).length > 1}<span class="where">
                    · {where(v)}</span
                  >{/if}
              </button>
            {/each}
            <select
              class="add-lang"
              value=""
              title={cref.scope === 'srd' ? t('best.translateSrd') : t('best.translate')}
              onchange={(e) => {
                const l = e.currentTarget.value;
                e.currentTarget.value = '';
                if (l) bestiary.translate(cref, l);
              }}
            >
              <option value="">{t('best.addLang')}</option>
              {#each missingLangs as l (l)}<option value={l}>{langName(l)}</option>{/each}
            </select>
          </div>
          <div class="spacer"></div>
          <!-- Персонаж игрока в бою один и с хитами по листу. -->
          {#if summary.kind !== 'character'}
            {#if isDnd(summary.system)}<label class="hp" title={summary.combat.hpFormula ? t('best.rollHp', { formula: summary.combat.hpFormula }) : t('best.noHpFormula')}>
              <input type="checkbox" bind:checked={rollHp} disabled={!summary.combat.hpFormula} /> {t('best.randomHp')}
            </label>{/if}
            <input class="count" type="number" min="1" max="20" bind:value={count} title={t('best.howMany')} />
          {/if}
          <select class="side" value={side ?? summary.side} onchange={(e) => (side = e.currentTarget.value as CardSide)} title={t('best.sideIn')}>
            {#each SIDES as s (s)}<option value={s}>{SIDE_TITLES[s].toLowerCase()}</option>{/each}
          </select>
          <button class="btn primary" onclick={toInitiative}><Swords size={14} /> {t('best.toInitiative')}</button>
        </div>
      </div>
      <!-- Портреты — под шапкой одной полосой: сколько бы их ни было, шапка на месте, лишние прокручиваются. -->
      <div class="strip">
        <div class="portraits">
          {#each card.portraits as p, i (p)}
            {@const asset = cardAsset(cref.scope, p)}
            {@const onScreen = app.portraits.onScreen.includes(asset)}
            <div class="portrait" class:main={i === 0} class:on={onScreen}>
              <button class="pic" data-view={asset} title={t('best.zoom')} ondblclick={(e) => viewImage(asset, e.currentTarget)}
                ><img src={thumb(cardImageUrl(cref.scope, p), 240)} alt="" /></button
              >
              <div class="p-actions">
                <button class="icon-btn" class:on={onScreen} title={onScreen ? t('best.removeFromScreen') : t('best.showToPlayers')} onclick={() => togglePortrait(asset)}
                  ><Monitor size={12} /></button
                >
                {#if i > 0}<button class="icon-btn" title={t('best.makeMain')} onclick={() => bestiary.makeMainPortrait(cref, p)}><Star size={12} /></button>{/if}
                <button class="icon-btn" title={t('best.removePortrait')} onclick={() => bestiary.removePortrait(cref, p)}><X size={12} /></button>
              </div>
            </div>
          {/each}
        </div>
        <div class="add-portrait" class:main={!card.portraits.length}>
          <button
            class="add-btn"
            title={cref.scope === 'srd' ? t('best.srdPortrait') : t('best.addPortrait')}
            onclick={() => (portraitMenu = !portraitMenu)}><ImagePlus size={16} /></button
          >
          {#if portraitMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <div class="menu-backdrop" onclick={() => (portraitMenu = false)}></div>
            <div class="menu">
              <button disabled={!app.vault.tree} onclick={() => ((portraitMenu = false), (picking = true))}><FolderOpen size={13} /> {t('best.fromVault')}</button>
              <button onclick={() => ((portraitMenu = false), bestiary.addPortrait(cref, undefined, true))}><ClipboardPaste size={13} /> {t('best.fromClipboard')}</button>
              <button onclick={() => ((portraitMenu = false), bestiary.addPortrait(cref))}><HardDrive size={13} /> {t('best.fromDisk')}</button>
            </div>
          {/if}
        </div>
      </div>
    </header>

    {#if card.description?.trim()}
      <div class="description">{@html markdown(card.description)}</div>
    {/if}

    <Stats {card} />

    {#if card.notes}
      <h3>{t('best.notes')}</h3>
      <div class="notes">{@html markdown(card.notes)}</div>
    {/if}
  {:else if ref && sameRef(ref, loadedFor)}
    <p class="faint placeholder">{t('best.notFound')}</p>
  {:else if ref}
    <p class="faint placeholder">{t('best.loading')}</p>
  {:else}
    <p class="faint placeholder">{empty}</p>
  {/if}
</div>
{#if picking && app.vault.tree && summary}
  {@const target = summary.ref}
  <ImagePicker tree={app.vault.tree} onpick={([p]) => ((picking = false), bestiary.addPortrait(target, p!))} onclose={() => (picking = false)} />
{/if}

<style>
  .lss-status {
    margin-top: 6px;
    font-size: 12px;
  }
  .card-view {
    padding: 16px 24px 32px;
  }
  /* В узкой выдвижной панели портреты поменьше. */
  .compact {
    padding: 12px 16px 24px;
  }
  .compact .portrait.main,
  .compact .add-portrait.main .add-btn {
    width: 80px;
  }
  .compact h1 {
    font-size: 20px;
  }
  .strip {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 12px 0 14px;
  }
  .portraits {
    display: flex;
    min-width: 0;
    padding-bottom: 4px;
    overflow-x: auto;
    align-items: flex-start;
    gap: 6px;
  }
  .portrait {
    position: relative;
    flex: none;
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
    flex-direction: column;
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
  .p-actions .icon-btn.on {
    background: var(--accent);
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
    top: calc(100% + 4px);
    left: 0;
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
