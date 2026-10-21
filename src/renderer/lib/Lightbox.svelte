<!-- Картинка крупно у мастера: рассмотреть перед тем, как показывать игрокам. Esc или щелчок мимо — закрыть,
     ← → — соседние картинки той же сетки. Внизу — те же действия, что на плитке (портрет, фон, раздатка…). -->
<script lang="ts">
  import { Check, ChevronLeft, ChevronRight, Copy, X } from '@lucide/svelte';
  import { assetUrl, prettyName } from '../../shared/vault';
  import { badgeOf } from './contrib';
  import { closeLightbox, lightbox } from './view-image.svelte';
  import { imageActions } from './registry';
  import { store } from './store.svelte';
  import { t } from './i18n.svelte';

  const path = $derived(lightbox.items[lightbox.index] ?? null);
  const app = $derived(store.state);
  const name = $derived(path ? prettyName(path) : '');

  function step(d: number) {
    const n = lightbox.items.length;
    if (n > 1) lightbox.index = (lightbox.index + d + n) % n;
  }

  // Copy the picture (⌘C / Ctrl+C or the button): the file itself, as PNG.
  let copied = $state<'ok' | 'fail' | null>(null);
  let copiedTimer: ReturnType<typeof setTimeout> | undefined;
  async function copy() {
    if (!path) return;
    copied = (await window.api.copyImage(path)) ? 'ok' : 'fail';
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied = null), 1500);
  }

  function onkeydown(e: KeyboardEvent) {
    if (!path) return;
    // A layout-independent key: C is KeyC in any keyboard layout (a Russian one types «с»).
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC' && !window.getSelection()?.toString()) void copy();
    else if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
</script>

<svelte:window onkeydowncapture={onkeydown} />

{#if path}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="lightbox" onclick={closeLightbox}>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <img src={assetUrl(path)} alt={name} onclick={(e) => e.stopPropagation()} />
    <button class="close icon-btn" title={t('app.closeEsc')} onclick={closeLightbox}><X size={20} /></button>
    {#if lightbox.items.length > 1}
      <button class="nav prev icon-btn" title={t('view.prev')} onclick={(e) => (e.stopPropagation(), step(-1))}><ChevronLeft size={28} /></button>
      <button class="nav next icon-btn" title={t('view.next')} onclick={(e) => (e.stopPropagation(), step(1))}><ChevronRight size={28} /></button>
    {/if}
    <div class="bar" onclick={(e) => e.stopPropagation()}>
      <span class="name" title={path}>{name}</span>
      {#if lightbox.items.length > 1}<span class="count">{lightbox.index + 1} / {lightbox.items.length}</span>{/if}
      <button class="btn" title={t('view.copyHint')} onclick={copy}>
        {#if copied === 'ok'}<Check size={14} /> {t('view.copied')}{:else}<Copy size={14} /> {copied === 'fail' ? t('view.copyFailed') : t('view.copy')}{/if}
      </button>
      {#each imageActions.filter((a) => a.visible?.(app, path) ?? true) as a (a.id)}
        {@const on = a.active(app, path)}
        <button class="btn" class:primary={on} onclick={() => a.toggle(app, path)}>
          <a.icon size={14} />
          {on ? t('action.remove', { what: badgeOf(a, app, path) }) : a.title}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 72px 16px;
    background: rgba(0, 0, 0, 0.88);
  }
  /* Во всё свободное место, и маленькая картинка тоже — её и открывают, чтобы рассмотреть. */
  img {
    flex: 1;
    min-height: 0;
    width: 100%;
    object-fit: contain;
    filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.6));
  }
  .close {
    position: absolute;
    top: 12px;
    right: 12px;
    color: #fff;
  }
  .nav {
    position: absolute;
    top: 50%;
    width: 48px;
    height: 48px;
    margin-top: -24px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .nav:hover {
    background: rgba(255, 255, 255, 0.18);
  }
  .prev {
    left: 14px;
  }
  .next {
    right: 14px;
  }
  .bar {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #ddd;
  }
  .name {
    max-width: 40vw;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    margin-right: 8px;
    color: #999;
    font-size: 12px;
  }
</style>
