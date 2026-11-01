// Pure technical indicators, a seeded synthetic series and a long/cash backtester.
// Every indicator returns an array the same length as its input: null until valid (the warm-up).
// No indicator at bar t reads any bar after t, so appending or mutating future bars never changes earlier values.
export type Arr = (number | null)[];
export type Seed = "sma" | "first";
export interface Bar { d: string; o: number; h: number; l: number; c: number; v: number }

const nul = (n: number): Arr => new Array<number | null>(n).fill(null);
const nn = (v: number | null) => v as number;

// ---------- trend ----------
/** Simple moving average. A window containing a null yields null. */
export const sma = (x: Arr, n: number): Arr => {
  const out = nul(x.length);
  let sum = 0, run = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    if (v === null) { sum = 0; run = 0; continue; }
    sum += v; run++;
    if (run > n) sum -= nn(x[i - n]);
    if (run >= n) out[i] = sum / n;
  }
  return out;
};
/**
 * Exponential moving average, alpha = 2 / (n + 1), starting at the first non-null input.
 * "sma": first value is the mean of the first n inputs (null before that). "first": first value is the first input.
 * The two seeds differ during warm-up and converge geometrically afterwards.
 */
const emaRun = (x: number[], n: number, seed: Seed): Arr => {
  const out = nul(x.length), a = 2 / (n + 1);
  let from: number;
  if (seed === "first") { out[0] = x[0]; from = 1; }
  else {
    if (n > x.length) return out;
    out[n - 1] = x.slice(0, n).reduce((s, v) => s + v, 0) / n; from = n;
  }
  for (let i = from; i < x.length; i++) out[i] = a * x[i] + (1 - a) * nn(out[i - 1]);
  return out;
};
/** A missing observation is never read as zero: the EMA is computed per contiguous run and restarts (re-seeds) after a gap. */
export const ema = (x: Arr, n: number, seed: Seed = "sma"): Arr => {
  const out = nul(x.length);
  for (let i = 0; i < x.length; ) {
    if (x[i] === null) { i++; continue; }
    let j = i;
    while (j < x.length && x[j] !== null) j++;
    emaRun(x.slice(i, j) as number[], n, seed).forEach((v, k) => (out[i + k] = v));
    i = j;
  }
  return out;
};
/** Linear weighted moving average, weights 1..n with the newest bar heaviest. */
export const wma = (x: number[], n: number): Arr => {
  const out = nul(x.length), den = (n * (n + 1)) / 2;
  for (let i = n - 1; i < x.length; i++) { let s = 0; for (let k = 0; k < n; k++) s += (k + 1) * x[i - n + 1 + k]; out[i] = s / den; }
  return out;
};

// ---------- momentum ----------
const rsiOf = (g: number, l: number) => (l === 0 ? (g === 0 ? 50 : 100) : 100 - 100 / (1 + g / l));
/** Wilder RSI. Seed: simple mean of the first n changes. Zero loss with gains is 100, zero gain with losses is 0, a flat window is 50. */
export const rsi = (c: number[], n = 14): Arr => {
  const out = nul(c.length);
  if (c.length <= n) return out;
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d; }
  g /= n; l /= n; out[n] = rsiOf(g, l);
  for (let i = n + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = rsiOf(g, l);
  }
  return out;
};
/** MACD line = EMA(fast) - EMA(slow); signal = EMA of the line (seeded by the same rule); histogram = line - signal. */
export const macd = (c: number[], fast = 12, slow = 26, sig = 9, seed: Seed = "sma") => {
  const f = ema(c, fast, seed), s = ema(c, slow, seed);
  const line = c.map((_, i) => (f[i] === null || s[i] === null ? null : nn(f[i]) - nn(s[i])));
  const signal = ema(line, sig, seed);
  return { line, signal, hist: line.map((v, i) => (v === null || signal[i] === null ? null : v - nn(signal[i]))) };
};
/** Fast stochastic: %K = 100 (C - LL) / (HH - LL) over n bars (50 on a flat range); %D = SMA(d) of %K. */
export const stochastic = (h: number[], l: number[], c: number[], n = 14, d = 3) => {
  const k = nul(c.length);
  for (let i = n - 1; i < c.length; i++) {
    let hh = -Infinity, ll = Infinity;
    for (let j = i - n + 1; j <= i; j++) { hh = Math.max(hh, h[j]); ll = Math.min(ll, l[j]); }
    k[i] = hh === ll ? 50 : (100 * (c[i] - ll)) / (hh - ll);
  }
  return { k, d: sma(k, d) };
};
/** Rate of change in percent over n bars. */
export const roc = (c: number[], n = 12): Arr => c.map((v, i) => (i < n ? null : 100 * (v / c[i - n] - 1)));
/** Commodity Channel Index: (TP - SMA(TP)) / (0.015 mean absolute deviation); 0 on a flat window. */
export const cci = (h: number[], l: number[], c: number[], n = 20): Arr => {
  const tp = c.map((v, i) => (h[i] + l[i] + v) / 3), out = nul(c.length);
  for (let i = n - 1; i < c.length; i++) {
    let m = 0; for (let j = i - n + 1; j <= i; j++) m += tp[j]; m /= n;
    let md = 0; for (let j = i - n + 1; j <= i; j++) md += Math.abs(tp[j] - m); md /= n;
    out[i] = md === 0 ? 0 : (tp[i] - m) / (0.015 * md);
  }
  return out;
};

