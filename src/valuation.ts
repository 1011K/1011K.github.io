// Pure valuation arithmetic for the hypothetical-input workstation. Rates are decimals (0.08 = 8%).
// Every function validates its inputs and throws an Error with a specific message; nothing is silently defaulted.

const pc = (x: number) => `${(x * 100).toFixed(2)}%`;
const finite = (x: number, name: string) => {
  if (typeof x !== "number" || !Number.isFinite(x)) throw new Error(`${name} is blank or not a number.`);
  return x;
};
const nonNeg = (x: number, name: string) => {
  if (finite(x, name) < 0) throw new Error(`${name} cannot be negative.`);
  return x;
};
const unit01 = (x: number, name: string, openTop = false) => {
  finite(x, name);
  if (x < 0 || x > 1 || (openTop && x >= 1)) throw new Error(`${name} must be between 0% and ${openTop ? "below " : ""}100%.`);
  return x;
};

export type Unit = "crore" | "million";
/** Money items must be declared in the same unit before they are combined. */
export function assertSameUnit(forecast: Unit, other: Unit, what: string) {
  if (forecast !== other)
    throw new Error(`Unit mismatch: ${what} (Rs ${other}) does not match the forecast unit (Rs ${forecast}). Convert before use (1 crore = 10 million).`);
}

/** Ke = Rf + beta x ERP. */
export function costOfEquity(rf: number, beta: number, erp: number) {
  finite(rf, "Risk-free rate");
  nonNeg(beta, "Beta");
  finite(erp, "Equity risk premium");
  return rf + beta * erp;
}

/** WACC = E/(D+E) x Ke + D/(D+E) x Kd x (1 - T). */
export function wacc(p: { ke: number; kd: number; tax: number; debtWeight: number }) {
  finite(p.ke, "Cost of equity");
  nonNeg(p.kd, "Pre-tax cost of debt");
  unit01(p.tax, "Tax rate", true);
  unit01(p.debtWeight, "Debt weight");
  const kdAfterTax = p.kd * (1 - p.tax), we = 1 - p.debtWeight, wd = p.debtWeight;
  return { ke: p.ke, kdAfterTax, we, wd, wacc: we * p.ke + wd * kdAfterTax };
}

export interface TelecomInputs {
  subsMn: number; subGrowth: number; arpu: number; arpuGrowth: number;
  marginStart: number; marginEnd: number; daPct: number; capexPct: number; nwcPct: number; tax: number;
  years: number;
  /** When set, revenue grows at this constant rate and the subscriber and ARPU drivers are bypassed (reverse DCF). */
  revenueGrowth?: number;
}
export interface Year { t: number; subs: number; arpu: number; revenue: number; ebitda: number; da: number; ebit: number; taxPaid: number; nopat: number; capex: number; dNwc: number; fcff: number }

/** subscribers (mn) x ARPU (Rs/month) x 12 months = Rs million; divided by 10 = Rs crore. */
export const revenueCrore = (subsMn: number, arpu: number) => (subsMn * arpu * 12) / 10;

/** FCFF = EBIT x (1 - tax) + D&A - capex - change in NWC. Tax is not credited on a negative EBIT. */
export function projectTelecom(i: TelecomInputs): Year[] {
  nonNeg(i.subsMn, "Subscribers"); nonNeg(i.arpu, "ARPU");
  for (const [k, n] of [["Subscriber growth", i.subGrowth], ["ARPU growth", i.arpuGrowth], ["Revenue growth", i.revenueGrowth ?? 0]] as const)
    if (finite(n, k) <= -1) throw new Error(`${k} must be above -100%.`);
  for (const [k, n] of [["Starting EBITDA margin", i.marginStart], ["Ending EBITDA margin", i.marginEnd]] as const)
    if (finite(n, k) < -1 || n > 1) throw new Error(`${k} must be between -100% and 100%.`);
  unit01(i.daPct, "D&A % of revenue"); unit01(i.capexPct, "Capex % of revenue"); unit01(i.tax, "Tax rate", true);
  finite(i.nwcPct, "NWC % of revenue change");
  if (!Number.isInteger(i.years) || i.years < 1 || i.years > 10) throw new Error("Horizon must be a whole number of years from 1 to 10.");
  const rev0 = revenueCrore(i.subsMn, i.arpu);
  let prev = rev0;
  return Array.from({ length: i.years }, (_, k) => {
    const t = k + 1, subs = i.subsMn * (1 + i.subGrowth) ** t, arpu = i.arpu * (1 + i.arpuGrowth) ** t;
    const revenue = i.revenueGrowth === undefined ? revenueCrore(subs, arpu) : rev0 * (1 + i.revenueGrowth) ** t;
    const margin = i.years > 1 ? i.marginStart + ((i.marginEnd - i.marginStart) * k) / (i.years - 1) : i.marginStart;
    const ebitda = revenue * margin, da = revenue * i.daPct, ebit = ebitda - da;
    const taxPaid = Math.max(0, ebit) * i.tax, nopat = ebit - taxPaid, capex = revenue * i.capexPct, dNwc = i.nwcPct * (revenue - prev);
    prev = revenue;
    return { t, subs, arpu, revenue, ebitda, da, ebit, taxPaid, nopat, capex, dNwc, fcff: nopat + da - capex - dNwc };
  });
}

