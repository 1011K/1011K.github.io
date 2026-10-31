import { describe, expect, it } from "vitest";
import {
  syntheticSeries,
  ema,
  rsi,
  backtest,
  expiryPayoff,
  allocation,
} from "./labs-models";

describe("causal synthetic technical study", () => {
  it("has deterministic valid OHLCV candles, not historical issuer data", () => {
    const a = syntheticSeries();
    expect(a).toEqual(syntheticSeries());
    expect(a).toHaveLength(180);
    for (const c of a) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
      expect(c.low).toBeGreaterThan(0);
      expect(c.volume).toBeGreaterThan(0);
    }
  });
  it("EMA and Wilder RSI match simple independent fixtures", () => {
    expect(ema([10, 20, 30], 3)).toEqual([10, 15, 22.5]);
    expect(rsi([1, 2, 3, 4, 5], 3)).toEqual([null, null, null, 100, 100]);
    expect(rsi([5, 4, 3, 2, 1], 3).slice(3)).toEqual([0, 0]);
    expect(rsi([2, 2, 2, 2, 2], 3).slice(3)).toEqual([50, 50]);
  });
  it("future candles cannot change previous signals, returns or indicators", () => {
    const a = syntheticSeries(),
      b = a.map((c, i) =>
        i < 120
          ? c
          : {
              ...c,
              open: c.open * 2,
              close: c.close * 2,
              high: c.high * 2,
              low: c.low * 2,
            },
      );
    for (const strategy of ["trend", "rsi"] as const) {
      const first = backtest(a, { period: 14, strategy, costBps: 10 });
      const second = backtest(b, { period: 14, strategy, costBps: 10 });
      expect(first.equity.slice(0, 120)).toEqual(second.equity.slice(0, 120));
      expect(first.positions.slice(0, 120)).toEqual(
        second.positions.slice(0, 120),
      );
      expect(first.rsi.slice(0, 120)).toEqual(second.rsi.slice(0, 120));
    }
  });
  it("charges entry/exit costs, changes with parameters and rejects invalid input", () => {
    const candles = syntheticSeries();
    const a = backtest(candles, { period: 8, strategy: "trend", costBps: 0 });
    const b = backtest(candles, { period: 8, strategy: "trend", costBps: 25 });
    expect(b.equity.at(-1)!).toBeLessThan(a.equity.at(-1)!);
    expect(
      backtest(candles, { period: 30, strategy: "trend", costBps: 10 })
        .positions,
    ).not.toEqual(a.positions);
    expect(a.drawdown.every((x) => x <= 0)).toBe(true);
    expect(() =>
      backtest([], { period: 14, strategy: "trend", costBps: 10 }),
    ).toThrow();
    expect(() =>
      backtest(candles, { period: 0, strategy: "trend", costBps: 10 }),
    ).toThrow();
    expect(() =>
      backtest(candles, { period: 14, strategy: "trend", costBps: -1 }),
    ).toThrow();
    expect(() => ema([1, NaN], 3)).toThrow();
  });
});
describe("expiry P&L, not model fair value", () => {
  const i = { spot: 100, strike: 100, premium: 5, days: 30 };
  it("long call has premium risk, strike+premium breakeven and unbounded upside", () => {
    const x = expiryPayoff(i, "call");
    expect(x.pnl(0)).toBe(-5);
    expect(x.pnl(120)).toBe(15);
    expect(x.breakeven).toBe(105);
    expect(x.maxLoss).toBe(5);
  });
  it("protective put includes purchase of underlying and put premium", () => {
    const x = expiryPayoff(i, "protective");
    expect(x.pnl(0)).toBe(-5);
    expect(x.pnl(90)).toBe(-5);
    expect(x.pnl(120)).toBe(15);
    expect(x.breakeven).toBe(105);
    expect(x.maxLoss).toBe(5);
    expect(
      expiryPayoff({ ...i, strike: 110 }, "protective").breakeven,
    ).toBeNull();
  });
  it("rejects blank-domain, negative, nonfinite inputs and invalid expiry scenarios", () => {
    for (const patch of [
      { spot: 0 },
      { strike: 0 },
      { premium: -1 },
      { days: 0 },
      { spot: Infinity },
    ])
      expect(() => expiryPayoff({ ...i, ...patch }, "call")).toThrow();
    expect(() => expiryPayoff(i, "call").pnl(-1)).toThrow();
  });
});
describe("standalone allocation and Euler risk", () => {
  it("matches textbook 20% volatility and adds contributions to total risk", () => {
    const x = allocation({ w1: 0.5, s1: 0.2, s2: 0.3, rho: 0.25 });
    expect(x.vol).toBeCloseTo(0.2, 12);
    expect(x.contributions[0]).toBeCloseTo(0.06875, 12);
    expect(x.contributions.reduce((a, b) => a + b)).toBeCloseTo(x.vol, 12);
    expect(x.concentration).toBe(0.5);
  });
  it("handles +/-1 correlation, zero variance and 0/100 weights", () => {
    expect(allocation({ w1: 0.5, s1: 0.2, s2: 0.2, rho: -1 }).vol).toBe(0);
    expect(allocation({ w1: 0.5, s1: 0, s2: 0, rho: 1 }).contributions).toEqual(
      [0, 0],
    );
    expect(allocation({ w1: 1, s1: 0.2, s2: 0.3, rho: 1 }).vol).toBe(0.2);
    expect(allocation({ w1: 0, s1: 0.2, s2: 0.3, rho: -1 }).vol).toBe(0.3);
    const x = allocation({ w1: 0.333333333, s1: 0.2, s2: 0.3, rho: 1 });
    expect(x.contributions.reduce((a, b) => a + b)).toBeCloseTo(x.vol, 12);
  });
  it("rejects invalid assumptions rather than silently replacing missing inputs with zero", () => {
    for (const patch of [{ w1: NaN }, { s1: -1 }, { rho: 1.01 }, { w1: 1.01 }])
      expect(() =>
        allocation({ w1: 0.5, s1: 0.2, s2: 0.3, rho: 0, ...patch }),
      ).toThrow();
  });
});

it("supports the full advertised backtest period range",()=>{expect(()=>backtest(syntheticSeries(),{period:60,strategy:"trend",costBps:10})).not.toThrow();});
