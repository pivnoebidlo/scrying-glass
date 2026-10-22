<!-- Forged in the Dark card editor: who they are, action dots (a click on a dot sets the rating, on the last one — one
     less), stress and traumas, harm, abilities, gear. -->
<script lang="ts">
  import { markdownKeys } from '../../renderer/lib/markdownKeys';
  import { t } from '../../renderer/lib/i18n.svelte';
  import { Plus, X } from '@lucide/svelte';
  import {
    ACTION_TITLES, ACTIONS, ATTRIBUTE_TITLES, ATTRIBUTES, attributeRating, dots, HARM_LEVELS, HARM_TITLES, MAX_DOTS, MAX_STRESS, MAX_TRAUMA,
    TRAUMA_TITLES, TRAUMAS, type FitdStats,
  } from './stats';

  let { stats = $bindable() }: { stats: FitdStats; system: string } = $props();

  const setDots = (a: string, n: number) => (stats.actions[a] = dots(stats, a) === n ? n - 1 : n);
  const int = (v: string, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
  function toggleTrauma(x: string) {
    stats.traumas = stats.traumas.includes(x) ? stats.traumas.filter((y) => y !== x) : stats.traumas.length < MAX_TRAUMA ? [...stats.traumas, x] : stats.traumas;
  }
</script>

<section>
  <h4>{t('fitd.who')}</h4>
  <div class="grid">
    <label class="field"><span>{t('fitd.playbook')}</span><input type="text" bind:value={stats.playbook} placeholder={t('fitd.playbookPh')} /></label>
    <label class="field"><span>{t('fitd.heritage')}</span><input type="text" bind:value={stats.heritage} /></label>
    <label class="field"><span>{t('fitd.background')}</span><input type="text" bind:value={stats.background} /></label>
    <label class="field"><span>{t('fitd.vice')}</span><input type="text" bind:value={stats.vice} /></label>
    <label class="field small" title={t('fitd.tierHint')}><span>{t('fitd.tier')}</span><input type="number" min="0" max="5" value={stats.tier} onchange={(e) => (stats.tier = int(e.currentTarget.value, 0, 5))} /></label>
  </div>
</section>

<section>
  <h4>{t('fitd.actions')}</h4>
  <div class="attrs">
    {#each ATTRIBUTES as a (a)}
      <div class="attr">
        <div class="lbl">{ATTRIBUTE_TITLES[a]} · {attributeRating(stats, a)}</div>
        {#each ACTIONS[a] as x (x)}
          <div class="action">
            <span class="dots">
              {#each { length: MAX_DOTS } as _, i (i)}
                <button type="button" class:on={i < dots(stats, x)} aria-label="{ACTION_TITLES[x]} {i + 1}" onclick={() => setDots(x, i + 1)}></button>
              {/each}
            </span>
            <span>{ACTION_TITLES[x]}</span>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</section>

<section>
  <h4>{t('fitd.stressAndHarm')}</h4>
  <div class="grid">
    <label class="field small"><span>{t('fitd.stress')}</span><input type="number" min="0" max={MAX_STRESS} value={stats.stress} onchange={(e) => (stats.stress = int(e.currentTarget.value, 0, MAX_STRESS))} /></label>
    <label class="check"><input type="checkbox" bind:checked={stats.armor} /> {t('fitd.armor')}</label>
  </div>
  <div class="lbl">{t('fitd.trauma')} ({stats.traumas.length}/{MAX_TRAUMA})</div>
  <div class="chips">
    {#each TRAUMAS as x (x)}
      <button type="button" class="chip" class:on={stats.traumas.includes(x)} onclick={() => toggleTrauma(x)}>{TRAUMA_TITLES[x]}</button>
    {/each}
  </div>
  <div class="rows harm">
    {#each HARM_LEVELS as level, i (i)}
      <label class="row"><span class="lbl">{level} · {HARM_TITLES[level]}</span><input type="text" bind:value={stats.harm[i]} placeholder={t('fitd.harmPh')} /></label>
    {/each}
  </div>
</section>

<section>
  <h4>{t('fitd.abilities')}</h4>
  <div class="rows">
    {#each stats.abilities as ab, i (i)}
      <div class="ability">
        <div class="pair">
          <input type="text" bind:value={ab.name} placeholder={t('fitd.abilityName')} />
          <button type="button" class="icon-btn" title={t('fitd.remove')} onclick={() => stats.abilities.splice(i, 1)}><X size={14} /></button>
        </div>
        <textarea rows="2" bind:value={ab.text} use:markdownKeys></textarea>
      </div>
    {/each}
  </div>
  <button type="button" class="btn add" onclick={() => stats.abilities.push({ name: '', text: '' })}><Plus size={14} /> {t('fitd.addAbility')}</button>
</section>

<section>
  <h4>{t('fitd.items')}</h4>
  <textarea rows="3" value={stats.items.join('\n')} placeholder={t('fitd.itemsPh')} onchange={(e) => (stats.items = e.currentTarget.value.split('\n').map((x) => x.trim()).filter(Boolean))}></textarea>
  <div class="grid">
    <label class="field small"><span>{t('fitd.coin')}</span><input type="number" min="0" value={stats.coin} onchange={(e) => (stats.coin = int(e.currentTarget.value, 0, 99))} /></label>
    <label class="field small"><span>{t('fitd.stash')}</span><input type="number" min="0" value={stats.stash} onchange={(e) => (stats.stash = int(e.currentTarget.value, 0, 99))} /></label>
    <label class="field small"><span>{t('fitd.xp')}</span><input type="number" min="0" value={stats.xp} onchange={(e) => (stats.xp = int(e.currentTarget.value, 0, 99))} /></label>
  </div>
</section>

<style>
  section {
    margin-bottom: 18px;
  }
  h4 {
    margin: 0 0 8px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin: 8px 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 160px;
  }
  .field.small {
    width: 70px;
  }
  .field > span:first-child,
  .lbl {
    color: var(--text-faint);
    font-size: 11px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 6px;
  }
  .attrs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .attr {
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .dots {
    display: inline-flex;
    gap: 3px;
  }
  .dots button {
    width: 12px;
    height: 12px;
    padding: 0;
    border: 1px solid var(--text-muted);
    border-radius: 50%;
    background: none;
    cursor: pointer;
  }
  .dots button.on {
    border-color: var(--accent);
    background: var(--accent);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 4px 0 10px;
  }
  .chip {
    padding: 2px 9px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 130px 1fr;
    align-items: center;
    gap: 8px;
  }
  .ability {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pair {
    display: flex;
    gap: 4px;
  }
  .pair > input {
    flex: 1;
    min-width: 0;
  }
  textarea {
    width: 100%;
    resize: vertical;
    font: inherit;
  }
  .add {
    margin-top: 8px;
  }
</style>
