// Реестр модулей экрана игроков.
window.SG = {
  modules: [],
  register(mod) { this.modules.push(mod); },
  // Картинка запрашивается по id элемента: sg-asset://p/<id>
  assetUrl(item) { return 'sg-asset://p/' + encodeURIComponent(item.id); },
};
