<!-- Настройка «Назначение папок»: по каким названиям папка считается портретами, картами и т. д. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { DEFAULT_ROLES, roleName, type FolderRole, type RoleNames, type VaultState } from '../../../shared/vault';
  import { ROLE_ICONS } from './ui.svelte';

  let { ms }: { ms: VaultState } = $props();

  const ROLES: { role: FolderRole; title: string; desc: string }[] = [
    { role: 'characters', title: 'Персонажи', desc: 'Портреты и карточки NPC.' },
    { role: 'party', title: 'Партия', desc: 'Персонажи игроков: портреты и листы.' },
    { role: 'bestiary', title: 'Бестиарий', desc: 'Карточки монстров и картинки к ним.' },
    { role: 'backgrounds', title: 'Фоны', desc: 'Картинки во весь экран.' },
    { role: 'handouts', title: 'Раздатка', desc: 'Записки, письма, улики.' },
    { role: 'maps', title: 'Карты', desc: 'Карты с туманом войны.' },
    { role: 'music', title: 'Музыка', desc: 'Музыка и атмосфера.' },
  ];
  const titleOf = (role: FolderRole) => ROLES.find((r) => r.role === role)!.title;

  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  const customized = $derived(ROLES.some(({ role }) => !same(ms.roles[role], DEFAULT_ROLES[role])));

  // Что набрано в поле каждой роли и ошибка под ним.
  let drafts = $state<Partial<Record<FolderRole, string>>>({});
  let errors = $state<Partial<Record<FolderRole, string>>>({});

  // В настройках храним только изменённые роли: остальные пусть следуют названиям по умолчанию.
  function save(role: FolderRole, names: string[]) {
    const all: RoleNames = { ...ms.roles, [role]: names };
    const roles = Object.fromEntries(Object.entries(all).filter(([r, n]) => !same(n, DEFAULT_ROLES[r as FolderRole])));
    dispatch('vault', 'setRoles', { roles: Object.keys(roles).length ? roles : null });
  }

  function add(role: FolderRole) {
    const name = roleName(drafts[role] ?? '');
    errors[role] = '';
    if (!name) return;
    if (/[/\\]/.test(name)) return void (errors[role] = 'Название папки не может содержать «/».');
    const other = ROLES.find((r) => ms.roles[r.role].includes(name));
    if (other) {
      errors[role] = other.role === role ? `«${name}» уже есть.` : `«${name}» уже означает «${titleOf(other.role)}».`;
      return;
    }
    drafts[role] = '';
    save(role, [...ms.roles[role], name]);
  }

  const remove = (role: FolderRole, name: string) => save(role, ms.roles[role].filter((n) => n !== name));
  const makeMain = (role: FolderRole, name: string) => save(role, [name, ...ms.roles[role].filter((n) => n !== name)]);
</script>

<h3>Назначение папок</h3>
<div class="intro">
  Папка с одним из этих названий (на любой глубине, регистр не важен) попадает в свою вкладку. Первое название —
  основное: так приложение называет папки, которые создаёт само (стандартные папки приключения, новая папка
  бестиария). Чтобы сделать название основным, нажмите на него.
  {#if customized}
    <button class="btn reset" onclick={() => dispatch('vault', 'setRoles', { roles: null })}>Вернуть по умолчанию</button>
  {/if}
</div>

{#each ROLES as { role, title, desc } (role)}
  {@const Icon = ROLE_ICONS[role]}
  {@const names = ms.roles[role]}
  <div class="setting role">
    <div class="info">
      <div class="name"><Icon size={14} /> {title}</div>
      <div class="desc">{desc}</div>
    </div>
    <div class="names">
      <div class="chips">
        {#each names as name, i (name)}
          <span class="chip" class:main={i === 0}>
            <button
              class="label"
              title={i === 0 ? 'Основное название' : 'Сделать основным'}
              disabled={i === 0}
              onclick={() => makeMain(role, name)}>{name}</button
            >
            {#if names.length > 1}
              <button class="x" title="Убрать" onclick={() => remove(role, name)}><X size={11} /></button>
            {/if}
          </span>
        {/each}
        <input
          type="text"
          placeholder="Добавить…"
          bind:value={drafts[role]}
          onkeydown={(e) => e.key === 'Enter' && add(role)}
          onblur={() => add(role)}
        />
      </div>
      {#if errors[role]}<div class="error">{errors[role]}</div>{/if}
    </div>
  </div>
{/each}

<style>
  .intro {
    margin-bottom: 8px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .reset {
    display: block;
    margin-top: 8px;
  }
  .role {
    align-items: flex-start !important;
  }
  .role .info {
    flex: 0 0 180px !important;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .names {
    flex: 1;
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
  }
  .chip.main {
    border-color: var(--accent);
  }
  .chip button {
    border: 0;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
  }
  .label {
    padding: 2px 6px;
  }
  .label:disabled {
    cursor: default;
  }
  .chip:not(.main) .label:hover {
    color: var(--accent);
  }
  .x {
    display: grid;
    place-items: center;
    padding: 2px 4px 2px 0;
    color: var(--text-muted) !important;
  }
  .x:hover {
    color: var(--danger) !important;
  }
  input {
    width: 110px;
    padding: 2px 6px;
  }
  .error {
    margin-top: 4px;
    color: var(--danger);
    font-size: 12px;
  }
</style>
