<!-- «Вставить» во вкладках «Персонажи», «Фоны», «Раздатка», «Карты»: картинка из буфера обмена — в папку роли
     текущего приключения (без приключения — в корне хранилища). ⌘V делает то же, пока кнопка на экране и фокус
     не в поле ввода; hotkey={false} — без сочетания (если кнопка не во вкладке, а в боковой панели). -->
<script lang="ts">
  import { ClipboardPaste } from '@lucide/svelte';
  import type { AppState } from '../../shared/types';
  import type { FolderRole } from '../../shared/vault';
  import { roleFolderHere } from '../../shared/adventures';
  import { dispatch } from './store.svelte';

  let { app, role, hotkey = true, compact = false }: { app: AppState; role: FolderRole; hotkey?: boolean; compact?: boolean } = $props();

  const target = $derived(app.vault.tree ? roleFolderHere(app.vault.tree, app.adventures, role) : null);
  const title = $derived(
    target
      ? `Вставить картинку из буфера обмена в папку «${target.path.split('/').join(' / ')}»${hotkey ? ' (⌘V)' : ''}`
      : app.adventures.current
        ? 'В приключении нет папки для этого (она создаётся при открытии хранилища)'
        : 'Выберите приключение: картинка попадёт в его папку'
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
  <button class="btn" {title} disabled={!target} onclick={paste}><ClipboardPaste size={14} /> Вставить</button>
{/if}
