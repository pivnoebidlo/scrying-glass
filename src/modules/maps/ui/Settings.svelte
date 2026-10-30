<!-- Раздел настроек «Карты». -->
<script lang="ts">
  import HelpTip from '../../../renderer/lib/HelpTip.svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { modKey } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
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
    <div class="name">{t('maps.fogTitle')}</div>
    <div class="desc">
      {ms.defaultFog === 'hidden'
        ? t('maps.fogHidden')
        : t('maps.fogRevealed')}
    </div>
  </div>
  <select value={ms.defaultFog} onchange={(e) => dispatch('maps', 'setDefaultFog', { value: e.currentTarget.value as 'hidden' | 'revealed' })}>
    <option value="hidden">{t('maps.hidden')}</option>
    <option value="revealed">{t('maps.revealed')}</option>
  </select>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('maps.pinSizeTitle')}</div>
    <div class="desc">{t('maps.pinSizeDesc')}</div>
  </div>
  <div class="size">
    <Slider value={size} min={0.5} max={3} step={0.1} oninput={(v) => (size = v)} onchange={(v) => dispatch('maps', 'setPinSize', { value: v })} />
    <span class="faint">{Math.round(size * 100)}%</span>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('maps.controlsTitle')}</div>
    <div class="desc">
      <Lead text={t('maps.controlsDesc', { mod: modKey() })} />
    </div>
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">
      {t('maps.sourceTitle')}
      <HelpTip>{t('maps.sourceBefore')} <RoleFolderNames role="maps" /> {t('maps.sourceAfter')}</HelpTip>
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
