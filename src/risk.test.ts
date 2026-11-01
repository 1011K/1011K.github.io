import { describe, expect, it } from "vitest";
import { annualSd, corrFromUpper, drawdown, eigenvalues, maxAbsDiff, portfolioPath, portfolioRisk, rollingCorr, sampleCorr, simulate, stress, validateModel, validateWeights } from "./risk.ts";

const two = (rho: number) => [[1, rho], [rho, 1]];

describe("portfolio risk", () => {
  it("matches the two-asset hand formula", () => {
    const [s1, s2, rho, w1] = [0.2, 0.3, 0.25, 0.4], w2 = 1 - w1;
    const r = portfolioRisk([s1, s2], two(rho), [w1, w2]);
    expect(r.variance).toBeCloseTo(w1 ** 2 * s1 ** 2 + w2 ** 2 * s2 ** 2 + 2 * w1 * w2 * rho * s1 * s2, 14);
    expect(r.vol).toBeCloseTo(Math.sqrt(r.variance), 14);
  });
  it("contributions sum to portfolio volatility and variance (five assets)", () => {
    const c = corrFromUpper(5, [0.3, 0.1, -0.2, 0.5, 0.4, 0.2, 0.0, 0.6, -0.1, 0.35]), v = [0.18, 0.35, 0.22, 0.28, 0.25], w = [0.1, 0.3, 0.2, 0.25, 0.15];
    validateModel(v, c);
    const r = portfolioRisk(v, c, w);
    expect(r.compVol.reduce((a, b) => a + b)).toBeCloseTo(r.vol, 12);
    expect(r.compVar.reduce((a, b) => a + b)).toBeCloseTo(r.variance, 12);
    expect(r.share.reduce((a, b) => a + b)).toBeCloseTo(1, 12);
    expect(r.compVol[0]).toBeCloseTo(w[0] * r.marginal[0], 14);
  });
  it("rho = 1 gives the weighted average vol (diversification ratio 1); rho = -1 can cancel", () => {
    const up = portfolioRisk([0.2, 0.3], two(1), [0.5, 0.5]);
    expect(up.vol).toBeCloseTo(0.25, 12);
    expect(up.divRatio).toBeCloseTo(1, 12);
    const dn = portfolioRisk([0.2, 0.2], two(-1), [0.5, 0.5]);
    expect(dn.vol).toBeCloseTo(0, 7);
    expect(dn.compVol[0]).toBeNaN(); // withheld, not divided by zero
    expect(portfolioRisk([0.2, 0.3], two(-1), [0.7, 0.3]).vol).toBeCloseTo(Math.abs(0.7 * 0.2 - 0.3 * 0.3), 12);
  });
  it("stress: vols x k scale risk, shrink toward 1 raises it, shrink 1 equals perfect correlation", () => {
    const c = corrFromUpper(3, [0.2, 0.1, 0.0]), v = [0.2, 0.25, 0.3], w = [0.4, 0.4, 0.2];
    const s = stress(v, c, w, 2, 0);
    expect(s.after.vol).toBeCloseTo(2 * s.before.vol, 12);
    const t = stress(v, c, w, 1, 1);
    expect(t.after.vol).toBeCloseTo(0.4 * 0.2 + 0.4 * 0.25 + 0.2 * 0.3, 12);
    expect(t.after.vol).toBeGreaterThan(t.before.vol);
    expect(() => stress(v, c, w, 1, 1.5)).toThrow();
  });
});

