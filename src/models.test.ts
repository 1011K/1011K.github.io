import { describe, expect, it } from "vitest";
import { dcf, blackScholes } from "./models";
import { diversificationPoints } from "./portfolio";

describe("independent educational models", () => {
  const input = {
    revenue: 1000,
    growth: 0.08,
    margin: 0.18,
    tax: 0.25,
    reinvestment: 0.3,
    wacc: 0.11,
    terminalGrowth: 0.03,
  };
  it("DCF matches independently discounted explicit cash flows and terminal value", () => {
    const v = dcf(input);
    const cash = [102.06, 110.2248, 119.042784, 128.56620672, 138.8515032576];
    const pv = cash.reduce((s, x, i) => s + x / 1.11 ** (i + 1), 0);
    expect(v.cashFlows).toEqual(cash.map((x) => expect.closeTo(x, 8)));
    expect(v.value).toBeCloseTo(pv + (cash[4] * 1.03) / 0.08 / 1.11 ** 5, 8);
    expect(dcf({ ...input, wacc: 0.12 }).value).toBeLessThan(v.value);
  });
  it("DCF rejects invalid rates, non-finite inputs and economic domains", () => {
    for (const x of [
      { wacc: 0.03 },
      { wacc: 0.02 },
      { revenue: NaN },
      { growth: Infinity },
      { reinvestment: 1.1 },
      { tax: -0.1 },
      { revenue: -1 },
    ])
      expect(() => dcf({ ...input, ...x })).toThrow();
  });
  it("zero FCFF has zero value and no meaningful terminal share", () => {
    const zero = dcf({ ...input, reinvestment: 1 });
    expect(zero.value).toBe(0);
    expect(zero.terminalShare).toBeNull();
  });
  const opt = { spot: 100, strike: 100, rate: 0.05, vol: 0.2, time: 1 };
  it("Black-Scholes matches published textbook no-dividend fixture", () => {
    const x = blackScholes(opt);
    expect(x.call.price).toBeCloseTo(10.45058357, 5);
    expect(x.put.price).toBeCloseTo(5.57352602, 5);
    expect(x.call.delta).toBeCloseTo(0.63683065, 6);
    expect(x.put.delta).toBeCloseTo(-0.36316935, 6);
    expect(x.gamma).toBeCloseTo(0.01876202, 7);
    expect(x.vega).toBeCloseTo(0.37524035, 6);
    expect(x.call.theta).toBeCloseTo(-6.41402755 / 365, 6);
    expect(x.put.theta).toBeCloseTo(-1.65788042 / 365, 6);
    expect(x.call.rho).toBeCloseTo(0.53232482, 6);
    expect(x.put.rho).toBeCloseTo(-0.41890461, 6);
  });
  it("put-call parity and Greeks match finite differences", () => {
    for (const spot of [50, 100, 180]) {
      const p = { ...opt, spot };
      const x = blackScholes(p),
        h = 0.001;
      const up = blackScholes({ ...p, spot: spot + h }),
        dn = blackScholes({ ...p, spot: spot - h });
      expect(x.call.price - x.put.price).toBeCloseTo(
        spot - 100 * Math.exp(-0.05),
        6,
      );
      expect((up.call.price - dn.call.price) / (2 * h)).toBeCloseTo(
        x.call.delta,
        4,
      );
      expect((up.call.delta - dn.call.delta) / (2 * h)).toBeCloseTo(x.gamma, 5);
      expect(
        (blackScholes({ ...p, vol: 0.2001 }).call.price -
          blackScholes({ ...p, vol: 0.1999 }).call.price) /
          0.02,
      ).toBeCloseTo(x.vega, 4);
    }
  });
  it("rejects expiry, zero volatility and non-finite option inputs", () => {
    for (const x of [
      { time: 0 },
      { vol: 0 },
      { spot: 0 },
      { strike: -1 },
      { rate: NaN },
      { time: Infinity },
    ])
      expect(() => blackScholes({ ...opt, ...x })).toThrow();
    expect(
      Number.isFinite(
        blackScholes({ ...opt, spot: 1, time: 0.001 }).call.price,
      ),
    ).toBe(true);
  });
  it("reports default diversification as 5 percentage points", () => {
    expect(
      diversificationPoints({ w1: 0.5, s1: 0.2, s2: 0.3, rho: 0.25 }),
    ).toBeCloseTo(5, 12);
  });
});
