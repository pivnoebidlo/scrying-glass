// A clock as SVG paths in a box of 100 × 100: the filled wedges (from the top, clockwise) and the dividing lines.
export function clockWedges(segments: number, filled: number): string[] {
  const r = 46;
  const at = (k: number) => {
    const a = (k / segments) * Math.PI * 2 - Math.PI / 2;
    return `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
  };
  if (filled >= segments) return [`M50 4A46 46 0 1 1 49.99 4Z`];
  return Array.from({ length: filled }, (_, k) => `M50 50L${at(k)}A${r} ${r} 0 0 1 ${at(k + 1)}Z`);
}

export function clockSpokes(segments: number): string {
  let d = '';
  for (let k = 0; k < segments; k++) {
    const a = (k / segments) * Math.PI * 2 - Math.PI / 2;
    d += `M50 50L${(50 + Math.cos(a) * 46).toFixed(2)} ${(50 + Math.sin(a) * 46).toFixed(2)}`;
  }
  return d;
}
