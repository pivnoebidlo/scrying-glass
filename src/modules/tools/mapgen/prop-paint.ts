// The brushes of the things' pictures (draw-props.ts, draw-more.ts): flat colours, a dark outline.
export type Ctx = CanvasRenderingContext2D;
export const INK = '#120f0b';
export const WOOD = ['#9a6b3c', '#8a5f35', '#a87a45'];
export const CLOTH = ['#8e3b32', '#3f5d86', '#5b7a3c', '#7a5a8e', '#a8823a', '#2f6f6a', '#2b2a2e', '#d8cdb3'];
export const STONE = ['#a9a294', '#8c857a', '#bdb5a3'];
// Magic light: red, blue, green, violet, gold.
export const GLOW = ['#e0523a', '#4f9fe0', '#5fcf7a', '#a36ee0', '#e8c14a'];
export const tone = (list: readonly string[], t = 0) => list[Math.floor(t * list.length) % list.length]!;

export function shape(ctx: Ctx, fill: string, path: () => void, line: number) {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = line;
  ctx.stroke();
}
export const rect = (ctx: Ctx, x: number, y: number, w: number, h: number, r = 0) => () => ctx.roundRect(x, y, w, h, r);
export const circle = (ctx: Ctx, x: number, y: number, r: number) => () => ctx.arc(x, y, r, 0, Math.PI * 2);
// Strokes of one colour and width, one path.
export function lines(ctx: Ctx, colour: string, width: number, draw: () => void) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  draw();
  ctx.stroke();
}
// A soft light round a point: candles, crystals, torches.
export function glow(ctx: Ctx, x: number, y: number, r: number, colour: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, colour);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
