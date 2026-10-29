<!-- Dungeon generator (Tools → Dungeon generator): kind, the heroes' level and five or eight rooms → name, overview,
     rooms (creatures — links to their cards, puzzles, traps with SRD saves and damage in D&D) and the hoard from the
     treasure generator. Each part can be rerolled; copy or to the journal. The dungeon is remembered by the window. -->
<script lang="ts">
  import { Check, Copy, DoorOpen, NotebookPen, RefreshCw, Swords } from '@lucide/svelte';
  import { toEncounter } from '../../../../modules/tools/encounter';
  import { onMount, type Snippet } from 'svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { peekEntry } from '../../../../renderer/lib/entry/peek.svelte';
  import { openTab } from '../../../../renderer/lib/nav';
  import { store } from '../../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../../shared/adventures';
  import { isDnd } from '../../here';
  import { dict } from '../../stats';
  import { allEntries, loadEntries } from '../../../../modules/compendium/ui/store.svelte';
  import { journalFolder } from '../../../../modules/journal/ui/store.svelte';
  import { openPage } from '../../../../modules/journal/ui/ui.svelte';
  import { en as npcEn } from '../../../../modules/tools/npc/content/en';
  import { ru as npcRu } from '../../../../modules/tools/npc/content/ru';
  import { pickItems, rarityOf, TIERS, type Rarity, type Tier } from '../treasure/generate';
  import { coinsLine, valuableLines, type TreasureWords } from '../treasure/text';
  import { DUNGEON_TYPES, generateDungeon, generateDungeonPart, TRAP_DICE, type Dungeon, type DungeonPart, type DungeonType, type Room } from './generate';
  import { dungeonMarkdown, dungeonName, monsterName, overview, puzzleText, roomText, trapDamage, trapSave, trapText, twistText, type DungeonLabels, type DungeonLang } from './text';

  const KEY = 'dungeon.state';
  interface Saved {
    type: DungeonType | 'random';
    tier: Tier;
    rooms: number;
    dungeon: Dungeon | null;
    // The hoard's magic items (compendium titles or curiosities) and where the dungeon was made.
    items: string[];
    dnd: boolean;
  }
  const DEFAULTS: Saved = { type: 'random', tier: 1, rooms: 5, dungeon: null, items: [], dnd: true };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const dg = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(dg)));
    } catch {
      /* not remembered — not a problem */
    }
  };
  onMount(() => void loadEntries());

  const dnd = $derived(isDnd(currentSystem(store.state.adventures)));
  const lang = $derived<DungeonLang>(locale.lang === 'ru' ? 'ru' : 'en');

  function chooseItems(rarities: Rarity[], inDnd: boolean): string[] {
    if (inDnd) {
      const pool = allEntries().flatMap((e) => {
        const rarity = e.entry.type === 'item' ? rarityOf(e.entry.fields['rarity']) : null;
        return rarity ? [{ title: e.entry.title, rarity }] : [];
      });
      return pickItems(rarities, pool);
    }
    const list = [...(lang === 'ru' ? npcRu : npcEn).magicItems];
    return rarities.map(() => list.splice(Math.floor(Math.random() * list.length), 1)[0] ?? '').filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  }

  function create() {
    const type = dg.type === 'random' ? DUNGEON_TYPES[Math.floor(Math.random() * DUNGEON_TYPES.length)]! : dg.type;
    const d = generateDungeon(type, dg.tier, dg.rooms);
    dg.dungeon = d;
    dg.dnd = dnd;
    dg.items = chooseItems(d.hoard.magic, dnd);
    save();
  }
  function reroll(part: DungeonPart) {
    if (!dg.dungeon) return;
    const d = $state.snapshot(dg.dungeon) as Dungeon;
    dg.dungeon = { ...d, ...generateDungeonPart(part, d) };
    if (part === 'hoard') dg.items = chooseItems(dg.dungeon.hoard.magic, dg.dnd);
    save();
  }

  const words = (): TreasureWords => ({ coin: (c) => t(`treasure.coin.${c}` as never), each: (value) => t('treasure.each', { value }) });
  const trapRule = (x: Room) => {
    if (!dg.dnd || !x.trap || !dg.dungeon) return '';
    const l = dict(locale.lang);
    const save = l.abilities[trapSave(x) as keyof typeof l.abilities] ?? trapSave(x);
    return t('dungeon.trapRule', { save, dc: x.trap.dc, dice: TRAP_DICE[dg.dungeon.tier], type: trapDamage(x, lang) });
  };
  const hoardLines = (d: Dungeon) => [coinsLine(d.hoard, lang, words()), ...valuableLines(d.hoard, lang, words(), dg.dnd), ...dg.items].filter(Boolean);
  const labels = (d: Dungeon): DungeonLabels => ({
    role: (role) => t(`dungeon.role.${role}` as never),
    room: (n) => t('dungeon.room', { n }),
    builder: t('dungeon.builder'),
    entrance: t('dungeon.entrance'),
    hook: t('dungeon.hook'),
    creatures: t('dungeon.creatures'),
    puzzle: t('dungeon.puzzle'),
    trap: t('dungeon.trap'),
    trapRule,
    hoard: t('dungeon.part.hoard'),
    hoardLines: hoardLines(d).map((h, i, all) => (dg.dnd && i >= all.length - dg.items.length ? `[[${h}]]` : h)),
    twist: t('dungeon.twist'),
  });

  let copied = $state(false);
  function copy() {
    if (!dg.dungeon) return;
    void navigator.clipboard.writeText(dungeonMarkdown(dg.dungeon, lang, labels(dg.dungeon)).replace(/\[\[([^\]]+)\]\]/g, '$1'));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!dg.dungeon) return;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), dungeonName(dg.dungeon, lang), dungeonMarkdown(dg.dungeon, lang, labels(dg.dungeon), false));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
  // A room's creatures → an encounter preset named after the dungeon and the room.
  let missing = $state('');
  async function roomToEncounter(d: Dungeon, x: Room, i: number) {
    if (!x.monster) return;
    const title = `${dungeonName(d, lang)} — ${t('dungeon.room', { n: i + 1 })}`;
    const lost = await toEncounter(title, [{ name: monsterName(x, lang), count: x.monster.count }], lang);
    missing = lost.length ? t('tools.noCards', { names: lost.join(', ') }) : '';
  }
  const TIER_LEVELS: Record<Tier, string> = { 1: '1–4', 2: '5–10', 3: '11–16', 4: '17–20' };
