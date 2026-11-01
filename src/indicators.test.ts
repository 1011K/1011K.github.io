import { describe, expect, it } from "vitest";
import {
  adx, atr, backtest, bollinger, cci, curveStats, ema, levels, macd, measuredWarmup, obv, registry, roc, rsi, sampleStats, signals, sma,
  stochastic, STRAT_PARAMS, synthSeries, wma, type Arr, type Bar, type Sig, type StratId,
} from "./indicators.ts";

const close = (a: Arr, e: (number | null)[]) => {
  expect(a.length).toBe(e.length);
  e.forEach((v, i) => (v === null ? expect(a[i]).toBeNull() : expect(a[i]).toBeCloseTo(v, 9)));
};
const mk = (o: number[], h = o.map((x) => x + 1), l = o.map((x) => x - 1), c = o): Bar[] => o.map((x, i) => ({ d: `d${i}`, o: x, h: h[i], l: l[i], c: c[i], v: 1000 }));

describe("indicators, hand computed", () => {
  it("SMA and WMA", () => {
    close(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
    close(wma([1, 2, 3, 4], 3), [null, null, 14 / 6, 20 / 6]);
  });
  it("EMA with both seeds differs in warm-up", () => {
    const x = [2, 4, 6, 8, 4];
    close(ema(x, 3, "sma"), [null, null, 4, 6, 5]);
    close(ema(x, 3, "first"), [2, 3, 4.5, 6.25, 5.125]);
    const long = synthSeries(1).map((b) => b.c);
    const a = ema(long, 26, "sma"), f = ema(long, 26, "first");
    expect(Math.abs(nn(a[26]) - nn(f[26]))).toBeGreaterThan(1e-6);
    expect(Math.abs(nn(a[700]) - nn(f[700]))).toBeLessThan(1e-6); // converged
  });
  it("RSI Wilder", () => {
    const r = rsi([10, 11, 10.5, 11.5, 11, 12], 3);
    close(r, [null, null, null, 80, 100 - 100 / 2.6, 100 - 100 / 4.4]);
  });
  it("RSI zero-gain, zero-loss and flat edges", () => {
    close(rsi([1, 2, 3, 4, 5], 3), [null, null, null, 100, 100]);
    close(rsi([5, 4, 3, 2, 1], 3), [null, null, null, 0, 0]);
    close(rsi([3, 3, 3, 3, 3], 3), [null, null, null, 50, 50]);
  });
  it("Bollinger uses population sd", () => {
    const b = bollinger([1, 2, 3, 4], 3, 2), sd = Math.sqrt(2 / 3);
    close(b.mid, [null, null, 2, 3]);
    close(b.up, [null, null, 2 + 2 * sd, 3 + 2 * sd]);
    close(b.lo, [null, null, 2 - 2 * sd, 3 - 2 * sd]);
  });
  it("ATR Wilder", () => {
    const h = [10, 11, 13, 12, 11], l = [8, 9, 10, 9, 10], c = [9, 10, 12, 10, 11];
    close(atr(h, l, c, 3), [null, null, null, 8 / 3, 19 / 9]);
  });
  it("OBV, ROC, CCI, stochastic", () => {
    close(obv([10, 11, 11, 10], [100, 200, 300, 400]), [0, 200, 200, -200]);
    close(roc([100, 110, 121], 1), [null, 10, 10]);
    close(cci([2, 2, 2], [2, 2, 2], [2, 2, 2], 3), [null, null, 0]);
    const s = stochastic([4, 6, 8], [0, 2, 4], [2, 4, 8], 3, 1);
    close(s.k, [null, null, 100 * (8 - 0) / (8 - 0)]);
    close(stochastic([5, 5, 5], [5, 5, 5], [5, 5, 5], 3, 1).k, [null, null, 50]);
  });
  it("MACD alignment per seed", () => {
    const c = synthSeries(2).map((b) => b.c), a = macd(c), f = macd(c, 12, 26, 9, "first");
    expect([measuredWarmup(a.line), measuredWarmup(a.signal), measuredWarmup(a.hist)]).toEqual([25, 33, 33]);
    expect([measuredWarmup(f.line), measuredWarmup(f.signal)]).toEqual([0, 0]);
    expect(nn(a.line[100])).toBeCloseTo(nn(ema(c, 12)[100]) - nn(ema(c, 26)[100]), 12);
    expect(nn(a.hist[100])).toBeCloseTo(nn(a.line[100]) - nn(a.signal[100]), 12);
  });
  it("ADX warm-up and a pure uptrend", () => {
    const up = Array.from({ length: 60 }, (_, i) => 100 + i), a = adx(up.map((x) => x + 1), up.map((x) => x - 1), up, 14);
    expect([measuredWarmup(a.pdi), measuredWarmup(a.adx)]).toEqual([14, 27]);
    expect(nn(a.mdi[40])).toBe(0);
    expect(nn(a.adx[59])).toBeCloseTo(100, 9);
  });
  it("registry declared warm-up equals measured warm-up, both seeds", () => {
    const b = synthSeries(3);
    for (const seed of ["sma", "first"] as const)
      for (const r of registry(b, seed)) {
        if (r.id === "res") expect(measuredWarmup(r.series)).toBeGreaterThanOrEqual(r.warmup);
        else expect([r.id, measuredWarmup(r.series)]).toEqual([r.id, r.warmup]);
      }
  });
});

describe("synthetic series", () => {
  it("is deterministic, valid OHLCV and seed dependent", () => {
    const a = synthSeries(1), b = synthSeries(2);
    expect(a.length).toBe(756);
    expect(JSON.stringify(synthSeries(1, 756))).toBe(JSON.stringify(a));
    expect(a[10].c).not.toBe(b[10].c);
    for (const x of a) { expect(x.h).toBeGreaterThanOrEqual(Math.max(x.o, x.c)); expect(x.l).toBeLessThanOrEqual(Math.min(x.o, x.c)); expect(x.l).toBeGreaterThan(0); expect(x.v).toBeGreaterThan(0); }
  });
});

const nn = (v: number | null) => v as number;
const same = (a: Arr, b: Arr, upTo: number) => expect(a.slice(0, upTo + 1)).toEqual(b.slice(0, upTo + 1));
const IDS = Object.keys(STRAT_PARAMS) as StratId[];
const defaults = (id: StratId) => Object.fromEntries(STRAT_PARAMS[id].map((p) => [p.key, p.value]));

describe("no look-ahead", () => {
  it("mutating future bars never changes earlier indicators, levels, signals or returns", () => {
    const base = synthSeries(4), T = 400;
    const alt = base.map((x, i) => (i <= T ? x : { ...x, o: x.o * 1.3, h: x.h * 1.9, l: x.l * 0.5, c: x.c * 0.7, v: x.v * 5 }));
    for (const seed of ["sma", "first"] as const) {
      const r1 = registry(base, seed), r2 = registry(alt, seed);
      r1.forEach((r, k) => same(r.series, r2[k].series, T));
    }
    const l1 = levels(base.map((x) => x.h), base.map((x) => x.l)), l2 = levels(alt.map((x) => x.h), alt.map((x) => x.l));
    same(l1.res, l2.res, T); same(l1.sup, l2.sup, T);
    for (const id of IDS) {
      const s1 = signals(id, base, defaults(id)), s2 = signals(id, alt, defaults(id));
      expect(s1.enter.slice(0, T + 1)).toEqual(s2.enter.slice(0, T + 1));
      expect(s1.exit.slice(0, T + 1)).toEqual(s2.exit.slice(0, T + 1));
      const o = { costBps: 10, stopK: 2 }, b1 = backtest(base, s1, o), b2 = backtest(alt, s2, o);
      expect(b1.ret.slice(0, T + 1)).toEqual(b2.ret.slice(0, T + 1));
    }
  });
});

const sig = (n: number, enter: number[], exit: number[], maxHold = Infinity): Sig => {
  const e = new Array<boolean>(n).fill(false), x = new Array<boolean>(n).fill(false);
  enter.forEach((i) => (e[i] = true)); exit.forEach((i) => (x[i] = true));
  return { enter: e, exit: x, maxHold, atr: new Array<number | null>(n).fill(null) };
};

describe("execution", () => {
  const b = mk([100, 101, 102, 103, 104, 105, 110, 111]);
  it("signal on close t fills at open t+1", () => {
    const r = backtest(b, sig(8, [2], [5]), { costBps: 0, stopK: 0 });
    expect(r.trades).toHaveLength(1);
    const t = r.trades[0];
    expect([t.sigI, t.inI, t.inPx]).toEqual([2, 3, 103]);
    expect([t.outSig, t.outI, t.outPx, t.why]).toEqual([5, 6, 110, "signal"]);
    expect(t.ret).toBeCloseTo(110 / 103 - 1, 12);
    expect(r.ret[2]).toBe(0); // nothing earned on the signal bar itself
    expect(r.ret.reduce((s, v) => s * (1 + v), 1)).toBeCloseTo(110 / 103, 12);
  });
  it("cost is charged once per fill and matches bar compounding", () => {
    const free = backtest(b, sig(8, [2], [5]), { costBps: 0, stopK: 0 }), paid = backtest(b, sig(8, [2], [5]), { costBps: 10, stopK: 0 });
    expect(paid.trades[0].ret).toBeCloseTo((110 / 103) * 0.999 ** 2 - 1, 12);
    expect(paid.ret.reduce((s, v) => s * (1 + v), 1)).toBeCloseTo((110 / 103) * 0.999 ** 2, 12);
    expect(paid.fills.reduce((s, v) => s + v, 0)).toBe(2);
    expect(free.trades[0].ret).toBeGreaterThan(paid.trades[0].ret);
  });
  it("time expiry exits next open; stop fills at stop or at a gap-down open", () => {
    const t = backtest(b, sig(8, [0], [], 2), { costBps: 0, stopK: 0 }).trades[0];
    expect([t.inI, t.outSig, t.outI, t.why]).toEqual([1, 2, 3, "time"]);
    const s = mk([100, 100, 100, 100, 100], [101, 101, 101, 101, 101], [99, 99, 94, 99, 99], [100, 100, 100, 100, 100]);
    const g = { ...sig(5, [0], []), atr: [2, 2, 2, 2, 2] as Arr };
    const st = backtest(s, g, { costBps: 0, stopK: 2 }).trades[0];
    expect([st.inI, st.outI, st.outPx, st.why, st.outSig]).toEqual([1, 2, 96, "stop", null]);
    const gap = mk([100, 100, 90], [101, 101, 91], [99, 99, 89], [100, 100, 90]);
    expect(backtest(gap, { ...sig(3, [0], []), atr: [2, 2, 2] }, { costBps: 0, stopK: 2 }).trades[0].outPx).toBe(90);
  });
  it("is blocked after a stop until the entry condition resets", () => {
    const s = mk(new Array(8).fill(100), new Array(8).fill(101), [99, 99, 90, 99, 99, 99, 99, 99]);
    const g = { ...sig(8, [0, 1, 2, 3, 5], []), atr: new Array(8).fill(2) as Arr };
    const r = backtest(s, g, { costBps: 0, stopK: 2 });
    expect(r.trades.map((t) => [t.inI, t.why])).toEqual([[1, "stop"], [6, "open"]]);
  });
});

describe("missing observations", () => {
  it("never reads a gap as zero when seeding or updating an EMA", () => {
    expect(ema([100, null, 100], 3)).toEqual([null, null, null]);
    const out = ema([10, 10, 10, null, 20, 20, 20], 3);
    expect(out.slice(0, 3)).toEqual([null, null, 10]);
    expect(out[3]).toBeNull();
    expect(out.slice(4)).toEqual([null, null, 20]);
    expect(ema([5, null, 7, 9], 2, "first")).toEqual([5, null, 7, 7 + (2 / 3) * (9 - 7)]);
  });
});

describe("sample size", () => {
  it("fails closed under 10 trades and reports above it", () => {
    const n = 300, b = mk(Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 5) * 5));
    const few = backtest(b, sig(n, [10, 50], [20, 60]), { costBps: 5, stopK: 0 });
    expect(sampleStats(few, 0, n)).toEqual({ insufficient: true, trades: 2 });
    const en = Array.from({ length: 25 }, (_, i) => 5 + i * 10), ex = en.map((i) => i + 4), many = backtest(b, sig(n, en, ex), { costBps: 5, stopK: 0 });
    const s = sampleStats(many, 0, n);
    expect(s.insufficient).toBe(false);
    if (!s.insufficient) { expect(s.trades).toBe(25); expect(s.turnover).toBeGreaterThan(0); expect(s.mdd).toBeLessThanOrEqual(0); }
    expect(sampleStats(many, 0, 110)).toMatchObject({ insufficient: false });
    expect(sampleStats(many, 0, 60)).toMatchObject({ insufficient: true });
  });
  it("does not count a trade that exits after the sample ends", () => {
    const n = 300, b = mk(Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 5) * 5));
    const en = Array.from({ length: 25 }, (_, i) => 5 + i * 10), ex = en.map((i) => i + 4), many = backtest(b, sig(n, en, ex), { costBps: 5, stopK: 0 });
    // Trade 10 enters at bar 96 and exits at bar 100, so it straddles z = 98 and must not enter the first sample.
    expect(sampleStats(many, 0, 98)).toEqual({ insufficient: true, trades: 9 });
  });
  it("curve stats", () => {
    const c = curveStats([0.1, -0.1, 0.1], 0, 3);
    expect(c.total).toBeCloseTo(1.1 * 0.9 * 1.1 - 1, 12);
    expect(c.mdd).toBeCloseTo(-0.1, 12);
    expect(curveStats([0, 0, 0], 0, 3).sharpe).toBeNaN();
  });
});
