<!-- Раздел настроек «Портреты»: подписи на экране игроков (показывать ли, вид подложки, цвет, шрифт) с образцом. -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { NOTE_FONTS, type NoteFont } from '../../../shared/notes';
  import { DEFAULT_PLATE, PLATE_COLOR_TITLE, PLATE_COLORS, PLATE_DEFAULT_COLOR, PLATE_STYLES, type NamePlate as Plate, type PlateStyle } from '../types';
  import NamePlate from './NamePlate.svelte';

  let { ms }: ModuleProps<'portraits'> = $props();

  const plate = $derived(ms.plate ?? DEFAULT_PLATE);
  const set = (p: Partial<Plate>) => dispatch('portraits', 'setPlate', p);
  // Новый стиль — со своим цветом по умолчанию: белый текст тени на ленте смотрелся бы плохо.
  const setStyle = (style: PlateStyle) => set({ style, color: PLATE_DEFAULT_COLOR[style] });
  const groups = [...new Set(Object.values(NOTE_FONTS).map((f) => f.group))];
</script>

<div class="setting">
  <div class="info">
    <div class="name">Подписи на экране игроков</div>
    <div class="desc">Показывать имя под каждым портретом.</div>
  </div>
  <input type="checkbox" checked={ms.showNames} onchange={(e) => dispatch('portraits', 'setShowNames', { value: e.currentTarget.checked })} />
</div>

{#if ms.showNames}
  <div class="plate-settings">
    <div class="sample">
      <NamePlate name="Староста Гилберт" {plate} />
    </div>
    <div class="row">
      <span class="label">Подложка</span>
      <div class="styles">
        {#each Object.entries(PLATE_STYLES) as [id, title] (id)}
          <button class="btn" class:primary={plate.style === id} onclick={() => setStyle(id as PlateStyle)}>{title}</button>
        {/each}
      </div>
    </div>
    <div class="row">
      <span class="label">{PLATE_COLOR_TITLE[plate.style]}</span>
      <div class="colors">
        {#each PLATE_COLORS as c (c)}
          <button class="swatch" class:on={plate.color.toLowerCase() === c} style:background={c} title={c} aria-label={c} onclick={() => set({ color: c })}></button>
        {/each}
        <input type="color" value={plate.color} title="Свой цвет" onchange={(e) => set({ color: e.currentTarget.value })} />
      </div>
    </div>
    <label class="row">
      <span class="label">Шрифт</span>
      <select value={plate.font} onchange={(e) => set({ font: e.currentTarget.value as NoteFont | '' })}>
        <option value="">Обычный (Georgia)</option>
        {#each groups as g (g)}
          <optgroup label={g}>
            {#each Object.entries(NOTE_FONTS).filter(([, f]) => f.group === g) as [id, f] (id)}<option value={id}>{f.title}</option>{/each}
          </optgroup>
        {/each}
      </select>
    </label>
  </div>
{/if}

<div class="setting">
  <div class="info">
    <div class="name">Откуда берутся портреты</div>
    <div class="desc">
      Из всех папок <RoleFolderNames role="characters" /> в хранилище, на любой глубине: в приключении, в главе кампании,
      во вложенных папках. Подпись — название карточки, у которой эта картинка стоит портретом, иначе имя файла
      (<code>староста_гилберт.jpg</code> → «Староста Гилберт»). Поправить её можно прямо под плиткой во вкладке
      «Персонажи»: переименуется карточка или файл.
    </div>
  </div>
</div>

<style>
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
  .plate-settings {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 4px 0 16px;
  }
  .sample {
    display: flex;
    justify-content: center;
    padding: 22px 16px;
    border-radius: var(--radius-m);
    background:
      linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)),
      linear-gradient(135deg, #3a4a3a, #6b5a3a 50%, #2b3550);
    font-size: 26px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .label {
    width: 110px;
    flex: none;
    color: var(--text-muted);
    font-size: 13px;
  }
  .styles,
  .colors {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .swatch {
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 999px;
    cursor: pointer;
  }
  .swatch.on {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  input[type='color'] {
    width: 30px;
    height: 24px;
    padding: 0;
    border: 0;
    background: none;
  }
</style>
