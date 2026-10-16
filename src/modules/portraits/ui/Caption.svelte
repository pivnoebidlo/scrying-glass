<!-- Подпись портрета под карточкой картинки — поле ввода. Пустое поле показывает подпись по умолчанию
     (название карточки или имя файла); если её стереть, вернётся она. Файл при этом не переименовывается. -->
<script lang="ts">
  import { Pencil } from '@lucide/svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { autoCaption } from './cardNames.svelte';

  let { path }: { path: string } = $props();
</script>

<label class="caption" title="Подпись на экране игроков. Оставьте пустым — будет название карточки или имя файла">
  <input
    type="text"
    placeholder={autoCaption(path)}
    value={store.state.portraits.names[path] ?? ''}
    onchange={(e) => dispatch('portraits', 'rename', { path, name: e.currentTarget.value })}
    onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
  />
  <Pencil size={11} />
</label>

<style>
  .caption {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 8px;
    border-top: 1px solid var(--border);
    color: var(--text-faint);
  }
  input {
    flex: 1;
    min-width: 0;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    padding: 5px 8px;
    /* Своя подпись — тем же цветом, что и подпись по умолчанию (у рамки поля он приглушённый). */
    color: var(--text-normal);
    font-size: 12px;
  }
  /* Подпись по умолчанию — как обычный текст, а не как подсказка. */
  input::placeholder {
    color: var(--text-normal);
    opacity: 0.85;
  }
  .caption :global(svg) {
    opacity: 0;
  }
  .caption:hover :global(svg) {
    opacity: 1;
  }
  .caption:hover input {
    border-color: var(--border);
  }
  input:focus {
    border-color: var(--accent);
    outline: none;
  }
  input:focus::placeholder {
    color: var(--text-faint);
  }
</style>
