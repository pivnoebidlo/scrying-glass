// Состояние редактора карт в окне управления: выбранная карта и инструмент.
export type Tool = 'pan' | 'reveal' | 'hide' | 'revealRect' | 'hideRect' | 'view';

export const ui = $state({
  selected: null as string | null,
  tool: 'reveal' as Tool,
  // Радиус кисти в точках экрана.
  brush: 40,
});
