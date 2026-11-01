import { describe, expect, it } from "vitest";
import { COMPANIES } from "./content.ts";
import { type Col, type Raw, SPECS, blocker, compare, hypothetical, rankAmong, validatePeerSet } from "./peers.ts";

const O = { leaseInEV: true };
const calc = (arch: string, key: string, raw: Raw, o = O) => SPECS[arch].ratios.find((r) => r.key === key)!.calc(raw, o);
const col = (name: string, raw: Raw = {}, over: Partial<Col> = {}): Col => ({ name, cls: "DIRECT", included: true, reason: "", basis: "FY", scope: "Consolidated", end: "2026-03-31", raw, ...over });

describe("ratios, hand computed", () => {
  const bank = { mcap: 1000, eqO: 80, eqC: 100, np: 18, taO: 900, taC: 1100, eaO: 800, eaC: 1000, lnO: 500, lnC: 700, nii: 36, prov: 3, casa: 40, dep: 100 };
  it("bank", () => {
    expect(calc("Bank", "pb", bank)).toBeCloseTo(10);
    expect(calc("Bank", "roe", bank)).toBeCloseTo(0.2); // 18 / 90
    expect(calc("Bank", "roa", bank)).toBeCloseTo(0.018); // 18 / 1000
    expect(calc("Bank", "nim", bank)).toBeCloseTo(0.04); // 36 / 900
    expect(calc("Bank", "cc", bank)).toBeCloseTo(0.005); // 3 / 600
    expect(calc("Bank", "casa", bank)).toBeCloseTo(0.4);
  });
  it("NBFC", () => {
    const n = { mcap: 600, eqO: 90, eqC: 110, np: 20, loO: 800, loC: 1000, bO: 600, bC: 800, iinc: 180, iexp: 56, s3: 30 };
    expect(calc("NBFC", "pb", n)).toBeCloseTo(600 / 110);
    expect(calc("NBFC", "roe", n)).toBeCloseTo(0.2);
    expect(calc("NBFC", "growth", n)).toBeCloseTo(0.25);
    expect(calc("NBFC", "cof", n)).toBeCloseTo(0.08); // 56 / 700
    expect(calc("NBFC", "spread", n)).toBeCloseTo(0.12); // 180/900 - 0.08
    expect(calc("NBFC", "s3", n)).toBeCloseTo(0.03);
    expect(calc("NBFC", "lev", n)).toBeCloseTo(800 / 110);
  });
  it("telecom with the lease switch", () => {
    const t = { mcap: 500, debt: 200, lease: 60, cash: 20, ebitda: 80, rev: 200, capex: 50, arpu: 200 };
    expect(calc("Telecom", "evx", t)).toBeCloseTo(9.25); // 740 / 80
    expect(calc("Telecom", "evx", t, { leaseInEV: false })).toBeCloseTo(8.5); // 680 / 80
    expect(calc("Telecom", "nd", t)).toBeCloseTo(3);
    expect(calc("Telecom", "nd", t, { leaseInEV: false })).toBeCloseTo(2.25);
    expect(calc("Telecom", "capex", t)).toBeCloseTo(0.25);
    expect(calc("Telecom", "arpu", t)).toBe(200);
    expect(calc("Telecom", "evx", { ...t, lease: NaN })).toBeNull(); // lease needed when included
    expect(calc("Telecom", "evx", { ...t, lease: NaN }, { leaseInEV: false })).toBeCloseTo(8.5);
  });
  it("real estate", () => {
    const r = { mcap: 900, nav: 1000, debt: 300, cash: 100, eq: 800, presales: 400, coll: 350 };
    expect(calc("Real estate developer", "nav", r)).toBeCloseTo(-0.1);
    expect(calc("Real estate developer", "nde", r)).toBeCloseTo(0.25);
    expect(calc("Real estate developer", "presales", r)).toBe(400);
    expect(calc("Real estate developer", "coll", r)).toBe(350);
  });
  it("life insurer", () => {
    const l = { mcap: 900, ev: 600, vnb: 30, ape: 100, solv: 2.1 };
    expect(calc("Life insurance", "pev", l)).toBeCloseTo(1.5);
    expect(calc("Life insurance", "vnbm", l)).toBeCloseTo(0.3);
    expect(calc("Life insurance", "ape", l)).toBe(100);
    expect(calc("Life insurance", "solv", l)).toBe(2.1);
    expect(calc("Life insurance", "vnbm", { ...l, vnb: -10 })).toBeCloseTo(-0.1); // negative numerator is meaningful
  });
});

