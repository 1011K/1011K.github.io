// Sector-aware peer comparison maths. Pure functions over HYPOTHETICAL figures the visitor types in
// (INR crore unless a field says otherwise). No market or company data lives here.
// Fail-closed rules: a ratio with a blank, zero or negative denominator is null (shown as NOT MEANINGFUL),
// never zero and never infinity; mismatched period basis, scope or period end blocks the whole comparison.
export const NM = "NOT MEANINGFUL";
export type Unit = "x" | "%" | "cr" | "INR";
export type Raw = Record<string, number>; // NaN = blank
export interface Opts { leaseInEV: boolean }
export interface Field { key: string; label: string; unit: Unit }
export interface RatioDef { key: string; label: string; unit: Unit; content: string; calc: (r: Raw, o: Opts) => number | null }
export interface Spec { fields: Field[]; ratios: RatioDef[] }

const ok = Number.isFinite;
/** n / d. Null unless the denominator is a finite number > 0 (and the numerator > 0 for valuation multiples). */
const div = (n: number, d: number, posN = false) => {
  if (!(ok(n) && ok(d) && d > 0 && (!posN || n > 0))) return null;
  const q = n / d;
  return ok(q) ? q : null; // finite inputs can still overflow: never report Infinity as a meaningful value
};
/** Average of opening and closing balances; both must be > 0. */
const avg = (a: number, b: number) => (a > 0 && b > 0 ? (a + b) / 2 : NaN);
/** An entered amount passed through as-is; blank, zero or negative is not meaningful (ARPU, APE, solvency). */
const amt = (x: number) => (ok(x) && x > 0 ? x : null);
/** Flows where a typed zero is a real observation (no presales this period). Blank or negative is still not meaningful. */
const flow = (x: number) => (ok(x) && x >= 0 ? x : null);
const sub = (a: number | null, b: number | null) => (a === null || b === null ? null : a - b);
const F = (rows: [string, string, Unit?][]): Field[] => rows.map(([key, label, unit = "cr"]) => ({ key, label, unit }));
const R = (key: string, label: string, unit: Unit, content: string, calc: RatioDef["calc"]): RatioDef => ({ key, label, unit, content, calc });
/** `content` is the matching entry in content.ts COMPANIES[].ratios. */
const lease = (r: Raw, o: Opts) => (o.leaseInEV ? r.lease : 0);

