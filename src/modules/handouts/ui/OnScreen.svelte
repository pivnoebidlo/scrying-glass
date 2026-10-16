<!-- Правая панель: раздатка под рукой (подборка) — картинки, записки, записи справочника. Щелчок выводит игрокам
     (поверх всего), ещё щелчок — убирает. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Pencil } from '@lucide/svelte';
  import { editNote } from '../../tools/ui/ui.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { prettyName } from '../../../shared/vault';
  import { isNotePath, noteTitle } from '../../../shared/notes';
  import type { Entry } from '../../../shared/compendium';
  import { forPlayers } from '../../../renderer/lib/entry/types.svelte';
  import { entryAt } from '../../compendium/ui/store.svelte';
  import Tray from '../../scenes/ui/Tray.svelte';

  let { ms, app }: ModuleProps<'handouts'> = $props();

  const caption = (p: string) => (isNotePath(p) ? noteTitle(p) : (entryAt(p)?.entry.title ?? prettyName(p)));

  function toggle(path: string) {
    const e = !isNotePath(path) && /\.md$|^srd:/i.test(path) ? entryAt(path) : undefined;
    if (e && ms.current !== path) return dispatch('handouts', 'toggleEntry', { path, entry: forPlayers($state.snapshot(e.entry) as Entry) });
    return dispatch('handouts', 'toggle', { path });
  }
</script>

<Tray
  {app}
  part="handout"
  prefer="handouts"
  kinds={['image', 'note', 'entry']}
  {caption}
  isOn={(p) => ms.current === p}
  {toggle}
  hint={t('handouts.trayHint')}
>
  {#if ms.current && isNotePath(ms.current)}
    {@const p = ms.current}
    <div class="row">
      <span class="name" title={p}>{noteTitle(p)}</span>
      <button class="icon-btn" title={t('handouts.editNote')} onclick={() => editNote(p)}><Pencil size={14} /></button>
    </div>
  {/if}
</Tray>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
