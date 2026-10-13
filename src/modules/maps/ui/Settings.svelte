<!-- Раздел настроек «Карты». -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'maps'> = $props();
  const pinSize = $derived(ms.pinSize);
  let size = $state(1);
  $effect.pre(() => {
    size = pinSize;
  });
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
    <div class="name">Размер меток у игроков</div>
    <div class="desc">Метки и их названия на экране игроков. Показываются только метки, отмеченные «игрокам».</div>
  </div>
  <div class="size">
    <Slider value={size} min={0.5} max={3} step={0.1} oninput={(v) => (size = v)} onchange={(v) => dispatch('maps', 'setPinSize', { value: v })} />
    <span class="faint">{Math.round(size * 100)}%</span>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Управление в редакторе</div>
    <div class="desc">
      Колесо мыши или щипок на тачпаде — масштаб. Пробел или средняя кнопка мыши — двигать карту. ⌘Z — отменить
      последнее изменение тумана. Метки: инструмент с булавкой — щелчок ставит метку, её можно перетащить;
      Delete удаляет выбранную, Esc снимает выбор. Рамка показывает, что видят игроки: её можно двигать инструментом «область игроков»
      или кнопками «Вся карта» и «Как у меня».
    </div>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Где брать карты</div>
    <div class="desc">
      Из папок <RoleFolderNames role="maps" /> на любой глубине хранилища. Любую другую картинку можно показать
      как карту кнопкой на её карточке. Туман и обзор каждой карты сохраняются: карту можно подготовить заранее.
    </div>
  </div>
</div>

<style>
  .size {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 180px;
    font-size: 12px;
  }
</style>
