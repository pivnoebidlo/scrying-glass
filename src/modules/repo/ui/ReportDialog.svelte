<!-- A complaint about an entry of the catalog: the reason and a few words. Only the repository's admin reads them.
     Opens on repo.reporting = <entry>. -->
<script lang="ts">
  import { Flag, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { LIMITS, REPORT_REASONS, type ReportReason } from '../../../shared/repo';
  import { report, repo } from './repo.svelte';

  let reason = $state<ReportReason | null>(null);
  let text = $state('');
  $effect(() => {
    if (repo.reporting) (reason = null), (text = '');
  });

  const close = () => (repo.reporting = null);
  const send = () => repo.reporting && reason && report(repo.reporting, reason, text.trim());
</script>

{#if repo.reporting}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), send())}>
      <header>
        <h3>{t('repo.report.title', { name: repo.reporting.title })}</h3>
        <button type="button" class="icon-btn" onclick={close} title={t('repo.cancel')}><X size={14} /></button>
      </header>
      <p class="faint">{t('repo.report.about')}</p>
      {#each REPORT_REASONS as r (r)}
        <label class="check"><input type="radio" name="reason" value={r} bind:group={reason} /> {t(`repo.report.${r}`)}</label>
      {/each}
      <textarea rows="4" bind:value={text} maxlength={LIMITS.report} placeholder={t('repo.report.textPh')}></textarea>
      <div class="row">
        <button class="btn" type="button" onclick={close}>{t('repo.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!reason || !!repo.busy}><Flag size={14} /> {t('repo.report.send')}</button>
      </div>
    </form>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(440px, 92vw);
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h3,
  p {
    margin: 0;
  }
  h3 {
    font-size: 15px;
  }
  p {
    margin-bottom: 4px;
    font-size: 13px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  textarea {
    margin-top: 4px;
    resize: vertical;
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 6px;
  }
</style>
