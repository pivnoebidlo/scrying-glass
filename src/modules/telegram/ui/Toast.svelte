<!-- A new message from a player: a toast with the other notices (lib/dock.ts) (a few seconds; a click opens the
     conversation in Tools). Not shown while the conversation is open. -->
<script lang="ts">
  import { hint } from '../../../shared/hotkeys';
  import { MessageCircle, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { dock } from '../../../renderer/lib/dock';
  import { openTab } from '../../../renderer/lib/nav';
  import { chatName } from '../../../shared/telegram';
  import { pickTool, ui as toolsUi } from '../../tools/ui/ui.svelte';
  import { loadTg, tg } from './tg.svelte';

  onMount(() => void loadTg());
  let timer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    if (!tg.toast) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (tg.toast = null), 8000);
  });
  const who = $derived.by(() => {
    const m = tg.toast;
    if (!m) return '';
    const c = tg.status?.chats.find((x) => x.id === m.chat);
    return c?.kind === 'group' ? `${m.from} · ${chatName(c)}` : m.from || (c ? chatName(c) : '');
  });
  function open() {
    tg.toast = null;
    if (toolsUi.tool !== 'telegram') pickTool('telegram');
    openTab('tools');
  }
</script>

{#if tg.toast}
  {@const m = tg.toast}
  <div class="toast" role="status" use:dock>
    <button class="body" onclick={open}>
      <MessageCircle size={16} />
      <span class="txt">
        <b>{who}</b>
        <span class="msg">{m.text || (m.photo ? t('tg.kind.photo') : m.kind ? t(`tg.kind.${m.kind}` as never) : '')}</span>
      </span>
    </button>
    <button class="icon-btn" title={hint(t('app.close'), 'close')} onclick={() => (tg.toast = null)}><X size={14} /></button>
  </div>
{/if}

<style>
  .toast {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    width: min(380px, calc(100vw - 32px));
    padding: 8px 6px 8px 12px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  }
  .body {
    display: flex;
    flex: 1;
    gap: 10px;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .body :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--accent);
  }
  .txt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .msg {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    color: var(--text-muted);
  }
</style>
