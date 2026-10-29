<!-- «New system»: what it starts from — a blank pack or a small working one of a kind of game (templates.ts); the
     examples say which games play so. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { TEMPLATES, type TemplateId } from './templates';

  let { onpick, onclose }: { onpick: (id: TemplateId) => void; onclose: () => void } = $props();
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={t('sb.new')}>
    <h3>{t('sb.new')}</h3>
    <p class="faint">{t('sb.tplAbout')}</p>
    <div class="cards">
      {#each TEMPLATES as id (id)}
        <button class="tpl" onclick={() => onpick(id)}>
          <b>{t(`sb.tpl.${id}`)}</b>
          <small>{t(`sb.tplWhat.${id}`)}</small>
          {#if id !== 'blank'}<span class="eg">{t('sb.tplLike', { games: t(`sb.tplEg.${id}`) })}</span>{/if}
        </button>
      {/each}
    </div>
    <div class="acts"><button class="btn" onclick={onclose}>{t('sb.cancel')}</button></div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.45);
    -webkit-app-region: no-drag;
  }
  .modal {
    width: min(720px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
  }
  h3 {
    margin: 0 0 4px;
    font-size: 16px;
  }
  p {
    margin: 0 0 12px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
  }
  .tpl {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: inherit;
    text-align: left;
  }
  .tpl:hover {
    border-color: var(--accent);
  }
  .tpl small {
    color: var(--text-muted);
  }
  .eg {
    color: var(--text-faint);
    font-size: 11px;
  }
  .acts {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
