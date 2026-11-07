<!-- What the GM can hide: tabs, blocks of the right panel, tools of the systems that are on. Settings → Parts of the app
     and the first launch. -->
<script lang="ts">
  import { dispatch, store } from '../lib/store.svelte';
  import { t } from '../lib/i18n.svelte';
  import { controlContributions } from '../lib/registry';
  import { isOff, switched, toolPart } from '../../shared/parts';
  import { enabledSystems } from '../../systems';
  import { TOOLS } from '../../modules/tools/ui/registry.svelte';
  import { workspace } from './workspace.svelte';
  import type { ModuleId } from '../../shared/types';

  const off = $derived(store.state.vault.partsOff);
  const optional = controlContributions.filter((c) => c.optional);
  const groups = $derived.by(() => {
    const families = new Set(enabledSystems().map((s) => s.family));
    const modules = (fits: (c: (typeof optional)[number]) => boolean) => optional.filter(fits).map((c) => ({ id: c.id as string, title: c.title, module: c.id }));
    return [
      { title: t('parts.tabs'), items: modules((c) => !!c.view) },
      { title: t('parts.panel'), items: modules((c) => !c.view && !!c.screen) },
      { title: t('parts.other'), items: modules((c) => !c.view && !c.screen) },
      {
        title: t('parts.tools'),
        // A tool of its own module (Telegram, the timer) follows the module.
        items: TOOLS.filter((d) => !optional.some((c) => c.id === (d.id as string)) && (!d.families || d.families.some((f) => families.has(f)))).map((d) => ({
          id: toolPart(d.id),
          title: d.title,
          module: undefined,
        })),
      },
    ].filter((g) => g.items.length);
  });

  function set(id: string, on: boolean, module?: ModuleId) {
    dispatch('vault', 'setPartsOff', { list: switched($state.snapshot(off), id, on) });
    if (!on && module) workspace.hide(module);
  }
</script>

<div class="parts">
  {#each groups as g (g.title)}
    <section>
      <h3>{g.title}</h3>
      <div class="list">
        {#each g.items as p (p.id)}
          <label class="check"><input type="checkbox" checked={!isOff(off, p.id)} onchange={(e) => set(p.id, e.currentTarget.checked, p.module)} /> {p.title}</label>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  section {
    margin-bottom: 14px;
  }
  h3 {
    margin: 0 0 6px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 4px 12px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
</style>
