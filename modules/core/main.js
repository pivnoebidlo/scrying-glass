// Общие настройки экрана игроков.
module.exports = {
  id: 'core',
  persist: false,
  initialState: { blackout: false },
  actions: {
    toggleBlackout: (s) => ({ ...s, blackout: !s.blackout }),
  },
};
