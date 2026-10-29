<!-- Раздел настроек «Ролевые системы» (модуля приключений): какие системы нужны. Отключённые не предлагаются при выборе системы,
     их карточки и встроенные записи скрыты. Общие для всех хранилищ (settings.json приложения). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { FAMILIES, systemOf, systems } from '../../../systems';
  import { systemFor } from '../../../shared/adventures';
  import { Blocks, Globe, Trash2 } from '@lucide/svelte';
  import { openRepo } from '../../repo/ui/repo.svelte';
  import { closeSettings } from '../../../renderer/lib/nav';
  import { openBuilder } from '../../tools/syspack/store.svelte';
  import { packOf } from '../../../systems/packs';

  let { ms, app }: ModuleProps<'adventures'> = $props();

  const off = $derived(new Set(app.vault.systemsOff));
  // The list of systems changes with the packs (installed, deleted): read again with them.
  const all = $derived((app.vault.systems, [...systems]));
  const onCount = $derived(all.length - off.size);
  const own = (id: string) => app.vault.systems.some((p) => p.id === id && p.own);
  async function remove(id: string, title: string) {
    if (confirm(t('sb.deleteAsk', { name: title }))) await window.api.deleteSystem(id);
  }

  // Что даёт система — строка под названием.
  const about = (id: string) => systemOf(id).about ?? '';

  // Приключения с этой системой (своей или унаследованной от хранилища) и само хранилище.
  const usedBy = (id: string) =>
    ms.list
      .filter((a) => systemFor(ms, a) === id)
      .map((a) => `${t('common.quote', { text: a })}${off.has(id) ? t('adv.hidden') : ''}`)
      .concat(systemFor(ms, null) === id ? [t('adv.wholeVault')] : []);

  function toggle(id: string, on: boolean) {
    const next = on ? [...off].filter((x) => x !== id) : [...off, id];
    dispatch('vault', 'setSystemsOff', { list: next });
  }
</script>

<p class="desc faint">
  {t('adv.systemsDesc')}
</p>
<div class="builder">
  <span class="faint">{t('adv.builderDesc')}</span>
  <span class="buttons">
    <button class="btn" onclick={() => (closeSettings(), openRepo('all', 'systems'))}><Globe size={14} /> {t('adv.findSystems')}</button>
    <button class="btn" onclick={() => (closeSettings(), openBuilder())}><Blocks size={14} /> {t('sb.title')}</button>
  </span>
</div>

{#each FAMILIES as f (f.id)}
  {#each all.filter((s) => s.family === f.id) as s (s.id)}
    {@const on = !off.has(s.id)}
    {@const used = usedBy(s.id)}
    <label class="setting">
      <div class="info">
        <div class="name">
          {s.title}
          {#if packOf(s.id)}<button class="link" onclick={(e) => (e.preventDefault(), closeSettings(), openBuilder(s.id))}>{t('adv.openInBuilder')}</button>{/if}
          {#if own(s.id)}
            <button class="icon-btn del" title={t('adv.deleteSystem')} onclick={(e) => (e.preventDefault(), remove(s.id, s.title))}><Trash2 size={13} /></button>
          {/if}
        </div>
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
  .builder {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 12px;
    font-size: 13px;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .del {
    margin-left: 4px;
    vertical-align: middle;
  }
  .link {
    margin-left: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font-size: 12px;
    cursor: pointer;
  }
</style>
