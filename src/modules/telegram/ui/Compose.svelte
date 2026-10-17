<!-- Tools → Telegram: a message to the players straight from the app (Markdown → Telegram), sent through the dialog
     (recipients: the group chat or players privately). Without a bot — how to set it up. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Send } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { openSettings } from '../../../renderer/lib/nav';
  import { markdownToTelegram } from '../../../shared/telegram';
  import { loadTg, sendToTelegram, tg, tgReady } from './tg.svelte';

  onMount(() => void loadTg());
  const KEY = 'tg.draft';
  let text = $state(readDraft());
  function readDraft() {
    try {
      return localStorage.getItem(KEY) ?? '';
    } catch {
      return '';
    }
  }
  $effect(() => {
    try {
      localStorage.setItem(KEY, text);
    } catch {
      /* not remembered — not a problem */
    }
  });
  const send = () => sendToTelegram({ kind: 'text', title: text.trim().split('\n')[0]!.slice(0, 60), html: markdownToTelegram(text) });
</script>

<div class="view">
  <h2>{t('tg.compose')}</h2>
  <p class="faint">{t('tg.composeAbout')}</p>
  {#if !tgReady()}
    <p class="faint">{tg.status?.error ? t('tg.error', { error: tg.status.error }) : t('tg.notReady')}</p>
    <button class="btn primary" onclick={() => openSettings('telegram')}>{t('tg.openSettings')}</button>
  {:else}
    <textarea rows="10" bind:value={text} placeholder={t('tg.composePh')}></textarea>
    <div class="row">
      <button class="btn primary" disabled={!text.trim()} onclick={send}><Send size={14} /> {t('tg.send')}</button>
    </div>
  {/if}
</div>

<style>
  .view {
    max-width: 760px;
    padding: 16px 20px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  textarea {
    width: 100%;
    margin-top: 10px;
  }
  .row {
    margin-top: 10px;
  }
</style>
