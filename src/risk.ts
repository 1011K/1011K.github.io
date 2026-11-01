// Portfolio risk maths for the five-company demo. Pure functions; every input is HYPOTHETICAL (no market data).
export type Mat = number[][];
export const TRADING_DAYS = 252;
export const SESSIONS = 756;
export const WEIGHT_TOL = 1e-9;
const PSD_TOL = 1e-10;
export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const mulVec = (m: Mat, v: number[]) => m.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));

/** 5x5-style symmetric correlation matrix from the strictly upper triangle (row-major: 01,02,..,12,13,..). */
export const PAIRS = (n: number): [number, number][] => Array.from({ length: n * n }, (_, k): [number, number] => [Math.floor(k / n), k % n]).filter(([i, j]) => i < j);
export function corrFromUpper(n: number, upper: number[]): Mat {
  const p = PAIRS(n), m: Mat = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j): number => (i === j ? 1 : 0)));
  if (upper.length !== p.length) throw new Error(`Expected ${p.length} pair correlations, got ${upper.length}.`);
  p.forEach(([i, j], k) => { m[i][j] = m[j][i] = upper[k]; });
  return m;
}
export const covFrom = (vols: number[], corr: Mat): Mat => corr.map((r, i) => r.map((x, j) => x * vols[i] * vols[j]));

/** Eigenvalues (ascending) of a symmetric matrix by cyclic Jacobi rotations. */
export function eigenvalues(m: Mat): number[] {
  const n = m.length, a = m.map((r) => [...r]);
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2;
    if (off < 1e-24) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-300) continue;
        const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = (th < 0 ? -1 : 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
        for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
      }
  }
  return a.map((r, i) => r[i]).sort((x, y) => x - y);
}

/** Checks vols, correlations (|rho|<=1, unit diagonal, symmetric) and positive semi-definiteness. Throws a plain message; returns the smallest eigenvalue. */
export function validateModel(vols: number[], corr: Mat, names: string[] = vols.map((_, i) => `#${i + 1}`)): number {
  const n = vols.length;
  if (corr.length !== n || corr.some((r) => r.length !== n)) throw new Error("Correlation matrix must be square and match the number of volatilities.");
  vols.forEach((v, i) => { if (!Number.isFinite(v) || v <= 0) throw new Error(`Volatility of ${names[i]} must be a number above 0%.`); if (v > 1) throw new Error(`Volatility of ${names[i]} is above 100%, outside the hypothetical range.`); });
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const r = corr[i][j];
      if (!Number.isFinite(r)) throw new Error(`Correlation ${names[i]}/${names[j]} is not a number.`);
      if (Math.abs(r) > 1) throw new Error(`Correlation ${names[i]}/${names[j]} = ${r} is outside -1 to +1.`);
      if (i === j && Math.abs(r - 1) > 1e-12) throw new Error(`Diagonal entry for ${names[i]} must be 1.`);
      if (Math.abs(r - corr[j][i]) > 1e-12) throw new Error(`Correlation matrix is not symmetric at ${names[i]}/${names[j]}.`);
    }
  const lo = eigenvalues(corr)[0];
  if (lo < -PSD_TOL) throw new Error(`Correlation matrix is not positive semi-definite (smallest eigenvalue ${lo.toFixed(4)}). These pair correlations cannot all hold at once; adjust them.`);
  return lo;
}

/** Long-only, fully invested. Never renormalises. */
export function validateWeights(w: number[], names: string[] = w.map((_, i) => `#${i + 1}`)) {
  w.forEach((x, i) => { if (!Number.isFinite(x)) throw new Error(`Weight of ${names[i]} is not a number.`); if (x < 0) throw new Error(`Weight of ${names[i]} is negative. This demo is long-only.`); });
  const s = sum(w);
  if (Math.abs(s - 1) > WEIGHT_TOL) throw new Error(`Weights sum to ${(s * 100).toFixed(4).replace(/\.?0+$/, "")}%, not 100%. They are not renormalised; correct them so they sum to exactly 100%.`);
}

export interface Risk { cov: Mat; variance: number; vol: number; marginal: number[]; compVar: number[]; compVol: number[]; share: number[]; weightedAvgVol: number; divRatio: number; avgCorr: number }
/** sigma_p^2 = w' S w. Marginal = (S w)_i / sigma_p; component = w_i (S w)_i (variance) and that / sigma_p (volatility). All annual. */
export function portfolioRisk(vols: number[], corr: Mat, w: number[]): Risk {
  const cov = covFrom(vols, corr), sw = mulVec(cov, w), compVar = w.map((x, i) => x * sw[i]), variance = sum(compVar), vol = Math.sqrt(Math.max(variance, 0));
  const weightedAvgVol = w.reduce((s, x, i) => s + x * vols[i], 0), ok = variance > 1e-12 * weightedAvgVol ** 2, compVol = compVar.map((c) => (ok ? c / vol : NaN)), n = vols.length;
  if (Math.abs(sum(compVar) - variance) > 1e-12 || (ok && Math.abs(sum(compVol) - vol) > 1e-12)) throw new Error("Internal check failed: risk contributions do not sum to total.");
  const off = PAIRS(n).map(([i, j]) => corr[i][j]);
  return { cov, variance, vol, marginal: sw.map((x) => (ok ? x / vol : NaN)), compVar, compVol, share: compVar.map((c) => (ok ? c / variance : NaN)), weightedAvgVol, divRatio: ok ? weightedAvgVol / vol : NaN, avgCorr: off.length ? sum(off) / off.length : NaN };
}

