import { describe, expect, it } from "vitest";
import { referencePrice, appraisal, applyScenario, assertSameUnit, bridge, costOfEquity, dcf, priceVsNav, projectNav, projectTelecom, residualIncome, revenueCrore, sensitivityGrid, solve, wacc, type TelecomInputs } from "./valuation";

const telecom: TelecomInputs = { subsMn: 100, subGrowth: 0.04, arpu: 100, arpuGrowth: 0.03, marginStart: 0.4, marginEnd: 0.45, daPct: 0.15, capexPct: 0.2, nwcPct: 0.02, tax: 0.25, years: 5 };

describe("DCF (hand solved)", () => {
  it("flat FCFF perpetuity: EV = FCFF / WACC", () => {
    const r = dcf([100], 0.1, 0);
    expect(r.ev).toBeCloseTo(1000, 9); // 100/1.1 + (100/0.1)/1.1
    expect(r.tvShare).toBeCloseTo(1 - 1 / 11, 9);
  });
  it("growing perpetuity: FCFF_t = 100 x 1.03^(t-1) gives EV = 100 / (WACC - g)", () => {
    const f = [0, 1, 2, 3, 4].map((k) => 100 * 1.03 ** k);
    expect(dcf(f, 0.1, 0.03).ev).toBeCloseTo(100 / 0.07, 8);
  });
  it("discounts a two-year vector by hand", () => {
    // 110/1.1 + 121/1.21 + TV: 121*1.0/(0.1-0) = 1210 -> 1210/1.21 = 1000 ; total 1200
    const r = dcf([110, 121], 0.1, 0);
    expect(r.sumPv).toBeCloseTo(200, 9);
    expect(r.ev).toBeCloseTo(1200, 9);
  });
});

describe("WACC and cost of equity", () => {
  it("Ke = Rf + beta x ERP", () => expect(costOfEquity(0.07, 1.2, 0.05)).toBeCloseTo(0.13, 12));
  it("WACC standalone: 70% x 12% + 30% x 8% x (1 - 25%) = 10.2%", () => {
    const w = wacc({ ke: 0.12, kd: 0.08, tax: 0.25, debtWeight: 0.3 });
    expect(w.wacc).toBeCloseTo(0.102, 12);
    expect(w.kdAfterTax).toBeCloseTo(0.06, 12);
  });
  it("rejects a debt weight of 120%", () => expect(() => wacc({ ke: 0.12, kd: 0.08, tax: 0.25, debtWeight: 1.2 })).toThrow(/Debt weight/));
});

describe("EV to equity bridge", () => {
  it("equity = EV - net debt - leases - minorities + investments", () => {
    const b = bridge({ ev: 1000, netDebt: 200, leases: 50, minorities: 30, investments: 80, shares: 10 });
    expect(b.equity).toBe(800);
    expect(b.perShare).toBe(80);
  });
  it("withholds per-share when shares are zero", () => expect(bridge({ ev: 1000, netDebt: 0, leases: 0, minorities: 0, investments: 0, shares: 0 }).perShare).toBeNull());
});

describe("telecom projection", () => {
  it("converts subscribers x ARPU to Rs crore", () => expect(revenueCrore(100, 100)).toBe(12000));
  it("FCFF identity on year 1", () => {
    const y = projectTelecom(telecom)[0];
    expect(y.revenue).toBeCloseTo(revenueCrore(104, 103), 8);
    expect(y.ebit).toBeCloseTo(y.ebitda - y.da, 8);
    expect(y.fcff).toBeCloseTo(y.nopat + y.da - y.capex - y.dNwc, 8);
    expect(y.dNwc).toBeCloseTo(0.02 * (y.revenue - 12000), 8);
  });
  it("margin fades linearly from start to end", () => {
    const r = projectTelecom(telecom);
    expect(r[0].ebitda / r[0].revenue).toBeCloseTo(0.4, 12);
    expect(r[4].ebitda / r[4].revenue).toBeCloseTo(0.45, 12);
  });
  it("downside scenario lowers EV and upside raises it", () => {
    const ev = (s: "base" | "upside" | "downside") => dcf(projectTelecom(applyScenario(telecom, s)).map((y) => y.fcff), 0.102, 0.04).ev;
    expect(ev("downside")).toBeLessThan(ev("base"));
    expect(ev("upside")).toBeGreaterThan(ev("base"));
  });
});

