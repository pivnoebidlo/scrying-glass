// Экран игроков: только рисует то, что пришло в состоянии. Никакой логики.
const stage = document.getElementById('stage');

for (const mod of SG.modules) {
  const layer = document.createElement('div');
  layer.className = 'layer';
  stage.appendChild(layer);
  mod.mount(layer);
}

function renderAll(state) {
  document.getElementById('blackout').classList.toggle('on', state.core.blackout);
  for (const mod of SG.modules) mod.render(state[mod.id], state);
}

window.api.onState(renderAll);
window.api.getState().then(renderAll);

// Esc закрывает экран игроков.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.api.closeDisplay();
});
