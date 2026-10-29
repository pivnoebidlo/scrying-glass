<!-- Spellcasting in an editor: the name, DC and spell attack, spells by rank (cantrips — 0, constant, slots). -->
<script lang="ts">
  import { Plus, Trash2 } from '@lucide/svelte';
  import { t } from '../../renderer/lib/i18n.svelte';
  import type { Spellcasting } from './stats';

  let { spellcasting = $bindable(), level }: { spellcasting: Spellcasting[]; level: number } = $props();

  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? 0 : n;
  };
</script>

  {#each spellcasting as sc, i (i)}
    <div class="block">
      <div class="head">
        <input class="name" type="text" placeholder="Arcane Prepared Spells" bind:value={sc.name} />
        <label class="mini">{t('pf2e.sb.dc')} <input class="bonus" type="number" bind:value={sc.dc} /></label>
        <label class="mini">{t('pf2e.sb.attack')} <input class="bonus" type="text" value={sc.attack ?? ''} onchange={(e) => (sc.attack = e.currentTarget.value.trim() ? num(e.currentTarget.value) : null)} /></label>
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => spellcasting.splice(i, 1)}><Trash2 size={14} /></button>
      </div>
      {#each sc.ranks as r, j (j)}
        <div class="rank">
          <input class="bonus" type="number" min="0" max="10" title={t('pf2e.ed.rankHint')} bind:value={r.rank} />
          <label class="mini"><input type="checkbox" checked={!!r.constant} onchange={(e) => (e.currentTarget.checked ? (r.constant = true) : delete r.constant)} /> {t('pf2e.sb.constant')}</label>
          <input class="bonus" type="text" placeholder={t('pf2e.ed.slots')} value={r.slots ?? ''} onchange={(e) => (e.currentTarget.value.trim() ? (r.slots = num(e.currentTarget.value)) : delete r.slots)} />
          <input class="spells" type="text" placeholder="fireball, haste" value={r.spells.join(', ')} onchange={(e) => (r.spells = list(e.currentTarget.value))} />
          <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => sc.ranks.splice(j, 1)}><Trash2 size={12} /></button>
        </div>
      {/each}
      <button type="button" class="btn" onclick={() => sc.ranks.push({ rank: (sc.ranks.at(-1)?.rank ?? 2) - 1 < 0 ? 0 : (sc.ranks.at(-1)?.rank ?? 2) - 1, spells: [] })}><Plus size={14} /> {t('pf2e.ed.addRank')}</button>
    </div>
  {/each}
  <button type="button" class="btn add" onclick={() => spellcasting.push({ name: '', dc: 15 + level, attack: 7 + level, ranks: [{ rank: 1, spells: [] }] })}><Plus size={14} /> {t('pf2e.ed.addSpells')}</button>
