<!-- Settings → Telegram: the bot token, its status, the chats it knows (on/off, whose player). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { sortChats } from '../../../shared/telegram';
  import { loadTg, prefs, setEnterSends, tg } from './tg.svelte';

  // Standard module props; nothing here uses them.
  let {}: ModuleProps<'telegram'> = $props();
  onMount(() => void loadTg());
  let token = $state('');
  let busy = $state(false);

  async function save() {
    busy = true;
    tg.status = await window.api.setTelegramToken(token.trim());
    token = '';
    busy = false;
  }
  async function remove() {
    if (!confirm(t('tg.removeConfirm'))) return;
    tg.status = await window.api.setTelegramToken(null);
  }
  const s = $derived(tg.status);

  // Tables: add, rename, remove (its chats become chats of no table).
  let tableName = $state('');
  async function addTable() {
    const name = tableName.trim();
    if (!name || !s) return;
    tg.status = await window.api.setTelegramTables([...$state.snapshot(s.tables), { id: crypto.randomUUID(), name }]);
    tableName = '';
  }
  const renameTable = async (id: string, name: string) =>
    s && name.trim() && (tg.status = await window.api.setTelegramTables(s.tables.map((x) => (x.id === id ? { ...x, name: name.trim() } : $state.snapshot(x)))));
  async function removeTable(id: string) {
    if (!s || !confirm(t('tg.tableRemoveAsk'))) return;
    tg.status = await window.api.setTelegramTables(s.tables.filter((x) => x.id !== id).map((x) => $state.snapshot(x)));
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('tg.token')}</div>
    <div class="desc">{t('tg.settingsAbout')}</div>
    {#if s?.configured}
      <div class="desc status">
        {#if s.error}<span class="err">{t('tg.error', { error: s.error })}</span>
        {:else if s.bot}{t('tg.connected', { bot: s.bot })}
        {:else}{t('tg.connecting')}{/if}
      </div>
    {/if}
  </div>
</div>
<div class="row">
  <input type="password" autocomplete="off" placeholder={s?.configured ? '••••••••' : t('tg.tokenPh')} bind:value={token} />
  <button class="btn primary" disabled={busy || !token.trim()} onclick={save}>{t('tg.save')}</button>
  {#if s?.configured}<button class="btn" onclick={remove}>{t('tg.remove')}</button>{/if}
</div>

{#if s?.configured}
  <div class="setting">
    <div class="info">
      <div class="name">{t('tg.sendKey')}</div>
      <div class="desc">{t('tg.sendKeyDesc')}</div>
    </div>
    <select value={prefs.enterSends ? 'enter' : 'mod'} onchange={(e) => setEnterSends(e.currentTarget.value === 'enter')}>
      <option value="enter">{t('tg.sendKey.enter')}</option>
      <option value="mod">{t('tg.sendKey.mod')}</option>
    </select>
  </div>
  <h3>{t('tg.tables')}</h3>
  <p class="faint">{t('tg.tablesAbout')}</p>
  {#if s.tables.length}
    <ul>
      {#each s.tables as x (x.id)}
        <li>
          <input class="tname" type="text" value={x.name} onchange={(e) => renameTable(x.id, e.currentTarget.value)} />
          <span class="faint">{t('tg.tableChats', { count: s.chats.filter((c) => c.table === x.id).length })}</span>
          <button class="icon-btn" title={t('tg.tableRemove')} onclick={() => removeTable(x.id)}><X size={13} /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <div class="row">
    <input type="text" placeholder={t('tg.tablePh')} bind:value={tableName} onkeydown={(e) => e.key === 'Enter' && addTable()} />
    <button class="btn" disabled={!tableName.trim()} onclick={addTable}><Plus size={14} /> {t('tg.tableAdd')}</button>
  </div>

  <h3>{t('tg.chats')}</h3>
  <p class="faint">{t('tg.chatsAbout', { bot: s.bot ?? '…' })}</p>
  {#if s.chats.length}
    <ul>
      {#each sortChats(s.chats) as c (c.id)}
        <li class:off={!c.enabled}>
          <label class="on" title={t('tg.enabled')}>
            <input type="checkbox" checked={c.enabled} onchange={async (e) => (tg.status = await window.api.updateTelegramChat(c.id, { enabled: e.currentTarget.checked }))} />
          </label>
          <span class="title">{c.title} <span class="faint">· {c.kind === 'group' ? t('tg.group') : t('tg.private')}</span></span>
          {#if c.kind === 'private'}
            <input
              class="label"
              type="text"
              title={t('tg.labelHint')}
              placeholder={t('tg.labelPh')}
              value={c.label ?? ''}
              onchange={async (e) => (tg.status = await window.api.updateTelegramChat(c.id, { label: e.currentTarget.value.trim() || undefined }))}
            />
          {/if}
          {#if s.tables.length}
            <select class="ctable" title={t('tg.chatTable')} value={c.table ?? ''} onchange={async (e) => (tg.status = await window.api.updateTelegramChat(c.id, { table: e.currentTarget.value }))}>
              <option value="">{t('tg.noTable')}</option>
              {#each s.tables as x (x.id)}<option value={x.id}>{x.name}</option>{/each}
            </select>
          {/if}
          <button class="icon-btn" title={t('tg.forget')} onclick={async () => (tg.status = await window.api.forgetTelegramChat(c.id))}><X size={13} /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="faint">{t('tg.noChats')}</p>
  {/if}
{/if}

<style>
  .row {
    display: flex;
    gap: 8px;
    margin: 4px 0 16px;
  }
  .row input {
    flex: 1;
    min-width: 0;
  }
  .status {
    color: var(--text-normal);
  }
  .err {
    color: var(--text-error, #e5534b);
  }
  h3 {
    margin: 8px 0 4px;
    font-size: 14px;
  }
  ul {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }
  li.off .title {
    color: var(--text-muted);
  }
  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .label {
    width: 140px;
  }
  .tname {
    flex: 1;
  }
  .ctable {
    max-width: 160px;
  }
</style>
