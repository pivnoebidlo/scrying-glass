<!-- Выдвижная панель карточки: статблок или лист открывается поверх текущей вкладки, у правой панели «Экран игроков»
     (её превью остаётся видно). Открывается из «Персонажей», «Файлов», трекера инициативы; Esc — закрыть. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { fly } from 'svelte/transition';
  import { BookOpen, X } from '@lucide/svelte';
  import type { AppState } from '../../../shared/types';
  import type { CardRef } from '../../../shared/cards';
  import { onMount } from 'svelte';
  import { bestiary, connectCards } from './cards.svelte';
  import CardView from './CardView.svelte';

  let { app, target }: { app: AppState; target: CardRef } = $props();

  // Панель могут открыть из трекера раньше, чем бестиарий загрузил список карточек.
  onMount(connectCards);

  const close = () => (bestiary.peeked = null);

  function onkeydown(e: KeyboardEvent) {
    // Esc закрывает панель, если поверх неё не открыто другое окно (выбор места, выбор картинки).
    if (e.key === 'Escape' && !bestiary.placeRequest && !document.querySelector('.modal')) close();
  }
</script>

<svelte:window {onkeydown} />

<aside class="drawer" transition:fly={{ x: 40, duration: 180 }} aria-label={t('best.card')}>
  <header>
    <button class="btn" title={t('best.inTabHint')} onclick={() => bestiary.openInBestiary(target)}>
      <BookOpen size={14} /> {t('best.inTab')}
    </button>
    <div class="spacer"></div>
    <button class="icon-btn" title={t('best.closeEsc')} onclick={close}><X size={16} /></button>
  </header>
  <div class="body">
    <CardView {app} ref={target} compact onselect={(r) => (bestiary.peeked = r)} />
  </div>
</aside>

<style>
  .drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    /* Вплотную к правой панели «Экран игроков» (280 + граница). */
    right: 281px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    width: min(620px, calc(100vw - 281px - 60px));
    border-left: 1px solid var(--border);
    background: var(--bg-primary);
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
  }
  .spacer {
    flex: 1;
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
</style>
