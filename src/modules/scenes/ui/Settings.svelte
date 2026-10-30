<!-- Раздел настроек «Сцены». -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { hotkeyLabel } from '../../../shared/hotkeys';

  let { ms }: ModuleProps<'scenes'> = $props();
  const keys = $derived(hotkeyLabel('scene'));
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('scenes.fadeTitle')}</div>
    <div class="desc"><Lead text={t('scenes.fadeDesc')} /></div>
  </div>
  <input type="checkbox" checked={ms.throughBlack} onchange={(e) => dispatch('scenes', 'setThroughBlack', { value: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('scenes.hotkeysTitle')}</div>
    <div class="desc"><Lead text={t('scenes.hotkeysDesc', { keys })} /></div>
  </div>
</div>