export type Scenario = "base" | "upside" | "downside";
const SHIFT: Record<Scenario, { growth: number; margin: number; capex: number }> = {
  base: { growth: 0, margin: 0, capex: 0 },
  upside: { growth: 0.01, margin: 0.02, capex: -0.01 },
  downside: { growth: -0.01, margin: -0.02, capex: 0.01 },
};
export const SCENARIO_TEXT = "Upside: subscriber and ARPU growth +1.0pp each, EBITDA margin +2.0pp, capex intensity -1.0pp. Downside is the mirror image.";
export function applyScenario(i: TelecomInputs, s: Scenario): TelecomInputs {
  const d = SHIFT[s];
  if (!d) throw new Error(`Unknown scenario: ${s}`);
  return { ...i, subGrowth: i.subGrowth + d.growth, arpuGrowth: i.arpuGrowth + d.growth, marginStart: i.marginStart + d.margin, marginEnd: i.marginEnd + d.margin, capexPct: i.capexPct + d.capex };
}

/** End-of-year discounting. Terminal value at year N = FCFF_N x (1 + g) / (WACC - g). Fails closed when g >= WACC. */
export function dcf(fcff: number[], rate: number, g: number) {
  if (!fcff.length) throw new Error("No explicit cash flows to discount.");
  fcff.forEach((x, k) => finite(x, `FCFF year ${k + 1}`));
  finite(rate, "WACC"); finite(g, "Terminal growth");
  if (rate <= 0) throw new Error("WACC must be above zero.");
  if (g >= rate) throw new Error(`Withheld: terminal growth (${pc(g)}) must be below WACC (${pc(rate)}). The perpetuity is undefined.`);
  const n = fcff.length, df = fcff.map((_, k) => 1 / (1 + rate) ** (k + 1)), pv = fcff.map((x, k) => x * df[k]);
  const sumPv = pv.reduce((a, b) => a + b, 0), tv = (fcff[n - 1] * (1 + g)) / (rate - g), pvTv = tv * df[n - 1], ev = sumPv + pvTv;
  return { df, pv, sumPv, tv, pvTv, ev, tvShare: ev > 0 ? pvTv / ev : NaN };
}

/** Equity = EV - net debt - lease liabilities - minorities + investments/associates. Per share only when shares > 0. */
export function bridge(b: { ev: number; netDebt: number; leases: number; minorities: number; investments: number; shares: number }) {
  finite(b.ev, "Enterprise value"); finite(b.netDebt, "Net debt");
  nonNeg(b.leases, "Lease liabilities"); nonNeg(b.minorities, "Minority interests"); nonNeg(b.investments, "Investments and associates");
  nonNeg(b.shares, "Diluted shares");
  const equity = b.ev - b.netDebt - b.leases - b.minorities + b.investments;
  return { equity, perShare: b.shares > 0 ? equity / b.shares : null };
}

/** Grid[row of growth][column of discount rate]; null where the discount rate is not above growth. */
export function sensitivityGrid(discounts: number[], growths: number[], f: (discount: number, g: number) => number) {
  return growths.map((g) => discounts.map((d) => (d <= 0 || d <= g ? null : f(d, g))));
}

/** Bisection for f(x) = target on [lo, hi]. Fails closed when the target is outside the achievable range. */
export function solve(f: (x: number) => number, lo: number, hi: number, target: number, tol = 1e-12) {
  finite(target, "Reference value");
  if (!(lo < hi)) throw new Error("Search bounds are invalid.");
  const a = f(lo) - target, b = f(hi) - target;
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("Model value is undefined at the search bounds.");
  if (a === 0) return lo;
  if (b === 0) return hi;
  if (a * b > 0) throw new Error(`No solution in bounds: the model value runs from ${(a + target).toFixed(2)} to ${(b + target).toFixed(2)} across the search range, which does not include the reference ${target.toFixed(2)}.`);
  let l = lo, h = hi;
  for (let k = 0; k < 200 && h - l > tol; k++) {
    const m = (l + h) / 2, fm = f(m) - target;
    if (fm === 0) return m;
    if ((fm < 0) === (a < 0)) l = m; else h = m;
  }
  return (l + h) / 2;
}

