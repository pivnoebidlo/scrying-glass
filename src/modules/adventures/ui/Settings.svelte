<!-- Раздел настроек «Приключения»: какие ролевые системы нужны. Отключённые не предлагаются при выборе системы,
     их карточки и встроенные записи скрыты. Общие для всех хранилищ (settings.json приложения). -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { DEFAULT_SYSTEM, FAMILIES, systems } from '../../../systems';

  let { ms, app }: ModuleProps<'adventures'> = $props();

  const off = $derived(new Set(app.vault.systemsOff));
  const onCount = $derived(systems.length - off.size);

  // Что даёт система — строка под названием.
  const ABOUT: Record<string, string> = {
    'dnd5e-2024': 'Встроенные монстры и справочник SRD 5.2.1, сложность боя, покупка характеристик',
    'dnd5e-2014': 'Встроенные монстры и справочник SRD 5.1, импорт из Long Story Short',
    'fate-core': 'Аспекты, стресс и последствия в бою, кубы Fate',
  };

  // Приключения, у которых выбрана эта система ('' — всё хранилище).
  const usedBy = (id: string) =>
    Object.entries(ms.systems ?? {})
      .filter(([, s]) => s === id)
      .map(([a]) => (a ? `«${a}»` : 'всё хранилище'))
      .concat(!ms.systems?.[''] && id === DEFAULT_SYSTEM ? ['система по умолчанию'] : []);

  function toggle(id: string, on: boolean) {
    const next = on ? [...off].filter((x) => x !== id) : [...off, id];
    dispatch('vault', 'setSystemsOff', { list: next });
  }
</script>

<h3>Ролевые системы</h3>
<p class="desc faint">
  Ненужные системы можно отключить: их не будет при выборе системы приключения, а их карточки и встроенные записи
  справочника скроются. Файлы при этом не меняются, приключения с отключённой системой работают как прежде. Настройка
  общая для всех хранилищ.
</p>

{#each FAMILIES as f (f.id)}
  {#each systems.filter((s) => s.family === f.id) as s (s.id)}
    {@const on = !off.has(s.id)}
    {@const used = usedBy(s.id)}
    <label class="setting">
      <div class="info">
        <div class="name">{s.title}</div>
        <div class="desc">
          {ABOUT[s.id] ?? ''}
          {#if used.length}<div class="used">Выбрана: {used.join(', ')}</div>{/if}
        </div>
      </div>
      <input
        type="checkbox"
        checked={on}
        disabled={on && onCount <= 1}
        title={on && onCount <= 1 ? 'Хотя бы одна система должна остаться' : ''}
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
