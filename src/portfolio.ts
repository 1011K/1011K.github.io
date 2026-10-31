// Textbook two-asset portfolio maths. Hypothetical inputs only.
export interface TwoAsset {
  w1: number; // weight of asset 1, 0..1 (asset 2 = 1 - w1, long-only)
  s1: number; // annual volatility of asset 1, decimal (0.2 = 20%)
  s2: number;
  rho: number; // correlation, -1..1
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function sanitize(i: TwoAsset): TwoAsset {
  const f = (x: number, lo: number, hi: number) => (Number.isFinite(x) ? clamp(x, lo, hi) : lo);
  return { w1: f(i.w1, 0, 1), s1: f(i.s1, 0, 2), s2: f(i.s2, 0, 2), rho: f(i.rho, -1, 1) };
}

export function portfolioVol(raw: TwoAsset): number {
  const { w1, s1, s2, rho } = sanitize(raw);
  const w2 = 1 - w1;
  const v = w1 * w1 * s1 * s1 + w2 * w2 * s2 * s2 + 2 * w1 * w2 * rho * s1 * s2;
  return Math.sqrt(Math.max(0, v)); // max() absorbs -1e-17 float noise at rho = -1
}

/** Volatility if correlation were +1: the weighted average. */
export const undiversifiedVol = (raw: TwoAsset): number => {
  const { w1, s1, s2 } = sanitize(raw);
  return w1 * s1 + (1 - w1) * s2;
};

/** Long-only minimum-variance weight in asset 1. Null when both assets have zero variance. */
export function minVarWeight(raw: TwoAsset): number | null {
  const { s1, s2, rho } = sanitize(raw);
  const d = s1 * s1 + s2 * s2 - 2 * rho * s1 * s2;
  if (d <= 1e-12) return s1 === 0 && s2 === 0 ? null : s1 <= s2 ? 1 : 0; // identical perfectly correlated risk
  return clamp((s2 * s2 - rho * s1 * s2) / d, 0, 1);
}
