<!-- Панель меток поверх редактора карты: выбранная метка (название, цвет, видят ли игроки, заметка) или список
     всех меток карты. Заметку видит только мастер. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { ChevronLeft, Eye, EyeOff, Trash2, X } from '@lucide/svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { PIN_ICONS, type PinIcon } from '../icons';
  import { PIN_COLORS, type MapPin, type PinColor } from '../types';
  import PinCards from './PinCards.svelte';
  import PinIconSvg from './PinIconSvg.svelte';
  import { ui } from './ui.svelte';

  let {
    path,
    pins,
    pin,
    focusTitle = $bindable(),
    onpick,
    onremove,
  }: {
    path: string;
    pins: MapPin[];
    pin: MapPin | null;
    focusTitle: boolean;
    onpick: (p: MapPin) => void;
    onremove: (p: MapPin) => void;
  } = $props();

  const update = (p: MapPin, changes: Partial<Omit<MapPin, 'id'>>) => dispatch('maps', 'updatePin', { path, id: p.id, changes });

  // Только что поставленная метка: сразу печатать название.
  function autofocus(el: HTMLInputElement) {
    if (!focusTitle) return;
    focusTitle = false;
    el.focus();
  }

  function setColor(p: MapPin, color: PinColor) {
    ui.pinColor = color;
    update(p, { color });
  }

  function setIcon(p: MapPin, icon: PinIcon) {
    ui.pinIcon = icon;
    update(p, { icon });
  }

  function close() {
    ui.pin = null;
    ui.pinList = false;
  }

  const sorted = $derived([...pins].sort((a, b) => (a.title || '￿').localeCompare(b.title || '￿', 'ru')));
</script>

<!-- Щелчки по панели не должны доходить до карты. -->
<div class="panel" role="presentation" onpointerdown={(e) => e.stopPropagation()}>
  {#if pin}
    {#key pin.id}
      <header>
        {#if ui.pinList}
          <button class="icon-btn" title={t('maps.backToPins')} onclick={() => (ui.pin = null)}><ChevronLeft size={15} /></button>
        {/if}
        <input
          class="title"
          type="text"
          value={pin.title}
          placeholder={t('maps.title')}
          use:autofocus
          onchange={(e) => update(pin, { title: e.currentTarget.value.trim() })}
          onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <button class="icon-btn" title={t('app.closeEsc')} onclick={close}><X size={15} /></button>
      </header>

      <div class="row">
        <div class="colors">
          {#each Object.entries(PIN_COLORS) as [c, v] (c)}
            <button class="color" class:active={pin.color === c} style:--c={v} title={t('maps.color')} aria-label={t('maps.color')} onclick={() => setColor(pin, c as PinColor)}></button>
          {/each}
        </div>
      </div>

      <div class="icons">
        {#each Object.entries(PIN_ICONS) as [id, ic] (id)}
          <button class="ic" class:active={(pin.icon ?? 'pin') === id} title={t(`maps.icon.${id as PinIcon}`)} aria-label={t(`maps.icon.${id as PinIcon}`)} onclick={() => setIcon(pin, id as PinIcon)}>
            <PinIconSvg icon={id as PinIcon} size={16} />
          </button>
        {/each}
      </div>

      <button class="btn shown" class:primary={!pin.shown} onclick={() => update(pin, { shown: !pin.shown })}>
        {#if pin.shown}<EyeOff size={14} /> {t('maps.hideFromPlayers')}{:else}<Eye size={14} /> {t('maps.showToPlayers')}{/if}
      </button>
      <div class="hint faint">
        {pin.shown ? t('maps.pinShown') : t('maps.pinHidden')}
      </div>

      <textarea
        rows="5"
        value={pin.note}
        placeholder={t('maps.noteForMe')}
        onchange={(e) => update(pin, { note: e.currentTarget.value })}
      ></textarea>

      <PinCards {path} {pin} />

      <footer>
        <span class="faint">{t('maps.dragPin')}</span>
        <button class="icon-btn" title={t('maps.deletePin')} onclick={() => onremove(pin)}><Trash2 size={15} /></button>
      </footer>
    {/key}
  {:else}
    <header>
      <div class="head">{t('maps.pins')}</div>
      <button class="icon-btn" title={t('maps.close')} onclick={close}><X size={15} /></button>
    </header>
    {#if sorted.length}
      <ul>
        {#each sorted as p (p.id)}
          <li>
            <button class="item" onclick={() => onpick(p)}>
              <span class="mark"><PinIconSvg icon={p.icon} size={14} color={PIN_COLORS[p.color]} /></span>
              <span class="name" class:faint={!p.title}>{p.title || t('maps.untitled')}</span>
              {#if p.note}<span class="note faint" title={p.note}>{p.note}</span>{/if}
            </button>
            <button class="icon-btn" title={p.shown ? t('maps.pinShownToggle') : t('maps.pinHiddenToggle')} onclick={() => update(p, { shown: !p.shown })}>
              {#if p.shown}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="faint empty">{t('maps.noPins')}</p>
    {/if}
  {/if}
</div>

<style>
  .panel {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 270px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m, 8px);
    background: var(--bg-primary);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .head {
    flex: 1;
    font-weight: 600;
  }
  .title {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .colors {
    display: flex;
    gap: 6px;
  }
  .color {
    width: 20px;
    height: 20px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 50%;
    background: var(--c);
    cursor: pointer;
  }
  .color.active {
    border-color: var(--text-normal);
  }
  .shown {
    justify-content: center;
  }
  .hint {
    margin-top: -4px;
    font-size: 12px;
  }
  textarea {
    width: 100%;
    resize: vertical;
    font: inherit;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }
  ul {
    max-height: 60vh;
    overflow: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .item {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 5px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: var(--bg-hover, var(--bg-active));
  }
  .mark {
    align-self: center;
    display: flex;
  }
  .icons {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 2px;
  }
  .ic {
    display: grid;
    place-items: center;
    height: 26px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .ic:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .ic.active {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .name {
    flex: none;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .note {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }
  .empty {
    margin: 4px 0;
    font-size: 13px;
  }
</style>
