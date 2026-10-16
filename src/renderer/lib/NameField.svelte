<!-- Название под плиткой (картинка, карта, существо), которое можно поправить прямо здесь: щелчок — правка,
     Enter или уход с поля — переименовать, Esc — отменить. Что значит «переименовать» (файл, карточку), решает
     onrename; без него поле только показывает название. -->
<script lang="ts">
  import { Pencil } from '@lucide/svelte';

  let {
    value,
    title = 'Переименовать',
    onrename,
  }: { value: string; title?: string; onrename?: (name: string) => unknown } = $props();

  let input = $state<HTMLInputElement>();

  async function commit(e: Event & { currentTarget: HTMLInputElement }) {
    const el = e.currentTarget;
    const next = el.value.trim();
    if (!onrename || !next || next === value) {
      el.value = value;
      return;
    }
    await onrename(next);
  }
</script>

<label class="name-field" class:readonly={!onrename} title={onrename ? title : value}>
  <input
    bind:this={input}
    type="text"
    {value}
    readonly={!onrename}
    onchange={commit}
    onkeydown={(e) => {
      if (e.key === 'Enter') e.currentTarget.blur();
      else if (e.key === 'Escape') {
        e.currentTarget.value = value;
        e.currentTarget.blur();
      }
    }}
  />
  {#if onrename}<Pencil size={11} />{/if}
</label>

<style>
  .name-field {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 8px;
    border-top: 1px solid var(--border);
    color: var(--text-faint);
  }
  input {
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--text-normal);
    font-size: 12px;
    text-overflow: ellipsis;
  }
  .readonly input {
    cursor: default;
  }
  .name-field :global(svg) {
    flex: none;
    opacity: 0;
  }
  .name-field:hover :global(svg) {
    opacity: 1;
  }
  .name-field:not(.readonly):hover input {
    border-color: var(--border);
  }
  input:focus {
    border-color: var(--accent);
    outline: none;
  }
</style>
