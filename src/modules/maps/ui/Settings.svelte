<!-- Раздел настроек «Карты». -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'maps'> = $props();
</script>

<div class="setting">
  <div class="info">
    <div class="name">Туман на новой карте</div>
    <div class="desc">
      {ms.defaultFog === 'hidden'
        ? 'Карта скрыта целиком: игроки видят только то, что вы откроете.'
        : 'Карта открыта целиком: туман можно добавить кистью.'}
    </div>
  </div>
  <select value={ms.defaultFog} onchange={(e) => dispatch('maps', 'setDefaultFog', { value: e.currentTarget.value as 'hidden' | 'revealed' })}>
    <option value="hidden">Скрыта</option>
    <option value="revealed">Открыта</option>
  </select>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Управление в редакторе</div>
    <div class="desc">
      Колесо мыши или щипок на тачпаде — масштаб. Пробел или средняя кнопка мыши — двигать карту. ⌘Z — отменить
      последнее изменение тумана. Рамка показывает, что видят игроки: её можно двигать инструментом «область игроков»
      или кнопками «Вся карта» и «Как у меня».
    </div>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Где брать карты</div>
    <div class="desc">
      Из папок <code>maps</code> и <code>карты</code> на любой глубине хранилища. Любую другую картинку можно показать
      как карту кнопкой на её карточке. Туман и обзор каждой карты сохраняются: карту можно подготовить заранее.
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
