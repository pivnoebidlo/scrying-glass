<!-- Trap generator (Tools → Trap generator): level, severity, kind and place → a mechanism with SRD numbers, its trigger,
     how to notice and disarm it, a way past, a complication and who set it. Each part can be rerolled; damage and
     attacks roll into the roll log; copy and to the journal. Not for Telegram: the page is the GM's secret. The current
     trap is remembered by the window. -->
<script lang="ts">
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { Bomb, Check, Copy, Dices, NotebookPen, RefreshCw } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../../renderer/lib/nav';
  import { rolls } from '../../../../renderer/lib/rolls.svelte';
  import { store } from '../../../../renderer/lib/store.svelte';
  import { journalFolder } from '../../../../modules/journal/ui/store.svelte';
  import { openPage } from '../../../../modules/journal/ui/ui.svelte';
  import { dict } from '../../stats';
  import { TIERS, type Tier } from '../treasure/generate';
  import { generateTrap, generateTrapPart, SEVERITIES, TRAP_KINDS, TRAP_PLACES, trapDice, type Severity, type Trap, type TrapKind, type TrapPart, type TrapPlace } from './generate';
  import { damageType, mechanismOf, trapMarkdown, trapName, trapTexts, type TrapLabels, type TrapLang } from './text';

  const KEY = 'trap.state';
  interface Saved {
    tier: Tier;
    severity: Severity;
    kind: TrapKind | 'random';
    place: TrapPlace | 'random';
    trap: Trap | null;
  }
  const DEFAULTS: Saved = { tier: 1, severity: 'dangerous', kind: 'random', place: 'random', trap: null };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const tp = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(tp)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const lang = $derived<TrapLang>(locale.lang === 'ru' ? 'ru' : 'en');
  const TIER_LEVELS: Record<Tier, string> = { 1: '1–4', 2: '5–10', 3: '11–16', 4: '17–20' };

  function create() {
    tp.trap = generateTrap({ tier: tp.tier, severity: tp.severity, kind: tp.kind, place: tp.place });
    save();
  }
  function reroll(part: TrapPart) {
    if (!tp.trap) return;
    const x = $state.snapshot(tp.trap) as Trap;
    tp.trap = { ...x, ...generateTrapPart(part, x) };
    save();
  }

  const subtitle = (x: Trap) =>
    `${t(`trap.kind.${x.kind}` as never)} · ${t(`trap.place.${x.place}` as never)} · ${t(`trap.severity.${x.severity}` as never)} · ${t('trap.levels', { levels: TIER_LEVELS[x.tier] })}`;
  const skill = (id: string) => (dict(locale.lang).skills as Record<string, string>)[id] ?? id;
  const ability = (id: string) => (dict(locale.lang).abilities as Record<string, string>)[id] ?? id;
  function rule(x: Trap, dice: string) {
    const m = mechanismOf(x);
    if (!m) return '';
    const type = damageType(x, lang);
    if (!m.save) return t('trap.rule.attack', { bonus: x.attack, dice, type });
    const save = ability(m.save);
    if (!m.damage) return t('trap.rule.save', { save, dc: x.saveDc });
    return t(m.success === 'half' ? 'trap.rule.half' : 'trap.rule.none', { save, dc: x.saveDc, dice, type });
  }
  const detectCheck = (x: Trap) => t('trap.check', { skill: skill(mechanismOf(x)?.detect ?? ''), dc: x.detectDc });
  const disarmCheck = (x: Trap) => t('trap.check', { skill: skill(mechanismOf(x)?.disable ?? ''), dc: x.disarmDc });
  const labels = (x: Trap): TrapLabels => ({
    subtitle: subtitle(x),
    trigger: t('trap.part.trigger'),
    effect: t('trap.effect'),
    detect: t('trap.detect'),
    disarm: t('trap.disarm'),
    bypass: t('trap.part.bypass'),
    complication: t('trap.part.complication'),
    story: t('trap.part.story'),
    rule,
    detectCheck,
    disarmCheck,
  });

  function roll(x: Trap) {
    const m = mechanismOf(x);
    if (!m?.damage) return;
    if (m.save) rolls.damage(trapName(x, lang), t('trap.effect'), trapDice(x));
    else rolls.attack(trapName(x, lang), t('trap.effect'), x.attack, [trapDice(x)]);
  }

  let copied = $state(false);
  function copy() {
    if (!tp.trap) return;
    void navigator.clipboard.writeText(trapMarkdown(tp.trap, lang, labels(tp.trap), { heading: true, rollable: false }));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!tp.trap) return;
    const body = trapMarkdown(tp.trap, lang, labels(tp.trap), { heading: false, rollable: true });
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), trapName(tp.trap, lang), body);
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