// Keys are the archetype strings used in content.ts.
export const SPECS: Record<string, Spec> = {
  Bank: {
    fields: F([["mcap", "Market capitalisation"], ["eqO", "Equity, opening"], ["eqC", "Equity, closing (book value)"], ["np", "Net profit"], ["taO", "Total assets, opening"], ["taC", "Total assets, closing"], ["eaO", "Earning assets, opening"], ["eaC", "Earning assets, closing"], ["lnO", "Loans, opening"], ["lnC", "Loans, closing"], ["nii", "Net interest income"], ["prov", "Credit provisions charge"], ["casa", "CASA deposits, closing"], ["dep", "Total deposits, closing"]]),
    ratios: [
      R("pb", "P/B", "x", "P/B", (r) => div(r.mcap, r.eqC, true)),
      R("roe", "ROE", "%", "ROE", (r) => div(r.np, avg(r.eqO, r.eqC))),
      R("roa", "ROA", "%", "ROA", (r) => div(r.np, avg(r.taO, r.taC))),
      R("nim", "NIM", "%", "NIM", (r) => div(r.nii, avg(r.eaO, r.eaC))),
      R("cc", "Credit cost", "%", "Credit cost", (r) => div(r.prov, avg(r.lnO, r.lnC))),
      R("casa", "CASA ratio", "%", "CASA ratio", (r) => (r.casa >= 0 && r.casa <= r.dep ? div(r.casa, r.dep) : null)),
    ],
  },
  "Real estate developer": {
    fields: F([["mcap", "Market capitalisation"], ["nav", "Net asset value (your estimate)"], ["debt", "Gross debt"], ["cash", "Cash and equivalents"], ["eq", "Equity"], ["presales", "Presales, period"], ["coll", "Collections, period"]]),
    ratios: [
      R("nav", "NAV premium / discount", "%", "NAV premium / discount", (r) => sub(div(r.mcap, r.nav, true), 1)),
      R("nde", "Net debt / equity", "x", "Net debt", (r) => div(r.debt - r.cash, r.eq)),
      R("presales", "Presales", "cr", "Presales", (r) => flow(r.presales)),
      R("coll", "Collections", "cr", "Collections", (r) => flow(r.coll)),
    ],
  },
  Telecom: {
    fields: F([["mcap", "Market capitalisation"], ["debt", "Gross borrowings"], ["lease", "Lease liabilities"], ["cash", "Cash and equivalents"], ["ebitda", "EBITDA, period (on the lease basis chosen above)"], ["rev", "Revenue, period"], ["capex", "Capex, period"], ["arpu", "ARPU (entered), INR per month", "INR"]]),
    ratios: [
      R("evx", "EV/EBITDA", "x", "EV/EBITDA (lease policy stated)", (r, o) => { const ev = r.mcap + r.debt + lease(r, o) - r.cash; return ev > 0 ? div(ev, r.ebitda) : null; }),
      R("nd", "Net debt / EBITDA", "x", "Net debt / EBITDA", (r, o) => div(r.debt + lease(r, o) - r.cash, r.ebitda)),
      R("capex", "Capex intensity", "%", "Capex intensity", (r) => div(r.capex, r.rev)),
      R("arpu", "ARPU", "INR", "ARPU", (r) => amt(r.arpu)),
    ],
  },
  NBFC: {
    fields: F([["mcap", "Market capitalisation"], ["eqO", "Equity, opening"], ["eqC", "Equity, closing (book value)"], ["np", "Net profit"], ["loO", "Loan book, opening"], ["loC", "Loan book, closing"], ["bO", "Borrowings, opening"], ["bC", "Borrowings, closing"], ["iinc", "Interest income"], ["iexp", "Finance costs"], ["s3", "Stage 3 loans, closing"]]),
    ratios: [
      R("pb", "P/B", "x", "P/B", (r) => div(r.mcap, r.eqC, true)),
      R("roe", "ROE", "%", "ROE", (r) => div(r.np, avg(r.eqO, r.eqC))),
      R("growth", "Loan-book growth (AUM proxy)", "%", "AUM growth", (r) => sub(div(r.loC, r.loO), 1)),
      R("spread", "Spread (yield less cost of funds)", "%", "NIM / spread", (r) => sub(div(r.iinc, avg(r.loO, r.loC)), div(r.iexp, avg(r.bO, r.bC)))),
      R("cof", "Cost of funds", "%", "Cost of funds", (r) => div(r.iexp, avg(r.bO, r.bC))),
      R("s3", "Stage 3 ratio", "%", "Stage 3 / ECL", (r) => (r.s3 >= 0 ? div(r.s3, r.loC) : null)),
      R("lev", "Leverage (borrowings / equity)", "x", "Leverage", (r) => (r.bC >= 0 ? div(r.bC, r.eqC) : null)),
    ],
  },
  "Life insurance": {
    fields: F([["mcap", "Market capitalisation"], ["ev", "Embedded value"], ["vnb", "Value of new business (VNB)"], ["ape", "Annualised premium equivalent (APE)"], ["solv", "Solvency ratio (entered), times", "x"]]),
    ratios: [
      R("pev", "P/EV", "x", "P/EV", (r) => div(r.mcap, r.ev, true)),
      R("vnbm", "VNB margin", "%", "VNB margin", (r) => div(r.vnb, r.ape)),
      R("ape", "APE", "cr", "APE", (r) => amt(r.ape)),
      R("solv", "Solvency ratio", "x", "Solvency ratio", (r) => amt(r.solv)),
    ],
  },
};

// Flows are not annualised, so a single quarter cannot be compared: only full-year or trailing-twelve-month periods are allowed.
export const BASES = ["FY", "TTM"];
export const SCOPES = ["Consolidated", "Standalone"];
export const REASONS = ["Different business model", "Data unavailable for this period", "Period or scope cannot be matched", "Structurally different economics", "Other (own judgement)"];

export interface Col { name: string; cls: "MAIN" | "DIRECT" | "ADJACENT"; included: boolean; reason: string; basis: string; scope: string; end: string; attest: boolean; raw: Raw }
export interface Rank { rank: number; of: number; pct: number }

/** Peer set sanity: no blank name, no peer equal to the main company, no duplicates. */
export function validatePeerSet(main: string, peers: string[]): string | null {
  const k = (s: string) => s.trim().toLowerCase(), seen = new Set([k(main)]);
  if (!peers.length) return "No peers are listed for this company.";
  for (const p of peers) {
    if (!k(p)) return "A peer name is blank.";
    if (k(p) === k(main)) return `${p} is the main company and cannot be its own peer.`;
    if (seen.has(k(p))) return `Duplicate peer: ${p}.`;
    seen.add(k(p));
  }
  return null;
}

