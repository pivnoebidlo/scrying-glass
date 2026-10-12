const $ = (id) => document.getElementById(id);
let currentState = { visible: true, title: '' };

async function refreshDisplays() {
  const list = await window.api.listDisplays();
  const select = $('display-select');
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
  select.value = String((keep || preferred).id);
}

function renderState(state) {
  currentState = state;
  const input = $('title-input');
  if (document.activeElement !== input) input.value = state.title;
}

function renderStatus(open) {
  $('status').textContent = open ? '● экран открыт' : '○ экран закрыт';
}

$('open-btn').addEventListener('click', () => window.api.openDisplay(Number($('display-select').value)));
$('close-btn').addEventListener('click', () => window.api.closeDisplay());
$('title-input').addEventListener('input', (e) => window.api.patchState({ title: e.target.value }));
$('toggle-btn').addEventListener('click', () => window.api.patchState({ visible: !currentState.visible }));

window.api.onState(renderState);
window.api.onDisplayStatus(renderStatus);
window.api.onDisplaysChanged(refreshDisplays);

(async () => {
  await refreshDisplays();
  renderState(await window.api.getState());
  renderStatus(await window.api.getDisplayStatus());
})();
