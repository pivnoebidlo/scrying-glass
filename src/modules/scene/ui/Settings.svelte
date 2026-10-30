<!-- Раздел настроек «Фон». -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'scene'> = $props();
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('scene.dimTitle')}</div>
    <div class="desc">{t('scene.dimDesc')}</div>
  </div>
  <input type="checkbox" checked={ms.dim} onchange={(e) => dispatch('scene', 'setDim', { value: e.currentTarget.checked })} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('scene.howTitle')}</div>
    <div class="desc">
      <Lead text={t('scene.howDesc')} />
    </div>
  </div>
</div>