describe("NOT MEANINGFUL (null) instead of zero or infinity", () => {
  const bank = { mcap: 1000, eqO: 80, eqC: 100, np: 18, taO: 900, taC: 1100, eaO: 800, eaC: 1000, lnO: 500, lnC: 700, nii: 36, prov: 3, casa: 40, dep: 100 };
  it("zero, negative and blank denominators", () => {
    expect(calc("Bank", "pb", { ...bank, eqC: 0 })).toBeNull();
    expect(calc("Bank", "pb", { ...bank, eqC: -5 })).toBeNull();
    expect(calc("Bank", "pb", { ...bank, eqC: NaN })).toBeNull();
    expect(calc("Bank", "pb", { ...bank, mcap: 0 })).toBeNull();
    expect(calc("Bank", "roe", { ...bank, eqO: 0 })).toBeNull(); // average needs both balances > 0
    expect(calc("Bank", "roe", { ...bank, np: NaN })).toBeNull();
    expect(calc("Bank", "roa", { ...bank, taC: -1 })).toBeNull();
    expect(calc("Bank", "casa", { ...bank, casa: 120 })).toBeNull();
    expect(calc("NBFC", "growth", { loO: 0, loC: 10 })).toBeNull();
    expect(calc("NBFC", "spread", { loO: 8, loC: 10, iinc: 2, bO: 0, bC: 0, iexp: 1 })).toBeNull();
    expect(calc("Telecom", "evx", { mcap: 500, debt: 0, lease: 0, cash: 0, ebitda: 0 })).toBeNull();
    expect(calc("Telecom", "evx", { mcap: 500, debt: 0, lease: 0, cash: 0, ebitda: -5 })).toBeNull();
    expect(calc("Telecom", "evx", { mcap: 10, debt: 0, lease: 0, cash: 50, ebitda: 5 })).toBeNull(); // EV <= 0
    expect(calc("Telecom", "arpu", { arpu: 0 })).toBeNull();
    expect(calc("Real estate developer", "nav", { mcap: 5, nav: 0 })).toBeNull();
    expect(calc("Real estate developer", "nde", { debt: 5, cash: 1, eq: -2 })).toBeNull();
    expect(calc("Life insurance", "pev", { mcap: 5, ev: -1 })).toBeNull();
    expect(calc("Life insurance", "vnbm", { vnb: 5, ape: 0 })).toBeNull();
  });
  it("a fully blank column is all null, never NaN or Infinity", () => {
    for (const [arch, s] of Object.entries(SPECS)) for (const r of s.ratios) expect(r.calc({}, O), `${arch}/${r.key}`).toBeNull();
  });
});

