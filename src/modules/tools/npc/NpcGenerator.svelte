<!-- NPC generator (Tools → NPC generator): race, gender, importance → name, trade, appearance, character and manner,
     desire, secret, what they carry (and fame for important ones). Each part can be rerolled or pinned; the history
     keeps the recent ones. "Create card" opens an NPC card in the editor already filled; "To journal" — a note. -->
<script lang="ts">
  import { Check, Copy, Dices, History, IdCard, NotebookPen, Pin, RefreshCw, Trash2 } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { RACES } from '../../../shared/names';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';
  import { npcName } from './generate';
  import { clearHistory, createNpc, npcs, rerollPart, rerollUnpinned, restore, saveOptions, togglePin } from './store.svelte';
  import { npcCard, npcLine, npcMarkdown, type NpcLabels } from './text';
  import { IMPORTANCE, type NpcPart } from './types';

  const n = $derived(npcs.npc);
  const race = (id: string) => t(`names.race.${id}` as never);
  const quote = (s: string) => t('common.quote', { text: s });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const labels = (): NpcLabels => ({
    race,
    appearance: t('npc.part.appearance'),
    trait: t('npc.part.trait'),
    manner: t('npc.part.manner'),
    desire: t('npc.part.desire'),
    secret: t('npc.part.secret'),
    item: t('npc.part.item'),
    fame: t('npc.fame'),
    quote,
  });

  const set = <K extends keyof typeof npcs.opts>(k: K, v: (typeof npcs.opts)[K]) => {
    npcs.opts[k] = v;
    saveOptions();
  };

  let copied = $state(false);
  function copy() {
    if (!n) return;
    void navigator.clipboard.writeText(npcMarkdown(n, labels()));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!n) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), npcName(n, (s) => s), npcMarkdown(n, labels(), false));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  const toCard = () => n && bestiary.create(undefined, { ...npcCard(n, labels()), kind: 'npc', lang: npcs.lang || undefined });
</script>

{#snippet part(id: NpcPart, body: Snippet)}
  <section class="part" class:pinned={npcs.pinned.includes(id)}>
    <header>
      <h3>{t(`npc.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => rerollPart(id)}><RefreshCw size={13} /></button>
      <button class="icon-btn pin" class:on={npcs.pinned.includes(id)} title={npcs.pinned.includes(id) ? t('tavern.unpin') : t('tavern.pin')} onclick={() => togglePin(id)}>
        <Pin size={13} />
      </button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('npc.title')}</h2>
    <div class="spacer"></div>
    {#if n}
      <button class="btn" title={t('npc.toCardHint')} onclick={toCard}><IdCard size={14} /> {t('npc.toCard')}</button>
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about">{t('npc.about')}</p>

  <div class="options">
    <label>{t('names.race')}
      <select value={npcs.opts.race} onchange={(e) => set('race', e.currentTarget.value)}>
        <option value="">{t('npc.random')}</option>
        {#each RACES as r (r)}<option value={r}>{race(r)}</option>{/each}
      </select>
    </label>
    <label>{t('names.gender')}
      <select value={npcs.opts.gender} onchange={(e) => set('gender', e.currentTarget.value as never)}>
        <option value="random">{t('npc.random')}</option>
        <option value="male">{t('names.male')}</option>
        <option value="female">{t('names.female')}</option>
      </select>
    </label>
    <label title={t('npc.importanceHint')}>{t('npc.importance')}
      <select value={npcs.opts.importance} onchange={(e) => set('importance', e.currentTarget.value as never)}>
        <option value="random">{t('npc.random')}</option>
        {#each IMPORTANCE as i (i)}<option value={i}>{t(`npc.importance.${i}` as never)}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={createNpc}><Dices size={16} /> {t('npc.create')}</button>
    {#if n}<button class="btn" onclick={rerollUnpinned}><RefreshCw size={14} /> {t('tavern.reroll')}</button>{/if}
  </div>

  {#if !n}
    <p class="faint placeholder">{t('npc.empty')}</p>
  {:else}
    <div class="sheet">
      {#snippet nameBody()}
        <p class="name">{npcName(n, quote)}</p>
        <p class="faint">{race(n.race)}, {t(n.gender === 'male' ? 'names.male' : 'names.female').toLowerCase()} · {t(`npc.importance.${n.importance}` as never)}</p>
        {#if n.fame}<p><b>{t('npc.fame')}:</b> {n.fame}.</p>{/if}
      {/snippet}
      {@render part('name', nameBody)}
      {#snippet occupationBody()}<p>{cap(n.occupation)}</p>{/snippet}
      {@render part('occupation', occupationBody)}
      {#snippet appearanceBody()}<p>{cap(n.appearance.join('; '))}.</p>{/snippet}
      {@render part('appearance', appearanceBody)}
      {#snippet traitBody()}<p>{cap(n.trait)}.</p>{/snippet}
      {@render part('trait', traitBody)}
      {#snippet mannerBody()}<p>{cap(n.manner)}.</p>{/snippet}
      {@render part('manner', mannerBody)}
      {#snippet desireBody()}<p>{cap(n.desire)}.</p>{/snippet}
      {@render part('desire', desireBody)}
      {#snippet secretBody()}<p class="secret">{cap(n.secret)}.</p>{/snippet}
      {@render part('secret', secretBody)}
      {#snippet itemBody()}<p>{cap(n.item)}.</p>{/snippet}
      {@render part('item', itemBody)}
    </div>
  {/if}

  {#if npcs.history.length > 1}
    <section class="history">
      <header>
        <h3><History size={14} /> {t('npc.history')}</h3>
        <div class="spacer"></div>
        <button class="icon-btn" title={t('names.clear')} onclick={() => confirm(t('names.clearHistory')) && clearHistory()}><Trash2 size={13} /></button>
      </header>
      <ul>
        {#each npcs.history as h, i (i)}
          <li><button class="link" onclick={() => restore(i)}>{npcName(h.npc, quote)}</button> <span class="faint">— {npcLine(h.npc, labels())}</span></li>
        {/each}
      </ul>
    </section>
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
  .part:first-child {
    grid-column: 1 / -1;
  }
  .part.pinned {
    border-color: var(--accent);
  }
  .part header,
  .history header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .part h3,
  .history h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .pin {
    color: var(--text-faint);
  }
  .pin.on {
    color: var(--accent);
  }
  .part p {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .name {
    font-size: 22px;
  }
  .secret {
    color: var(--text-muted);
  }
  .history {
    margin-top: 20px;
  }
  .history ul {
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }
  .history li {
    padding: 2px 0;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
</style>
