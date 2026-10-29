<!-- Strikes in an editor (a creature's or a character's): melee or ranged, the attack bonus, traits, damage — dice
     typed as they are become rolls («1d6+2 slashing» → «{1d6+2} slashing») — and what else a hit does. -->
<script lang="ts">
  import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte';
  import { t } from '../../renderer/lib/i18n.svelte';
  import type { Strike } from './stats';

  let { strikes = $bindable() }: { strikes: Strike[] } = $props();

  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? 0 : n;
  };
  // «1d6+2 slashing» ↔ «{1d6+2} slashing»: the braces make the dice roll in the stat block.
  const plain = (s: string) => s.replace(/\{([^}]+)\}/g, '$1');
  const withDice = (s: string) => plain(s).replace(/\b(\d*d\d+(?:\s*[+-]\s*\d+)?)\b/g, (d) => `{${d.replace(/\s+/g, '')}}`);
  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j >= 0 && j < strikes.length) [strikes[i], strikes[j]] = [strikes[j]!, strikes[i]!];
  }
</script>

  {#each strikes as st, i (i)}
    <div class="block">
      <div class="head">
        <select title={t('pf2e.ed.strikeKind')} value={st.ranged ? 'r' : 'm'} onchange={(e) => (st.ranged = e.currentTarget.value === 'r')}>
          <option value="m">{t('pf2e.sb.melee')}</option>
          <option value="r">{t('pf2e.sb.ranged')}</option>
        </select>
        <input class="name" type="text" placeholder={t('pf2e.ed.strikeName')} bind:value={st.name} />
        <input class="bonus" type="text" title={t('pf2e.ed.bonus')} value={st.bonus} onchange={(e) => (st.bonus = num(e.currentTarget.value))} />
        <button type="button" class="icon-btn" title={t('pf2e.ed.up')} disabled={i === 0} onclick={() => move(i, -1)}><ArrowUp size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.down')} disabled={i === strikes.length - 1} onclick={() => move(i, 1)}><ArrowDown size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => strikes.splice(i, 1)}><Trash2 size={14} /></button>
      </div>
      <div class="grid">
        <label class="field wide"><span>{t('pf2e.ed.traits')}</span><input type="text" placeholder="agile, finesse" value={st.traits.join(', ')} onchange={(e) => (st.traits = list(e.currentTarget.value))} /></label>
        <label class="field wide"><span>{t('pf2e.sb.damage')}</span><input type="text" placeholder="1d6+2 slashing" value={plain(st.damage)} onchange={(e) => (st.damage = withDice(e.currentTarget.value))} /></label>
        <label class="field wide"><span>{t('pf2e.ed.effects')}</span><input type="text" placeholder="Grab" value={st.effects.join(', ')} onchange={(e) => (st.effects = list(e.currentTarget.value))} /></label>
      </div>
    </div>
  {/each}
  <button type="button" class="btn add" onclick={() => strikes.push({ name: '', ranged: false, bonus: 0, traits: [], damage: '', effects: [] })}><Plus size={14} /> {t('pf2e.ed.addStrike')}</button>
