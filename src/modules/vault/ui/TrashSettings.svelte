<!-- Настройки корзины (раздел «Файлы»): удалять в корзину или сразу, автоочистка. Общие для всех хранилищ. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { daysTitle, loadTrash, setTrashSettings, trash, TRASH_DAYS } from './trash.svelte';

  onMount(loadTrash);
</script>

<h3>Корзина</h3>
<div class="setting">
  <div class="info">
    <div class="name">Удалённые файлы</div>
    <div class="desc">
      Куда уходят удалённые в приложении файлы, карточки, таблицы, записи и приключения. Корзина приложения — скрытая папка
      <code>.trash</code> в хранилище (и в библиотеке); вернуть оттуда можно в «Файлах» → «Корзина».
    </div>
  </div>
  <select value={trash.settings.keep ? 'trash' : 'delete'} onchange={(e) => setTrashSettings({ keep: e.currentTarget.value === 'trash' })}>
    <option value="trash">В корзину приложения</option>
    <option value="delete">Удалять сразу, без корзины</option>
  </select>
</div>
<div class="setting">
  <div class="info">
    <div class="name">Очищать корзину</div>
    <div class="desc">Что лежит в корзине дольше этого срока, удаляется насовсем — при открытии хранилища и раз в час.</div>
  </div>
  <select value={trash.settings.days} onchange={(e) => setTrashSettings({ days: Number(e.currentTarget.value) })}>
    {#each TRASH_DAYS as d (d)}<option value={d}>{daysTitle(d)}</option>{/each}
  </select>
</div>

<style>
  select {
    max-width: 240px;
  }
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
