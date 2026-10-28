<!-- "Send to Telegram": recipients (the chats turned on in the settings), an optional caption for a picture, Send.
     Lives all the time (the module's background component), opens on sendToTelegram(). A note is drawn large over the
     window for a moment (the dialog hidden) and captured — a picture as the players see it. -->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Send, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openSettings } from '../../../renderer/lib/nav';
  import { chatName, markdownToTelegram, sortChats, titleHtml } from '../../../shared/telegram';
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';
  import type { Note } from '../../../shared/notes';
  import { isSketchPath, type Sketch } from '../../../shared/sketch';
  import SketchView from '../../../renderer/lib/sketch/SketchView.svelte';
  import PaperSheet from '../../../systems/dnd5e/PaperSheet.svelte';
  import type { Card, CardRef } from '../../../shared/cards';
  import type { Dnd5eCharacter } from '../../../systems/dnd5e/character';
  import { enabledChats, lastSelected, loadTg, rememberSelected, sending, tg, tgReady } from './tg.svelte';

  // Standard module props; nothing here uses them.
  let {}: ModuleProps<'telegram'> = $props();
  onMount(() => void loadTg());

  let selected = $state<number[]>([]);
  let caption = $state('');
  let busy = $state(false);
  let result = $state('');

  const job = $derived(sending.job);
  const chats = $derived(sortChats(enabledChats()));
  const groups = $derived(chats.filter((c) => c.kind === 'group'));
  const players = $derived(chats.filter((c) => c.kind === 'private'));

  // The dialog hides for a capture and comes back with the same job: that is not a new job.
  let shownFor: unknown = null;
  $effect(() => {
    if (!job || job === shownFor) return;
    shownFor = job;
    // A new job: the recipients of last time that are still on, the title as the caption.
    const on = new Set(chats.map((c) => c.id));
    const last = lastSelected().filter((id) => on.has(id));
    selected = last.length ? last : groups.map((c) => c.id).slice(0, 1);
    caption = job.kind === 'text' ? '' : job.kind === 'image' ? (job.caption ?? '') : job.title;
    result = '';
    busy = false;
  });

  const toggle = (id: number) => (selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const allPlayersOn = $derived(players.length > 0 && players.every((p) => selected.includes(p.id)));
  const toggleAllPlayers = () =>
    (selected = allPlayersOn ? selected.filter((id) => !players.some((p) => p.id === id)) : [...new Set([...selected, ...players.map((p) => p.id)])]);

  const close = () => (sending.job = null);

  async function send() {
    const j = job;
    if (!j || !selected.length) return;
    busy = true;
    rememberSelected(selected);
    // The title offered as the caption goes bold; a caption written by hand — as Markdown.
    const c = caption.trim();
    const cap = !c ? undefined : j.kind !== 'image' && c === j.title ? titleHtml(c) : markdownToTelegram(c);
    let r: { sent: number; errors: string[] };
    if (j.kind === 'file') r = await window.api.telegramSendFile($state.snapshot(selected), j.path, cap);
    else if (j.kind === 'image') r = await window.api.telegramSendBytes($state.snapshot(selected), j.data, j.name, cap);
    else if (j.kind === 'text') r = await window.api.telegramSendText($state.snapshot(selected), j.html);
    else if (j.kind === 'card') r = await sendCard(j.ref, j.title, cap);
    else r = await sendNote(j.path, j.title, cap);
    busy = false;
    result = [r.sent ? t('tg.sent', { count: r.sent }) : '', ...r.errors].filter(Boolean).join(' ');
    if (r.sent && !r.errors.length) setTimeout(() => sending.job === j && close(), 1200);
  }

  // A note (or a canvas): drawn large over the window (the dialog hidden; the sheet fits the box keeping its shape),
  // captured, removed.
  let shooting = $state.raw<Note | Sketch | null>(null);
  let page = $state<HTMLElement | null>(null);
  const frame = () => new Promise((res) => setTimeout(res, 120));
  async function sendNote(path: string, title: string, cap?: string) {
    const note = isSketchPath(path) ? await window.api.readSketch(path) : await window.api.readNote(path);
    if (!note) return { sent: 0, errors: [title] };
    const j = sending.job;
    sending.job = null;
    shooting = note;
    await tick();
    await document.fonts.ready;
    // A canvas over a picture: the picture has to be loaded.
    await Promise.all([...(page?.querySelectorAll('img') ?? [])].map((img) => img.decode().catch(() => {})));
    await frame();
    await frame();
    const sheet = page?.querySelector('.sheet') as HTMLElement | null;
    const b = (sheet ?? page)!.getBoundingClientRect();
    const r = await window.api.telegramSendCapture($state.snapshot(selected), { x: b.x, y: b.y, width: b.width, height: b.height }, `${title}.png`, cap);
    shooting = null;
    sending.job = j;
    return r;
  }

  // A character: the paper sheet drawn over the window, made smaller to fit it (CSS zoom), captured.
  let sheetCard = $state.raw<{ card: Card<Dnd5eCharacter>; ref: CardRef } | null>(null);
  let sheetBox = $state<HTMLElement | null>(null);
  async function sendCard(ref: CardRef, title: string, cap?: string) {
    ref = $state.snapshot(ref);
    const card = (await window.api.getCard(ref)) as Card<Dnd5eCharacter> | null;
    if (!card) return { sent: 0, errors: [title] };
    const j = sending.job;
    sending.job = null;
    sheetCard = { card, ref };
    await tick();
    await document.fonts.ready;
    await Promise.all([...(sheetBox?.querySelectorAll('img') ?? [])].map((img) => img.decode().catch(() => {})));
    const el = sheetBox!.firstElementChild as HTMLElement;
    const zoom = Math.min(1, (window.innerWidth - 16) / el.offsetWidth, (window.innerHeight - 16) / el.offsetHeight);
    sheetBox!.style.zoom = String(zoom);
    await frame();
    await frame();
    const b = el.getBoundingClientRect();
    const r = await window.api.telegramSendCapture($state.snapshot(selected), { x: b.x, y: b.y, width: b.width, height: b.height }, `${title}.png`, cap);
    sheetCard = null;
    sending.job = j;
    return r;
  }

  function onkeydown(e: KeyboardEvent) {
    if (job && e.key === 'Escape') close();
  }
</script>

<svelte:window {onkeydown} />

{#if shooting}
  <div class="shoot"><div class="page" bind:this={page}>{#if shooting.scryingGlass === 'sketch'}<SketchView sketch={shooting} />{:else}<NotePaper note={shooting} />{/if}</div></div>
{/if}
{#if sheetCard}
  <div class="shoot top"><div bind:this={sheetBox}><PaperSheet card={sheetCard.card} scope={sheetCard.ref.scope} /></div></div>
{/if}

{#if job}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <div class="modal" role="dialog" aria-modal="true" aria-label={t('tg.send')}>
      <header>
        <Send size={16} />
        <h3>{t('tg.send')}</h3>
        <span class="faint what">{job.title}</span>
        <button class="icon-btn" title={t('tg.cancel')} onclick={close}><X size={16} /></button>
      </header>
      {#if !tgReady()}
        <p class="faint">{tg.status?.error ? t('tg.error', { error: tg.status.error }) : t('tg.notReady')}</p>
        <footer>
          <button class="btn primary" onclick={() => (close(), openSettings('telegram'))}>{t('tg.openSettings')}</button>
        </footer>
      {:else}
        <div class="label">{t('tg.to')}</div>
        <div class="chats">
          {#each groups as c (c.id)}
            <label><input type="checkbox" checked={selected.includes(c.id)} onchange={() => toggle(c.id)} /> {chatName(c)} <span class="faint">· {t('tg.group')}</span></label>
          {/each}
          {#if players.length > 1}
            <label class="all"><input type="checkbox" checked={allPlayersOn} onchange={toggleAllPlayers} /> {t('tg.allPlayers')}</label>
          {/if}
          {#each players as c (c.id)}
            <label class:indent={players.length > 1}><input type="checkbox" checked={selected.includes(c.id)} onchange={() => toggle(c.id)} /> {chatName(c)}</label>
          {/each}
        </div>
        {#if job.kind !== 'text'}
          <label class="caption">{t('tg.caption')}<input type="text" bind:value={caption} placeholder={t('tg.captionPh')} /></label>
        {/if}
        {#if result}<p class="result">{result}</p>{/if}
        <footer>
          <button class="btn" onclick={close}>{t('tg.cancel')}</button>
          <button class="btn primary" disabled={busy || !selected.length} onclick={send}><Send size={14} /> {busy ? t('tg.sending') : t('tg.sendShort')}</button>
        </footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .shoot.top {
    place-items: start center;
    padding-top: 8px;
  }
  .shoot {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    background: #111;
  }
  .page {
    width: min(900px, 94vw);
    height: calc(100vh - 24px);
  }
  .modal {
    width: min(440px, 92vw);
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font-size: 15px;
  }
  .what {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .label {
    margin: 12px 0 4px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .chats {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .chats label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chats .indent {
    padding-left: 20px;
  }
  .caption {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 12px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .result {
    margin: 10px 0 0;
    color: var(--accent);
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }
</style>
