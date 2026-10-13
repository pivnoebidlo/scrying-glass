<!-- Раздел настроек «Портреты». -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'portraits'> = $props();
</script>

<div class="setting">
  <div class="info">
    <div class="name">Подписи на экране игроков</div>
    <div class="desc">Показывать имя под каждым портретом.</div>
  </div>
  <input
    type="checkbox"
    checked={ms.showNames}
    onchange={(e) => dispatch('portraits', 'setShowNames', { value: e.currentTarget.checked })}
  />
</div>

<div class="setting">
  <div class="info">
    <div class="name">Откуда берутся портреты</div>
    <div class="desc">
      Из всех папок <RoleFolderNames role="characters" /> в хранилище, на любой глубине:
      в приключении, в главе кампании, во вложенных папках. Подпись по умолчанию — имя файла
      (<code>староста_гилберт.jpg</code> → «Староста Гилберт»), её можно изменить на карточке. Файлы при этом не
      переименовываются.
    </div>
  </div>
</div>

<style>
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
