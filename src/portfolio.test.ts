import { describe, expect, it } from "vitest";
import {
  minVarWeight,
  portfolioVol,
  sanitize,
  undiversifiedVol,
} from "./portfolio";

const base = { w1: 0.5, s1: 0.2, s2: 0.3, rho: 0.25 };

describe("portfolioVol", () => {
  it("matches hand calculation", () => {
    // 0.25*0.04 + 0.25*0.09 + 2*0.25*0.25*0.06 = 0.01+0.0225+0.0075 = 0.04 -> 0.2
    expect(portfolioVol(base)).toBeCloseTo(0.2, 12);
  });
  it("rho=1 equals weighted average", () => {
    const i = { ...base, rho: 1 };
    expect(portfolioVol(i)).toBeCloseTo(undiversifiedVol(i), 12);
  });
  it("rho=-1 with equal vols and weights is zero (no NaN)", () => {
    expect(portfolioVol({ w1: 0.5, s1: 0.2, s2: 0.2, rho: -1 })).toBe(0);
  });
  it("single-asset weights return that asset volatility", () => {
    expect(portfolioVol({ ...base, w1: 1 })).toBeCloseTo(0.2, 12);
    expect(portfolioVol({ ...base, w1: 0 })).toBeCloseTo(0.3, 12);
  });
  it("zero variance cases", () => {
    expect(portfolioVol({ w1: 0.4, s1: 0, s2: 0, rho: 0.5 })).toBe(0);
    expect(portfolioVol({ w1: 0.4, s1: 0, s2: 0.3, rho: 0.5 })).toBeCloseTo(
      0.6 * 0.3,
      12,
    );
  });
  it("never exceeds undiversified vol", () => {
    for (const rho of [-1, -0.5, 0, 0.5, 1])
      expect(portfolioVol({ ...base, rho })).toBeLessThanOrEqual(
        undiversifiedVol(base) + 1e-12,
      );
  });
});

describe("sanitize", () => {
  it("clamps out-of-bounds and non-finite inputs", () => {
    expect(sanitize({ w1: 2, s1: -1, s2: NaN, rho: 5 })).toEqual({
      w1: 1,
      s1: 0,
      s2: 0,
      rho: 1,
    });
  });
});

describe("minVarWeight", () => {
  it("uncorrelated textbook case", () => {
    // s1=.2 s2=.3 rho=0: w1 = .09/(.04+.09) = 0.6923
    expect(minVarWeight({ ...base, rho: 0 })).toBeCloseTo(0.09 / 0.13, 12);
  });
  it("actually minimises volatility on a grid", () => {
    const w = minVarWeight(base)!;
    const v = portfolioVol({ ...base, w1: w });
    for (let k = 0; k <= 100; k++)
      expect(portfolioVol({ ...base, w1: k / 100 })).toBeGreaterThanOrEqual(
        v - 1e-12,
      );
  });
  it("perfect hedge gives 0.6 / 0.4 style weight and zero vol", () => {
    const i = { w1: 0, s1: 0.2, s2: 0.3, rho: -1 };
    const w = minVarWeight(i)!;
    expect(w).toBeCloseTo(0.6, 12);
    expect(portfolioVol({ ...i, w1: w })).toBeCloseTo(0, 9);
  });
  it("degenerate cases", () => {
    expect(minVarWeight({ w1: 0.5, s1: 0, s2: 0, rho: 0 })).toBeNull();
    expect(minVarWeight({ w1: 0.5, s1: 0.2, s2: 0.2, rho: 1 })).toBe(1);
  });
});
