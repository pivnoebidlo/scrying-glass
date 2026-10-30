<!-- Раздел настроек «Инициатива»: как выглядит полоса очерёдности на экране игроков. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { StripPosition } from '../types';

  let { ms }: ModuleProps<'initiative'> = $props();
  const d = $derived(ms.display);
  let size = $state(0);
  $effect.pre(() => {
    size = d.size;
  });
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('init.portraitSize')}</div>
    <div class="desc">{t('init.portraitSizeDesc', { n: size.toFixed(1) })}</div>
  </div>
  <div class="slider">
    <Slider value={size} min={0.8} max={3} step={0.1} oninput={(v) => (size = v)} onchange={(v) => dispatch('initiative', 'setDisplay', { size: v })} />
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('init.stripPos')}</div>
    <div class="desc">{t('init.stripPosDesc')}</div>
  </div>
  <select value={d.position ?? 'top'} onchange={(e) => dispatch('initiative', 'setDisplay', { position: e.currentTarget.value as StripPosition })}>
    <option value="top">{t('init.top')}</option>
    <option value="bottom">{t('init.bottom')}</option>
    <option value="left">{t('init.left')}</option>
    <option value="right">{t('init.right')}</option>
  </select>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('init.names')}</div>
    <div class="desc">{t('init.namesDesc')}</div>
  </div>
  <input type="checkbox" checked={d.names} onchange={(e) => dispatch('initiative', 'setDisplay', { names: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('init.wounds')}</div>
    <div class="desc">
      <Lead text={t('init.woundsDesc')} />
    </div>
  </div>
  <input type="checkbox" checked={d.wounds} onchange={(e) => dispatch('initiative', 'setDisplay', { wounds: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('init.ringColor')}</div>
    <div class="desc">
      <span class="sw" style:--c="#e8b94a"></span> {t('init.ringParty')} · <span class="sw" style:--c="#4f8de8"></span> {t('init.ringAlly')} ·
      <span class="sw" style:--c="#9aa0a8"></span> {t('init.ringNeutral')} · <span class="sw" style:--c="#e04545"></span> {t('init.ringEnemy')}. {t('init.ringTurn')}
    </div>
  </div>
</div>

<style>
  .slider {
    width: 220px;
  }
  .sw {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid var(--c);
    border-radius: 50%;
    vertical-align: -1px;
  }
</style>
