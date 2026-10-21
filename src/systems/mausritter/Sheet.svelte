<!-- Mausritter card: the stat block (a click on STR / DEX / WIL — a save, on an attack — its damage) and, for a mouse
     with a sheet, level, pips and inventory slots (paws, body, pack; Conditions take slots too). -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import type { Card } from '../../shared/cards';
  import { modeOf, rollHint, rolls } from '../../renderer/lib/rolls.svelte';
  import { ATTR_SHORT, ATTR_TITLES, ATTRS, encumbered, gritFor, SLOT_COUNT, slotGroup, xpFor, type MausAttr, type MausStats } from './stats';

  let { card }: { card: Card<MausStats> } = $props();

  const s = $derived(card.stats);
  const sheet = $derived(s.sheet);
  const extra = $derived(sheet ? sheet.slots.slice(SLOT_COUNT).filter((x) => x.name.trim()) : []);

  const save = (e: MouseEvent, a: MausAttr) => s[a] !== null && rolls.save(card.name, t('maus.saveOf', { attr: ATTR_SHORT[a]! }), s[a]!, modeOf(e));
  // «Хочет, чтобы…» — the text may begin with its own comma.
  const gap = (text: string) => (/^[,.;:]/.test(text) ? '' : ' ');
  // Dice as the card's language writes them: «к8» on a Russian card.
  const die = (d: string) => (card.lang === 'ru' ? d.replace(/d/g, 'к') : d);
  // «d6/d8» — one paw or both: each die is its own button.
  const damage = (die: string, name: string) => rolls.damage(card.name, name || die, `1${die}`);
</script>

<article class="sheet">
  {#if s.warband}<p class="meta">{t('maus.warband')}</p>{/if}

  <div class="stats">
    {#if s.hp !== null}
      <div class="stat" title={t('maus.hpTitle')}><span class="k">{t('maus.hp')}</span><span class="v">{s.hp}</span></div>
    {/if}
    {#each ATTRS as a (a)}
      {#if s[a] !== null}
        <button class="stat roll" title="{t('maus.saveHint', { attr: ATTR_TITLES[a]! })}. {rollHint()}" onclick={(e) => save(e, a)}>
          <span class="k">{ATTR_SHORT[a]}</span><span class="v">{s[a]}</span>
        </button>
      {/if}
    {/each}
    <div class="stat" title={t('maus.armourHint')}><span class="k">{t('maus.armourShort')}</span><span class="v">{s.armour}</span></div>
  </div>

  {#if s.attacks.length}
    <p class="line">
      <b>{t('maus.attacks')}:</b>
      {#each s.attacks as a, i (i)}{#if i > 0},{' '}{/if}{#each a.dice.split('/').filter(Boolean) as d, j (j)}{#if j > 0}/{/if}<button class="roll inline" title={t('maus.attackHint')} onclick={() => damage(d, a.name)}>{die(d)}</button>{/each}{a.dice ? ' ' : ''}{a.name}{/each}
    </p>
  {/if}
  {#if s.critical}<p class="line"><b>{t('maus.critical')}:</b> {s.critical}</p>{/if}
  {#each s.abilities.filter((x) => x.trim()) as x, i (i)}<p class="line">{x}</p>{/each}
  {#if s.wants}<p class="line"><b>{t('maus.wants')}</b>{gap(s.wants)}{s.wants}</p>{/if}

  {#if sheet}
    <h3>{t('maus.mouse')}</h3>
    <dl>
      <div><dt>{t('maus.level')}</dt><dd>{sheet.level} <span class="faint">· {t('maus.xpOf', { xp: sheet.xp, next: xpFor(sheet.level + 1) })}</span></dd></div>
      {#if gritFor(sheet.level)}
        <div>
          <dt>{t('maus.grit')}</dt>
          <dd>{gritFor(sheet.level)}{#if sheet.grit.length}{' '}<span class="faint">· {t('maus.ignored')}:</span>{' '}{sheet.grit.join(', ')}{/if}</dd>
        </div>
      {/if}
      <div><dt>{t('maus.pips')}</dt><dd>{sheet.pips}</dd></div>
      {#if sheet.background}<div><dt>{t('maus.background')}</dt><dd>{sheet.background}</dd></div>{/if}
      {#if sheet.birthsign}<div><dt>{t('maus.birthsign')}</dt><dd>{sheet.birthsign}</dd></div>{/if}
      {#if sheet.coat}<div><dt>{t('maus.coat')}</dt><dd>{sheet.coat}</dd></div>{/if}
      {#if sheet.look}<div><dt>{t('maus.look')}</dt><dd>{sheet.look}</dd></div>{/if}
    </dl>

    <h3>{t('maus.inventory')}{#if encumbered(sheet)}<span class="warn"> · {t('maus.encumbered')}</span>{/if}</h3>
    <div class="slots">
      {#each sheet.slots.slice(0, SLOT_COUNT) as x, i (i)}
        <div class="slot {slotGroup(i)}" class:condition={x.condition} class:empty={!x.name.trim()}>
          <span class="where faint">{t(`maus.slot.${slotGroup(i)}`)}</span>
          <span class="name">{x.name}</span>
          {#if x.name.trim() && !x.condition}
            <span class="dots" title={t('maus.usage')}>{#each [0, 1, 2] as d (d)}<span class="dot" class:on={(x.usage ?? 0) > d}></span>{/each}</span>
          {/if}
        </div>
      {/each}
    </div>
    {#if extra.length}
      <p class="line warn">{t('maus.extra')}: {extra.map((x) => x.name).join(', ')}</p>
    {/if}
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
    color: var(--text-muted);
    font-style: italic;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 54px;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: inherit;
    font: inherit;
  }
  .stat .k {
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 0.05em;
  }
  .stat .v {
    font-size: 18px;
    font-weight: 600;
  }
  button.stat {
    cursor: pointer;
  }
  button.stat:hover {
    border-color: var(--accent);
  }
  .line {
    margin: 0 0 4px;
  }
  .roll.inline {
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .roll.inline:hover {
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
    color: var(--on-accent);
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
  .warn {
    color: var(--warning);
  }
  .slots {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }
  /* Paws and body — the first row, the pack — the next ones. */
  .slot {
    display: flex;
    flex-direction: column;
    min-height: 58px;
    padding: 4px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    font-size: 13px;
  }
  .slot.paw,
  .slot.body {
    background: var(--bg-secondary);
  }
  .slot.empty .name {
    color: var(--text-faint);
  }
  .slot.condition {
    border-color: var(--danger);
    color: var(--danger);
  }
  .where {
    font-size: 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .name {
    flex: 1;
  }
  .dots {
    display: flex;
    gap: 3px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border: 1px solid var(--text-muted);
    border-radius: 50%;
  }
  .dot.on {
    background: var(--text-muted);
  }
</style>
