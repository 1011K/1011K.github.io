import { expect, it } from "vitest";
import { bsm, impliedVol, payoff, breakeven, premiumBounds, intrinsic, theoryPrice, positionValue, positionGreeks, positionPayoff, breakevens, futuresFair, toCalendarDays } from "./options";
const base = { spot: 100, strike: 100, days: 365, vol: 0.2, rate: 0.05, yield: 0 };
it("matches the textbook Black-Scholes values", () => {
  const x = bsm(base);
  expect(x.call.price).toBeCloseTo(10.4506, 3);
  expect(x.put.price).toBeCloseTo(5.5735, 3);
  expect(x.call.delta).toBeCloseTo(0.6368, 3);
  expect(x.gamma).toBeCloseTo(0.018762, 5);
  expect(x.vega).toBeCloseTo(0.37524, 4);
});
it("satisfies put-call parity with a dividend yield", () => {
  for (const [spot, strike, days] of [[100, 80, 30], [100, 120, 400], [50, 50, 7]])
    expect(Math.abs(bsm({ ...base, spot, strike, days, yield: 0.02 }).parity)).toBeLessThan(1e-9);
});
it("greeks agree with finite differences", () => {
  const q = { ...base, yield: 0.03 }, h = 0.01, x = bsm(q);
  const up = bsm({ ...q, spot: q.spot + h }), dn = bsm({ ...q, spot: q.spot - h });
  expect((up.call.price - dn.call.price) / (2 * h)).toBeCloseTo(x.call.delta, 5);
  expect((up.put.price - dn.put.price) / (2 * h)).toBeCloseTo(x.put.delta, 5);
  expect((up.call.price - 2 * x.call.price + dn.call.price) / (h * h)).toBeCloseTo(x.gamma, 4);
  const dv = (bsm({ ...q, vol: 0.2001 }).call.price - bsm({ ...q, vol: 0.1999 }).call.price) / 0.0002;
  expect(dv / 100).toBeCloseTo(x.vega, 5);
  const dt = bsm({ ...q, days: q.days - 1 }).call.price - x.call.price;
  expect(dt).toBeCloseTo(x.call.theta, 3);
  const pdt = bsm({ ...q, days: q.days - 1 }).put.price - x.put.price;
  expect(pdt).toBeCloseTo(x.put.theta, 3);
  const dr = (bsm({ ...q, rate: 0.0501 }).call.price - bsm({ ...q, rate: 0.0499 }).call.price) / 0.0002;
  expect(dr / 100).toBeCloseTo(x.call.rho, 5);
  const pr = (bsm({ ...q, rate: 0.0501 }).put.price - bsm({ ...q, rate: 0.0499 }).put.price) / 0.0002;
  expect(pr / 100).toBeCloseTo(x.put.rho, 5);
});
it("fails closed on missing or invalid inputs instead of pricing from spot alone", () => {
  for (const bad of [{ vol: NaN }, { vol: 0 }, { days: 0 }, { strike: -1 }, { spot: 0 }, { rate: Infinity }])
    expect(() => bsm({ ...base, ...bad })).toThrow();
});
it("recovers implied volatility and rejects out-of-bound premiums", () => {
  const { vol: _v, ...rest } = base;
  const p = bsm({ ...base, vol: 0.37 }).call.price;
  expect(impliedVol(rest, "call", p)).toBeCloseTo(0.37, 6);
  expect(() => impliedVol(rest, "call", 0.0001)).toThrow(/No implied volatility/);
  expect(() => impliedVol(rest, "call", 100)).toThrow(/No implied volatility/);
  expect(() => impliedVol(rest, "put", -1)).toThrow();
});
it("recovers put implied volatility across moneyness", () => {
  const { vol: _v, ...rest } = base;
  for (const strike of [70, 100, 140])
    for (const vol of [0.05, 0.4, 1.2]) {
      const r = { ...rest, strike, yield: 0.02 };
      const p = bsm({ ...r, vol }).put.price;
      const T = r.days / 365, lower = Math.max(0, strike * Math.exp(-r.rate * T) - r.spot * Math.exp(-r.yield * T));
      if (p - lower > 1e-4) expect(impliedVol(r, "put", p)).toBeCloseTo(vol, 3);
    }
});
it("computes expiry payoff and breakeven", () => {
  expect(payoff("call", 100, 5, 90)).toBe(-5);
  expect(payoff("call", 100, 5, 120)).toBe(15);
  expect(payoff("put", 100, 4, 80)).toBe(16);
  expect(breakeven("call", 100, 5)).toBe(105);
  expect(breakeven("put", 100, 4)).toBe(96);
});

