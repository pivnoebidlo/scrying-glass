<!-- Вкладка «Раздатка»: записки, улики и письма из папок handouts / раздатка / улики, сгруппированные по приключениям.
     Показать игрокам поверх всего — кнопками на плитке; название под картинкой правится (файл переименуется). Записки (сделанные
     в «Инструментах») лежат в тех же папках и стоят в том же порядке, что и картинки. -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { FilePlus2, Search } from '@lucide/svelte';
  import { allFiles, findFolder } from '../../../shared/vault';
  import { createNote } from '../../../renderer/lib/note/notes.svelte';
  import NoteCard from '../../tools/ui/NoteCard.svelte';
  import { editNote } from '../../tools/ui/ui.svelte';
  import { noteTitle } from '../../../shared/notes';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import NameField from '../../../renderer/lib/NameField.svelte';
  import PasteButton from '../../../renderer/lib/PasteButton.svelte';
  import { prettyName } from '../../../shared/vault';
  import { imageGroups } from '../../portraits/library';
  import { sortable } from '../../../renderer/lib/sortable';
  import { applyOrder } from '../../../shared/order';
  import { ui } from './ui.svelte';
  import ThumbSize from '../../../renderer/lib/ThumbSize.svelte';
  import { thumbs } from '../../../renderer/lib/thumbs.svelte';

  let { app }: ModuleProps<'handouts'> = $props();

  const groups = $derived(
    (app.vault.tree ? imageGroups(app.vault.tree, app.vault.name, 'handouts', app.adventures) : []).map((g) => {
      const folder = findFolder(app.vault.tree!, g.key);
      const notes = folder ? allFiles(folder, 'note') : [];
      return { ...g, items: applyOrder([...notes, ...g.items], (f) => f.path, app.order.groups[g.key]) };
    })
  );
  const label = (path: string, kind: string) => (kind === 'note' ? noteTitle(path) : prettyName(path));

  async function newNote() {
    const path = await createNote(app.vault.tree, app.adventures);
    if (path) editNote(path);
  }
  const visible = $derived.by(() => {
    const q = ui.search.trim().toLowerCase();
    return groups
      .filter((g) => ui.group === 'all' || g.key === ui.group)
      .map((g) => ({ ...g, items: q ? g.items.filter((f) => label(f.path, f.kind).toLowerCase().includes(q)) : g.items }))
      .filter((g) => g.items.length || !q);
  });
  const collapsed = $state<Record<string, boolean>>({});
</script>

<div class="view">
  <header class="toolbar">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder="Поиск по названию" bind:value={ui.search} />
    </label>
    <PasteButton {app} role="handouts" />
    <button class="btn" title="Письмо, приказ, объявление — текст на пергаменте (редактор в «Инструментах»)" onclick={newNote}><FilePlus2 size={14} /> Новая записка</button>
    <div class="spacer"></div>
    <ThumbSize grid="handouts" />
  </header>

  {#if groups.length === 0}
    <div class="empty">
      <p>В хранилище пока нет папок с раздаточными материалами.</p>
      <p class="faint">
        Создайте папку <RoleFolderNames role="handouts" /> в приключении или главе, и
        картинки из неё появятся здесь. Любую другую картинку можно показать раздаткой через «Файлы».
      </p>
    </div>
  {:else if visible.length === 0}
    <div class="empty faint">Ничего не найдено.</div>
  {/if}

  {#each visible as g (g.key)}
    <section>
      <button class="group-title" title={g.key} onclick={() => (collapsed[g.key] = !collapsed[g.key])}>
        {collapsed[g.key] ? '▸' : '▾'} {g.title} <span class="faint">{g.items.length}</span>
      </button>
      {#if !collapsed[g.key]}
        <div class="grid" style:--thumb="{thumbs.handouts}px">
          {#each g.items as f (f.path)}
            <div use:sortable={{ group: g.key, id: f.path, ids: g.items.map((x) => x.path), disabled: !!ui.search.trim(), file: f.path }}>
              {#if f.kind === 'note'}
                <NoteCard path={f.path} />
              {:else}
                <ImageCard path={f.path} primary="handout" aspect="3 / 4">
                  <NameField value={prettyName(f.path)} title="Переименовать файл" onrename={(name) => window.api.renameFile(f.path, name)} />
                </ImageCard>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .view {
    padding: 0 20px 20px;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 12px 0;
    background: var(--bg-primary);
  }
  .spacer {
    flex: 1;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    color: var(--text-faint);
  }
  .search:focus-within {
    border-color: var(--accent);
  }
  .search {
    flex: 0 1 220px;
    min-width: 120px;
  }
  .search input {
    width: 100%;
    min-width: 0;
    border: 0;
    padding: 5px 0;
    background: none;
  }
  .group-title {
    margin: 14px 0 10px;
    padding: 0;
    border: 0;
    background: none;
    font-weight: 600;
    cursor: pointer;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--thumb), 1fr));
    gap: 12px;
  }
  .empty {
    max-width: 460px;
    margin: 40px auto;
    text-align: center;
  }
</style>
