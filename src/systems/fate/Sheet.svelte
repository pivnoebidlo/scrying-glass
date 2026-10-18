<!-- Карточка Fate Core: аспекты, пирамида навыков (щелчок — бросок 4dF + навык), трюки, стресс и последствия.
     Один вид для персонажей игроков и NPC. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { Dices } from '@lucide/svelte';
  import type { Card } from '../../shared/cards';
  import { escape, markdown } from '../../renderer/lib/markdown';
  import { rolls } from '../../renderer/lib/rolls.svelte';
  import { consequencesOf, pyramid, signed, stepTitle, stressOf, TIERS, type FateStats } from './stats';
  import { CONSEQUENCE_TITLES, trackTitle } from './tracker';

  let { card }: { card: Card<FateStats> } = $props();

  const s = $derived(card.stats);
  const steps = $derived(pyramid(s));
  const stress = $derived(stressOf(s));
  const consequences = $derived(consequencesOf(s));
  const meta = $derived(
    [card.kind === 'character' ? '' : TIERS[s.tier], s.refresh !== null && s.refresh !== undefined ? t('fcore.sh.refreshN', { n: s.refresh }) : ''].filter(Boolean).join(' · ')
  );

  // Название трюка — в начале первого абзаца: «Мастер побега. +2 к Атлетике, когда…»
  function stuntHtml(t: { name: string; text: string }) {
    const name = t.name ? `<strong>${escape(t.name)}.</strong> ` : '';
    const html = markdown(t.text);
    return html.startsWith('<p>') ? '<p>' + name + html.slice(3) : `<p>${name}</p>${html}`;
  }

  const roll = (what: string, rating: number) => rolls.fate(card.name, what, rating);
</script>

<article class="sheet">
  {#if meta}<p class="meta">{meta}</p>{/if}

  {#if s.highConcept || s.trouble || s.aspects.length}
    <h3>{t('fcore.aspects')}</h3>
    <dl class="aspects">
      {#if s.highConcept}<div><dt>{t('fcore.concept')}</dt><dd>{s.highConcept}</dd></div>{/if}
      {#if s.trouble}<div><dt>{t('fcore.trouble')}</dt><dd>{s.trouble}</dd></div>{/if}
      {#each s.aspects.filter((a) => a.trim()) as a, i (i)}<div><dt></dt><dd>{a}</dd></div>{/each}
    </dl>
  {/if}

  <h3>{t('fcore.skills')}</h3>
  {#if steps.length}
    <dl class="skills">
      {#each steps as [rating, list] (rating)}
        <div>
          <dt>{stepTitle(rating)}</dt>
          <dd>
            {#each list as x, i (i)}{#if i > 0},{' '}{/if}<button class="roll" title={t('fcore.sh.rollHint', { rating: signed(rating) })} onclick={() => roll(x.name, rating)}>{x.name}</button>{/each}
          </dd>
        </div>
      {/each}
    </dl>
  {/if}
  <div class="rolls">
    <button class="roll-btn" title={t('fcore.sh.noSkillHint')} onclick={() => roll(t('fcore.sh.noSkill'), 0)}><Dices size={13} /> 4dF</button>
  </div>

  {#if s.stunts.length}
    <h3>{t('fcore.stunts')}</h3>
    {#each s.stunts as st, i (i)}
      <div class="text stunt">
        {@html stuntHtml(st)}
      </div>
    {/each}
  {/if}

  <h3>{t('fcore.stressCons')}</h3>
  <div class="tracks">
    {#each stress as tr (tr.id)}
      <div class="track">
        <span class="label">{trackTitle(tr.id)}</span>
        {#each { length: tr.boxes } as _, i (i)}<span class="box">{i + 1}</span>{/each}
        {#if !tr.boxes}<span class="faint">{t('fcore.sh.outFirst')}</span>{/if}
      </div>
    {/each}
  </div>
  {#if consequences.length}
    <div class="cons">
      {#each consequences as shift, i (i)}
        <span class="con"><b>{shift}</b> {(CONSEQUENCE_TITLES[shift] ?? t('fcore.consequence')).toLowerCase()}</span>
      {/each}
    </div>
  {:else}
    <p class="faint small">{t('fcore.sh.noCons')}</p>
  {/if}
</article>

<style>
  .sheet {
    max-width: 720px;
    line-height: 1.5;
    user-select: text;
  }
  .meta {
    margin: 0;
    color: var(--text-muted);
    font-style: italic;
  }
  h3 {
    margin: 18px 0 6px;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--border);
    color: var(--accent-hover);
    font-size: 15px;
    font-weight: 600;
  }
  dl {
    margin: 0;
  }
  dl div {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 8px;
    margin: 2px 0;
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
  }
  .aspects dd {
    font-style: italic;
  }
  /* Без полей: запятая после навыка не отрывается; подсветка при наведении — тенью. */
  .roll {
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .roll:hover {
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
    color: var(--on-accent);
  }
  .rolls {
    margin: 6px 0 0;
  }
  .roll-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .roll-btn:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .stunt {
    margin-bottom: 6px;
  }
  .text :global(p) {
    margin: 0 0 6px;
  }
  .tracks {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .track {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .label {
    width: 110px;
    color: var(--text-muted);
  }
  .box {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--text-faint);
    font-size: 11px;
  }
  .cons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .con {
    padding: 2px 8px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-size: 12px;
  }
  .small {
    margin: 6px 0 0;
    font-size: 12px;
  }
</style>
