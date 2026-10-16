<!-- Название портрета под плиткой: оно же подпись на экране игроков. Правка переименовывает карточку, если она у
     картинки есть, иначе файл (rename.ts). -->
<script lang="ts">
  import NameField from '../../../renderer/lib/NameField.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { caption } from './cardNames.svelte';
  import { canRename, renamePortrait } from './rename';

  let { path }: { path: string } = $props();
</script>

<NameField
  value={caption(store.state.portraits, path)}
  title="Переименовать: карточку, если она есть, иначе файл. Это же название видят игроки"
  onrename={canRename(path) ? (name) => renamePortrait(path, name) : undefined}
/>
