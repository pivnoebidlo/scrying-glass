<!-- Над боковой панелью: текущее приключение, выбор другого и создание нового; экспорт и импорт приключения
     одним файлом (.sgpack). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Check, ChevronsUpDown, CloudUpload, Download, Globe, Map, Plus, Trash2, Upload, UserRoundPlus, UsersRound } from '@lucide/svelte';
  import { openRepo, repo } from '../../repo/ui/repo.svelte';
  import { currentSystem, roleFolderHere, shownAdventures, visibleIn } from '../../../shared/adventures';
  import SystemSelect from './SystemSelect.svelte';
  import { roleNames } from '../../../shared/vault';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms, app }: ModuleProps<'adventures'> = $props();

  let open = $state(false);
  let creating = $state(false);
  let name = $state('');
  // Система нового приключения: по умолчанию — как у текущего.
  let newSystem = $state('');
  const system = $derived(currentSystem(ms));

  // Приключения отключённых систем скрыты (настройки «Приключения» → «Ролевые системы»).
  const list = $derived(shownAdventures(ms));
  const hidden = $derived(ms.list.length - list.length);
  const title = $derived(ms.current ?? (list.length ? t('adv.allVault') : app.vault.name));

  function select(path: string | null) {
    dispatch('adventures', 'select', { path });
    open = false;
  }

  // Экспорт и импорт идут долго (картинки, музыка): показываем, что работа идёт, и чем закончилась.
  let busy = $state('');
  let done = $state('');
  function flash(text: string) {
    done = text;
    setTimeout(() => (done = ''), 6000);
  }

  async function exportCurrent() {
    if (!ms.current) return;
    open = false;
    busy = t('adv.exporting', { name: ms.current ?? '' });
    try {
      const file = await window.api.exportAdventure(ms.current);
      if (file) flash(t('adv.exported'));
    } catch (e) {
      flash(t('adv.failed', { error: String(e) }));
    } finally {
      busy = '';
    }
  }

  // Импорт: выбрать файл; если такое приключение уже есть — спросить другое название (окно ниже).
  let asking = $state<{ file: string; name: string } | null>(null);
  let newName = $state('');
  let nameFree = $state(true);
  $effect(() => {
    const n = newName;
    if (!asking) return;
    let stale = false;
    window.api.adventureNameFree(n).then((ok) => !stale && (nameFree = ok));
    return () => (stale = true);
  });

  async function importPack() {
    open = false;
    try {
      const p = await window.api.pickAdventurePack();
      if (!p) return;
      if (p.exists) {
        asking = { file: p.file, name: p.name };
        newName = p.suggestion;
        return;
      }
      await runImport(p.file, p.name);
    } catch (e) {
      flash(t('adv.failed', { error: String(e) }));
    }
  }

  async function runImport(file: string, name: string) {
    asking = null;
    busy = t('adv.importing');
    try {
      const r = await window.api.importAdventure(file, name);
      if (r) flash(t('adv.imported', { name: r.name, scenes: r.scenes, encounters: r.encounters, cards: r.cards ? t('adv.importedCards', { count: r.cards }) : '' }));
    } catch (e) {
      flash(t('adv.failed', { error: String(e) }));
    } finally {
      busy = '';
    }
  }

  async function remove() {
    if (!ms.current) return;
    const name = ms.current;
    open = false;
    if (await window.api.deleteAdventure(name)) flash(t('adv.deleted', { name }));
  }

  // Персонажи игроков текущего приключения (или всего хранилища) — одним файлом карточек с портретами.
  async function exportParty() {
    open = false;
    await connectCards();
    const party = bestiary.all.filter((c) => c.kind === 'character' && c.ref.scope === 'vault' && c.folder !== undefined && visibleIn(ms, c.folder));
    if (!party.length) return flash(t('adv.noParty'));
    const n = await window.api.exportCards({ refs: party.map((c) => $state.snapshot(c.ref)), name: t('adv.partyFile', { name: ms.current ?? app.vault.name }) });
    if (n) flash(t('adv.exportedChars', { count: n }));
  }

  // Карточки персонажей (файл экспорта или выгрузка Long Story Short) — в папку партии текущего приключения.
  async function importParty() {
    open = false;
    const tree = app.vault.tree;
    const here = tree ? roleFolderHere(tree, ms, 'party') : null;
    const name = roleNames().party[0]!;
    const folder = here?.path ?? (ms.current ? `${ms.current}/${name}` : name);
    const msg = await bestiary.importFiles({ scope: 'vault', folder });
    if (msg) flash(msg.replace(/\n/g, '; '));
  }

  async function create() {
    if (!name.trim()) return;
    await dispatch('adventures', 'create', { name, system: newSystem || system });
    name = '';
    creating = false;
    open = false;
  }
</script>