</script>

{#snippet part(id: DungeonPart, body: Snippet)}
  <section class="part">
    <header>
      <h3>{t(`dungeon.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => reroll(id)}><RefreshCw size={13} /></button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('dungeon.title')}</h2>
    <div class="spacer"></div>
    {#if dg.dungeon}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about">{t('dungeon.about')}</p>

  <div class="options">
    <label>{t('dungeon.type')}
      <select bind:value={dg.type} onchange={save}>
        <option value="random">{t('dungeon.random')}</option>
        {#each DUNGEON_TYPES as id (id)}<option value={id}>{t(`dungeon.type.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t('treasure.tier')}
      <select bind:value={dg.tier} onchange={save}>
        {#each TIERS as id (id)}<option value={id}>{TIER_LEVELS[id]}</option>{/each}
      </select>
    </label>
    <label>{t('dungeon.size')}
      <select bind:value={dg.rooms} onchange={save}>
        <option value={5}>5</option>
        <option value={8}>8</option>
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={create}><DoorOpen size={16} /> {t('dungeon.create')}</button>
  </div>

  {#if !dg.dungeon}
    <p class="faint placeholder">{t('dungeon.empty')}</p>
  {:else}
    {@const d = dg.dungeon}
    {@const o = overview(d, lang)}
    <div class="sheet">
      {#snippet nameBody()}
        <p class="name">{dungeonName(d, lang)}</p>
        <p class="faint">{t(`dungeon.type.${d.type}` as never)} · {t('treasure.tier')} {TIER_LEVELS[d.tier]}</p>
      {/snippet}
      {@render part('name', nameBody)}
      {#snippet overviewBody()}
        <p class="mood">{o.atmosphere}</p>
        <p><b>{t('dungeon.builder')}:</b> {o.builder}. {o.fate}</p>
        <p><b>{t('dungeon.entrance')}:</b> {o.entrance}</p>
        <p><b>{t('dungeon.hook')}:</b> {o.hook}</p>
      {/snippet}
      {@render part('overview', overviewBody)}
      {#snippet roomsBody()}
        <ol class="rooms">
          {#each d.rooms as x, i (i)}
            <li class="room role-{x.role}">
              <header class="room-head">
                <h4>{t('dungeon.room', { n: i + 1 })} — {t(`dungeon.role.${x.role}` as never)}</h4>
                {#if x.monster}
                  <button class="btn small" title={t('tools.toEncounterHint')} onclick={() => roomToEncounter(d, x, i)}><Swords size={13} /> {t('tools.toEncounter')}</button>
                {/if}
              </header>
              <p>{roomText(x, lang)}</p>
              {#if x.monster}
                <p><b>{t('dungeon.creatures')}:</b> <button class="link" onclick={() => peekEntry(monsterName(x, lang))}>{monsterName(x, lang)}</button>{#if x.monster.count > 1}{' '}×{x.monster.count}{/if}</p>
              {/if}
              {#if x.puzzle !== undefined}<p><b>{t('dungeon.puzzle')}:</b> {puzzleText(x, lang)}</p>{/if}
              {#if x.trap}
                <p><b>{t('dungeon.trap')}:</b> {trapText(x, lang)}</p>
                {#if trapRule(x)}<p class="rule">{trapRule(x)}</p>{/if}
              {/if}
              {#if x.role === 'reward' && x.twist !== undefined}<p><b>{t('dungeon.twist')}:</b> {twistText(x, lang)}</p>{/if}
            </li>
          {/each}
        </ol>
        {#if missing}<p class="faint">{missing}</p>{/if}
      {/snippet}
      {@render part('rooms', roomsBody)}
      {#snippet hoardBody()}
        <ul>
          {#each hoardLines(d) as h, i (i)}
            {@const item = i >= hoardLines(d).length - dg.items.length}
            <li>{#if item && dg.dnd}<button class="link" onclick={() => peekEntry(h)}>{h}</button>{:else}{h}{/if}</li>
          {/each}
        </ul>
      {/snippet}
      {@render part('hoard', hoardBody)}
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
    gap: 10px;
  }
  .part {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
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
  .part p,
  .part ul {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .part ul {
    padding-left: 18px;
  }
  .name {
    font-size: 22px;
  }
  .mood {
    padding: 4px 10px;
    border-left: 3px solid var(--accent);
    background: var(--bg-primary);
    font-style: italic;
  }
  .rooms {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }
  .room {
    padding: 6px 10px 8px;
    border-left: 3px solid var(--border);
    background: var(--bg-primary);
  }
  .role-guardian,
  .role-lair,
  .role-climax {
    border-left-color: #c0504d;
  }
  .role-trap {
    border-left-color: #d9a441;
  }
  .role-puzzle {
    border-left-color: #4a86c5;
  }
  .role-reward {
    border-left-color: #4f9d69;
  }
  .room-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .small {
    padding: 2px 8px;
    font-size: 12px;
  }
  h4 {
    margin: 0;
    font-size: 14px;
  }
  .room p {
    margin: 4px 0 0;
  }
  .rule {
    color: var(--text-muted);
    font-size: 13px;
    font-style: italic;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline dotted;
    cursor: pointer;
  }
</style>
