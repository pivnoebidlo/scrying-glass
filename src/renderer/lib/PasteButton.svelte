<!-- «Вставить» во вкладках «Персонажи», «Фоны», «Раздатка», «Карты»: картинка из буфера обмена — в папку роли
     текущего приключения (без приключения — в корне хранилища). ⌘V делает то же, пока кнопка на экране и фокус
     не в поле ввода; hotkey={false} — без сочетания (если кнопка не во вкладке, а в боковой панели). -->
<script lang="ts">
  import { hint } from '../../shared/hotkeys';
  import { t } from './i18n.svelte';
  import { ClipboardPaste } from '@lucide/svelte';
  import type { AppState } from '../../shared/types';
  import type { FolderRole } from '../../shared/vault';
  import { roleFolderHere } from '../../shared/adventures';
  import { dispatch } from './store.svelte';

  let { app, role, hotkey = true, compact = false }: { app: AppState; role: FolderRole; hotkey?: boolean; compact?: boolean } = $props();

  const target = $derived(app.vault.tree ? roleFolderHere(app.vault.tree, app.adventures, role) : null);
  const title = $derived(
    target
      ? (hotkey ? (s: string) => hint(s, 'paste') : (s: string) => s)(t('lib.pasteInto', { folder: target.path.split('/').join(' / ') }))
      : app.adventures.current
        ? t('lib.noFolder')
        : t('lib.pickAdventure')
  );

  const paste = () => target && dispatch('vault', 'pasteImage', { folder: target.path });

  function onkeydown(e: KeyboardEvent) {
    if (!hotkey || !(e.metaKey || e.ctrlKey) || e.code !== 'KeyV' || !target) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (document.querySelector('.modal')) return;
    e.preventDefault();
    paste();
  }
</script>

<svelte:window {onkeydown} />

{#if compact}
  <button class="icon-btn" {title} disabled={!target} onclick={paste}><ClipboardPaste size={14} /></button>
{:else}
  <button class="btn" {title} disabled={!target} onclick={paste}><ClipboardPaste size={14} /> {t('lib.paste')}</button>
{/if}