// ---------- volatility ----------
/** Bollinger bands: SMA(n) +/- k population standard deviations. */
export const bollinger = (c: number[], n = 20, k = 2) => {
  const mid = nul(c.length), up = nul(c.length), lo = nul(c.length);
  for (let i = n - 1; i < c.length; i++) {
    let m = 0; for (let j = i - n + 1; j <= i; j++) m += c[j]; m /= n;
    let s = 0; for (let j = i - n + 1; j <= i; j++) s += (c[j] - m) ** 2;
    const sd = Math.sqrt(s / n);
    mid[i] = m; up[i] = m + k * sd; lo[i] = m - k * sd;
  }
  return { mid, up, lo };
};
/** True range; bar 0 has no previous close so it is the high-low range. */
export const trueRange = (h: number[], l: number[], c: number[]) =>
  h.map((hi, i) => (i === 0 ? hi - l[i] : Math.max(hi - l[i], Math.abs(hi - c[i - 1]), Math.abs(l[i] - c[i - 1]))));
/** Wilder ATR. Seed: mean of true range over bars 1..n (bar 0 has no previous close). */
export const atr = (h: number[], l: number[], c: number[], n = 14): Arr => {
  const out = nul(c.length);
  if (c.length <= n) return out;
  const tr = trueRange(h, l, c);
  let a = 0; for (let i = 1; i <= n; i++) a += tr[i];
  a /= n; out[n] = a;
  for (let i = n + 1; i < c.length; i++) { a = (a * (n - 1) + tr[i]) / n; out[i] = a; }
  return out;
};
/** Annualised realised volatility: sample standard deviation of n log returns times sqrt(252). */
export const realisedVol = (c: number[], n = 20): Arr => {
  const r = c.map((v, i) => (i === 0 ? 0 : Math.log(v / c[i - 1]))), out = nul(c.length);
  for (let i = n; i < c.length; i++) {
    let m = 0; for (let j = i - n + 1; j <= i; j++) m += r[j]; m /= n;
    let s = 0; for (let j = i - n + 1; j <= i; j++) s += (r[j] - m) ** 2;
    out[i] = Math.sqrt(s / (n - 1)) * Math.sqrt(252);
  }
  return out;
};

// ---------- trend strength ----------
/** Wilder ADX with +DI and -DI. DI valid at bar n; ADX seeded by the mean of the first n DX values, valid at bar 2n-1. */
export const adx = (h: number[], l: number[], c: number[], n = 14) => {
  const len = c.length, pdi = nul(len), mdi = nul(len), out = nul(len);
  if (len <= n) return { pdi, mdi, adx: out };
  const tr = trueRange(h, l, c), pdm = [0], mdm = [0];
  for (let i = 1; i < len; i++) {
    const up = h[i] - h[i - 1], dn = l[i - 1] - l[i];
    pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0);
  }
  let sT = 0, sP = 0, sM = 0;
  for (let i = 1; i <= n; i++) { sT += tr[i]; sP += pdm[i]; sM += mdm[i]; }
  let adxPrev = 0;
  for (let i = n; i < len; i++) {
    if (i > n) { sT += tr[i] - sT / n; sP += pdm[i] - sP / n; sM += mdm[i] - sM / n; }
    const p = sT === 0 ? 0 : (100 * sP) / sT, m = sT === 0 ? 0 : (100 * sM) / sT, dx = p + m === 0 ? 0 : (100 * Math.abs(p - m)) / (p + m);
    pdi[i] = p; mdi[i] = m;
    if (i < 2 * n - 1) adxPrev += dx / n;
    else if (i === 2 * n - 1) { adxPrev += dx / n; out[i] = adxPrev; }
    else { adxPrev = (adxPrev * (n - 1) + dx) / n; out[i] = adxPrev; }
  }
  return { pdi, mdi, adx: out };
};

