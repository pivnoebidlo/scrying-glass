<!-- Forged in the Dark card: the actions under their attributes (a click on an action — an action roll of its dots, on
     an attribute — a resistance roll), stress and traumas, harm, special abilities, gear. One view for every kind. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import type { Card } from '../../shared/cards';
  import { rolls } from '../../renderer/lib/rolls.svelte';
  import {
    ACTION_TITLES, ACTIONS, ATTRIBUTE_TITLES, ATTRIBUTES, attributeRating, dots, HARM_LEVELS, HARM_TITLES, MAX_DOTS, MAX_STRESS, TRAUMA_TITLES,
    type FitdAttribute, type FitdStats,
  } from './stats';

  let { card }: { card: Card<FitdStats> } = $props();

  const s = $derived(card.stats);
  const character = $derived(card.kind === 'character');
  const meta = $derived(
    [
      [t('fitd.playbook'), s.playbook],
      [t('fitd.heritage'), s.heritage],
      [t('fitd.background'), s.background],
      [t('fitd.vice'), s.vice],
    ].filter(([, v]) => v),
  );
  const harm = $derived(s.harm.map((text, i) => ({ text, level: HARM_LEVELS[i]! })).filter((h) => h.text.trim()));

  const action = (a: string) => rolls.pool(card.name, ACTION_TITLES[a]!, dots(s, a));
  const resist = (a: FitdAttribute) => rolls.pool(card.name, t('fitd.resistOf', { attr: ATTRIBUTE_TITLES[a]! }), attributeRating(s, a), true);
</script>

<article class="sheet">
  {#if meta.length}
    <p class="meta">{#each meta as [k, v], i (k)}{#if i}{' · '}{/if}<span class="faint">{k}:</span> {v}{/each}</p>
  {/if}
  {#if !character && s.tier}<p class="meta"><span class="faint">{t('fitd.tier')}:</span> {s.tier}</p>{/if}

  <div class="attrs">
    {#each ATTRIBUTES as a (a)}
      <section class="attr">
        <button class="head" title={t('fitd.resistHint', { attr: ATTRIBUTE_TITLES[a]! })} onclick={() => resist(a)}>
          <span>{ATTRIBUTE_TITLES[a]}</span><span class="rating">{attributeRating(s, a)}</span>
        </button>
        {#each ACTIONS[a] as x (x)}
          <button class="action" title={t('fitd.actionHint', { n: dots(s, x) })} onclick={() => action(x)}>
            <span class="dots" aria-label={String(dots(s, x))}>{#each { length: MAX_DOTS } as _, i (i)}<i class:on={i < dots(s, x)}></i>{/each}</span>
            <span>{ACTION_TITLES[x]}</span>
          </button>
        {/each}
      </section>
    {/each}
  </div>

  <div class="track" title={t('fitd.stressHint')}>
    <b>{t('fitd.stress')}</b>
    <span class="boxes">{#each { length: MAX_STRESS } as _, i (i)}<i class:on={i < s.stress}></i>{/each}</span>
    <span class="faint">{s.stress}/{MAX_STRESS}</span>
  </div>
  {#if s.traumas.length}
    <p class="line"><b>{t('fitd.trauma')}:</b> {s.traumas.map((x) => TRAUMA_TITLES[x] ?? x).join(', ')}</p>
  {/if}
  {#if harm.length}
    <p class="line">
      <b>{t('fitd.harmTitle')}:</b>
      {#each harm as h, i (i)}{#if i}{'; '}{/if}{h.text} <span class="faint">({HARM_TITLES[h.level]?.toLowerCase()})</span>{/each}
    </p>
  {/if}
  {#if s.armor}<p class="line"><b>{t('fitd.armor')}</b></p>{/if}

  {#if s.abilities.length}
    <h3>{t('fitd.abilities')}</h3>
    {#each s.abilities as ab, i (i)}<p class="line"><b>{ab.name}.</b> {ab.text}</p>{/each}
  {/if}
  {#if s.items.length}
    <h3>{t('fitd.items')}</h3>
    <p class="line">{s.items.join(', ')}</p>
  {/if}
  {#if character && (s.coin || s.stash || s.xp)}
    <p class="line faint">{t('fitd.coin')}: {s.coin} · {t('fitd.stash')}: {s.stash} · {t('fitd.xp')}: {s.xp}</p>
  {/if}
</article>

<style>
  .sheet {
    max-width: 720px;
    line-height: 1.5;
    user-select: text;
  }
  .meta {
    margin: 0 0 6px;
  }
  .attrs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 8px 0 12px;
  }
  .attr {
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
  }
  .head,
  .action {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 2px 4px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .head {
    justify-content: space-between;
    margin-bottom: 2px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .head:hover,
  .action:hover {
    background: var(--bg-hover);
  }
  .rating {
    color: var(--text-normal);
    font-size: 14px;
  }
  .dots,
  .boxes {
    display: inline-flex;
    gap: 3px;
  }
  .dots i {
    width: 8px;
    height: 8px;
    border: 1px solid var(--text-muted);
    border-radius: 50%;
  }
  .boxes i {
    width: 12px;
    height: 12px;
    border: 1px solid var(--text-muted);
    border-radius: 2px;
  }
  .dots i.on,
  .boxes i.on {
    border-color: var(--accent);
    background: var(--accent);
  }
  .track {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .line {
    margin: 4px 0;
  }
  h3 {
    margin: 12px 0 4px;
    font-size: 13px;
  }
</style>
