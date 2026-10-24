<!-- A text of a pack (shared/syspack.ts `Loc`): edited in the interface language. One string stays one string;
     a text in several languages changes only in this one. -->
<script lang="ts">
  import { getLang } from '../../../shared/i18n';
  import { loc, type Loc } from '../../../shared/syspack';

  let {
    value,
    set,
    placeholder = '',
    multiline = false,
    disabled = false,
  }: { value: Loc | undefined; set: (v: Loc) => void; placeholder?: string; multiline?: boolean; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  const text = $derived(loc(value, lang));
  const put = (v: string) => set(value === undefined || typeof value === 'string' ? v : { ...value, [lang]: v });
</script>

{#if multiline}
  <textarea rows="3" {placeholder} {disabled} value={text} oninput={(e) => put(e.currentTarget.value)}></textarea>
{:else}
  <input type="text" {placeholder} {disabled} value={text} oninput={(e) => put(e.currentTarget.value)} />
{/if}
