<!-- Tools → Telegram: the conversation with the players. Chats on top (all, or one — with unread counts), the
     messages (theirs on the left, the app's on the right, photos inline), and the message box: to one chat it goes
     straight (optionally as a reply), to "All" — through the send dialog with recipients. Opening a chat marks it read.
     Without a bot — how to set it up. -->
<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { CornerUpLeft, Send, Trash2, X } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { markdownKeys } from '../../../renderer/lib/markdownKeys';
  import { openSettings } from '../../../renderer/lib/nav';
  import { chatName, markdownToTelegram, type TgMessage } from '../../../shared/telegram';
  import { clearInbox, enabledChats, loadTg, markRead, photoUrl, sendToTelegram, tg, tgReady, unread } from './tg.svelte';

  onMount(() => {
    void loadTg();
    tg.reading = true;
    tg.toast = null;
  });
  onDestroy(() => (tg.reading = false));

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

  // Which chat is open: null — all.
  let chat = $state<number | null>(null);
  let replyTo = $state<TgMessage | null>(null);
  const chats = $derived(enabledChats());
  const list = $derived(tg.inbox.filter((m) => chat === null || m.chat === chat));
  const nameOf = (id: number) => {
    const c = tg.status?.chats.find((x) => x.id === id);
    return c ? chatName(c) : String(id);
  };

  // What is shown is read; the list scrolls to the newest.
  let box = $state<HTMLElement>();
  $effect(() => {
    void list.length;
    void markRead(chat ?? undefined);
    void tick().then(() => box && (box.scrollTop = box.scrollHeight));
  });

  let sending = $state(false);
  let error = $state('');
  async function send() {
    const html = markdownToTelegram(text);
    if (!text.trim()) return;
    if (chat === null) {
      sendToTelegram({ kind: 'text', title: text.trim().split('\n')[0]!.slice(0, 60), html });
      return;
    }
    sending = true;
    error = '';
    const res = await window.api.telegramSendText([chat], html, replyTo && !replyTo.mine ? Number(replyTo.id.split(':')[1]) : undefined);
    sending = false;
    if (res.errors.length) error = res.errors.join('; ');
    else {
      text = '';
      replyTo = null;
    }
  }
  function reply(m: TgMessage) {
    chat = m.chat;
    replyTo = m;
  }
  const time = (d: number) =>
    new Date(d).toLocaleString(locale.lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const kindText = (m: TgMessage) => (m.kind ? t(`tg.kind.${m.kind}` as never) : '');
</script>

<div class="view">
  <header class="head">
    <h2>{t('tg.compose')}</h2>
    <div class="spacer"></div>
    {#if list.length}
      <button class="icon-btn" title={t(chat === null ? 'tg.clearAll' : 'tg.clearChat')} onclick={() => confirm(t(chat === null ? 'tg.clearAllAsk' : 'tg.clearChatAsk')) && clearInbox(chat ?? undefined)}>
        <Trash2 size={15} />
      </button>
    {/if}
  </header>
  <p class="faint about">{t('tg.composeAbout')}</p>
  {#if !tgReady()}
    <p class="faint">{tg.status?.error ? t('tg.error', { error: tg.status.error }) : t('tg.notReady')}</p>
    <button class="btn primary" onclick={() => openSettings('telegram')}>{t('tg.openSettings')}</button>
  {:else}
    <div class="chats">
      <button class="chip" class:on={chat === null} onclick={() => ((chat = null), (replyTo = null))}>
        {t('tg.allChats')}{#if unread()}<span class="badge">{unread()}</span>{/if}
      </button>
      {#each chats as c (c.id)}
        <button class="chip" class:on={chat === c.id} onclick={() => ((chat = c.id), (replyTo = null))}>
          {chatName(c)}{#if unread(c.id)}<span class="badge">{unread(c.id)}</span>{/if}
        </button>
      {/each}
    </div>

    <div class="messages" bind:this={box}>
      {#each list as m (m.id)}
        <div class="msg" class:mine={m.mine}>
          <div class="meta">
            {#if m.mine}{t('tg.you')}{#if chat === null} → {nameOf(m.chat)}{/if}{:else}<b>{m.from || nameOf(m.chat)}</b>{#if chat === null && tg.status?.chats.find((c) => c.id === m.chat)?.kind === 'group'} · {nameOf(m.chat)}{/if}{/if}
            · {time(m.date)}
            {#if !m.mine}<button class="icon-btn small" title={t('tg.reply')} onclick={() => reply(m)}><CornerUpLeft size={12} /></button>{/if}
          </div>
          {#if m.photo}
            {@const url = photoUrl(m.photo)}
            {#if url}<img src={url} alt="" />{/if}
          {/if}
          {#if m.text}<div class="text">{m.text}</div>{/if}
          {#if m.kind}<div class="faint kind">{kindText(m)}</div>{/if}
        </div>
      {:else}
        <p class="faint empty">{t('tg.noMessages')}</p>
      {/each}
    </div>

    {#if replyTo}
      <div class="replying faint">
        <CornerUpLeft size={12} /> {t('tg.replyingTo', { name: replyTo.from || nameOf(replyTo.chat) })}: {replyTo.text.slice(0, 80)}
        <button class="icon-btn small" title={t('tg.cancelReply')} onclick={() => (replyTo = null)}><X size={12} /></button>
      </div>
    {/if}
    <textarea
      rows="4"
      bind:value={text}
      placeholder={chat === null ? t('tg.composePh') : t('tg.composeTo', { name: nameOf(chat) })}
      use:markdownKeys
      onkeydown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && (e.preventDefault(), send())}
    ></textarea>
    <div class="row">
      <button class="btn primary" disabled={!text.trim() || sending} onclick={send}><Send size={14} /> {chat === null ? t('tg.send') : t('tg.sendTo', { name: nameOf(chat) })}</button>
      <span class="faint hint">⌘↵</span>
      {#if error}<span class="error">{error}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    max-width: 820px;
    height: 100%;
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .about {
    margin: 6px 0 10px;
  }
  .chats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .badge {
    min-width: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    font-size: 11px;
    text-align: center;
  }
  .messages {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    min-height: 120px;
    margin: 10px 0;
    padding: 10px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    user-select: text;
  }
  .msg {
    align-self: flex-start;
    max-width: 78%;
    padding: 6px 10px 8px;
    border-radius: 10px;
    background: var(--bg-primary);
  }
  .msg.mine {
    align-self: flex-end;
    background: var(--accent-soft);
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-faint);
    font-size: 11px;
  }
  .text {
    margin-top: 2px;
    white-space: pre-wrap;
    line-height: 1.45;
  }
  img {
    display: block;
    max-width: 100%;
    max-height: 320px;
    margin-top: 4px;
    border-radius: 6px;
  }
  .kind {
    font-style: italic;
  }
  .empty {
    margin: auto;
  }
  .icon-btn.small {
    width: 20px;
    height: 20px;
  }
  .replying {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 12px;
  }
  textarea {
    width: 100%;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }
  .hint {
    font-size: 12px;
  }
  .error {
    color: var(--danger);
    font-size: 12px;
  }
</style>
