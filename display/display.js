// Экран игроков: только рисует то, что пришло в состоянии. Никакой логики.
function render(state) {
  document.getElementById('title').textContent = state.title;
  document.getElementById('stage').style.opacity = state.visible ? '1' : '0';
}

window.api.onState(render);
window.api.getState().then(render);

// Esc закрывает экран игроков.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.api.closeDisplay();
});