<div class="switcher">
  <button class="current" title={t('adv.currentHint')} onclick={() => (open = !open)}>
    <Map size={14} />
    <span class="name">{title}</span>
    <ChevronsUpDown size={13} />
  </button>

  {#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="backdrop" onclick={() => ((open = false), (creating = false))}></div>
    <div class="menu">
      {#each list as a (a)}
        <button onclick={() => select(a)}>
          <span class="mark">{#if ms.current === a}<Check size={13} />{/if}</span>
          {a}
        </button>
      {/each}
      <button onclick={() => select(null)} title={t('adv.allHint')}>
        <span class="mark">{#if ms.current === null}<Check size={13} />{/if}</span>
        <span class="muted">{t('adv.allVault')}</span>
      </button>
      {#if hidden}<p class="hint faint">{t('adv.hiddenN', { count: hidden })}</p>{/if}
      <label class="system" title={ms.current ? t('adv.systemHintAdv') : t('adv.systemHintVault')}>
        <span class="faint">{t('adv.system')}</span>
        <SystemSelect value={system} onchange={(v) => dispatch('adventures', 'setSystem', { path: ms.current, system: v })} />
      </label>
      <div class="sep"></div>
      {#if creating}
        <form class="create" onsubmit={(e) => (e.preventDefault(), create())}>
          <!-- svelte-ignore a11y_autofocus -->
          <input type="text" placeholder={t('adv.namePlaceholder')} bind:value={name} autofocus />
          <button class="btn primary" type="submit" disabled={!name.trim()}>{t('adv.create')}</button>
        </form>
        <label class="system"><span class="faint">{t('adv.system')}</span><SystemSelect value={newSystem || system} onchange={(v) => (newSystem = v)} /></label>
        <p class="hint faint">{t('adv.foldersHint')}</p>
      {:else}
        <button onclick={() => (creating = true)}><span class="mark"><Plus size={13} /></span> {t('adv.createAdventure')}</button>
      {/if}
      <p class="hint faint">{t('adv.markHint')}</p>
      <div class="sep"></div>
      {#if ms.current}
        <button onclick={exportCurrent} title={t('adv.exportHint')}>
          <span class="mark"><Download size={13} /></span> {t('adv.export', { name: ms.current ?? '' })}
        </button>
      {/if}
      <button onclick={importPack} title={t('adv.importHint')}><span class="mark"><Upload size={13} /></span> {t('adv.import')}</button>
      <div class="sep"></div>
      {#if ms.current}
        {@const name = ms.current}
        <button onclick={() => ((open = false), (repo.publish = name))} title={t('repo.menuPublishHint')}>
          <span class="mark"><CloudUpload size={13} /></span> {t(app.repo.published[name] ? 'repo.menuUpdate' : 'repo.menuPublish', { name })}
        </button>
      {/if}
      <button onclick={() => ((open = false), openRepo())} title={t('repo.menuBrowseHint')}><span class="mark"><Globe size={13} /></span> {t('repo.menuBrowse')}</button>
      <div class="sep"></div>
      {#if ms.current}
        <button class="danger" onclick={remove} title={t('adv.deleteHint')}>
          <span class="mark"><Trash2 size={13} /></span> {t('adv.delete', { name: ms.current ?? '' })}
        </button>
      {/if}
      <div class="sep"></div>
      <button onclick={exportParty} title={t('adv.exportPartyHint')}><span class="mark"><UsersRound size={13} /></span> {t('adv.exportParty')}</button>
      <button onclick={importParty} title={t('adv.importPartyHint')}>
        <span class="mark"><UserRoundPlus size={13} /></span> {t('adv.importParty')}
      </button>
    </div>
  {/if}
  {#if busy || done}<p class="status">{busy || done}</p>{/if}
</div>

{#if asking}
  {@const a = asking}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="modal-back" onclick={(e) => e.target === e.currentTarget && (asking = null)}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), nameFree && newName.trim() && runImport(a.file, newName))}>
      <h3>{t('adv.exists', { name: a.name })}</h3>
      <p class="faint">{t('adv.renameAsk')}</p>
      <!-- svelte-ignore a11y_autofocus -->
      <input type="text" bind:value={newName} autofocus />
      {#if !nameFree && newName.trim()}<p class="warn">{t('adv.taken')}</p>{/if}
      <div class="row">
        <button class="btn" type="button" onclick={() => (asking = null)}>{t('adv.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!nameFree || !newName.trim()}>{t('adv.doImport')}</button>
      </div>
    </form>
  </div>
{/if}

<style>
  .system {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    font-size: 12px;
  }
  .system :global(select) {
    flex: 1;
    min-width: 0;
  }
  .danger:hover {
    color: var(--danger, #e04545);
  }
  .modal-back {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    width: 380px;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  .modal h3 {
    margin: 0 0 6px;
    font-size: 15px;
  }
  .modal p {
    margin: 0 0 10px;
    font-size: 13px;
  }
  .modal input {
    width: 100%;
  }
  .modal .warn {
    margin-top: 6px;
    color: var(--warning);
  }
  .modal .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }
  .status {
    margin: 6px 4px 0;
    color: var(--accent);
    font-size: 12px;
  }
  .switcher {
    position: relative;
    padding: 8px 8px 0;
  }
  .current {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    color: var(--text-normal);
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .current:hover {
    border-color: var(--accent);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 19;
  }
  .menu {
    position: absolute;
    top: 44px;
    left: 8px;
    right: -60px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  .menu > button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .menu > button:hover {
    background: var(--bg-hover);
  }
  .mark {
    display: inline-flex;
    width: 14px;
    color: var(--accent);
  }
  .sep {
    height: 1px;
    margin: 4px 0;
    background: var(--border);
  }
  .create {
    display: flex;
    gap: 6px;
    padding: 4px;
  }
  .create input {
    flex: 1;
    min-width: 0;
  }
  .hint {
    margin: 2px 8px 4px;
    font-size: 11px;
  }
</style>
