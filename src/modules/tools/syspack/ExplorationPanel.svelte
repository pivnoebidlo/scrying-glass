<!-- The builder, under the "Exploration clock" feature: its rules (GeneratorFile.exploration in SystemPack.kit), in
     phrases. Without rules the clock only counts. -->
<script lang="ts">
  import { Plus, Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { genText, namesOfText, type ExplorationRules, type GenText } from '../../../shared/generators';
  import type { SystemPack } from '../../../shared/syspack';
  import { filesOf } from '../generators/store.svelte';
  import LocInput from './LocInput.svelte';

  let { pack, disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  type Encounter = NonNullable<ExplorationRules['encounter']>;
  const lang = $derived(getLang());
  const rules = $derived(pack.kit?.exploration);
  const enc = $derived(rules?.encounter);
  // The rules of the system's content package: a copy here wins over them.
  const inherited = $derived(filesOf(pack.family ?? pack.id).find((f) => f.exploration)?.exploration);
  const names = $derived(rules?.watch?.names ?? []);
  const asLoc = (x: GenText | undefined) => x as string | Record<string, string> | undefined;
  // A whole number above zero; anything else — none.
  const count = (e: Event) => {
    const n = Number((e.currentTarget as HTMLInputElement).value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };

  function start() {
    pack.kit ??= { tables: {}, generators: [] };
    pack.kit.exploration = inherited ? $state.snapshot(inherited) : { turn: {}, watch: { names: namesOfText(t('sb.rules.defWatches'), [], lang) } };
  }
  const remove = () => {
    if (pack.kit) delete pack.kit.exploration;
  };
  function addEncounter() {
    rules!.encounter = { die: 6, results: [{ roll: 1, text: t('sb.rules.defEnc'), tone: 'hit' }], none: t('sb.rules.defNone') };
    (rules!.turn ??= {}).every = 3;
    rules!.turn.note = t('sb.rules.defNote');
  }
  function dropEncounter() {
    delete rules!.encounter;
    if (rules!.turn) delete rules!.turn.every;
    if (rules!.watch) delete rules!.watch.rolls;
  }
  function setEvery(e: Event) {
    const n = count(e);
    rules!.turn ??= {};
    if (n) rules!.turn.every = n;
    else delete rules!.turn.every;
  }
  function setUsageEvery(e: Event) {
    const n = count(e);
    rules!.turn ??= {};
    if (n) rules!.turn.usage = { every: n, text: rules!.turn.usage?.text ?? '' };
    else delete rules!.turn.usage;
  }
  function setNames(e: Event) {
    const list = namesOfText((e.currentTarget as HTMLTextAreaElement).value, names, lang);
    rules!.watch ??= {};
    if (list.length) rules!.watch.names = list;
    else delete rules!.watch.names;
    if (rules!.watch.rolls) rules!.watch.rolls = rules!.watch.rolls.filter((n) => n <= list.length);
  }
  function setRolls(n: number, on: boolean) {
    rules!.watch ??= {};
    const set = new Set(rules!.watch.rolls ?? []);
    if (on) set.add(n);
    else set.delete(n);
    rules!.watch.rolls = [...set].sort((a, b) => a - b);
  }
  function setDie(e: Event, x: { die: number }) {
    const n = count(e);
    if (n) x.die = n;
  }
  function addFace(x: Encounter) {
    const taken = x.results.map((r) => r.roll);
    let roll = 1;
    while (taken.includes(roll)) roll++;
    x.results.push({ roll, text: '' });
  }
  function setTone(r: Encounter['results'][number], v: string) {
    if (v === 'hit' || v === 'omen') r.tone = v;
    else delete r.tone;
  }
  function setHour(on: boolean) {
    if (on) enc!.hour = { die: 12, upTo: 2, text: t('sb.rules.defHour') };
    else delete enc!.hour;
  }
</script>

{#if !rules}
  <div class="rules">
    <p class="faint">{inherited ? t('sb.rules.fromPackage') : t('sb.rules.noClock')}</p>
    <div><button class="btn" {disabled} onclick={start}><Plus size={14} /> {inherited ? t('sb.rules.copy') : t('sb.rules.add')}</button></div>
  </div>
{:else}
  <div class="rules">
    <h4>{t('sb.rules.turns')}</h4>
    <label class="row"><span>{t('sb.rules.turnHint')}</span><LocInput {disabled} value={asLoc(rules.turn?.hint)} placeholder={t('sb.rules.turnHintPh')} set={(v) => ((rules.turn ??= {}).hint = v)} /></label>
    <label class="row"><span>{t('sb.rules.note')}</span><LocInput {disabled} value={asLoc(rules.turn?.note)} set={(v) => ((rules.turn ??= {}).note = v)} /></label>
    <div class="two">
      <label class="row"><span>{t('sb.rules.usageEvery')}</span><input class="short" type="number" min="1" {disabled} value={rules.turn?.usage?.every ?? ''} onchange={setUsageEvery} /></label>
      {#if rules.turn?.usage}
        {@const usage = rules.turn.usage}
        <label class="row grow"><span>{t('sb.rules.usageText')}</span><LocInput {disabled} value={asLoc(usage.text)} set={(v) => (usage.text = v)} /></label>
      {/if}
    </div>

    <h4>{t('sb.rules.watches')}</h4>
    <label class="row"><span>{t('sb.rules.watchNames')}</span><textarea rows={Math.max(2, names.length)} {disabled} value={names.map((n) => genText(n, lang)).join('\n')} onchange={setNames}></textarea></label>
    <label class="row"><span>{t('sb.rules.watchHint')}</span><LocInput {disabled} value={asLoc(rules.watch?.hint)} set={(v) => ((rules.watch ??= {}).hint = v)} /></label>
    <label class="row"><span>{t('sb.rules.note')}</span><LocInput {disabled} value={asLoc(rules.watch?.note)} set={(v) => ((rules.watch ??= {}).note = v)} /></label>

    <h4>{t('sb.rules.encounter')}</h4>
    {#if !enc}
      <p class="faint">{t('sb.rules.noEncounter')}</p>
      <button class="btn" {disabled} onclick={addEncounter}><Plus size={14} /> {t('sb.rules.add')}</button>
    {:else}
      <div class="two">
        <label class="row"><span>{t('sb.rules.die')}</span><input class="short" type="number" min="1" {disabled} value={enc.die} onchange={(e) => setDie(e, enc)} /></label>
        <label class="row"><span>{t('sb.rules.everyTurns')}</span><input class="short" type="number" min="1" {disabled} value={rules.turn?.every ?? ''} onchange={setEvery} /></label>
      </div>
      {#if names.length}
        <div class="row">
          <span>{t('sb.rules.onWatches')}</span>
          <div class="chips">
            {#each names as n, i (i)}
              <label class="check"><input type="checkbox" {disabled} checked={rules.watch?.rolls?.includes(i + 1) ?? false} onchange={(e) => setRolls(i + 1, e.currentTarget.checked)} /> {genText(n, lang)}</label>
            {/each}
          </div>
        </div>
      {/if}
      <div class="row">
        <span>{t('sb.rules.results')}</span>
        {#each enc.results as r, i (i)}
          <div class="two">
            <input class="tiny" type="number" min="1" title={t('sb.rules.face')} {disabled} value={r.roll} onchange={(e) => (r.roll = count(e) ?? r.roll)} />
            <div class="grow"><LocInput {disabled} value={asLoc(r.text)} placeholder={t('sb.rules.faceText')} set={(v) => (r.text = v)} /></div>
            <select {disabled} value={r.tone ?? ''} onchange={(e) => setTone(r, e.currentTarget.value)}>
              <option value="">{t('sb.rules.toneNone')}</option>
              <option value="hit">{t('sb.rules.toneHit')}</option>
              <option value="omen">{t('sb.rules.toneOmen')}</option>
            </select>
            <button class="icon-btn" {disabled} title={t('sb.rules.remove')} onclick={() => enc.results.splice(i, 1)}><Trash2 size={13} /></button>
          </div>
        {/each}
        <div><button class="btn" {disabled} onclick={() => addFace(enc)}><Plus size={14} /> {t('sb.rules.addFace')}</button></div>
      </div>
      <label class="row"><span>{t('sb.rules.none')}</span><LocInput {disabled} value={asLoc(enc.none)} set={(v) => (enc.none = v)} /></label>
      <label class="row"><span>{t('sb.rules.rollHint')}</span><LocInput {disabled} value={asLoc(enc.hint)} set={(v) => (enc.hint = v)} /></label>
      <label class="check"><input type="checkbox" {disabled} checked={!!enc.hour} onchange={(e) => setHour(e.currentTarget.checked)} /> {t('sb.rules.hour')}</label>
      {#if enc.hour}
        {@const hour = enc.hour}
        <div class="two">
          <label class="row"><span>{t('sb.rules.upTo')}</span><input class="short" type="number" min="1" {disabled} value={hour.upTo} onchange={(e) => (hour.upTo = count(e) ?? hour.upTo)} /></label>
          <label class="row"><span>{t('sb.rules.die')}</span><input class="short" type="number" min="1" {disabled} value={hour.die} onchange={(e) => setDie(e, hour)} /></label>
          <label class="row grow"><span>{t('sb.rules.hourText')}</span><LocInput {disabled} value={asLoc(hour.text)} set={(v) => (hour.text = v)} /></label>
        </div>
      {/if}
      <div><button class="btn" {disabled} onclick={dropEncounter}><Trash2 size={13} /> {t('sb.rules.remove')}</button></div>
    {/if}

    <div class="end"><button class="btn" {disabled} onclick={remove}><Trash2 size={13} /> {t('sb.rules.remove')}</button></div>
  </div>
{/if}

<style>
  .rules {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 0 10px 24px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  p {
    margin: 0;
    font-size: 12px;
  }
  h4 {
    margin: 6px 0 0;
    color: var(--text-muted);
    font-size: 12px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .row > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .row :global(input[type='text']),
  textarea {
    width: 100%;
  }
  .two {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-end;
  }
  .grow {
    flex: 1;
    min-width: 160px;
  }
  .grow :global(input) {
    width: 100%;
  }
  .short {
    width: 90px;
  }
  .tiny {
    width: 56px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .end {
    display: flex;
    justify-content: flex-end;
  }
</style>