// ---------- volume ----------
/** On-balance volume: cumulative signed volume from bar 0 (= 0). */
export const obv = (c: number[], v: number[]): Arr => {
  let o = 0;
  return c.map((x, i) => { if (i > 0) o += x > c[i - 1] ? v[i] : x < c[i - 1] ? -v[i] : 0; return o; });
};
/** Relative volume: volume / mean volume of the previous n bars (today excluded). Null when that mean is zero or volume is missing. */
export const relVolume = (v: number[], n = 20): Arr => {
  const out = nul(v.length);
  for (let i = n; i < v.length; i++) { let m = 0; for (let j = i - n; j < i; j++) m += v[j]; m /= n; out[i] = m > 0 && Number.isFinite(v[i]) ? v[i] / m : null; }
  return out;
};

// ---------- structure ----------
export interface Swing { i: number; at: number; type: "H" | "L"; price: number }
/** Swing highs/lows: strictly the extreme of k bars each side. A swing at bar i is only confirmed (usable) at bar i + k. */
export const swings = (h: number[], l: number[], k = 5): Swing[] => {
  const out: Swing[] = [];
  for (let i = k; i < h.length - k; i++) {
    let hi = true, lo = true;
    for (let j = i - k; j <= i + k && (hi || lo); j++) { if (j === i) continue; if (h[j] >= h[i]) hi = false; if (l[j] <= l[i]) lo = false; }
    if (hi) out.push({ i, at: i + k, type: "H", price: h[i] });
    if (lo) out.push({ i, at: i + k, type: "L", price: l[i] });
  }
  return out;
};
/** Latest confirmed resistance (swing high) and support (swing low) known at each bar. No look-ahead. */
export const levels = (h: number[], l: number[], k = 5) => {
  const res = nul(h.length), sup = nul(h.length), sw = swings(h, l, k);
  let r: number | null = null, s: number | null = null, p = 0;
  for (let t = 0; t < h.length; t++) {
    while (p < sw.length && sw[p].at <= t) { if (sw[p].type === "H") r = sw[p].price; else s = sw[p].price; p++; }
    res[t] = r; sup[t] = s;
  }
  return { res, sup };
};

