<!-- Песочные часы: left — какая доля времени осталась (0..1). Песок наверху убывает, внизу растёт; пока идёт —
     тонкая струйка через горлышко. Размер — по родителю. -->
<script lang="ts">
  let { left, running }: { left: number; running: boolean } = $props();

  const uid = 'h' + Math.random().toString(36).slice(2, 8);
  // Колбы: верхняя 16..78, нижняя 82..144 (по высоте), горлышко на 80.
  const k = $derived(Math.min(1, Math.max(0, left)));
  // Площадь колбы не равномерна по высоте; квадратный корень даёт уровень, похожий на настоящий.
  const topH = $derived(58 * Math.sqrt(k));
  const botH = $derived(58 * Math.sqrt(1 - k));
</script>

<svg viewBox="0 0 100 160" aria-hidden="true">
  <defs>
    <clipPath id="{uid}-top"><path d="M20 16 H80 C80 46 54 66 52 80 H48 C46 66 20 46 20 16 Z" /></clipPath>
    <clipPath id="{uid}-bot"><path d="M48 80 H52 C54 94 80 114 80 144 H20 C20 114 46 94 48 80 Z" /></clipPath>
    <linearGradient id="{uid}-wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a5a32" />
      <stop offset="0.5" stop-color="#5e3a1d" />
      <stop offset="1" stop-color="#3e2611" />
    </linearGradient>
    <linearGradient id="{uid}-sand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0c877" />
      <stop offset="1" stop-color="#c8913c" />
    </linearGradient>
  </defs>

  <!-- Стекло -->
  <path d="M20 16 H80 C80 46 54 66 52 80 C54 94 80 114 80 144 H20 C20 114 46 94 48 80 C46 66 20 46 20 16 Z" fill="rgba(200, 225, 255, 0.12)" />
  <!-- Песок -->
  <rect x="0" y={78 - topH} width="100" height={topH} fill="url(#{uid}-sand)" clip-path="url(#{uid}-top)" />
  <rect x="0" y={144 - botH} width="100" height={botH} fill="url(#{uid}-sand)" clip-path="url(#{uid}-bot)" />
  {#if running && k > 0}
    <rect class="stream" x="49.2" y="78" width="1.6" height={66 - botH} fill="#e8b866" />
  {/if}
  <path d="M20 16 H80 C80 46 54 66 52 80 C54 94 80 114 80 144 H20 C20 114 46 94 48 80 C46 66 20 46 20 16 Z" fill="none" stroke="rgba(230, 240, 255, 0.65)" stroke-width="1.6" />
  <!-- Рама -->
  <rect x="10" y="6" width="80" height="10" rx="3" fill="url(#{uid}-wood)" />
  <rect x="10" y="144" width="80" height="10" rx="3" fill="url(#{uid}-wood)" />
  <rect x="12" y="16" width="4" height="128" fill="url(#{uid}-wood)" />
  <rect x="84" y="16" width="4" height="128" fill="url(#{uid}-wood)" />
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .stream {
    animation: flow 0.4s linear infinite;
  }
  @keyframes flow {
    50% {
      opacity: 0.6;
    }
  }
</style>
