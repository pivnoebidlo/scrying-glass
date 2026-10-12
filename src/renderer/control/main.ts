// Запуск окна управления: общие кнопки + панели всех модулей.
import type { AppState, ModuleId } from '../../shared/types';
import { dispatch, type Panel } from '../panel';

// Панели модулей подхватываются автоматически: modules/<имя>/control.ts
const panels = Object.values(
  import.meta.glob<Panel<ModuleId>>('../../modules/*/control.ts', { eager: true, import: 'default' })
);

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

async function refreshDisplays() {
  const list = await window.api.listDisplays();
  const select = $<HTMLSelectElement>('display-select');
  const previous = select.value;
  select.innerHTML = '';
  for (const d of list) {
    const opt = document.createElement('option');
    opt.value = String(d.id);
    opt.textContent = d.label;
    select.appendChild(opt);
  }
  // По умолчанию предлагаем неосновной экран (проектор / телевизор), если он есть.
  const preferred = list.find((d) => !d.primary) || list[0];
  const keep = list.find((d) => String(d.id) === previous);
  const chosen = keep || preferred;
  if (chosen) select.value = String(chosen.id);
}

function renderStatus(open: boolean) {
  $('status').textContent = open ? '● экран открыт' : '○ экран закрыт';
}

// Каждая панель получает свою секцию на странице.
const renders = panels.map((panel) => {
  const section = document.createElement('section');
  section.innerHTML = `<h2></h2><div class="body"></div>`;
  section.querySelector('h2')!.textContent = panel.title ?? panel.id;
  $('modules').appendChild(section);
  const render = panel.mount(section.querySelector<HTMLElement>('.body')!);
  return (state: AppState) => render(state[panel.id], state);
});

function renderAll(state: AppState) {
  $('blackout-btn').textContent = state.core.blackout ? 'Вернуть картинку' : 'Погасить экран';
  for (const render of renders) render(state);
}

$('open-btn').addEventListener('click', () => window.api.openDisplay(Number($<HTMLSelectElement>('display-select').value)));
$('close-btn').addEventListener('click', () => window.api.closeDisplay());
$('blackout-btn').addEventListener('click', () => dispatch('core', 'toggleBlackout'));
$('reveal-btn').addEventListener('click', () => window.api.revealCampaign());

window.api.onState(renderAll);
window.api.onDisplayStatus(renderStatus);
window.api.onDisplaysChanged(refreshDisplays);

await refreshDisplays();
renderAll(await window.api.getState());
renderStatus(await window.api.getDisplayStatus());
