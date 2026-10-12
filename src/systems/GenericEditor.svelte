<!-- Редактор характеристик неизвестной системы: блок stats как JSON. -->
<script lang="ts">
  let { stats = $bindable() }: { stats: unknown; system: string } = $props();

  let text = $state(JSON.stringify(stats, null, 2));
  let error = $state('');

  function oninput() {
    try {
      stats = JSON.parse(text);
      error = '';
    } catch (e) {
      error = String(e);
    }
  }
</script>

<p class="faint">Для этой системы нет редактора: характеристики правятся как JSON.</p>
<textarea rows="24" spellcheck="false" bind:value={text} {oninput}></textarea>
{#if error}<p class="error">{error}</p>{/if}

<style>
  textarea {
    width: 100%;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
  }
  .error {
    color: var(--danger);
  }
</style>
