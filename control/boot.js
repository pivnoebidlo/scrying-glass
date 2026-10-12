// Запуск окна управления: общие кнопки + панели всех модулей.
const $ = (id) => document.getElementById(id);

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

function renderStatus(open) {
  $('status').textContent = open ? '● экран открыт' : '○ экран закрыт';
}

function renderAll(state) {
  $('blackout-btn').textContent = state.core.blackout ? 'Вернуть картинку' : 'Погасить экран';
  for (const mod of SG.modules) mod.render(state[mod.id], state);
}

$('open-btn').addEventListener('click', () => window.api.openDisplay(Number($('display-select').value)));
$('close-btn').addEventListener('click', () => window.api.closeDisplay());
$('blackout-btn').addEventListener('click', () => SG.dispatch('core', 'toggleBlackout'));
$('reveal-btn').addEventListener('click', () => window.api.revealCampaign());

window.api.onState(renderAll);
window.api.onDisplayStatus(renderStatus);
window.api.onDisplaysChanged(refreshDisplays);

(async () => {
  // Каждый модуль получает свою секцию на странице.
  for (const mod of SG.modules) {
    const section = document.createElement('section');
    section.innerHTML = `<h2>${mod.title}</h2><div class="body"></div>`;
    $('modules').appendChild(section);
    mod.mount(section.querySelector('.body'));
  }
  await refreshDisplays();
  renderAll(await window.api.getState());
  renderStatus(await window.api.getDisplayStatus());
})();