/** Reason the comparison is blocked, or null. No silent normalisation of basis, scope or period end. */
export function blocker(cols: Col[]): string | null {
  const x = cols.find((c) => !c.included && !c.reason);
  if (x) return `${x.name} is excluded without a reason. Pick a reason or include it.`;
  const inc = cols.filter((c) => c.included);
  if (inc.length < 2) return "Include at least one peer.";
  const miss = inc.find((c) => !c.basis || !c.scope || !c.end);
  if (miss) return `Select period basis, scope and period end for ${miss.name} (or load the hypothetical example).`;
  const bq = inc.find((c) => !BASES.includes(c.basis));
  if (bq) return `${bq.name}: period basis "${bq.basis}" is not supported. Use FY or TTM; quarterly flows are not annualised here.`;
  const unc = inc.find((c) => !c.attest);
  if (unc) return `Confirm that every figure for ${unc.name} is for the stated period and scope (and, for telecom, the chosen lease basis). The page cannot check this for you.`;
  for (const [k, what] of [["basis", "Period basis"], ["scope", "Scope"], ["end", "Period end"]] as const)
    if (new Set(inc.map((c) => c[k])).size > 1)
      return `${what} differs across included columns (${inc.map((c) => `${c.name}: ${c[k]}`).join("; ")}). Comparison blocked: nothing is normalised silently. Align them, or exclude a peer with a reason.`;
  return null;
}

/** Rank (1 = highest value, not a quality judgement) and percentile (share of other meaningful columns strictly lower) among meaningful values. Needs 2 or more. */
export function rankAmong(v: (number | null)[]): (Rank | null)[] {
  const m = v.filter((x): x is number => x !== null), n = m.length;
  return v.map((x) => (x === null || n < 2 ? null : { rank: 1 + m.filter((y) => y > x).length, of: n, pct: (100 * m.filter((y) => y < x).length) / (n - 1) }));
}

/** Throws the blocking message (shown by the workstation) or returns ratios for the included columns, main company first. */
export function compare(arch: string, cols: Col[], o: Opts) {
  const spec = SPECS[arch];
  if (!spec) throw new Error(`No peer ratio set is defined for ${arch}.`);
  const b = blocker(cols);
  if (b) throw new Error(`COMPARE BLOCKED. ${b}`);
  const inc = cols.filter((c) => c.included);
  const rows = spec.ratios.map((ratio) => {
    const values = inc.map((c) => ratio.calc(c.raw, o));
    // Adjacent peers have different economics: their values are shown as context but never ranked against the main company.
    const ranks = rankAmong(values.map((v, i) => (inc[i].cls === "ADJACENT" ? null : v)));
    return { ratio, values, ranks };
  });
  return { inc, rows, excluded: cols.filter((c) => !c.included).map((c) => ({ name: c.name, reason: c.reason })) };
}

/** Generic round-number example (HYPOTHETICAL). Column 0 is the base; others vary deterministically. */
const BASE: Record<string, Raw> = {
  Bank: { mcap: 10000, eqO: 1800, eqC: 2000, np: 300, taO: 18000, taC: 20000, eaO: 16000, eaC: 18000, lnO: 11000, lnC: 12000, nii: 650, prov: 60, casa: 400, dep: 1000 },
  "Real estate developer": { mcap: 20000, nav: 18000, debt: 3000, cash: 1000, eq: 8000, presales: 4000, coll: 3500 },
  Telecom: { mcap: 50000, debt: 20000, lease: 6000, cash: 2000, ebitda: 8000, rev: 18000, capex: 4000, arpu: 200 },
  NBFC: { mcap: 12000, eqO: 2000, eqC: 2400, np: 400, loO: 9000, loC: 12000, bO: 7000, bC: 9000, iinc: 1500, iexp: 700, s3: 240 },
  "Life insurance": { mcap: 15000, ev: 9000, vnb: 600, ape: 2400, solv: 2 },
};
export function hypothetical(arch: string, i: number): Raw {
  const spec = SPECS[arch], base = BASE[arch];
  return Object.fromEntries(spec.fields.map((f, k) => {
    const v = base[f.key] * (i ? 1 + 0.1 * (((k * 3 + i * 2) % 5) - 2) : 1);
    return [f.key, f.unit === "cr" ? Math.round(v / 10) * 10 : Math.round(v * 10) / 10];
  }));
}
