<!-- Tools → Telegram: the conversation with the players. Messages on the left (theirs on the left, the app's on the
     right, pictures inline), the chats on the right (all, or one — with unread counts). The box writes to the chosen
     chat straight away (↩ — as a reply), to "All" — through the send dialog with recipients. Enter or ⌘Enter sends
     (Settings → Telegram); an image pasted or dropped into the box goes as a picture with the text as its caption.
     The app's own messages can be deleted for everyone (Telegram allows 48 hours), any message hidden in the app. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { modKey } from '../../../shared/hotkeys';
  import { onDestroy, onMount, tick } from 'svelte';
  import { CornerUpLeft, EyeOff, ImagePlus, Send, Trash2, X } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { markdownKeys } from '../../../renderer/lib/markdownKeys';
  import { openSettings } from '../../../renderer/lib/nav';
  import { chatName, markdownToTelegram, safeTgHtml, sortChats, type TgMessage } from '../../../shared/telegram';
  import { clearInbox, enabledChats, loadInbox, loadTg, markRead, photoUrl, prefs, sendToTelegram, setTable, table, tg, tgReady, unread, visibleChat } from './tg.svelte';

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
  const chats = $derived(sortChats(enabledChats()));
  const list = $derived(tg.inbox.filter((m) => (chat === null ? visibleChat(m.chat) : m.chat === chat)));
  // A chat of another table is no longer here: back to all.
  $effect(() => {
    if (chat !== null && !chats.some((c) => c.id === chat)) pick(null);
  });
  const chatOf = (id: number) => tg.status?.chats.find((x) => x.id === id);
  const nameOf = (id: number) => {
    const c = chatOf(id);
    return c ? chatName(c) : String(id);
  };
  const pick = (id: number | null) => {
    chat = id;
    replyTo = null;
  };

  // What is shown is read; the list scrolls to the newest.
  let box = $state<HTMLElement>();
  $effect(() => {
    void list.length;
    void markRead(chat ?? undefined);
    void tick().then(() => box && (box.scrollTop = box.scrollHeight));
  });

  // A pasted or dropped image waiting to go (with the text as its caption).
  let image = $state.raw<{ data: Uint8Array; name: string; url: string } | null>(null);
  async function takeImage(file: File | null | undefined) {
    if (!file || !file.type.startsWith('image/')) return false;
    const data = new Uint8Array(await file.arrayBuffer());
    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
    // A data: URL for the preview (the window's CSP allows data:, not blob:).
    const url = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.readAsDataURL(file);
    });
    image = { data, name: file.name && file.name !== 'image.png' ? file.name : `image.${ext}`, url };
    return true;
  }
  function dropImage() {
    image = null;
  }
  async function onpaste(e: ClipboardEvent) {
    const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      await takeImage(file);
    }
  }
  let over = $state(false);
  function ondragover(e: DragEvent) {
    if ([...(e.dataTransfer?.items ?? [])].some((i) => i.kind === 'file' && i.type.startsWith('image/'))) {
      e.preventDefault();
      over = true;
    }
  }
  async function ondrop(e: DragEvent) {
    over = false;
    const file = [...(e.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      await takeImage(file);
    }
  }
  let picker = $state<HTMLInputElement>();

  let sending = $state(false);
  let error = $state('');
  const canSend = $derived(!!text.trim() || !!image);
  async function send() {
    if (!canSend || sending) return;
    const html = text.trim() ? markdownToTelegram(text) : '';
    const title = text.trim().split('\n')[0]!.slice(0, 60);
    if (chat === null) {
      if (image) sendToTelegram({ kind: 'image', title: title || image.name, data: image.data, name: image.name, caption: text.trim() });
      else sendToTelegram({ kind: 'text', title, html });
      return;
    }
    sending = true;
    error = '';
    const reply = replyTo && !replyTo.mine ? Number(replyTo.id.split(':')[1]) : undefined;
    const res = image
      ? await window.api.telegramSendBytes([chat], image.data, image.name, html || undefined)
      : await window.api.telegramSendText([chat], html, reply);
    sending = false;
    if (res.errors.length) error = res.errors.join('; ');
    else {
      text = '';
      replyTo = null;
      dropImage();
    }
  }
  // Enter or ⌘Enter sends (the other one makes a new line), as set in Settings → Telegram.
  function onkeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter' || e.isComposing || e.altKey) return;
    const mod = e.metaKey || e.ctrlKey;
    const go = prefs.enterSends ? !mod && !e.shiftKey : mod;
    if (go) {
      e.preventDefault();
      void send();
    }
  }

  function reply(m: TgMessage) {
    chat = m.chat;
    replyTo = m;
  }
  async function remove(m: TgMessage) {
    if (!confirm(t('tg.deleteAsk'))) return;
    error = (await window.api.telegramDelete(m.id)) ?? '';
    if (error) error = t('tg.deleteFailed', { error });
    await loadInbox();
  }
  async function hide(m: TgMessage) {
    tg.inbox = await window.api.telegramHide(m.id);
  }
  const time = (d: number) => new Date(d).toLocaleString(locale.lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  // Delete for everyone: only the app's own messages, only for 48 hours.
  const deletable = (m: TgMessage) => m.mine && !!m.tgIds?.length && Date.now() - m.date < 48 * 3600 * 1000;
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
  <p class="faint about"><Lead text={t('tg.composeAbout')} /></p>
  {#if !tgReady()}
    <p class="faint">{tg.status?.error ? t('tg.error', { error: tg.status.error }) : t('tg.notReady')}</p>
    <button class="btn primary" onclick={() => openSettings('telegram')}>{t('tg.openSettings')}</button>
  {:else}
    <div class="layout">
      <div class="talk">
        <div class="messages" bind:this={box}>
          {#each list as m (m.id)}
            <div class="msg" class:mine={m.mine}>
              <div class="meta">
                {#if m.mine}{t('tg.you')}{#if chat === null}{' '}→ {nameOf(m.chat)}{/if}{:else}<b>{m.from || nameOf(m.chat)}</b>{#if chat === null && chatOf(m.chat)?.kind === 'group'} · {nameOf(m.chat)}{/if}{/if}
                · {time(m.date)}
                <span class="actions">
                  {#if !m.mine}<button class="icon-btn small" title={t('tg.reply')} onclick={() => reply(m)}><CornerUpLeft size={12} /></button>{/if}
                  {#if deletable(m)}<button class="icon-btn small" title={t('tg.deleteForAll')} onclick={() => remove(m)}><Trash2 size={12} /></button>{/if}
                  <button class="icon-btn small" title={t('tg.hide')} onclick={() => hide(m)}><EyeOff size={12} /></button>
                </span>
              </div>
              {#if m.photo}
                {@const url = photoUrl(m.photo)}
                {#if url}<img src={url} alt="" />{/if}
              {/if}
              {#if m.html}<div class="text">{@html safeTgHtml(m.html)}</div>{:else if m.text}<div class="text">{m.text}</div>{/if}
              {#if m.kind}<div class="faint kind">{t(`tg.kind.${m.kind}` as never)}</div>{/if}
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
        {#if image}
          <div class="pending">
            <img src={image.url} alt="" />
            <span class="faint">{t('tg.imageCaption')}</span>
            <button class="icon-btn small" title={t('tg.removeImage')} onclick={dropImage}><X size={12} /></button>
          </div>
        {/if}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="compose" class:over {ondragover} ondragleave={() => (over = false)} {ondrop}>
          <textarea
            rows="3"
            bind:value={text}
            placeholder={chat === null ? t('tg.composePh', { mod: modKey() }) : t('tg.composeTo', { name: nameOf(chat), mod: modKey() })}
            use:markdownKeys={{ enter: !prefs.enterSends, telegram: true }}
            {onkeydown}
            {onpaste}
          ></textarea>
        </div>
        <div class="row">
          <button class="btn primary" disabled={!canSend || sending} onclick={send}>
            <Send size={14} /> {chat === null ? t('tg.send') : t('tg.sendTo', { name: nameOf(chat) })}
          </button>
          <button class="icon-btn" title={t('tg.attach')} onclick={() => picker?.click()}><ImagePlus size={16} /></button>
          <input bind:this={picker} type="file" accept="image/*" hidden onchange={(e) => void takeImage(e.currentTarget.files?.[0]).then(() => picker && (picker.value = ''))} />
          <span class="faint hint">{prefs.enterSends ? t('tg.hintEnter') : t('tg.hintMod', { mod: modKey() })}</span>
          {#if error}<span class="error">{error}</span>{/if}
        </div>
      </div>

      <nav class="chats">
        {#if tg.status?.tables.length}
          <select class="table" title={t('tg.tableHint')} value={tg.status.tables.some((x) => x.id === table.id) ? table.id : ''} onchange={(e) => setTable(e.currentTarget.value)}>
            <option value="">{t('tg.allTables')}</option>
            {#each tg.status.tables as x (x.id)}<option value={x.id}>{x.name}</option>{/each}
          </select>
        {/if}
        <button class="chat" class:on={chat === null} onclick={() => pick(null)}>
          <span class="name">{t('tg.allChats')}</span>
          {#if unread()}<span class="badge">{unread()}</span>{/if}
        </button>
        {#each chats as c (c.id)}
          <button class="chat" class:on={chat === c.id} onclick={() => pick(c.id)}>
            <span class="name">
              {c.label || c.title}
              <span class="faint sub">{c.kind === 'group' ? t('tg.group') : c.label ? c.title : t('tg.private')}</span>
            </span>
            {#if unread(c.id)}<span class="badge">{unread(c.id)}</span>{/if}
          </button>
        {/each}
      </nav>
    </div>
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    max-width: 1000px;
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
  .layout {
    display: flex;
    flex: 1;
    gap: 12px;
    min-height: 0;
  }
  .talk {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .chats {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 2px;
    width: 220px;
    overflow-y: auto;
  }
  .table {
    margin-bottom: 6px;
  }
  .chat {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .chat:hover {
    background: var(--bg-hover);
  }
  .chat.on {
    background: var(--accent-soft);
  }
  .chat .name {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .sub {
    overflow: hidden;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  /* Always there, quiet until the message is hovered. */
  .actions {
    display: flex;
    opacity: 0.55;
  }
  .msg:hover .actions {
    opacity: 1;
  }
  .text {
    margin-top: 2px;
    white-space: pre-wrap;
    line-height: 1.45;
  }
  .msg img {
    display: block;
    max-width: 100%;
    max-height: 320px;
    margin-top: 4px;
    border-radius: 6px;
  }
  .kind {
    font-style: italic;
  }
  .text :global(blockquote) {
    margin: 4px 0;
    padding-left: 8px;
    border-left: 3px solid var(--accent);
  }
  .text :global(tg-spoiler) {
    border-radius: 3px;
    background: var(--text-faint);
    color: transparent;
    transition: color 0.2s;
  }
  .text :global(tg-spoiler:hover) {
    background: none;
    color: inherit;
  }
  .empty {
    margin: auto;
  }
  .icon-btn.small {
    width: 20px;
    height: 20px;
  }
  .replying,
  .pending {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 12px;
  }
  .pending img {
    max-width: 120px;
    max-height: 80px;
    border-radius: 4px;
  }
  .compose {
    margin-top: 8px;
    border-radius: var(--radius-s);
  }
  .compose.over {
    outline: 2px dashed var(--accent);
  }
  textarea {
    display: block;
    width: 100%;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
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