// ---------- registry (name, parameters, initialisation, warm-up) ----------
export interface Row { id: string; group: string; name: string; params: string; init: string; warmup: number; series: Arr }
const lead = (a: Arr) => { const i = a.findIndex((v) => v !== null); return i < 0 ? a.length : i; };
/** Registry rows; `warmup` is the declared number of leading null bars, checked against the output in tests. */
export function registry(b: Bar[], seed: Seed = "sma"): Row[] {
  const h = b.map((x) => x.h), l = b.map((x) => x.l), c = b.map((x) => x.c), v = b.map((x) => x.v), n = (k: number) => (seed === "sma" ? k - 1 : 0);
  const E = seed === "sma" ? "Mean of first n closes" : "First close";
  const m = macd(c, 12, 26, 9, seed), st = stochastic(h, l, c), bb = bollinger(c), ad = adx(h, l, c), lv = levels(h, l, 5);
  const r = (id: string, group: string, name: string, params: string, init: string, warmup: number, series: Arr): Row => ({ id, group, name, params, init, warmup, series });
  return [
    r("sma12", "Trend", "SMA", "n = 12", "Mean of first n closes", 11, sma(c, 12)),
    r("sma26", "Trend", "SMA", "n = 26", "Mean of first n closes", 25, sma(c, 26)),
    r("ema12", "Trend", "EMA", "n = 12", E, n(12), ema(c, 12, seed)),
    r("ema26", "Trend", "EMA", "n = 26", E, n(26), ema(c, 26, seed)),
    r("wma20", "Trend", "WMA", "n = 20", "Weights 1..n", 19, wma(c, 20)),
    r("rsi", "Momentum", "RSI (Wilder)", "n = 14", "Mean of first 14 changes", 14, rsi(c, 14)),
    r("macd", "Momentum", "MACD line", "12, 26", E, n(26), m.line),
    r("macds", "Momentum", "MACD signal", "9", `${E} of the line`, n(26) + n(9), m.signal),
    r("stk", "Momentum", "Stochastic %K", "n = 14", "None", 13, st.k),
    r("std", "Momentum", "Stochastic %D", "SMA 3 of %K", "None", 15, st.d),
    r("roc", "Momentum", "Rate of change", "n = 12", "None", 12, roc(c, 12)),
    r("cci", "Momentum", "CCI", "n = 20, 0.015", "None", 19, cci(h, l, c, 20)),
    r("bb", "Volatility", "Bollinger middle", "n = 20, 2 sd (population)", "None", 19, bb.mid),
    r("atr", "Volatility", "ATR (Wilder)", "n = 14", "Mean of true range, bars 1..14", 14, atr(h, l, c, 14)),
    r("rv", "Volatility", "Realised volatility", "n = 20, x sqrt(252)", "None", 20, realisedVol(c, 20)),
    r("pdi", "Trend strength", "+DI / -DI", "n = 14", "Wilder sums, bars 1..14", 14, ad.pdi),
    r("adx", "Trend strength", "ADX", "n = 14", "Mean of first 14 DX", 27, ad.adx),
    r("obv", "Volume", "On-balance volume", "none", "0 at first bar", 0, obv(c, v)),
    r("rvol", "Volume", "Relative volume", "n = 20 prior bars", "None", 20, relVolume(v, 20)),
    r("res", "Structure", "Confirmed swing high", "k = 5 each side", "None; confirmed k bars late", 10, lv.res),
  ];
}
export const measuredWarmup = lead;

// ---------- seeded synthetic daily OHLCV ----------
export function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const REGIMES = [{ mu: 0.0009, s: 0.009 }, { mu: -0.0011, s: 0.018 }, { mu: 0.0001, s: 0.011 }];
const cache = new Map<number, Bar[]>();
/** Deterministic geometric random walk with regime switching, volatility clustering and volume spikes. NOT market data. */
export function synthSeries(seed: number, n = 756): Bar[] {
  const key = seed * 100000 + n, hit = cache.get(key);
  if (hit) return hit;
  const rnd = mulberry32(seed * 7919 + 13), gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const out: Bar[] = [], day = new Date(Date.UTC(2023, 9, 16));
  let px = 100, reg = 0, lv = 0;
  for (let i = 0; i < n; i++) {
    while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() + 1);
    if (rnd() < 1 / 70) reg = Math.floor(rnd() * REGIMES.length);
    lv = 0.92 * lv + 0.3 * gauss();
    const { mu, s } = REGIMES[reg], sg = s * Math.exp(0.5 * lv), o = px * Math.exp(0.25 * sg * gauss()), r = mu + sg * gauss(), c = o * Math.exp(r);
    const h = Math.max(o, c) * Math.exp(Math.abs(gauss()) * 0.5 * sg), l = Math.min(o, c) * Math.exp(-Math.abs(gauss()) * 0.5 * sg);
    const spike = rnd() < 0.04 ? 2 + 3 * rnd() : 1, v = Math.round(1e6 * Math.exp(0.3 * gauss()) * (1 + 0.5 * Math.abs(r / sg)) * spike);
    const q = (x: number) => Math.round(x * 100) / 100, oo = q(o), cc = q(c);
    out.push({ d: day.toISOString().slice(0, 10), o: oo, h: Math.max(q(h), oo, cc), l: Math.min(q(l), oo, cc), c: cc, v });
    px = c; day.setUTCDate(day.getUTCDate() + 1);
  }
  cache.set(key, out);
  return out;
}

