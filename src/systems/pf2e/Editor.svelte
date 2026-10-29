<!-- The editor of a Pathfinder 2e creature, in the order of the stat block. Lists are typed with commas; dice in a
     damage («1d6+2 slashing») become rolls by themselves. Labels — in the interface language. -->
<script lang="ts">
  import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte';
  import { markdownKeys } from '../../renderer/lib/markdownKeys';
  import { t } from '../../renderer/lib/i18n.svelte';
  import { ABILITIES, SIZES, type ActionCost, type Feature, type Pf2eStats } from './stats';

  let { stats = $bindable() }: { stats: Pf2eStats; system?: string; lang?: string } = $props();

  const RARITIES = ['common', 'uncommon', 'rare', 'unique'] as const;
  const COSTS: { v: string; label: string }[] = [
    { v: '', label: '—' },
    { v: '1', label: '◆' },
    { v: '2', label: '◆◆' },
    { v: '3', label: '◆◆◆' },
    { v: 'reaction', label: '⟲' },
    { v: 'free', label: '◇' },
  ];

  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? 0 : n;
  };
  const costOf = (v: string): ActionCost => (v === '' ? null : v === 'reaction' || v === 'free' ? v : (Number(v) as 1 | 2 | 3));
  // «1d6+2 slashing» ↔ «{1d6+2} slashing»: the braces make the dice roll in the stat block.
  const plain = (s: string) => s.replace(/\{([^}]+)\}/g, '$1');
  const withDice = (s: string) => plain(s).replace(/\b(\d*d\d+(?:\s*[+-]\s*\d+)?)\b/g, (d) => `{${d.replace(/\s+/g, '')}}`);

  function move<T>(arr: T[], i: number, d: -1 | 1) {
    const j = i + d;
    if (j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  const rows = (s: string) => Math.min(12, Math.max(2, Math.ceil(s.length / 70) + (s.match(/\n/g)?.length ?? 0)));
  const blankFeature = (): Feature => ({ name: '', actions: null, traits: [], text: '' });
</script>

{#snippet features(arr: Feature[], add: string)}
  {#each arr as f, i (i)}
    <div class="block">
      <div class="head">
        <input class="name" type="text" placeholder={t('pf2e.ed.name')} bind:value={f.name} />
        <select title={t('pf2e.ed.actions')} value={f.actions === null ? '' : String(f.actions)} onchange={(e) => (f.actions = costOf(e.currentTarget.value))}>
          {#each COSTS as c (c.v)}<option value={c.v}>{c.label}</option>{/each}
        </select>
        <input class="traits" type="text" placeholder={t('pf2e.ed.traits')} value={f.traits.join(', ')} onchange={(e) => (f.traits = list(e.currentTarget.value))} />
        <button type="button" class="icon-btn" title={t('pf2e.ed.up')} disabled={i === 0} onclick={() => move(arr, i, -1)}><ArrowUp size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.down')} disabled={i === arr.length - 1} onclick={() => move(arr, i, 1)}><ArrowDown size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => arr.splice(i, 1)}><Trash2 size={14} /></button>
      </div>
      <textarea use:markdownKeys rows={rows(f.text)} placeholder={t('pf2e.ed.textPh')} bind:value={f.text}></textarea>
    </div>
  {/each}
  <button type="button" class="btn add" onclick={() => arr.push(blankFeature())}><Plus size={14} /> {add}</button>
{/snippet}

<section>
  <h4>{t('pf2e.ed.basics')}</h4>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.ed.level')}</span><input type="number" min="-1" max="25" bind:value={stats.level} /></label>
    <label class="field">
      <span>{t('pf2e.ed.rarity')}</span>
      <select bind:value={stats.rarity}>{#each RARITIES as r (r)}<option value={r}>{t(`pf2e.rarity.${r}`)}</option>{/each}</select>
    </label>
    <label class="field">
      <span>{t('pf2e.ed.size')}</span>
      <select bind:value={stats.size}>{#each SIZES as s (s)}<option value={s}>{t(`pf2e.size.${s}`)}</option>{/each}</select>
    </label>
    <label class="field wide"><span>{t('pf2e.ed.traits')}</span><input type="text" placeholder="goblin, humanoid" value={stats.traits.join(', ')} onchange={(e) => (stats.traits = list(e.currentTarget.value))} /></label>
  </div>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.sb.perception')}</span><input type="text" value={stats.perception} onchange={(e) => (stats.perception = num(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.ed.senses')}</span><input type="text" placeholder="darkvision, scent (imprecise) 30 feet" value={stats.senses.join(', ')} onchange={(e) => (stats.senses = list(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.sb.languages')}</span><input type="text" placeholder="Common, Goblin" value={stats.languages.join(', ')} onchange={(e) => (stats.languages = list(e.currentTarget.value))} /></label>
  </div>
</section>

<section>
  <h4>{t('pf2e.sb.skills')}</h4>
  <div class="chips">
    {#each stats.skills as sk, i (i)}
      <span class="chip">
        <input class="sk-name" type="text" placeholder={t('pf2e.ed.skill')} bind:value={sk.name} />
        <input class="sk-mod" type="text" value={sk.mod} onchange={(e) => (sk.mod = num(e.currentTarget.value))} />
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => stats.skills.splice(i, 1)}><Trash2 size={12} /></button>
      </span>
    {/each}
    <button type="button" class="btn" onclick={() => stats.skills.push({ name: '', mod: 0 })}><Plus size={14} /> {t('pf2e.ed.addSkill')}</button>
  </div>
</section>

<section>
  <h4>{t('pf2e.ed.abilities')}</h4>
  <div class="abilities">
    {#each ABILITIES as a (a)}
      <label class="ability"><span class="abbr">{t(`pf2e.ab.${a}`)}</span><input type="text" value={stats.abilities[a]} onchange={(e) => (stats.abilities[a] = num(e.currentTarget.value))} /></label>
    {/each}
  </div>
  <label class="field wide one"><span>{t('pf2e.sb.items')}</span><input type="text" placeholder="dogslicer, shortbow, leather armor" value={stats.items.join(', ')} onchange={(e) => (stats.items = list(e.currentTarget.value))} /></label>
  {@render features(stats.interaction, t('pf2e.ed.addInteraction'))}
</section>

<section>
  <h4>{t('pf2e.ed.defense')}</h4>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.sb.ac')}</span><input type="number" bind:value={stats.ac} /></label>
    <label class="field small"><span>{t('pf2e.sb.fort')}</span><input type="text" value={stats.saves.fort} onchange={(e) => (stats.saves.fort = num(e.currentTarget.value))} /></label>
    <label class="field small"><span>{t('pf2e.sb.ref')}</span><input type="text" value={stats.saves.ref} onchange={(e) => (stats.saves.ref = num(e.currentTarget.value))} /></label>
    <label class="field small"><span>{t('pf2e.sb.will')}</span><input type="text" value={stats.saves.will} onchange={(e) => (stats.saves.will = num(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.ed.saveNote')}</span><input type="text" placeholder="+1 status to all saves vs. magic" value={stats.saves.note ?? ''} onchange={(e) => (e.currentTarget.value.trim() ? (stats.saves.note = e.currentTarget.value.trim()) : delete stats.saves.note)} /></label>
  </div>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.sb.hp')}</span><input type="number" bind:value={stats.hp} /></label>
    <label class="field wide"><span>{t('pf2e.ed.hpNote')}</span><input type="text" placeholder="regeneration 10 (deactivated by fire)" value={stats.hpNote ?? ''} onchange={(e) => (e.currentTarget.value.trim() ? (stats.hpNote = e.currentTarget.value.trim()) : delete stats.hpNote)} /></label>
  </div>
  <div class="grid">
    <label class="field wide"><span>{t('pf2e.sb.immunities')}</span><input type="text" placeholder="fire, paralyzed" value={stats.immunities.join(', ')} onchange={(e) => (stats.immunities = list(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.sb.weaknesses')}</span><input type="text" placeholder="cold iron 5" value={stats.weaknesses.join(', ')} onchange={(e) => (stats.weaknesses = list(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.sb.resistances')}</span><input type="text" placeholder="physical 3 (except silver)" value={stats.resistances.join(', ')} onchange={(e) => (stats.resistances = list(e.currentTarget.value))} /></label>
  </div>
  {@render features(stats.defensive, t('pf2e.ed.addDefensive'))}
</section>

<section>
  <h4>{t('pf2e.ed.offense')}</h4>
  <label class="field wide one"><span>{t('pf2e.sb.speed')}</span><input type="text" placeholder="25 feet, climb 20 feet" value={stats.speeds.join(', ')} onchange={(e) => (stats.speeds = list(e.currentTarget.value))} /></label>
  {#each stats.strikes as st, i (i)}
    <div class="block">
      <div class="head">
        <select title={t('pf2e.ed.strikeKind')} value={st.ranged ? 'r' : 'm'} onchange={(e) => (st.ranged = e.currentTarget.value === 'r')}>
          <option value="m">{t('pf2e.sb.melee')}</option>
          <option value="r">{t('pf2e.sb.ranged')}</option>
        </select>
        <input class="name" type="text" placeholder={t('pf2e.ed.strikeName')} bind:value={st.name} />
        <input class="bonus" type="text" title={t('pf2e.ed.bonus')} value={st.bonus} onchange={(e) => (st.bonus = num(e.currentTarget.value))} />
        <button type="button" class="icon-btn" title={t('pf2e.ed.up')} disabled={i === 0} onclick={() => move(stats.strikes, i, -1)}><ArrowUp size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.down')} disabled={i === stats.strikes.length - 1} onclick={() => move(stats.strikes, i, 1)}><ArrowDown size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => stats.strikes.splice(i, 1)}><Trash2 size={14} /></button>
      </div>
      <div class="grid">
        <label class="field wide"><span>{t('pf2e.ed.traits')}</span><input type="text" placeholder="agile, finesse" value={st.traits.join(', ')} onchange={(e) => (st.traits = list(e.currentTarget.value))} /></label>
        <label class="field wide"><span>{t('pf2e.sb.damage')}</span><input type="text" placeholder="1d6+2 slashing" value={plain(st.damage)} onchange={(e) => (st.damage = withDice(e.currentTarget.value))} /></label>
        <label class="field wide"><span>{t('pf2e.ed.effects')}</span><input type="text" placeholder="Grab" value={st.effects.join(', ')} onchange={(e) => (st.effects = list(e.currentTarget.value))} /></label>
      </div>
    </div>
  {/each}
  <button type="button" class="btn add" onclick={() => stats.strikes.push({ name: '', ranged: false, bonus: 0, traits: [], damage: '', effects: [] })}><Plus size={14} /> {t('pf2e.ed.addStrike')}</button>

  {#each stats.spellcasting as sc, i (i)}
    <div class="block">
      <div class="head">
        <input class="name" type="text" placeholder="Arcane Prepared Spells" bind:value={sc.name} />
        <label class="mini">{t('pf2e.sb.dc')} <input class="bonus" type="number" bind:value={sc.dc} /></label>
        <label class="mini">{t('pf2e.sb.attack')} <input class="bonus" type="text" value={sc.attack ?? ''} onchange={(e) => (sc.attack = e.currentTarget.value.trim() ? num(e.currentTarget.value) : null)} /></label>
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => stats.spellcasting.splice(i, 1)}><Trash2 size={14} /></button>
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
  <button type="button" class="btn add" onclick={() => stats.spellcasting.push({ name: '', dc: 15 + stats.level, attack: 7 + stats.level, ranks: [{ rank: 1, spells: [] }] })}><Plus size={14} /> {t('pf2e.ed.addSpells')}</button>

  {@render features(stats.offensive, t('pf2e.ed.addOffensive'))}
</section>

<style>
  section {
    margin-bottom: 14px;
  }
  h4 {
    margin: 0 0 6px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 110px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .field.small {
    width: 80px;
    min-width: 0;
  }
  .field.wide {
    flex: 1;
    min-width: 180px;
  }
  .field.one {
    margin-bottom: 8px;
  }
  .abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 8px;
  }
  .ability {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .abbr {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .ability input {
    width: 100%;
    min-width: 0;
    text-align: center;
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 2px 2px 6px;
    border-radius: var(--radius-s);
    background: var(--bg-active);
  }
  .sk-name {
    width: 110px;
  }
  .sk-mod,
  .bonus {
    width: 52px;
    text-align: center;
  }
  .block {
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .head,
  .rank {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .head .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .head .traits,
  .rank .spells {
    flex: 1;
    min-width: 0;
  }
  .mini {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
  }
  textarea {
    width: 100%;
  }
  .add {
    margin-bottom: 8px;
  }
</style>
