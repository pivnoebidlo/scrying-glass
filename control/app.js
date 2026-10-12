// Реестр модулей окна управления.
window.SG = {
  modules: [],
  register(mod) { this.modules.push(mod); },
  dispatch(module, name, payload) { return window.api.dispatch(module, name, payload); },
  // Картинка запрашивается по id элемента: sg-asset://p/<id>
  assetUrl(item) { return 'sg-asset://p/' + encodeURIComponent(item.id); },
};
