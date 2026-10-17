import { t } from '../../../renderer/lib/i18n.svelte';
// Устройство вывода звука (колонки в комнате, а не наушники мастера). Своё у каждого компьютера, поэтому
// хранится в окне (localStorage), а не в хранилище. '' — устройство системы по умолчанию.
const KEY = 'sg.music.sink';

function load() {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export const output = $state({
  sink: load(),
  devices: [] as { id: string; label: string }[],
});

export function setSink(id: string) {
  output.sink = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* без сохранения — только до перезапуска */
  }
}

export async function refreshDevices() {
  const all = await navigator.mediaDevices.enumerateDevices();
  output.devices = all
    .filter((d) => d.kind === 'audiooutput' && d.deviceId !== 'default' && d.deviceId !== 'communications')
    .map((d, i) => ({ id: d.deviceId, label: d.label || t('music.device', { n: i + 1 }) }));
}

let watching = false;
export function watchDevices() {
  if (watching) return;
  watching = true;
  navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
  refreshDevices();
}

// Направить звук элемента на выбранное устройство. Нет такого (отключили) — остаётся то, что было.
export function route(a: HTMLAudioElement, sink: string) {
  if (a.sinkId !== sink) a.setSinkId(sink).catch(() => {});
}
