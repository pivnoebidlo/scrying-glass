<!-- Над боковой панелью: текущее приключение, выбор другого и создание нового; экспорт и импорт приключения
     одним файлом (.sgpack). -->
<script lang="ts">
  import { Check, ChevronsUpDown, Download, Map, Plus, Upload, UserRoundPlus, UsersRound } from '@lucide/svelte';
  import { roleFolderHere, visibleIn } from '../../../shared/adventures';
  import { roleNames } from '../../../shared/vault';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms, app }: ModuleProps<'adventures'> = $props();

  let open = $state(false);
  let creating = $state(false);
  let name = $state('');

  const title = $derived(ms.current ?? (ms.list.length ? 'Всё хранилище' : app.vault.name));

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
    busy = `Экспорт «${ms.current}»…`;
    try {
      const file = await window.api.exportAdventure(ms.current);
      if (file) flash('Приключение сохранено в файл.');
    } catch (e) {
      flash(`Не удалось: ${String(e)}`);
    } finally {
      busy = '';
    }
  }

  async function importPack() {
    open = false;
    busy = 'Импорт приключения…';
    try {
      const r = await window.api.importAdventure();
      if (r) flash(`Импортировано «${r.name}»${r.renamed ? ' (такое название уже было)' : ''}: сцен ${r.scenes}, заготовок боёв ${r.encounters}${r.cards ? `, общих карточек ${r.cards}` : ''}.`);
    } catch (e) {
      flash(`Не удалось: ${String(e)}`);
    } finally {
      busy = '';
    }
  }

  // Персонажи игроков текущего приключения (или всего хранилища) — одним файлом карточек с портретами.
  async function exportParty() {
    open = false;
    await connectCards();
    const party = bestiary.all.filter((c) => c.kind === 'character' && c.ref.scope === 'vault' && c.folder !== undefined && visibleIn(ms, c.folder));
    if (!party.length) return flash('Персонажей игроков здесь нет: их листы лежат в папках партии.');
    const n = await window.api.exportCards({ refs: party.map((c) => $state.snapshot(c.ref)), name: `Партия — ${ms.current ?? app.vault.name}` });
    if (n) flash(`Экспортировано персонажей: ${n}.`);
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
    await dispatch('adventures', 'create', { name });
    name = '';
    creating = false;
    open = false;
  }
</script>

<div class="switcher">
  <button class="current" title="Приключение: вкладки показывают его и общее содержимое хранилища" onclick={() => (open = !open)}>
    <Map size={14} />
    <span class="name">{title}</span>
    <ChevronsUpDown size={13} />
  </button>

  {#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="backdrop" onclick={() => ((open = false), (creating = false))}></div>
    <div class="menu">
      {#each ms.list as a (a)}
        <button onclick={() => select(a)}>
          <span class="mark">{#if ms.current === a}<Check size={13} />{/if}</span>
          {a}
        </button>
      {/each}
      <button onclick={() => select(null)} title="Показывать содержимое всех приключений сразу">
        <span class="mark">{#if ms.current === null}<Check size={13} />{/if}</span>
        <span class="muted">Всё хранилище</span>
      </button>
      <div class="sep"></div>
      {#if creating}
        <form class="create" onsubmit={(e) => (e.preventDefault(), create())}>
          <!-- svelte-ignore a11y_autofocus -->
          <input type="text" placeholder="Название приключения" bind:value={name} autofocus />
          <button class="btn primary" type="submit" disabled={!name.trim()}>Создать</button>
        </form>
        <p class="hint faint">Появится папка с подпапками characters, monsters, backgrounds, maps, music.</p>
      {:else}
        <button onclick={() => (creating = true)}><span class="mark"><Plus size={13} /></span> Создать приключение…</button>
      {/if}
      <p class="hint faint">Сделать приключением существующую папку можно во вкладке «Файлы».</p>
      <div class="sep"></div>
      {#if ms.current}
        <button onclick={exportCurrent} title="Папка приключения, его сцены, карты, заготовки боёв и нужные общие карточки — одним файлом">
          <span class="mark"><Download size={13} /></span> Экспорт «{ms.current}»…
        </button>
      {/if}
      <button onclick={importPack} title="Добавить приключение из файла .sgpack"><span class="mark"><Upload size={13} /></span> Импорт приключения…</button>
      <div class="sep"></div>
      <button onclick={exportParty} title="Листы персонажей игроков с портретами — одним файлом"><span class="mark"><UsersRound size={13} /></span> Экспорт партии…</button>
      <button onclick={importParty} title="Файл карточек или выгрузка Long Story Short — в папку партии приключения">
        <span class="mark"><UserRoundPlus size={13} /></span> Импорт персонажей…
      </button>
    </div>
  {/if}
  {#if busy || done}<p class="status">{busy || done}</p>{/if}
</div>

<style>
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
