<!-- Правая панель: таймер, если он есть. Запускается в «Инструменты» → «Таймер». -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Controls from './Controls.svelte';

  let { ms }: ModuleProps<'timer'> = $props();
</script>

{#if ms.active}<Controls {ms} />{:else}<div class="faint">Нет. Запустить — в «Инструменты» → «Таймер».</div>{/if}
