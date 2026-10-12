<!-- Подпись портрета под карточкой картинки. Файл при этом не переименовывается. -->
<script lang="ts">
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { caption } from '../library';

  let { path }: { path: string } = $props();
</script>

<input
  type="text"
  placeholder="Подпись"
  title="Подпись на экране игроков"
  value={caption(store.state.portraits, path)}
  onchange={(e) => dispatch('portraits', 'rename', { path, name: e.currentTarget.value })}
/>

<style>
  input {
    display: block;
    width: 100%;
    border: 0;
    border-top: 1px solid var(--border);
    border-radius: 0;
    background: transparent;
    padding: 6px 8px;
    font-size: 12px;
  }
</style>
