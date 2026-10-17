<!-- Раздел настроек «Музыка». -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
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
    <div class="name">{t('music.crossfadeTitle')}</div>
    <div class="desc">
      {seconds ? t('music.crossfadeOn', { s: seconds }) : t('music.crossfadeOff')}
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
    <div class="name">{t('music.outputTitle')}</div>
    <div class="desc">{t('music.outputDesc')}</div>
  </div>
  <select value={output.sink} onchange={(e) => setSink(e.currentTarget.value)}>
    <option value="">{t('music.outputSystem')}</option>
    {#each output.devices as d (d.id)}<option value={d.id}>{d.label}</option>{/each}
    {#if missing}<option value={output.sink}>{t('music.outputMissing')}</option>{/if}
  </select>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('music.hotkeysTitle')}</div>
    <div class="desc">
      {t('music.hotkeysDesc', { mod })}
    </div>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('music.sourceTitle')}</div>
    <div class="desc">
      {t('music.sourceBefore')} <RoleFolderNames role="music" /> {t('music.sourceAfter')}
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
