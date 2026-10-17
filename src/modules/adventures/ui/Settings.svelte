<!-- Раздел настроек «Приключения»: какие ролевые системы нужны. Отключённые не предлагаются при выборе системы,
     их карточки и встроенные записи скрыты. Общие для всех хранилищ (settings.json приложения). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { FAMILIES, systems } from '../../../systems';
  import { systemFor } from '../../../shared/adventures';

  let { ms, app }: ModuleProps<'adventures'> = $props();

  const off = $derived(new Set(app.vault.systemsOff));
  const onCount = $derived(systems.length - off.size);

  // Что даёт система — строка под названием.
  const about = (id: string) => (['dnd5e-2024', 'dnd5e-2014', 'fate-core'].includes(id) ? t(`adv.about.${id as 'fate-core'}`) : '');

  // Приключения с этой системой (своей или унаследованной от хранилища) и само хранилище.
  const usedBy = (id: string) =>
    ms.list
      .filter((a) => systemFor(ms, a) === id)
      .map((a) => `«${a}»${off.has(id) ? t('adv.hidden') : ''}`)
      .concat(systemFor(ms, null) === id ? [t('adv.wholeVault')] : []);

  function toggle(id: string, on: boolean) {
    const next = on ? [...off].filter((x) => x !== id) : [...off, id];
    dispatch('vault', 'setSystemsOff', { list: next });
  }
</script>

<h3>{t('adv.systems')}</h3>
<p class="desc faint">
  {t('adv.systemsDesc')}
</p>

{#each FAMILIES as f (f.id)}
  {#each systems.filter((s) => s.family === f.id) as s (s.id)}
    {@const on = !off.has(s.id)}
    {@const used = usedBy(s.id)}
    <label class="setting">
      <div class="info">
        <div class="name">{s.title}</div>
        <div class="desc">
          {about(s.id)}
          {#if used.length}<div class="used">{t('adv.usedBy', { list: used.join(', ') })}</div>{/if}
        </div>
      </div>
      <input
        type="checkbox"
        checked={on}
        disabled={on && onCount <= 1}
        title={on && onCount <= 1 ? t('adv.keepOne') : ''}
        onchange={(e) => toggle(s.id, e.currentTarget.checked)}
      />
    </label>
  {/each}
{/each}

<style>
  .desc {
    margin: 0 0 12px;
    font-size: 13px;
  }
  .setting .desc {
    margin: 0;
  }
  label.setting {
    cursor: pointer;
  }
  .used {
    color: var(--text-faint);
  }
</style>
