<!-- Правая панель: раздатка под рукой (подборка) — картинки, записки, записи справочника. Щелчок выводит игрокам
     (поверх всего), ещё щелчок — убирает. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Pencil, Send } from '@lucide/svelte';
  import { entryToTelegram } from '../../../shared/telegram';
  import { typeDef } from '../../../renderer/lib/entry/types.svelte';
  import { sendToTelegram, tgReady } from '../../telegram/ui/tg.svelte';
  import { editNote } from '../../tools/ui/ui.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { prettyName } from '../../../shared/vault';
  import { isNotePath as isNote, noteTitle } from '../../../shared/notes';
  import { isSketchPath, sketchTitle } from '../../../shared/sketch';
  // Notes and canvases: made in the app, edited in «Tools».
  const isNotePath = (p: string) => isNote(p) || isSketchPath(p);
  import type { Entry } from '../../../shared/compendium';
  import { forPlayers } from '../../../renderer/lib/entry/types.svelte';
  import { entryAt } from '../../compendium/ui/store.svelte';
  import Tray from '../../scenes/ui/Tray.svelte';

  let { ms, app }: ModuleProps<'handouts'> = $props();

  const caption = (p: string) => (isSketchPath(p) ? sketchTitle(p) : isNote(p) ? noteTitle(p) : (entryAt(p)?.entry.title ?? prettyName(p)));

  // What the players see now goes to Telegram: a picture as it is, a note as a picture, an entry as text.
  function send(path: string) {
    if (isNotePath(path)) return sendToTelegram({ kind: 'note', path, title: caption(path) });
    const e = entryAt(path)?.entry ?? (ms.entry ? ($state.snapshot(ms.entry) as Entry) : null);
    if (e && /\.md$|^srd:/i.test(path)) return sendToTelegram({ kind: 'text', title: e.title, html: entryToTelegram(e, e.def ?? typeDef(e.type)) });
    sendToTelegram({ kind: 'file', path, title: prettyName(path) });
  }

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
  kinds={['image', 'note', 'sketch', 'entry']}
  {caption}
  isOn={(p) => ms.current === p}
  {toggle}
  hint={t('handouts.trayHint')}
>
  {#if ms.current && (isNotePath(ms.current) || tgReady())}
    {@const p = ms.current}
    <div class="row">
      <span class="name" title={p}>{caption(p)}</span>
      {#if tgReady()}<button class="icon-btn" title={t('tg.sendShown')} onclick={() => send(p)}><Send size={14} /></button>{/if}
      {#if isNotePath(p)}<button class="icon-btn" title={t('handouts.editNote')} onclick={() => editNote(p)}><Pencil size={14} /></button>{/if}
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