describe("blocking and exclusions", () => {
  const set = (over: Partial<Col>[] = []) => ["Main", "A", "B", "C"].map((n, i) => col(n, {}, over[i] ?? {}));
  it("passes when basis, scope and period end match", () => expect(blocker(set())).toBeNull());
  it("blocks on unselected metadata", () => expect(blocker(set([{}, { basis: "" }]))).toMatch(/Select period basis.*A/));
  it("blocks on a basis mismatch", () => expect(() => compare("Bank", set([{}, { basis: "TTM" }]), O)).toThrow(/Period basis differs.*A: TTM/));
  it("blocks on a scope mismatch", () => expect(() => compare("Bank", set([{}, {}, { scope: "Standalone" }]), O)).toThrow(/Scope differs/));
  it("blocks on a period end mismatch", () => expect(blocker(set([{}, {}, {}, { end: "2025-12-31" }]))).toMatch(/Period end differs/));
  it("an excluded column's mismatch does not block, but needs a reason", () => {
    expect(blocker(set([{}, {}, {}, { included: false, reason: "Period or scope cannot be matched", basis: "TTM" }]))).toBeNull();
    expect(blocker(set([{}, {}, {}, { included: false }]))).toMatch(/excluded without a reason/);
  });
  it("fewer than 3 peers is allowed with a visible reason and is listed", () => {
    const r = compare("Bank", set([{}, {}, {}, { included: false, reason: "Different business model" }]), O);
    expect(r.inc.map((c) => c.name)).toEqual(["Main", "A", "B"]);
    expect(r.excluded).toEqual([{ name: "C", reason: "Different business model" }]);
    expect(r.rows.every((x) => x.values.length === 3)).toBe(true);
  });
  it("needs at least one included peer", () => {
    const off = { included: false, reason: "Other (own judgement)" };
    expect(blocker(set([{}, off, off, off]))).toMatch(/at least one peer/);
  });
});

describe("rank and percentile", () => {
  it("ranks 1 = highest, ties share, nulls skipped", () => {
    const r = rankAmong([5, null, 10, 5]);
    expect(r[0]).toEqual({ rank: 2, of: 3, pct: 0 });
    expect(r[1]).toBeNull();
    expect(r[2]).toEqual({ rank: 1, of: 3, pct: 100 });
    expect(r[3]).toEqual({ rank: 2, of: 3, pct: 0 });
  });
  it("percentile is the share of other columns lower", () => {
    const r = rankAmong([1, 2, 3, 4]);
    expect(r[1]!.rank).toBe(3);
    expect(r[1]!.pct).toBeCloseTo(100 / 3);
  });
  it("needs two meaningful values", () => expect(rankAmong([3, null])).toEqual([null, null]));
});

describe("peer set rules", () => {
  it("rejects self, duplicates (case-insensitive) and blanks", () => {
    expect(validatePeerSet("X Bank", ["x bank", "A"])).toMatch(/main company/);
    expect(validatePeerSet("X", ["A", " a "])).toMatch(/Duplicate/);
    expect(validatePeerSet("X", ["A", ""])).toMatch(/blank/);
    expect(validatePeerSet("X", [])).not.toBeNull();
  });
  it("every proposed set in content.ts is valid, has 3 peers and is classified", () => {
    for (const c of COMPANIES) {
      expect(validatePeerSet(c.name, c.peers.map((p) => p.name)), c.name).toBeNull();
      expect(c.peers).toHaveLength(3);
      expect(c.peers.every((p) => p.cls === "DIRECT" || p.cls === "ADJACENT")).toBe(true);
    }
  });
});

describe("archetype ratio sets", () => {
  it("each archetype has a spec whose ratios map onto content.ts naming", () => {
    for (const c of COMPANIES) {
      const s = SPECS[c.archetype];
      expect(s, c.archetype).toBeDefined();
      expect(new Set(s.ratios.map((r) => r.key)).size).toBe(s.ratios.length);
      for (const r of s.ratios) expect(c.ratios, `${c.archetype}/${r.key}`).toContain(r.content);
    }
  });
  it("the hypothetical example gives every ratio a meaningful value in every column", () => {
    for (const [arch, s] of Object.entries(SPECS))
      for (let i = 0; i < 4; i++)
        for (const lease of [true, false])
          for (const r of s.ratios) {
            const v = r.calc(hypothetical(arch, i), { leaseInEV: lease });
            expect(v, `${arch}/${r.key}/${i}`).not.toBeNull();
            expect(Number.isFinite(v!)).toBe(true);
          }
  });
  it("telecom lease switch changes EV/EBITDA", () => {
    const h = hypothetical("Telecom", 0);
    expect(calc("Telecom", "evx", h)).toBeGreaterThan(calc("Telecom", "evx", h, { leaseInEV: false })!);
  });
});
