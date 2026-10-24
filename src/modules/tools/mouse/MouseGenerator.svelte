<!-- Mouse generator (Tools → Mouse, Mausritter adventures only): a new mouse by the SRD procedure — attributes,
     HP, pips, background and its items, weapon, birthsign, coat, physical detail, name. Two attributes can be swapped,
     the name rerolled. "Create card" opens a mouse sheet in the editor already filled; "To journal" — a note. -->
<script lang="ts">
  import { ArrowLeftRight, Check, Copy, Dices, IdCard, NotebookPen, RefreshCw } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { ATTR_SHORT, ATTR_TITLES } from './text';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import type { Attr } from './generate';
  import { mice, newMouse, newName, swapAttrs } from './store.svelte';
  import { ATTR_ORDER, mouseCard, mouseLang, mouseMarkdown, mouseView, type MouseLabels } from './text';

  const m = $derived(mice.mouse);
  const lang = $derived(mouseLang(locale.lang));
  const v = $derived(m && mouseView(m, lang));
  const labels = (): MouseLabels => ({
    attr: { str: ATTR_SHORT.str!, dex: ATTR_SHORT.dex!, wil: ATTR_SHORT.wil! },
    hp: t('maus.hp'),
    pips: t('maus.pips'),
    background: t('maus.background'),
    items: t('mouse.items'),
    birthsign: t('maus.birthsign'),
    coat: t('maus.coat'),
    detail: t('maus.look'),
  });

  // Swapping: the first click picks an attribute, the second swaps them.
  let picked = $state<Attr | null>(null);
  function pickAttr(a: Attr) {
    if (!picked || picked === a) picked = picked === a ? null : a;
    else {
      swapAttrs(picked, a);
      picked = null;
    }
  }

  let copied = $state(false);
  function copy() {
    if (!m) return;
    void navigator.clipboard.writeText(mouseMarkdown(m, lang, labels()));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!m || !v) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), v.name, mouseMarkdown(m, lang, labels()).replace(/^## .*\n\n/, ''));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  const toCard = () => m && bestiary.create(undefined, { ...mouseCard(m, lang), kind: 'character', lang, system: 'mausritter' });
</script>

<div class="view">
  <header class="head">
    <h2>{t('mouse.title')}</h2>
    <div class="spacer"></div>
    {#if m}
      <button class="btn" title={t('mouse.toCardHint')} onclick={toCard}><IdCard size={14} /> {t('npc.toCard')}</button>
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about">{t('mouse.about')}</p>

  <div class="actions">
    <button class="btn primary big" onclick={() => ((picked = null), newMouse())}><Dices size={16} /> {t('mouse.create')}</button>
  </div>

  {#if !m || !v}
    <p class="faint placeholder">{t('mouse.empty')}</p>
  {:else}
    <div class="sheet">
      <section class="part wide">
        <header>
          <p class="name">{v.name}</p>
          <button class="icon-btn" title={t('mouse.rerollName')} onclick={newName}><RefreshCw size={13} /></button>
        </header>
        <div class="stats">
          {#each ATTR_ORDER as a, i (a)}
            <button class="stat" class:picked={picked === a} title="{ATTR_TITLES[a]}: {t('mouse.rolled', { dice: m.rolls[i]!.join(', ') })}. {t('mouse.swapHint')}" onclick={() => pickAttr(a)}>
              <span class="k">{ATTR_SHORT[a]}</span><span class="v">{m[a]}</span>
              <span class="dice">{m.rolls[i]!.join(' ')}</span>
            </button>
          {/each}
          <div class="stat"><span class="k">{t('maus.hp')}</span><span class="v">{m.hp}</span></div>
          <div class="stat"><span class="k">{t('maus.pips')}</span><span class="v">{m.pips}</span></div>
        </div>
        <p class="faint small"><ArrowLeftRight size={11} /> {picked ? t('mouse.swapWith', { attr: ATTR_SHORT[picked]! }) : t('mouse.swapHint')}</p>
      </section>

      <section class="part">
        <h3>{t('maus.background')}</h3>
        <p><b>{v.background}</b></p>
        <ul>
          <li>{v.weapon} <span class="faint">— {t('mouse.weaponOfChoice')}</span></li>
          {#each v.items as it, i (i)}<li>{it.text}</li>{/each}
        </ul>
        {#if v.weak}<p class="faint small">{v.weak === 'both' ? t('mouse.weakBoth') : t('mouse.weakOne')}</p>{/if}
      </section>

      <section class="part">
        <h3>{t('mouse.details')}</h3>
        <p><b>{t('maus.birthsign')}:</b> {v.birthsign} ({v.disposition.toLowerCase()})</p>
        <p><b>{t('maus.coat')}:</b> {v.coat}</p>
        <p><b>{t('maus.look')}:</b> {v.detail}</p>
      </section>
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
  .actions {
    display: flex;
    gap: 8px;
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
  .part.wide {
    grid-column: 1 / -1;
  }
  .part header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .part h3 {
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
  .part ul {
    margin: 6px 0 0;
    padding-left: 18px;
    line-height: 1.5;
  }
  .name {
    margin: 0 !important;
    font-size: 18px;
    font-weight: 600;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
    color: inherit;
    font: inherit;
  }
  button.stat {
    cursor: pointer;
  }
  button.stat:hover,
  .stat.picked {
    border-color: var(--accent);
  }
  .stat .k {
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 0.05em;
  }
  .stat .v {
    font-size: 20px;
    font-weight: 600;
  }
  .stat .dice {
    color: var(--text-faint);
    font-size: 10px;
  }
  .small {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
</style>
