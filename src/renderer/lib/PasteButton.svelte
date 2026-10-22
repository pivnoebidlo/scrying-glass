<!-- «Вставить» во вкладках «Персонажи», «Фоны», «Раздатка», «Карты», «Музыка»: файлы, скопированные в Finder или
     Проводнике, или картинка из буфера — в папку роли текущего приключения (без приключения — в корне хранилища).
     ⌘V в открытой вкладке делает то же (renderer/control/FileDrop.svelte); hotkey={false} — без сочетания в подсказке
     (кнопка не во вкладке, а в боковой панели). -->
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

  const paste = () => target && dispatch('vault', 'pasteImage', { folder: target.path, role });
</script>

{#if compact}
  <button class="icon-btn" {title} disabled={!target} onclick={paste}><ClipboardPaste size={14} /></button>
{:else}
  <button class="btn" {title} disabled={!target} onclick={paste}><ClipboardPaste size={14} /> {t('lib.paste')}</button>
{/if}