describe("sensitivity grid", () => {
  it("marks cells with WACC <= g as invalid and computes the rest", () => {
    const f = [100];
    const grid = sensitivityGrid([0.04, 0.05, 0.08], [0.04, 0.05], (d, g) => dcf(f, d, g).ev);
    expect(grid[0][0]).toBeNull(); // WACC 4% = g 4%
    expect(grid[1][0]).toBeNull(); // WACC 4% < g 5%
    expect(grid[1][1]).toBeNull(); // WACC 5% = g 5%
    expect(grid[0][1]).not.toBeNull();
    expect(grid[0][2]).toBeCloseTo(dcf(f, 0.08, 0.04).ev, 9);
  });
});

describe("residual income (hand solved)", () => {
  it("ROE 15% vs Ke 10%, full payout, g 0: value = 100 + 5/0.10 = 150", () => {
    const r = residualIncome({ bvps: 100, roeStart: 0.15, roeLong: 0.15, years: 5, payout: 1, ke: 0.1, g: 0 });
    expect(r.value).toBeCloseTo(150, 9);
    expect(r.pb).toBeCloseTo(1.5, 9);
  });
  it("steady growth: P/B = (ROE - g)/(Ke - g) = 2", () => {
    const r = residualIncome({ bvps: 100, roeStart: 0.15, roeLong: 0.15, years: 5, payout: 1 - 0.05 / 0.15, ke: 0.1, g: 0.05 });
    expect(r.pb).toBeCloseTo(2, 9);
  });
  it("ROE equal to Ke gives value equal to book", () => {
    expect(residualIncome({ bvps: 80, roeStart: 0.12, roeLong: 0.12, years: 7, payout: 0.4, ke: 0.12, g: 0.03 }).value).toBeCloseTo(80, 9);
  });
});

describe("project NAV", () => {
  it("hand case: 50% of 1210 at 10% for 2 years = 500, less net debt 100", () => {
    const n = projectNav([{ name: "A", cashFlow: 1210, years: 2, rate: 0.1, stake: 0.5 }], 100, 20);
    expect(n.nav).toBeCloseTo(400, 9);
    expect(n.perShare).toBeCloseTo(20, 9);
    expect(priceVsNav(15, 20)).toBeCloseTo(-0.25, 12);
  });
});

describe("appraisal arithmetic", () => {
  it("ANW + VIF + multiple x VNB", () => expect(appraisal({ anw: 100, vif: 200, vnb: 10, multiple: 8, shares: 0 })).toEqual({ franchise: 80, total: 380, perShare: null }));
});

describe("reverse DCF", () => {
  const value = (g: number) => {
    const y = projectTelecom({ ...telecom, years: 10, revenueGrowth: g });
    return bridge({ ev: dcf(y.map((x) => x.fcff), 0.102, 0.04).ev, netDebt: 5000, leases: 1000, minorities: 500, investments: 800, shares: 100 }).perShare!;
  };
  it("round-trips a known growth rate", () => expect(solve(value, -0.1, 0.3, value(0.07))).toBeCloseTo(0.07, 8));
  it("fails closed when the reference is unreachable", () => expect(() => solve(value, -0.1, 0.3, 1e9)).toThrow(/No solution/));
});

describe("fail-closed negatives", () => {
  it("g >= WACC", () => {
    expect(() => dcf([100], 0.08, 0.08)).toThrow(/terminal growth/i);
    expect(() => dcf([100], 0.08, 0.09)).toThrow(/terminal growth/i);
  });
  it("blank or NaN inputs", () => {
    expect(() => dcf([NaN], 0.1, 0.02)).toThrow(/FCFF year 1/);
    expect(() => costOfEquity(NaN, 1, 0.05)).toThrow(/Risk-free/);
    expect(() => projectTelecom({ ...telecom, arpu: NaN })).toThrow(/ARPU/);
  });
  it("negative shares", () => expect(() => bridge({ ev: 1, netDebt: 0, leases: 0, minorities: 0, investments: 0, shares: -1 })).toThrow(/Diluted shares/));
  it("reference price: 0 is not entered, negative or blank is rejected", () => {
    expect(referencePrice(0)).toBeNull();
    expect(referencePrice(120)).toBe(120);
    expect(() => referencePrice(-1)).toThrow(/Reference price/);
    expect(() => referencePrice(NaN)).toThrow(/Reference price/);
  });
  it("unit mismatch", () => expect(() => assertSameUnit("crore", "million", "Net debt")).toThrow(/Unit mismatch/));
  it("residual income with g >= Ke", () => expect(() => residualIncome({ bvps: 100, roeStart: 0.15, roeLong: 0.15, years: 5, payout: 0.5, ke: 0.1, g: 0.1 })).toThrow(/Withheld/));
  it("NAV with a negative NAV per share has no premium", () => expect(() => priceVsNav(10, -5)).toThrow(/not positive/));
});
