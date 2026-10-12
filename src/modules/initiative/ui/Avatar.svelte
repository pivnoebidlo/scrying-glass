<!-- Портрет участника боя или первая буква имени. -->
<script lang="ts">
  import { vaultUrl } from '../../../shared/vault';
  import type { Combatant } from '../types';

  let { c, size = '28px' }: { c: Combatant; size?: string } = $props();
</script>

<span class="avatar {c.side}" style:--size={size}>
  {#if c.portrait || c.image}<img src={c.portrait ? vaultUrl(c.portrait) : c.image} alt="" />{:else}{c.name.slice(0, 1).toUpperCase()}{/if}
</span>

<style>
  .avatar {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    overflow: hidden;
    font-size: calc(var(--size) * 0.45);
    font-weight: 600;
    color: #fff;
  }
  .party {
    background: #2f6f4f;
  }
  .ally {
    background: #2f5a8f;
  }
  .enemy {
    background: #8f2f2f;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
