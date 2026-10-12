// Экран игроков: только рисует то, что пришло в состоянии. Никакой логики.
import type { AppState, ModuleId } from '../../shared/types';
import type { Panel } from '../panel';

// Слои модулей подхватываются автоматически: modules/<имя>/display.ts
const panels = Object.values(
  import.meta.glob<Panel<ModuleId>>('../../modules/*/display.ts', { eager: true, import: 'default' })
);

const stage = document.getElementById('stage')!;

const renders = panels.map((panel) => {
  const layer = document.createElement('div');
  layer.className = 'layer';
  stage.appendChild(layer);
  const render = panel.mount(layer);
  return (state: AppState) => render(state[panel.id], state);
});

function renderAll(state: AppState) {
  document.getElementById('blackout')!.classList.toggle('on', state.core.blackout);
  for (const render of renders) render(state);
}

window.api.onState(renderAll);
window.api.getState().then(renderAll);

// Esc закрывает экран игроков.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.api.closeDisplay();
});