export interface RIInputs { bvps: number; roeStart: number; roeLong: number; years: number; payout: number; ke: number; g: number }
/**
 * Residual income: value = BVPS0 + sum RI_t/(1+ke)^t + TV/(1+ke)^N, RI_t = (ROE_t - ke) x BVPS_(t-1),
 * ROE fades linearly from year 1 to year N, BVPS_t = BVPS_(t-1) x (1 + ROE_t x (1 - payout)),
 * TV_N = (ROE_long - ke) x BVPS_N / (ke - g).
 */
export function residualIncome(i: RIInputs) {
  if (finite(i.bvps, "Book value per share") <= 0) throw new Error("Book value per share must be above zero.");
  finite(i.roeStart, "Starting ROE"); finite(i.roeLong, "Long-run ROE"); unit01(i.payout, "Payout ratio");
  finite(i.ke, "Cost of equity"); finite(i.g, "Terminal growth");
  if (!Number.isInteger(i.years) || i.years < 1 || i.years > 20) throw new Error("Explicit years must be a whole number from 1 to 20.");
  if (i.ke <= 0) throw new Error("Cost of equity must be above zero.");
  if (i.g >= i.ke) throw new Error(`Withheld: terminal growth (${pc(i.g)}) must be below cost of equity (${pc(i.ke)}).`);
  if (i.g > i.roeLong) throw new Error(`Terminal growth (${pc(i.g)}) exceeds long-run ROE (${pc(i.roeLong)}): it would need retention above 100%.`);
  let open = i.bvps;
  const rows = Array.from({ length: i.years }, (_, k) => {
    const t = k + 1, roe = i.years > 1 ? i.roeStart + ((i.roeLong - i.roeStart) * k) / (i.years - 1) : i.roeStart;
    const earnings = roe * open, ri = (roe - i.ke) * open, df = 1 / (1 + i.ke) ** t, row = { t, roe, open, earnings, ri, df, pv: ri * df, close: open + earnings * (1 - i.payout) };
    open = row.close;
    return row;
  });
  const sumPv = rows.reduce((a, r) => a + r.pv, 0), tv = ((i.roeLong - i.ke) * open) / (i.ke - i.g), pvTv = tv * rows[rows.length - 1].df, value = i.bvps + sumPv + pvTv;
  return { rows, sumPv, tv, pvTv, value, pb: value / i.bvps, tvShare: value > 0 ? pvTv / value : NaN };
}

export interface Project { name: string; cashFlow: number; years: number; rate: number; stake: number }
/** NAV = sum of stake x CF/(1+r)^years over projects, less net debt. Per share only when shares > 0. */
export function projectNav(projects: Project[], netDebt: number, shares: number) {
  if (!projects.length) throw new Error("Add at least one named project.");
  if (projects.length > 6) throw new Error("At most 6 projects are supported.");
  finite(netDebt, "Net debt"); nonNeg(shares, "Diluted shares");
  const rows = projects.map((p) => {
    finite(p.cashFlow, `${p.name}: remaining cash flow`); nonNeg(p.years, `${p.name}: years to realise`); nonNeg(p.rate, `${p.name}: discount rate`); unit01(p.stake, `${p.name}: stake`);
    const pv = p.cashFlow / (1 + p.rate) ** p.years;
    return { ...p, pv, attributable: pv * p.stake };
  });
  const gross = rows.reduce((a, r) => a + r.attributable, 0), nav = gross - netDebt;
  return { rows, gross, nav, perShare: shares > 0 ? nav / shares : null };
}
/** Reference price relative to NAV per share; negative means a discount to NAV. */
export function priceVsNav(price: number, navPerShare: number) {
  if (nonNeg(price, "Reference price") <= 0) throw new Error("Reference price must be above zero.");
  if (!(navPerShare > 0)) throw new Error("NAV per share is not positive, so a premium or discount is undefined.");
  return price / navPerShare - 1;
}

/** Hypothetical appraisal arithmetic only: adjusted net worth + value in force + multiple x value of new business. */
export function appraisal(p: { anw: number; vif: number; vnb: number; multiple: number; shares: number }) {
  finite(p.anw, "Adjusted net worth"); finite(p.vif, "Value of in-force"); finite(p.vnb, "Value of new business"); nonNeg(p.multiple, "VNB multiple"); nonNeg(p.shares, "Diluted shares");
  const franchise = p.multiple * p.vnb, total = p.anw + p.vif + franchise;
  return { franchise, total, perShare: p.shares > 0 ? total / p.shares : null };
}

/** Optional reference price: 0 means "not entered" (returns null); blank, NaN or negative fail closed. */
export function referencePrice(x: number) {
  nonNeg(x, "Reference price");
  return x === 0 ? null : x;
}
