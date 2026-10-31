import { expect, it } from "vitest";
import { bsm, impliedVol, payoff, breakeven } from "./options";
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
