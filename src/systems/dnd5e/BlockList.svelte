<!-- Особенности или действия: название, ограничение («Перезарядка 5–6»), текст и данные атаки. -->
<script lang="ts">
  import { markdownKeys } from '../../renderer/lib/markdownKeys';
  import { t } from '../../renderer/lib/i18n.svelte';
  import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte';
  import type { Block } from './stats';

  let { blocks = $bindable(), addLabel }: { blocks: Block[]; addLabel: string } = $props();

  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    [blocks[i], blocks[j]] = [blocks[j]!, blocks[i]!];
  }

  // Атака: «+4» и «1d6+2, 1d4». Пустые поля — атаки нет.
  function setAttack(b: Block, bonus: string, damage: string) {
    const n = Number(bonus.replace('−', '-'));
    if (bonus.trim() === '' || isNaN(n)) delete b.attack;
    else b.attack = { bonus: n, damage: damage.split(',').map((x) => x.replace(/\s+/g, '')).filter(Boolean) };
  }

  // Высота поля под текст.
  const rows = (t: string) => Math.min(14, Math.max(2, Math.ceil(t.length / 70) + (t.match(/\n/g)?.length ?? 0)));
</script>

{#each blocks as b, i (i)}
  <div class="block">
    <div class="head">
      <input class="name" type="text" placeholder={t('dnd.bl.name')} bind:value={b.name} />
      <input class="uses" type="text" placeholder={t('dnd.bl.usesPh')} title={t('dnd.bl.usesHint')} bind:value={b.uses} />
      <button type="button" class="icon-btn" title={t('dnd.up')} disabled={i === 0} onclick={() => move(i, -1)}><ArrowUp size={14} /></button>
      <button type="button" class="icon-btn" title={t('dnd.down')} disabled={i === blocks.length - 1} onclick={() => move(i, 1)}><ArrowDown size={14} /></button>
      <button type="button" class="icon-btn" title={t('dnd.delete')} onclick={() => blocks.splice(i, 1)}><Trash2 size={14} /></button>
    </div>
    <textarea use:markdownKeys rows={rows(b.text)} placeholder={t('dnd.bl.textPh')} bind:value={b.text}></textarea>
    <div class="attack">
      <span class="faint">{t('dnd.bl.attack')}</span>
      <input
        type="text"
        placeholder={t('dnd.bl.bonusPh')}
        value={b.attack ? (b.attack.bonus >= 0 ? '+' : '') + b.attack.bonus : ''}
        onchange={(e) => setAttack(b, e.currentTarget.value, b.attack?.damage.join(', ') ?? '')}
      />
      <input
        class="dmg"
        type="text"
        placeholder={t('dnd.bl.damagePh')}
        disabled={!b.attack}
        value={b.attack?.damage.join(', ') ?? ''}
        onchange={(e) => b.attack && setAttack(b, String(b.attack.bonus), e.currentTarget.value)}
      />
    </div>
  </div>
{/each}
<button type="button" class="btn add" onclick={() => blocks.push({ name: '', text: '' })}><Plus size={14} /> {addLabel}</button>

<style>
  .block {
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .head {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
  }
  .name {
    flex: 1;
    font-weight: 600;
  }
  .uses {
    width: 170px;
  }
  .icon-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  textarea {
    width: 100%;
    resize: vertical;
  }
  .attack {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 12px;
  }
  .attack input {
    width: 90px;
    padding: 2px 6px;
  }
  .attack .dmg {
    width: 160px;
  }
  .add {
    margin-bottom: 4px;
  }
</style>