it("computes futures fair value by cost of carry", () => {
  expect(futuresFair(100, 0.05, 0, 365)).toBeCloseTo(100 * Math.exp(0.05), 10);
  expect(futuresFair(100, 0.05, 0.02, 73)).toBeCloseTo(100 * Math.exp(0.03 * 0.2), 10);
  expect(futuresFair(100, 0.05, 0.02, 0)).toBe(100);
  expect(futuresFair(100, 0.05, 0.02, 30)).toBeCloseTo(bsm({ ...base, days: 30, yield: 0.02 }).forward, 10);
  expect(() => futuresFair(NaN, 0, 0, 1)).toThrow();
  expect(() => futuresFair(0, 0, 0, 1)).toThrow();
  expect(() => futuresFair(100, 0, 0, -1)).toThrow();
});
it("straddle payoff is the sum of both legs net of total premium, and scales with lot size", () => {
  expect(positionPayoff("straddle", 100, 10, 100)).toBe(-10);
  expect(positionPayoff("straddle", 100, 10, 130)).toBe(20);
  expect(positionPayoff("straddle", 100, 10, 70)).toBe(20);
  expect(positionPayoff("call", 100, 5, 120)).toBe(payoff("call", 100, 5, 120));
  expect(positionPayoff("put", 100, 4, 80)).toBe(payoff("put", 100, 4, 80));
  expect(breakevens("straddle", 100, 10)).toEqual([90, 110]);
  expect(breakevens("straddle", 100, 120)).toEqual([220]);
  expect(breakevens("call", 100, 5)).toEqual([105]);
  const lot = 50, lots = 3, perShare = positionPayoff("straddle", 100, 10, 130);
  expect(perShare * lot * lots).toBe(3000);
});
it("straddle value and greeks are the sum of the call and put", () => {
  const x = bsm({ ...base, yield: 0.02 }), g = positionGreeks(x, "straddle");
  expect(g.price).toBeCloseTo(x.call.price + x.put.price, 12);
  expect(g.delta).toBeCloseTo(x.call.delta + x.put.delta, 12);
  expect(g.gamma).toBeCloseTo(2 * x.gamma, 12);
  expect(g.vega).toBeCloseTo(2 * x.vega, 12);
  expect(g.theta).toBeCloseTo(x.call.theta + x.put.theta, 12);
  expect(positionValue({ ...base, yield: 0.02 }, "straddle")).toBeCloseTo(g.price, 12);
  expect(positionGreeks(x, "put").delta).toBe(x.put.delta);
});
it("put-call parity holds with yield in the form C - P = S e^-qT - K e^-rT", () => {
  const i = { ...base, spot: 120, strike: 95, days: 200, yield: 0.04 }, T = 200 / 365;
  expect(theoryPrice(i, "call") - theoryPrice(i, "put")).toBeCloseTo(120 * Math.exp(-0.04 * T) - 95 * Math.exp(-0.05 * T), 9);
});
it("converges to intrinsic as time to expiry goes to zero and is intrinsic at T=0 or when expired", () => {
  for (const [spot, strike] of [[110, 100], [90, 100], [100, 100]] as const) {
    const i = { ...base, spot, strike, rate: 0.03, yield: 0.01 };
    for (const right of ["call", "put"] as const) {
      expect(Math.abs(bsm({ ...i, days: 1e-6 })[right].price - intrinsic(right, spot, strike))).toBeLessThan(1e-3);
      expect(theoryPrice({ ...i, days: 0 }, right)).toBe(intrinsic(right, spot, strike));
      expect(theoryPrice({ ...i, days: -5 }, right)).toBe(intrinsic(right, spot, strike));
    }
  }
});
it("handles sigma=0 as the deterministic discounted forward intrinsic and matches the small-sigma limit", () => {
  const i = { ...base, spot: 110, strike: 100, yield: 0.01 };
  const T = 1, c0 = theoryPrice({ ...i, vol: 0 }, "call");
  expect(c0).toBeCloseTo(110 * Math.exp(-0.01 * T) - 100 * Math.exp(-0.05 * T), 12);
  expect(theoryPrice({ ...i, vol: 0 }, "put")).toBe(0);
  expect(theoryPrice({ ...i, vol: 1e-6 }, "call")).toBeCloseTo(c0, 6);
  expect(() => theoryPrice({ ...i, vol: -0.1 }, "call")).toThrow(/negative/);
  expect(() => theoryPrice({ ...i, vol: NaN }, "call")).toThrow();
  expect(() => theoryPrice({ ...i, spot: 0 }, "call")).toThrow();
});
it("deep in- and out-of-the-money branches stay finite and sensible", () => {
  const otm = bsm({ ...base, spot: 100, strike: 300, days: 30 }), itm = bsm({ ...base, spot: 300, strike: 100, days: 30 });
  expect(otm.call.price).toBeLessThan(1e-12);
  expect(itm.call.delta).toBeCloseTo(1, 8);
  expect(itm.call.price).toBeCloseTo(300 - 100 * Math.exp(-0.05 * 30 / 365), 6);
  expect(Math.abs(itm.parity)).toBeLessThan(1e-9);
});
it("reports no-arbitrage premium bounds and fails implied vol closed outside them", () => {
  const { vol: _v, ...rest } = base, T = 1;
  const b = premiumBounds({ ...rest, strike: 80 }, "call");
  expect(b.lower).toBeCloseTo(100 - 80 * Math.exp(-0.05 * T), 10);
  expect(b.upper).toBe(100);
  expect(premiumBounds(rest, "put")).toEqual({ lower: Math.max(0, 100 * Math.exp(-0.05) - 100), upper: 100 * Math.exp(-0.05) });
  expect(() => impliedVol({ ...rest, strike: 80 }, "call", b.lower - 0.5)).toThrow(/between/);
  expect(() => impliedVol(rest, "call", NaN)).toThrow(/positive/);
  expect(() => impliedVol({ ...rest, days: 0 }, "call", 3)).toThrow();
});
it("converts expiry bases to calendar days", () => {
  expect(toCalendarDays(30, "calendar")).toBe(30);
  expect(toCalendarDays(252, "trading")).toBeCloseTo(365, 10);
  expect(toCalendarDays(0.5, "years")).toBeCloseTo(182.5, 10);
});
