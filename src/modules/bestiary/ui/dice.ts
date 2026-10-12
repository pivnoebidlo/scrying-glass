// Бросок по формуле вида «3d6», «19d12+133», «2к8 − 1». Неразобранная формула — null.
export function rollFormula(formula: string): number | null {
  const m = /^(\d+)[dк](\d+)(?:([+\-−])(\d+))?$/i.exec(formula.replace(/\s+/g, ''));
  if (!m) return null;
  const [n, sides] = [Number(m[1]), Number(m[2])];
  let sum = 0;
  for (let i = 0; i < n; i++) sum += 1 + Math.floor(Math.random() * sides);
  const k = m[4] ? Number(m[4]) : 0;
  return Math.max(1, m[3] === '+' ? sum + k : sum - k);
}