describe("validation", () => {
  it("rejects the classic non-PSD 3x3 and names the smallest eigenvalue", () => {
    const bad = corrFromUpper(3, [0.9, 0.9, -0.9]);
    expect(eigenvalues(bad)[0]).toBeLessThan(-0.1);
    expect(() => validateModel([0.2, 0.2, 0.2], bad)).toThrow(/not positive semi-definite \(smallest eigenvalue -/);
  });
  it("accepts uniform rho and Jacobi eigenvalues match 1+(n-1)rho and 1-rho", () => {
    const e = eigenvalues(corrFromUpper(5, Array(10).fill(0.3)));
    expect(e[0]).toBeCloseTo(0.7, 10);
    expect(e[4]).toBeCloseTo(2.2, 10);
    expect(validateModel(Array(5).fill(0.2), corrFromUpper(5, Array(10).fill(0.3)))).toBeCloseTo(0.7, 10);
    expect(() => validateModel([0.2, 0.2], two(1))).not.toThrow(); // semi-definite is allowed
  });
  it("rejects |rho|>1, asymmetric, bad diagonal and non-positive vol", () => {
    expect(() => validateModel([0.2, 0.2], two(1.01))).toThrow(/outside -1 to \+1/);
    expect(() => validateModel([0.2, 0.2], [[1, 0.3], [0.2, 1]])).toThrow(/symmetric/);
    expect(() => validateModel([0.2, 0.2], [[0.9, 0.3], [0.3, 1]])).toThrow(/Diagonal/);
    expect(() => validateModel([0, 0.2], two(0.3))).toThrow(/above 0%/);
    expect(() => validateModel([NaN, 0.2], two(0.3))).toThrow();
  });
  it("accepts 100% weights; rejects 99%, 101% and negative without renormalising", () => {
    expect(() => validateWeights([0.2, 0.2, 0.2, 0.2, 0.2])).not.toThrow();
    expect(() => validateWeights([0.33, 0.33, 0.34])).not.toThrow();
    expect(() => validateWeights([0.2, 0.2, 0.2, 0.2, 0.19])).toThrow(/sum to 99%.*not renormalised/);
    expect(() => validateWeights([0.2, 0.2, 0.2, 0.2, 0.21])).toThrow(/sum to 101%/);
    expect(() => validateWeights([1.2, -0.2])).toThrow(/negative/);
    expect(() => validateWeights([0.5, NaN])).toThrow();
  });
});

describe("simulation", () => {
  const c = corrFromUpper(5, [0.3, 0.1, -0.2, 0.5, 0.4, 0.2, 0.0, 0.6, -0.1, 0.35]), v = [0.18, 0.35, 0.22, 0.28, 0.25];
  it("is deterministic per seed and differs across seeds", () => {
    expect(simulate(v, c, 7)).toEqual(simulate(v, c, 7));
    expect(simulate(v, c, 7)).not.toEqual(simulate(v, c, 8));
    expect(simulate(v, c, 7)).toHaveLength(756);
  });
  it("sample correlation approaches the input", () => {
    expect(maxAbsDiff(sampleCorr(simulate(v, c, 1, 30000)), c)).toBeLessThan(0.03);
    expect(maxAbsDiff(sampleCorr(simulate(v, c, 20261031)), c)).toBeLessThan(0.12);
  });
  it("handles rho = 1 (semi-definite) and annualised sd matches input vol at large N", () => {
    const r = simulate([0.2, 0.2], two(1), 3, 5000);
    expect(maxAbsDiff(sampleCorr(r), two(1))).toBeLessThan(1e-9);
    expect(annualSd(r.map((x) => x[0]))).toBeGreaterThan(0.18);
    expect(annualSd(r.map((x) => x[0]))).toBeLessThan(0.22);
  });
  it("rolling correlation: null warm-up, window length respected, in [-1,1]", () => {
    const r = simulate(v, c, 5), roll = rollingCorr(r, 0, 1, 60);
    expect(roll).toHaveLength(756);
    expect(roll[58]).toBeNull();
    const x = roll[59]!;
    expect(Math.abs(x)).toBeLessThanOrEqual(1);
    expect(roll.slice(59).every((q) => q !== null && Math.abs(q) <= 1 + 1e-12)).toBe(true);
  });
  it("portfolio path: growth starts at 1, log kind uses expm1", () => {
    const p = portfolioPath([[0.01, 0.03], [-0.02, 0.0]], [0.5, 0.5], "simple");
    expect(p.growth[0]).toBe(1);
    expect(p.growth[1]).toBeCloseTo(1.02, 12);
    expect(p.growth[2]).toBeCloseTo(1.02 * 0.99, 12);
    expect(portfolioPath([[Math.log(1.1), Math.log(1.1)]], [0.5, 0.5], "log").growth[1]).toBeCloseTo(1.1, 12);
  });
});

describe("drawdown", () => {
  it("hand case", () => {
    const d = drawdown([1, 1.2, 0.9, 1.0, 1.3]);
    expect(d.dd[0]).toBe(0);
    expect(d.dd[2]).toBeCloseTo(-0.25, 12);
    expect(d.dd[3]).toBeCloseTo(1 / 1.2 - 1, 12);
    expect(d.dd[4]).toBe(0);
    expect(d.maxDD).toBeCloseTo(-0.25, 12);
  });
});