// ---------- strategies: long/cash, signal on close t, fill at open t+1 ----------
export type StratId = "TREND_MOMENTUM" | "BREAKOUT_CONFIRM" | "MEAN_REVERSION";
export interface ParamDef { key: string; label: string; value: number; step: number; min: number; int?: boolean }
export const STRAT_PARAMS: Record<StratId, ParamDef[]> = {
  TREND_MOMENTUM: [
    { key: "fast", label: "Fast EMA", value: 12, step: 1, min: 2, int: true }, { key: "slow", label: "Slow EMA", value: 26, step: 1, min: 3, int: true },
    { key: "rsiIn", label: "RSI to enter at or above", value: 50, step: 1, min: 1 }, { key: "rsiOut", label: "RSI to exit below", value: 50, step: 1, min: 1 },
  ],
  BREAKOUT_CONFIRM: [
    { key: "look", label: "Breakout window (prior bars)", value: 10, step: 1, min: 2, int: true }, { key: "exitLook", label: "Exit window (prior bars)", value: 5, step: 1, min: 2, int: true },
    { key: "buf", label: "Buffer over prior high (ATR)", value: 0, step: 0.05, min: 0 }, { key: "rv", label: "Minimum relative volume", value: 1, step: 0.1, min: 0 },
  ],
  MEAN_REVERSION: [
    { key: "bbN", label: "Band window", value: 20, step: 1, min: 3, int: true }, { key: "bbK", label: "Band width (sd)", value: 1, step: 0.1, min: 0.1 },
    { key: "regime", label: "Regime filter SMA", value: 50, step: 5, min: 5, int: true }, { key: "hold", label: "Signal expiry (bars held)", value: 5, step: 1, min: 1, int: true },
  ],
};
export interface Sig { enter: boolean[]; exit: boolean[]; maxHold: number; atr: Arr }
export type Params = Record<string, number>;
export function signals(id: StratId, b: Bar[], p: Params, seed: Seed = "sma"): Sig {
  const h = b.map((x) => x.h), l = b.map((x) => x.l), c = b.map((x) => x.c), v = b.map((x) => x.v), n = b.length, at = atr(h, l, c, 14);
  const enter = new Array<boolean>(n).fill(false), exit = new Array<boolean>(n).fill(false);
  let maxHold = Infinity;
  if (id === "TREND_MOMENTUM") {
    const f = ema(c, p.fast, seed), s = ema(c, p.slow, seed), r = rsi(c, 14);
    for (let t = 0; t < n; t++) if (f[t] !== null && s[t] !== null && r[t] !== null) {
      enter[t] = nn(f[t]) > nn(s[t]) && nn(r[t]) >= p.rsiIn; exit[t] = nn(f[t]) < nn(s[t]) || nn(r[t]) < p.rsiOut;
    }
  } else if (id === "BREAKOUT_CONFIRM") {
    const rv = relVolume(v, 20);
    for (let t = Math.max(p.look, p.exitLook); t < n; t++) {
      let hh = -Infinity, ll = Infinity;
      for (let j = t - p.look; j < t; j++) hh = Math.max(hh, h[j]);
      for (let j = t - p.exitLook; j < t; j++) ll = Math.min(ll, l[j]);
      if (at[t] !== null && rv[t] !== null) enter[t] = c[t] > hh + p.buf * nn(at[t]) && nn(rv[t]) >= p.rv;
      exit[t] = c[t] < ll;
    }
  } else {
    const bb = bollinger(c, p.bbN, p.bbK), reg = sma(c, p.regime);
    maxHold = p.hold;
    for (let t = 0; t < n; t++) if (bb.lo[t] !== null && reg[t] !== null) { enter[t] = c[t] > nn(reg[t]) && c[t] < nn(bb.lo[t]); exit[t] = c[t] >= nn(bb.mid[t]); }
  }
  return { enter, exit, maxHold, atr: at };
}
export interface Trade { sigI: number; inI: number; inPx: number; outSig: number | null; outI: number | null; outPx: number | null; why: "signal" | "time" | "stop" | "open"; ret: number }
export interface BT { trades: Trade[]; ret: number[]; fills: number[]; inPos: boolean; pending: "enter" | "exit" | null }
/**
 * Long/cash. A signal on bar t close is filled at bar t+1 open. One-way cost in bps on every fill.
 * Optional ATR stop (stopK x ATR at the signal bar, below the entry fill): filled at the stop, or at the open if it gaps through.
 * After a stop the strategy stays out until its entry condition has gone false and fired again.
 */