/** Stress: every vol x k; every pair correlation moved toward +1 by `shrink` in [0,1] (rho' = rho + shrink (1 - rho), stays PSD). */
export function stress(vols: number[], corr: Mat, w: number[], k: number, shrink: number) {
  if (!Number.isFinite(k) || k <= 0) throw new Error("Volatility multiplier must be above 0.");
  if (!Number.isFinite(shrink) || shrink < 0 || shrink > 1) throw new Error("Correlation shrink must be between 0 and 1.");
  const v2 = vols.map((v) => v * k), c2 = corr.map((r, i) => r.map((x, j) => (i === j ? 1 : x + shrink * (1 - x))));
  return { before: portfolioRisk(vols, corr, w), after: portfolioRisk(v2, c2, w), corrAfter: c2, volsAfter: v2 };
}

/** Cholesky tolerant of a zero pivot (semi-definite input, e.g. rho = 1). ponytail: no pivoting; fine for matrices passed through validateModel. */
export function cholesky(a: Mat, tol = 1e-9): Mat {
  const n = a.length, L = a.map((r) => r.map(() => 0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= i; j++) {
      let s = a[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) { if (s < -tol) throw new Error("Matrix is not positive semi-definite."); L[i][i] = Math.sqrt(Math.max(s, 0)); }
      else L[i][j] = L[j][j] > 1e-12 ? s / L[j][j] : 0;
    }
  return L;
}

/** Deterministic PRNG (mulberry32) and standard normals by Box-Muller. */
export function rng(seed: number) {
  let s = seed >>> 0;
  const u = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
}

export type Kind = "simple" | "log";
/** SIMULATED multivariate-normal daily returns (zero drift): r = (vol/sqrt(252)) * L z, L L' = corr. Rows are sessions. */
export function simulate(vols: number[], corr: Mat, seed: number, n = SESSIONS): Mat {
  if (!Number.isInteger(seed)) throw new Error("Seed must be a whole number.");
  if (!Number.isInteger(n) || n < 2) throw new Error("Need at least 2 sessions.");
  const L = cholesky(corr), d = vols.length, z = rng(seed), sd = vols.map((v) => v / Math.sqrt(TRADING_DAYS));
  return Array.from({ length: n }, () => { const e = Array.from({ length: d }, z); return L.map((row, i) => sd[i] * row.reduce((s, x, k) => s + x * e[k], 0)); });
}

export function pearson(x: number[], y: number[]): number {
  const n = x.length, mx = sum(x) / n, my = sum(y) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
}
const col = (r: Mat, j: number) => r.map((row) => row[j]);
export function sampleCorr(r: Mat): Mat {
  const d = r[0].length, c = Array.from({ length: d }, (_, j) => col(r, j));
  return c.map((a, i) => c.map((b, j) => (i === j ? 1 : pearson(a, b))));
}
export const maxAbsDiff = (a: Mat, b: Mat) => Math.max(...a.flatMap((r, i) => r.map((x, j) => Math.abs(x - b[i][j]))));
/** Rolling Pearson correlation of columns i,j; null until a full window exists. */
export function rollingCorr(r: Mat, i: number, j: number, win: number): (number | null)[] {
  if (!Number.isInteger(win) || win < 2) throw new Error("Window must be a whole number of at least 2.");
  const a = col(r, i), b = col(r, j);
  return a.map((_, t) => (t + 1 < win ? null : pearson(a.slice(t + 1 - win, t + 1), b.slice(t + 1 - win, t + 1))));
}

/** Weighted portfolio path, SIMULATED. Draws are read as `kind` returns (log -> exp(x)-1); weights reset to target every session. Growth starts at 1. */
export function portfolioPath(r: Mat, w: number[], kind: Kind) {
  const growth = [1];
  for (const row of r) growth.push(growth[growth.length - 1] * (1 + row.reduce((s, x, i) => s + w[i] * (kind === "log" ? Math.expm1(x) : x), 0)));
  const dd = drawdown(growth);
  return { growth, ...dd };
}
export function drawdown(v: number[]) {
  let peak = -Infinity;
  const dd = v.map((x) => { peak = Math.max(peak, x); return x / peak - 1; });
  return { dd, maxDD: Math.min(...dd) };
}
/** Annualised sample volatility (sd of daily draws x sqrt(252)) of a daily return series. */
export function annualSd(daily: number[]) {
  const n = daily.length, m = sum(daily) / n;
  return Math.sqrt(sum(daily.map((x) => (x - m) ** 2)) / (n - 1)) * Math.sqrt(TRADING_DAYS);
}
