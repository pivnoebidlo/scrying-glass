// Текущее время для окна мастера: тикает, пока его кто-то читает (раз в 250 мс).
let subscribers = 0;
let t: ReturnType<typeof setInterval> | undefined;
export const clockNow = $state({ ms: Date.now() });

// Вызвать в $effect компонента: подписка на тиканье, возвращает отписку.
export function tick() {
  if (subscribers++ === 0) t = setInterval(() => (clockNow.ms = Date.now()), 250);
  return () => {
    if (--subscribers === 0) clearInterval(t);
  };
}
