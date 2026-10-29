<!-- The author key's recovery words (shared/keywords.ts). repo.words = 'show' — the 24 words of the key on this
     computer, to write down; 'restore' — the GM types or pastes the words and the same key comes back (another
     author's key here — the core asks first). -->
<script lang="ts">
  import { Copy, KeyRound, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { checkWords, readWords, WORD_COUNT } from '../../../shared/keywords';
  import { shortKey } from '../../../shared/repo';
  import { errorText, repo } from './repo.svelte';

  let words = $state<string[]>([]);
  let text = $state('');
  let error = $state('');
  let copied = $state(false);
  let done = $state('');
  let working = $state(false);

  $effect(() => {
    const mode = repo.words;
    words = [];
    text = '';
    error = '';
    done = '';
    copied = false;
    if (mode === 'show') window.api.repoRecoveryWords().then((w) => (words = w), (e) => (error = errorText(e)));
  });

  const typed = $derived(readWords(text));
  const check = $derived(checkWords(typed));
  // What is wrong, said only once the GM has typed them all (or a word is not on the list).
  const problem = $derived.by(() => {
    if (!typed.length) return '';
    if (check.problem === 'unknown') return t('repo.words.unknown', { words: check.unknown.map((i) => typed[i]).join(', ') });
    if (check.problem === 'count') return typed.length > WORD_COUNT ? t('repo.words.tooMany', { count: WORD_COUNT }) : '';
    if (check.problem === 'checksum') return t('repo.words.checksum');
    return '';
  });

  // Shown words close as written: the GM has seen them, no reminder of the key after that.
  async function close() {
    if (repo.words === 'show' && words.length && !repo.info?.keySaved) repo.info = await window.api.repoKeyKept();
    repo.words = null;
  }

  async function copy() {
    await navigator.clipboard.writeText(words.map((w, i) => `${i + 1}. ${w}`).join('\n'));
    copied = true;
  }
  async function restore() {
    working = true;
    error = '';
    try {
      const info = await window.api.repoLoadKeyWords(typed);
      if (info) (repo.info = info), (done = t('repo.words.restored', { key: shortKey(info.author ?? '') }));
    } catch (e) {
      error = errorText(e);
    } finally {
      working = false;
    }
  }
</script>

<svelte:window onkeydown={(e) => repo.words && e.key === 'Escape' && (e.preventDefault(), close())} />

{#if repo.words}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <div class="modal">
      <header>
        <h3><KeyRound size={15} /> {t(repo.words === 'show' ? 'repo.words.showTitle' : 'repo.words.restoreTitle')}</h3>
        <button type="button" class="icon-btn" onclick={close} title={t('repo.words.close')}><X size={14} /></button>
      </header>

      {#if repo.words === 'show'}
        <p>{t('repo.words.showAbout')}</p>
        <p class="warn">{t('repo.words.secret')}</p>
        {#if words.length}
          <ol class="grid">
            {#each words as w, i (i)}<li><span class="n">{i + 1}</span> {w}</li>{/each}
          </ol>
        {/if}
        {#if error}<p class="error">{error}</p>{/if}
        <div class="row">
          <button class="btn" onclick={copy} disabled={!words.length}><Copy size={14} /> {t(copied ? 'repo.words.copied' : 'repo.words.copy')}</button>
          <span class="space"></span>
          <button class="btn primary" onclick={close}>{t('repo.words.close')}</button>
        </div>
      {:else if done}
        <p>{done}</p>
        <div class="row"><button class="btn primary" onclick={close}>{t('repo.words.close')}</button></div>
      {:else}
        <p>{t('repo.words.restoreAbout', { count: WORD_COUNT })}</p>
        <!-- svelte-ignore a11y_autofocus -->
        <textarea rows="5" bind:value={text} autofocus spellcheck="false" autocapitalize="off" placeholder={t('repo.words.placeholder')}></textarea>
        <p class="faint small">
          {t('repo.words.count', { n: typed.length, count: WORD_COUNT })}{#if problem} · <span class="error">{problem}</span>{/if}
        </p>
        {#if error}<p class="error">{error}</p>{/if}
        <div class="row">
          <span class="space"></span>
          <button class="btn" onclick={close}>{t('repo.cancel')}</button>
          <button class="btn primary" onclick={restore} disabled={!!check.problem || working}>{t('repo.words.restore')}</button>
        </div>
      {/if}
    </div>
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
    gap: 8px;
    width: min(560px, 92vw);
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
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 15px;
  }
  p {
    margin: 0;
    font-size: 13px;
  }
  .small {
    font-size: 12px;
  }
  .warn {
    color: var(--warning);
  }
  .error {
    color: var(--danger);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px 12px;
    margin: 4px 0;
    padding: 10px 12px;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-family: ui-monospace, monospace;
    font-size: 13px;
    user-select: text;
  }
  @media (max-width: 520px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .n {
    display: inline-block;
    min-width: 2ch;
    text-align: right;
    color: var(--text-faint);
  }
  textarea {
    resize: vertical;
    font-family: ui-monospace, monospace;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .space {
    flex: 1;
  }
</style>
