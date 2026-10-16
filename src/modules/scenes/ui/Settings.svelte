<!-- Раздел настроек «Сцены». -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'scenes'> = $props();
  const mod = navigator.platform.startsWith('Mac') ? '⌘' : 'Ctrl+';
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('scenes.fadeTitle')}</div>
    <div class="desc">{t('scenes.fadeDesc')}</div>
  </div>
  <input type="checkbox" checked={ms.throughBlack} onchange={(e) => dispatch('scenes', 'setThroughBlack', { value: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('scenes.hotkeysTitle')}</div>
    <div class="desc">{t('scenes.hotkeysDesc', { mod })}</div>
  </div>
</div>
