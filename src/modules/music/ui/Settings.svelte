<!-- Раздел настроек «Музыка». -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'music'> = $props();
  let shown = $state<number | null>(null);
  const seconds = $derived(shown ?? ms.crossfade);
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
</style>
