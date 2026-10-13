<!-- Вкладка «Персонажи»: портреты из папок characters и party, сгруппированные по папкам. У портрета может быть
     карточка NPC или лист персонажа (лежит рядом в той же папке): статблок и кнопка «в инициативу». Ниже — монстры
     приключения (карточки из его папок бестиария), чтобы накидывать их в бой отсюда же. -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { Search } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { caption, characterGroups } from '../library';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import PasteButton from '../../../renderer/lib/PasteButton.svelte';
  import Caption from './Caption.svelte';
  import CardBar from './CardBar.svelte';
  import ThumbSize from '../../../renderer/lib/ThumbSize.svelte';
  import { thumbs } from '../../../renderer/lib/thumbs.svelte';
  import { onMount } from 'svelte';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { folderRole } from '../../../shared/vault';
  import { Download } from '@lucide/svelte';
  import { connectCardNames } from './cardNames.svelte';
  import { ui } from './ui.svelte';
  import MonsterTile from './MonsterTile.svelte';
  import { monsterGroups } from './monsters';

  let { ms, app }: ModuleProps<'portraits'> = $props();

  onMount(connectCards);

  // Импорт персонажа сразу в папку партии текущего приключения (её создаёт проверка папок при запуске);
  // без текущего приключения — спросить, куда.
  let status = $state('');
  async function importCharacter() {
    const a = app.adventures.current;
    const party = a && app.vault.tree?.folders.find((f) => f.path === a)?.folders.find((f) => folderRole(f.name) === 'party');
    const text = await bestiary.importFiles(party ? { scope: 'vault', folder: party.path } : null);
    if (text) {
      status = text.replace(/\n/g, ' · ');
      setTimeout(() => (status = ''), 5000);
    }
  }
  onMount(connectCardNames);

  const groups = $derived(app.vault.tree ? characterGroups(app.vault.tree, app.vault.name, app.adventures) : []);
  const visible = $derived.by(() => {
    const q = ui.search.trim().toLowerCase();
    return groups
      .filter((g) => ui.group === 'all' || g.key === ui.group)
      .map((g) => ({ ...g, items: q ? g.items.filter((f) => caption(ms, f.path).toLowerCase().includes(q)) : g.items }))
      .filter((g) => g.items.length || !q);
  });
  const collapsed = $state<Record<string, boolean>>({});

  const monsters = $derived(monsterGroups(bestiary.all, app.adventures, app.vault.name, bestiary.filters.lang === 'all' ? 'ru' : bestiary.filters.lang));
  const visibleMonsters = $derived.by(() => {
    const q = ui.search.trim().toLowerCase();
    return monsters
      .filter((g) => ui.group === 'all' || g.key === ui.group)
      .map((g) => ({ ...g, items: q ? g.items.filter((c) => c.name.toLowerCase().includes(q)) : g.items }))
      .filter((g) => g.items.length);
  });
</script>

<div class="view">
  <header class="toolbar">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder="Поиск по имени" bind:value={ui.search} />
    </label>
    <PasteButton {app} role="characters" />
    <button
      class="btn"
      title="Персонаж игрока из Long Story Short (экспорт листа в JSON) или файл карточек Scrying Glass. Повторный импорт того же персонажа обновляет его лист"
      onclick={importCharacter}><Download size={14} /> Импорт персонажа…</button
    >
    {#if status}<span class="status">{status}</span>{/if}
    <div class="spacer"></div>
    <ThumbSize grid="portraits" />
  </header>

  {#if groups.length === 0 && monsters.length === 0}
    <div class="empty">
      <p>В хранилище пока нет папок с персонажами.</p>
      <p class="faint">
        Создайте папку <RoleFolderNames role="characters" /> в приключении или главе, и картинки из неё
        появятся здесь. Картинку из любой другой папки можно показать игрокам через «Файлы».
      </p>
    </div>
  {:else if visible.length === 0 && visibleMonsters.length === 0}
    <div class="empty faint">Ничего не найдено.</div>
  {/if}

  {#each visible as g (g.key)}
    <section>
      <button class="group-title" title={g.key} onclick={() => (collapsed[g.key] = !collapsed[g.key])}>
        {collapsed[g.key] ? '▸' : '▾'} {g.title} <span class="faint">{g.items.length}</span>
      </button>
      {#if !collapsed[g.key]}
        <div class="grid" style:--thumb="{thumbs.portraits}px">
          {#each g.items as f (f.path)}
            <ImageCard path={f.path} primary="portrait">
              <Caption path={f.path} />
              <CardBar path={f.path} name={caption(ms, f.path)} />
            </ImageCard>
          {/each}
        </div>
      {/if}
    </section>
  {/each}

  {#each visibleMonsters as g (g.key)}
    <section>
      <button class="group-title" onclick={() => (collapsed[g.key] = !collapsed[g.key])}>
        {collapsed[g.key] ? '▸' : '▾'} {g.title} <span class="faint">{g.items.length}</span>
      </button>
      {#if !collapsed[g.key]}
        <div class="grid" style:--thumb="{thumbs.portraits}px">
          {#each g.items as c (c.ref.id)}<MonsterTile card={c} />{/each}
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
  .status {
    padding: 4px 8px;
    border-radius: var(--radius-s);
    background: var(--accent-soft);
    font-size: 12px;
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