{#snippet part(id: TrapPart, body: Snippet)}
  <section class="part">
    <header>
      <h3>{t(`trap.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => reroll(id)}><RefreshCw size={13} /></button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('trap.title')}</h2>
    <div class="spacer"></div>
    {#if tp.trap}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('trap.about')} /></p>

  <div class="options">
    <label>{t('treasure.tier')}
      <select bind:value={tp.tier} onchange={save}>
        {#each TIERS as id (id)}<option value={id}>{TIER_LEVELS[id]}</option>{/each}
      </select>
    </label>
    <label>{t('trap.severity')}
      <select bind:value={tp.severity} onchange={save}>
        {#each SEVERITIES as id (id)}<option value={id}>{t(`trap.severity.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('trap.kind')}
      <select bind:value={tp.kind} onchange={save}>
        <option value="random">{t('trap.random')}</option>
        {#each TRAP_KINDS as id (id)}<option value={id}>{t(`trap.kind.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('trap.place')}
      <select bind:value={tp.place} onchange={save}>
        <option value="random">{t('trap.random')}</option>
        {#each TRAP_PLACES as id (id)}<option value={id}>{t(`trap.place.${id}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={create}><Bomb size={16} /> {t('trap.create')}</button>
  </div>

  {#if !tp.trap}
    <p class="faint placeholder">{t('trap.empty')}</p>
  {:else}
    {@const x = tp.trap}
    {@const s = trapTexts(x, lang)}
    <div class="sheet">
      {#snippet mechanismBody()}
        <p class="name">{trapName(x, lang)}</p>
        <p class="faint">{subtitle(x)}</p>
        <p>{s.effect}</p>
        <p class="rule">{rule(x, trapDice(x))}</p>
        {#if mechanismOf(x)?.damage}
          <button class="btn roll" onclick={() => roll(x)}><Dices size={14} /> {mechanismOf(x)?.save ? trapDice(x) : t('trap.rollAttack', { bonus: x.attack })}</button>
        {/if}
        <p><b>{t('trap.detect')}:</b> {s.clue} <span class="rule">{detectCheck(x)}</span></p>
        <p><b>{t('trap.disarm')}:</b> {s.disarm} <span class="rule">{disarmCheck(x)}</span></p>
      {/snippet}
      {@render part('mechanism', mechanismBody)}
      {#snippet triggerBody()}<p>{s.trigger}</p>{/snippet}
      {@render part('trigger', triggerBody)}
      {#snippet bypassBody()}<p>{s.bypass}</p>{/snippet}
      {@render part('bypass', bypassBody)}
      {#snippet complicationBody()}<p>{s.complication}</p>{/snippet}
      {@render part('complication', complicationBody)}
      {#snippet storyBody()}
        <p>{s.maker}</p>
        <p>{s.remains}</p>
      {/snippet}
      {@render part('story', storyBody)}
    </div>
  {/if}
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .about {
    margin: 6px 0 12px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
  }
  .options label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .actions {
    margin: 12px 0 16px;
  }
  .big {
    padding: 6px 18px;
    font-size: 15px;
  }
  .placeholder {
    font-style: italic;
  }
  .sheet {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 10px;
  }
  .part {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .part:first-child {
    grid-column: 1 / -1;
  }
  .part header {
    display: flex;
    align-items: center;
  }
  h3 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .part p {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .name {
    font-size: 22px;
  }
  .rule {
    color: var(--text-muted);
    font-style: italic;
  }
  .roll {
    margin-top: 6px;
  }
</style>
