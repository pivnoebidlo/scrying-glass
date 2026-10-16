<!-- Названия папок роли для подсказок: «<code>maps</code> или <code>карты</code>» — те, что сейчас в настройках. -->
<script lang="ts">
  import { t } from './i18n.svelte';
  import type { FolderRole } from '../../shared/vault';
  import { store } from './store.svelte';

  let { role, max = 3 }: { role: FolderRole; max?: number } = $props();
  const names = $derived(store.state.vault.roles[role].slice(0, max));
</script>

{#each names as name, i (name)}{#if i > 0}{i === names.length - 1 ? t('lib.or') : ', '}{/if}<code>{name}</code>{/each}

<style>
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
