<!-- Раздел настроек «Музыка». -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { output, refreshDevices, setSink } from './output.svelte';

  let { ms }: ModuleProps<'music'> = $props();
  let shown = $state<number | null>(null);
  const seconds = $derived(shown ?? ms.crossfade);
  refreshDevices();
  const mod = navigator.platform.startsWith('Mac') ? '⌘' : 'Ctrl+';
  // Сохранённое устройство сейчас не подключено — всё равно показываем его в списке.
  const missing = $derived(!!output.sink && !output.devices.some((d) => d.id === output.sink));
</script>

<div class="setting">
  <div class="info">
    <div class="name">Плавный переход между треками</div>
    <div class="desc">
      {seconds ? `Следующий трек начинается за ${seconds} с до конца текущего.` : 'Без перехода: треки идут встык.'}
    </div>
  </div>
  <div class="slider">
    <Slider
      value={seconds}
      min={0}
      max={10}
      step={1}
      oninput={(v) => (shown = v)}
      onchange={(v) => dispatch('music', 'setCrossfade', { seconds: v }).then(() => (shown = null))}
    />
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Устройство вывода</div>
    <div class="desc">Куда идут музыка и атмосфера: например, колонки в комнате, а не наушники. Запоминается на этом компьютере.</div>
  </div>
  <select value={output.sink} onchange={(e) => setSink(e.currentTarget.value)}>
    <option value="">Как в системе</option>
    {#each output.devices as d (d.id)}<option value={d.id}>{d.label}</option>{/each}
    {#if missing}<option value={output.sink}>Отключённое устройство</option>{/if}
  </select>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Горячие клавиши</div>
    <div class="desc">
      {mod}P — пауза и продолжение, {mod}→ / {mod}← — следующий и предыдущий трек, {mod}↑ / {mod}↓ — громкость,
      {mod}⇧A — атмосфера. {mod}B — погасить экран игроков, {mod}1…9 — сцены. Не работают, пока курсор в поле ввода.
    </div>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Где брать музыку</div>
    <div class="desc">
      Плейлист — любая папка хранилища с аудиофайлами (mp3, ogg, m4a, wav, flac); папки
      <RoleFolderNames role="music" /> подписываются по приключению или главе. Играть можно и отдельный трек из «Файлов». Звук идёт
      через устройство вывода компьютера мастера, музыка продолжает играть, даже если экран игроков закрыт.
    </div>
  </div>
</div>

<style>
  .slider {
    width: 180px;
  }
  select {
    max-width: 240px;
  }
</style>