export function backtest(b: Bar[], s: Sig, o: { costBps: number; stopK: number }): BT {
  const n = b.length, cost = o.costBps / 1e4, ret = new Array<number>(n).fill(0), fills = new Array<number>(n).fill(0), trades: Trade[] = [];
  let inPos = false, pend: BT["pending"] = null, why: Trade["why"] = "signal", blocked = false, stop = -Infinity, cur: Trade | null = null;
  const close = (px: number, outSig: number | null, j: number, w: Trade["why"]) => {
    cur = cur as Trade; cur.outSig = outSig; cur.outI = j; cur.outPx = px; cur.why = w; cur.ret = (px / cur.inPx) * (1 - cost) ** 2 - 1; cur = null; inPos = false;
  };
  for (let j = 0; j < n; j++) {
    const x = b[j]; let ref = j > 0 ? b[j - 1].c : x.o, g = 1;
    if (pend === "enter" && !inPos) {
      inPos = true; ref = x.o; g *= 1 - cost; fills[j]++;
      stop = o.stopK > 0 && s.atr[j - 1] !== null ? x.o - o.stopK * nn(s.atr[j - 1]) : -Infinity;
      cur = { sigI: j - 1, inI: j, inPx: x.o, outSig: null, outI: null, outPx: null, why: "open", ret: 0 }; trades.push(cur);
    } else if (pend === "exit" && inPos) {
      g *= (x.o / ref) * (1 - cost); fills[j]++; close(x.o, j - 1, j, why);
    }
    pend = null;
    if (inPos) {
      if (x.l <= stop) { const px = Math.min(x.o, stop); g *= (px / ref) * (1 - cost); fills[j]++; close(px, null, j, "stop"); blocked = true; }
      else g *= x.c / ref;
    }
    ret[j] = g - 1;
    if (!s.enter[j]) blocked = false;
    if (inPos) {
      const held = j - (cur as Trade).inI + 1;
      if (s.exit[j]) { pend = "exit"; why = "signal"; } else if (held >= s.maxHold) { pend = "exit"; why = "time"; }
    } else if (!blocked && s.enter[j]) pend = "enter";
  }
  const open = cur as Trade | null;
  if (open) open.ret = (b[n - 1].c / open.inPx) * (1 - cost) - 1;
  return { trades, ret, fills, inPos, pending: pend };
}

// ---------- metrics ----------
export const MIN_TRADES = 10;
export const TRADING_DAYS = 252;
export interface Curve { total: number; cagr: number; mdd: number; sharpe: number }
/** Metrics of daily returns r[a..z). Sharpe is annualised with sqrt(252), risk-free rate 0, sample standard deviation. */
export function curveStats(r: number[], a: number, z: number): Curve {
  const x = r.slice(a, z), len = x.length;
  let eq = 1, peak = 1, mdd = 0;
  for (const v of x) { eq *= 1 + v; peak = Math.max(peak, eq); mdd = Math.min(mdd, eq / peak - 1); }
  const mean = x.reduce((s, v) => s + v, 0) / (len || 1), sd = Math.sqrt(x.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, len - 1));
  return { total: eq - 1, cagr: len ? eq ** (TRADING_DAYS / len) - 1 : NaN, mdd, sharpe: sd > 0 ? (mean / sd) * Math.sqrt(TRADING_DAYS) : NaN };
}
export interface Stats extends Curve { trades: number; hit: number; turnover: number }
export type Sample = ({ insufficient: false } & Stats) | { insufficient: true; trades: number };
/** Strategy metrics for bars [a, z). A trade counts only if it both enters and exits inside the sample, so no later outcome leaks into an earlier sample. Fails closed under MIN_TRADES closed trades. */
export function sampleStats(bt: BT, a: number, z: number, min = MIN_TRADES): Sample {
  const t = bt.trades.filter((x) => x.inI >= a && x.inI < z && x.outI !== null && x.outI < z);
  if (t.length < min) return { insufficient: true, trades: t.length };
  const fills = bt.fills.slice(a, z).reduce((s, v) => s + v, 0);
  return { insufficient: false, ...curveStats(bt.ret, a, z), trades: t.length, hit: t.filter((x) => x.ret > 0).length / t.length, turnover: fills / ((z - a) / TRADING_DAYS) };
}
/** Buy-and-hold close-to-close returns (bar 0 from its open), no costs. */
export const holdReturns = (b: Bar[]) => b.map((x, i) => x.c / (i ? b[i - 1].c : x.o) - 1);
export const equityOf = (r: number[]) => { let e = 1; return r.map((v) => (e *= 1 + v)); };
export const drawdownOf = (r: number[]) => { let e = 1, p = 1; return r.map((v) => { e *= 1 + v; p = Math.max(p, e); return e / p - 1; }); };
export const splitIndex = (n: number) => Math.floor(n * 0.7);
