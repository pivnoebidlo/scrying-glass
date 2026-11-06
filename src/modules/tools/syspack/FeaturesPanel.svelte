<!-- The builder (the draft is changed in place, as in the other panels): what of the core the system uses (shared/features.ts). What appeared after the pack's format is marked;
     saving moves the pack to the current format. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { freshFeatures, offeredFeatures, oldUses } from '../../../shared/features';
  import type { SystemPack } from '../../../shared/syspack';

  let { pack, disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  const uses = $derived(pack.uses ?? oldUses(pack.family ?? pack.id));
  const fresh = $derived(new Set(freshFeatures(pack.format, uses).map((f) => f.id)));
  function toggle(id: string, on: boolean) {
    pack.uses = on ? [...uses, id] : uses.filter((u) => u !== id);
  }
</script>

  <p class="faint small"><Lead text={t('sb.feat.lead')} /></p>
  {#each offeredFeatures() as f (f.id)}
    <label class="feature">
      <input type="checkbox" {disabled} checked={uses.includes(f.id)} onchange={(e) => toggle(f.id, e.currentTarget.checked)} />
      <span class="text">
        <span class="name">{t(`sb.feat.${f.id}` as never)}{#if !disabled && fresh.has(f.id)}<span class="fresh">{t('sb.feat.new')}</span>{/if}</span>
        <span class="faint small">{t(`sb.feat.${f.id}.desc` as never)}</span>
      </span>
    </label>
  {/each}

<style>
  .feature {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 8px 0;
    border-top: 1px solid var(--border);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .fresh {
    margin-left: 8px;
    padding: 0 6px;
    border-radius: 8px;
    font-size: 11px;
    color: var(--on-accent);
    background: var(--accent);
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
</style>
