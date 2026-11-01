import "./demo-valuation.css";
import type { Mount } from "./demo-ctx.ts";
import { COMPANIES, METHODS, methodLabel, methodVerdict, type Company, type Method } from "./content.ts";
import { barChart, lineChart, redScale, waterfall } from "./charts.ts";
import { e, fmt, group, label, metrics, number, pct, select, str, table, val, workstation } from "./ui.ts";
import * as V from "./valuation.ts";

// All arithmetic lives in valuation.ts. This file reads fields, calls it and formats.
const n = (id: string, text: string, value: number, unit = "", hint = "") => number(id, text, value, "any", unit, hint);
const text = (id: string, name: string, value: string) =>
  `<label class="field" for="${id}"><span>${e(name)}</span><input id="${id}" name="${id}" type="text" value="${e(value)}" maxlength="16"></label>`;
const h = (t: string) => `<h4>${e(t)}</h4>`;
const note = (t: string) => `<p class="note">${e(t)}</p>`;
const list = (items: string[]) => (items.length ? `<ul class="val-qa">${items.map((i) => `<li>${e(i)}</li>`).join("")}</ul>` : "");
const money = (v: number) => fmt(v, 1);
const ps = (v: number | null) => (v === null ? "Withheld: shares = 0" : fmt(v, 2));
const HYP = `<p class="val-hyp" role="note"><b>HYPOTHETICAL INPUTS.</b> Not the company's financials. Arithmetic on numbers you type: not a target price, rating or recommendation.</p>`;
const yearLabels = (k: number) => `Y${k + 1}`;

/** Numeric heat table: red scale, a number in every cell, invalid cells shown as Withheld. Colours are applied after render. */
function heat(caption: string, corner: string, cols: string[], rows: string[], grid: (number | null)[][], f: (v: number) => string, mid: [number, number]) {
  const nums = grid.flat().filter((v): v is number => v !== null && Number.isFinite(v));
  const lo = Math.min(...nums), hi = Math.max(...nums);
  const body = grid
    .map((row, ri) => `<tr><th scope="row">${e(rows[ri])}</th>${row
      .map((v, ci) => {
        if (v === null || !Number.isFinite(v)) return `<td class="val-with">Withheld</td>`;
        const [bg, fg] = redScale(hi > lo ? (v - lo) / (hi - lo) : 0.5);
        return `<td data-bg="${bg}" data-fg="${fg}"${ri === mid[0] && ci === mid[1] ? ' class="val-base"' : ""}>${e(f(v))}</td>`;
      })
      .join("")}</tr>`)
    .join("");
  return `<div class="tscroll" role="region" aria-label="${e(caption)}" tabindex="0"><table class="grid val-heat"><caption>${e(caption)}</caption><thead><tr><th scope="col">${e(corner)}</th>${cols.map((c) => `<th scope="col">${e(c)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>` +
    note(`Deeper red = higher value; every cell shows its number. Withheld = discount rate not above growth, or invalid inputs. Bold outlined cell = current inputs.${nums.length ? ` Range ${f(lo)} to ${f(hi)}.` : ""}`);
}

const routerCtl = (reg: Method) =>
  group("Method router", select("attempt", "Attempt method", METHODS.map((m) => [m, methodLabel(m)]), reg) + `<button type="button" class="btn" data-reset>Reset to defaults</button>`);
const rateAxis = [-2, -1, 0, 1, 2], gAxis = [-1, -0.5, 0, 0.5, 1];
const sgn = (d: number) => (d > 0 ? "+" : "") + d.toFixed(1);

/* ---------- controls ---------- */
const CONTROLS: Record<Method, () => string> = {
  FCFF_DCF: () =>
    group("Scenario and horizon", select("scen", "Scenario", [["base", "Base"], ["upside", "Upside"], ["downside", "Downside"]], "base") + select("years", "Explicit horizon", [["5", "5 years"], ["10", "10 years"]], "5")) +
    group("Telecom revenue drivers", n("subs", "Subscribers, year 0", 100, "mn") + n("subg", "Subscriber growth", 4, "% a year") + n("arpu", "ARPU, year 0", 100, "Rs/month", "Revenue (Rs crore) = subscribers x ARPU x 12 / 10") + n("arpug", "ARPU growth", 3, "% a year")) +
    group("Margin, capex, working capital, tax", n("m0", "EBITDA margin, year 1", 40, "%") + n("m1", "EBITDA margin, final year", 45, "%", "Equal values give a flat margin") + n("da", "D&A", 15, "% of revenue") + n("capex", "Capex", 20, "% of revenue") + n("nwc", "Net working capital", 2, "% of revenue change", "Positive = cash tied up as revenue grows") + n("tax", "Tax rate", 25, "%")) +
    group("Cost of capital", n("rf", "Risk-free rate", 7, "%") + n("beta", "Beta", 1, "") + n("erp", "Equity risk premium", 5, "%") + n("kd", "Pre-tax cost of debt", 8, "%") + n("dw", "Debt weight D/(D+E)", 30, "%")) +
    group("Terminal value", n("g", "Terminal growth g", 4, "%", "Withheld if g is not below WACC")) +
    group("EV to equity bridge", select("ub", "Unit of bridge items", [["crore", "Rs crore"], ["million", "Rs million"]], "crore") + n("nd", "Net debt (negative = net cash)", 5000, "Rs crore") + n("lease", "Lease liabilities", 1000, "Rs crore") + n("mi", "Minority interests", 500, "Rs crore") + n("inv", "Investments and associates", 800, "Rs crore") + n("sh", "Diluted shares", 100, "crore", "0 withholds per-share outputs") + n("ref", "Reference price", 250, "Rs", "0 = not entered. Used for reverse DCF only")),
  RESIDUAL_INCOME: () =>
    group("Book value and returns", n("bv", "Book value per share", 100, "Rs") + n("roe0", "ROE, year 1", 16, "%") + n("roe1", "Long-run ROE", 13, "%", "ROE fades linearly to this by the final year") + n("years", "Explicit years", 10, "", "Whole number, 1 to 20") + n("pay", "Dividend payout", 40, "%")) +
    group("Cost of equity", n("rf", "Risk-free rate", 7, "%") + n("beta", "Beta", 1, "") + n("erp", "Equity risk premium", 5, "%")) +
    group("Terminal value", n("g", "Terminal growth g", 5, "%", "Withheld if g is not below cost of equity")) +
    group("Reference", n("ref", "Reference price", 150, "Rs", "0 = not entered")),
  PROJECT_NAV: () =>
    [1, 2, 3, 4, 5, 6].map((i) => group(`Project ${i}`, text(`pn${i}`, "Name (blank = unused)", i <= 3 ? `Project ${"ABC"[i - 1]}` : "") + n(`pc${i}`, "Remaining net cash flow", i <= 3 ? [3000, 2000, 1500][i - 1] : 0, "Rs crore, undiscounted") + n(`py${i}`, "Average years to realise", i <= 3 ? [4, 6, 3][i - 1] : 0, "years") + n(`pr${i}`, "Discount rate", 12, "%") + n(`ps${i}`, "Stake", i === 3 ? 50 : 100, "%"))).join("") +
    group("Balance sheet and reference", n("nd", "Net debt (negative = net cash)", 2000, "Rs crore") + n("sh", "Diluted shares", 100, "crore", "0 withholds per-share outputs") + n("ref", "Reference price", 100, "Rs", "0 = not entered")),
  EV_VNB: () =>
    group("Appraisal-style components", n("anw", "Adjusted net worth", 1000, "Rs crore") + n("vif", "Value of in-force business", 1500, "Rs crore") + n("vnb", "Annual value of new business", 200, "Rs crore") + n("mult", "Multiple of new business", 8, "x") + n("sh", "Diluted shares", 100, "crore", "0 withholds per-share outputs") + n("ref", "Reference price", 0, "Rs", "0 = not entered")),
};

/* ---------- result bodies ---------- */
function dcfBody(form: HTMLFormElement) {
  const x = (k: string) => val(form, k), p = (k: string) => val(form, k) / 100;
  V.assertSameUnit("crore", str(form, "ub") as V.Unit, "the declared unit of the EV-to-equity bridge items");
  const base: V.TelecomInputs = { subsMn: x("subs"), subGrowth: p("subg"), arpu: x("arpu"), arpuGrowth: p("arpug"), marginStart: p("m0"), marginEnd: p("m1"), daPct: p("da"), capexPct: p("capex"), nwcPct: p("nwc"), tax: p("tax"), years: x("years") };
  const scen = str(form, "scen") as V.Scenario, used = V.applyScenario(base, scen);
  const ke = V.costOfEquity(p("rf"), x("beta"), p("erp")), w = V.wacc({ ke, kd: p("kd"), tax: p("tax"), debtWeight: p("dw") }), g = p("g");
  const bin = { netDebt: x("nd"), leases: x("lease"), minorities: x("mi"), investments: x("inv"), shares: x("sh") };
  const ref = V.referencePrice(x("ref"));
  const run = (inp: V.TelecomInputs) => {
    const rows = V.projectTelecom(inp), d = V.dcf(rows.map((r) => r.fcff), w.wacc, g);
    return { rows, d, b: V.bridge({ ev: d.ev, ...bin }) };
  };
  const cur = run(used), rows = cur.rows, last = rows[rows.length - 1], N = rows.length;
  const line = (name: string, f: (r: V.Year) => number, d = 1) => [name, ...rows.map((r) => fmt(f(r), d))];
  const wacCells = rateAxis.map((d) => w.wacc + d / 100), gCells = gAxis.map((d) => g + d / 100), fcff = rows.map((r) => r.fcff);
  const grid = V.sensitivityGrid(wacCells, gCells, (d, gg) => { const b = V.bridge({ ev: V.dcf(fcff, d, gg).ev, ...bin }); return b.perShare ?? b.equity; });

  // Reverse DCF: constant revenue growth that reproduces a reference value per share, scenario margins and capex held.
  const implied = (target: number) => V.solve((r) => { const y = V.projectTelecom({ ...used, revenueGrowth: r }); const b = V.bridge({ ev: V.dcf(y.map((q) => q.fcff), w.wacc, g).ev, ...bin }); if (b.perShare === null) throw new Error("Reverse DCF needs diluted shares above zero."); return b.perShare; }, -0.2, 0.4, target);
  let reverse: string;
  if (ref === null) reverse = label("Enter a reference price above zero to run the reverse DCF.", "warn");
  else if (bin.shares <= 0) reverse = label("Withheld: the reverse DCF needs diluted shares above zero.", "no");
  else {
    const cagr = Math.pow(last.revenue / V.revenueCrore(base.subsMn, base.arpu), 1 / N) - 1;
    const row = (target: number) => { try { return [fmt(target, 2), pct(implied(target), 2)]; } catch (x) { return [fmt(target, 2), `Withheld: ${(x as Error).message}`]; } };
    reverse = table("Reverse DCF: constant revenue growth that equals each reference value per share", ["Reference value per share (Rs)", "Implied constant revenue growth"], [0.8, 0.9, 1, 1.1, 1.2].map((m) => row(ref * m))) +
      note(`Search range -20% to +40%; WACC, terminal g, margins and capex held at the current inputs. Current drivers imply revenue growth of ${pct(cagr, 2)} a year. A root, not proof the market assumes it.`);
  }

  const scenarios = (["base", "upside", "downside"] as const).map((s) => { const r = run(V.applyScenario(base, s)); return [s[0].toUpperCase() + s.slice(1), money(r.d.ev), money(r.b.equity), ps(r.b.perShare)]; });
  const resid = cur.d.sumPv + cur.d.pvTv - bin.netDebt - bin.leases - bin.minorities + bin.investments - cur.b.equity;
  const qa: string[] = [];
  if (g > p("rf")) qa.push(`Terminal growth (${pct(g)}) exceeds the risk-free rate (${pct(p("rf"))}): check it is sustainable.`);
  if (last.capex < last.da) qa.push("Terminal-year capex is below D&A: the perpetuity may overstate sustainable cash flow.");
  if (cur.d.tvShare > 0.75) qa.push(`Terminal value is ${pct(cur.d.tvShare, 0)} of enterprise value: most of the value rests on the perpetuity.`);
  if (cur.b.equity <= 0) qa.push("Equity value is not positive: per-share value is not meaningful.");
  if (bin.shares === 0) qa.push("Diluted shares are zero: per-share outputs are withheld.");
  if (scen !== "base") qa.push(`${scen[0].toUpperCase() + scen.slice(1)} scenario overlay is applied. ${V.SCENARIO_TEXT}`);
  qa.push("Leases are deducted once, in the bridge; lease payments are not deducted from FCFF, so there is no double counting. Keep that convention if you edit the inputs.");

  return (
    metrics([["Enterprise value (Rs crore)", money(cur.d.ev)], ["Equity value (Rs crore)", money(cur.b.equity)], ["Illustrative value per share (Rs)", ps(cur.b.perShare)], ["WACC", pct(w.wacc, 2)], ["Terminal value share of EV", pct(cur.d.tvShare, 1)]]) +
    (ref !== null && cur.b.perShare ? note(`Reference price ${fmt(ref, 2)} is ${pct(ref / cur.b.perShare - 1, 1)} relative to the illustrative value per share. Arithmetic only.`) : "") +
    h("Revenue, EBITDA and FCFF forecast") +
    lineChart({ title: "Revenue and EBITDA projection", caption: `Hypothetical, Rs crore, ${scen} scenario.`, series: [{ name: "Revenue", values: rows.map((r) => r.revenue) }, { name: "EBITDA", values: rows.map((r) => r.ebitda) }], x: yearLabels, zero: true }) +
    barChart({ title: "FCFF by year", caption: "FCFF = EBIT x (1 - tax) + D&A - capex - change in NWC. Rs crore.", labels: rows.map((_, k) => yearLabels(k)), values: fcff }) +
    table("Forecast schedule (table view of the charts), Rs crore unless stated", ["Line item", ...rows.map((_, k) => yearLabels(k))], [
      line("Subscribers (mn)", (r) => r.subs), line("ARPU (Rs/month)", (r) => r.arpu), line("Revenue", (r) => r.revenue), line("EBITDA", (r) => r.ebitda), line("EBITDA margin (%)", (r) => (r.ebitda / r.revenue) * 100),
      line("D&A", (r) => r.da), line("EBIT", (r) => r.ebit), line("Tax on EBIT", (r) => r.taxPaid), line("NOPAT", (r) => r.nopat), line("Capex", (r) => r.capex), line("Change in NWC", (r) => r.dNwc), line("FCFF", (r) => r.fcff),
    ]) +
    h("Cost of equity, WACC and terminal value") +
    table("Capital cost decomposition", ["Item", "Value", "Contribution to WACC"], [
      ["Risk-free rate", pct(p("rf"), 2), ""], ["Beta x equity risk premium", `${fmt(x("beta"), 2)} x ${pct(p("erp"), 2)}`, ""], ["Cost of equity", pct(w.ke, 2), pct(w.we * w.ke, 2)],
      ["Pre-tax cost of debt", pct(p("kd"), 2), ""], ["After-tax cost of debt", pct(w.kdAfterTax, 2), pct(w.wd * w.kdAfterTax, 2)], ["Weights E / D", `${pct(w.we, 1)} / ${pct(w.wd, 1)}`, ""], ["WACC", "", pct(w.wacc, 2)],
    ]) +
    table("Terminal value (Gordon growth on final-year FCFF)", ["Item", "Value"], [
      ["Terminal value at end of horizon, Rs crore", money(cur.d.tv)], ["Present value of terminal value", money(cur.d.pvTv)], ["Present value of explicit FCFF", money(cur.d.sumPv)],
      ["Implied terminal EV/EBITDA", fmt(cur.d.tv / last.ebitda, 1) + "x"],
    ]) +
    h("Enterprise value to equity bridge") +
    waterfall({ title: "Enterprise value to equity value", caption: "Hypothetical, Rs crore.", steps: [
      { label: "PV explicit", value: cur.d.sumPv }, { label: "PV terminal", value: cur.d.pvTv }, { label: "EV", value: cur.d.ev, total: true }, { label: "Net debt", value: -bin.netDebt }, { label: "Leases", value: -bin.leases },
      { label: "Minorities", value: -bin.minorities }, { label: "Investments", value: bin.investments }, { label: "Equity", value: cur.b.equity, total: true },
    ] }) +
    note(`Identity check: PV explicit + PV terminal - net debt - leases - minorities + investments - equity = ${fmt(resid, 6)} (should be 0).`) +
    h("Sensitivity: WACC and terminal growth") +
    heat(`${bin.shares > 0 ? "Illustrative value per share (Rs)" : "Equity value (Rs crore), per-share withheld"}: terminal growth (rows) by WACC (columns)`, "g \\ WACC", rateAxis.map((d) => `${pct(w.wacc + d / 100, 2)} (${sgn(d)}pp)`), gAxis.map((d) => `${pct(g + d / 100, 2)} (${sgn(d)}pp)`), grid, (v) => fmt(v, bin.shares > 0 ? 1 : 0), [2, 2]) +
    h("Scenarios") + table("Scenario comparison (same WACC and terminal g)", ["Scenario", "EV (Rs crore)", "Equity (Rs crore)", "Value per share (Rs)"], scenarios) + note(V.SCENARIO_TEXT) +
    h("Reverse DCF") + reverse +
    tail(qa)
  );
}

function riBody(form: HTMLFormElement, c: Company) {
  const x = (k: string) => val(form, k), p = (k: string) => val(form, k) / 100;
  const ke = V.costOfEquity(p("rf"), x("beta"), p("erp")), inp: V.RIInputs = { bvps: x("bv"), roeStart: p("roe0"), roeLong: p("roe1"), years: x("years"), payout: p("pay"), ke, g: p("g") };
  const r = V.residualIncome(inp), ref = V.referencePrice(x("ref"));
  const grid = V.sensitivityGrid(rateAxis.map((d) => ke + d / 100), gAxis.map((d) => inp.g + d / 100), (d, gg) => { try { return V.residualIncome({ ...inp, ke: d, g: gg }).pb; } catch { return NaN; } });
  const qa = [c.archetype === "Bank" ? "Deposits are operating liabilities for a bank, so no FCFF or WACC is used. Capital adequacy limits on payout are not modelled." : "Funding cost, Stage 3 assets and expected credit loss are not modelled separately; they enter only through the ROE path you type. FCFE is not built."];
  if (inp.g > p("rf")) qa.push(`Terminal growth (${pct(inp.g)}) exceeds the risk-free rate (${pct(p("rf"))}): check it is sustainable.`);
  if (inp.roeLong < ke) qa.push("Long-run ROE is below the cost of equity: terminal residual income is negative and value falls below book.");
  const last = r.rows[r.rows.length - 1];
  return (
    metrics([["Cost of equity", pct(ke, 2)], ["Illustrative value per share (Rs)", fmt(r.value, 2)], ["Implied P/B", fmt(r.pb, 2) + "x"], ["PV of explicit residual income", fmt(r.sumPv, 2)], ["PV of terminal residual income", fmt(r.pvTv, 2)]]) +
    (ref !== null ? note(`Reference price ${fmt(ref, 2)} is ${pct(ref / r.value - 1, 1)} relative to the illustrative value per share and ${fmt(ref / inp.bvps, 2)}x opening book. Arithmetic only.`) : "") +
    h("ROE path and residual income") +
    lineChart({ title: "ROE fading to long-run ROE against cost of equity", caption: "Residual income is positive while ROE is above cost of equity.", series: [{ name: "ROE", values: r.rows.map((q) => q.roe * 100) }, { name: "Cost of equity", values: r.rows.map(() => ke * 100) }], x: yearLabels, yFmt: (v) => v.toFixed(1) + "%" }) +
    barChart({ title: "Residual income per share by year", caption: "Rs per share, hypothetical.", labels: r.rows.map((_, k) => yearLabels(k)), values: r.rows.map((q) => q.ri) }) +
    table("Residual income schedule, Rs per share", ["Year", "ROE", "Opening BVPS", "Earnings", "Residual income", "Discount factor", "PV"], r.rows.map((q) => [yearLabels(q.t - 1), pct(q.roe, 2), fmt(q.open, 2), fmt(q.earnings, 2), fmt(q.ri, 2), fmt(q.df, 4), fmt(q.pv, 2)])) +
    table("Value build", ["Item", "Rs per share"], [["Opening book value", fmt(inp.bvps, 2)], ["PV of explicit residual income", fmt(r.sumPv, 2)], [`Terminal value at year ${r.rows.length} (on book ${fmt(last.close, 2)})`, fmt(r.tv, 2)], ["PV of terminal value", fmt(r.pvTv, 2)], ["Illustrative value per share", fmt(r.value, 2)]]) +
    h("Sensitivity: cost of equity and terminal growth") +
    heat("Implied P/B: terminal growth (rows) by cost of equity (columns)", "g \\ Ke", rateAxis.map((d) => `${pct(ke + d / 100, 2)} (${sgn(d)}pp)`), gAxis.map((d) => `${pct(inp.g + d / 100, 2)} (${sgn(d)}pp)`), grid, (v) => fmt(v, 2) + "x", [2, 2]) +
    tail(qa)
  );
}

function navBody(form: HTMLFormElement) {
  const x = (k: string) => val(form, k), p = (k: string) => val(form, k) / 100;
  const projects: V.Project[] = [];
  for (let i = 1; i <= 6; i++) { const name = str(form, `pn${i}`).trim(); if (name) projects.push({ name, cashFlow: x(`pc${i}`), years: x(`py${i}`), rate: p(`pr${i}`), stake: p(`ps${i}`) }); }
  const r = V.projectNav(projects, x("nd"), x("sh")), ref = V.referencePrice(x("ref"));
  const qa = ["Project cash flows are single typed totals with one average timing each, not a verified project schedule. Land bank, rental assets and unlaunched pipeline are not modelled unless you enter them as projects.", "This is a project-level NAV, not a generic perpetuity DCF."];
  if (r.nav <= 0) qa.push("NAV is not positive after net debt: per-share value is not meaningful.");
  return (
    metrics([["Attributable project value (Rs crore)", money(r.gross)], ["NAV after net debt (Rs crore)", money(r.nav)], ["Illustrative NAV per share (Rs)", ps(r.perShare)]]) +
    (ref !== null && r.perShare !== null ? note(`Reference price ${fmt(ref, 2)} is ${pct(V.priceVsNav(ref, r.perShare), 1)} relative to illustrative NAV per share (negative = discount). Arithmetic only.`) : "") +
    h("Project NAV") +
    waterfall({ title: "Project values to NAV", caption: "Attributable present values, then net debt. Hypothetical, Rs crore.", steps: [...r.rows.map((q) => ({ label: q.name, value: q.attributable })), { label: "Gross", value: r.gross, total: true }, { label: "Net debt", value: -x("nd") }, { label: "NAV", value: r.nav, total: true }] }) +
    table("Project NAV table, Rs crore", ["Project", "Remaining cash flow", "Years", "Discount rate", "PV at 100%", "Stake", "Attributable PV"], r.rows.map((q) => [q.name, fmt(q.cashFlow, 1), fmt(q.years, 1), pct(q.rate, 1), fmt(q.pv, 1), pct(q.stake, 0), fmt(q.attributable, 1)])) +
    tail(qa)
  );
}

function appraisalBody(form: HTMLFormElement) {
  const x = (k: string) => val(form, k), ref = V.referencePrice(x("ref"));
  const r = V.appraisal({ anw: x("anw"), vif: x("vif"), vnb: x("vnb"), multiple: x("mult"), shares: x("sh") });
  return (
    label("HYPOTHETICAL appraisal-style illustration. No supported embedded-value engine is verified; this adds three numbers you type. It is not an actuarial valuation.", "no") +
    metrics([["Illustrative appraisal total (Rs crore)", money(r.total)], ["Illustrative value per share (Rs)", ps(r.perShare)]]) +
    (ref !== null && r.perShare !== null ? note(`Reference price ${fmt(ref, 2)} is ${pct(ref / r.perShare - 1, 1)} relative to the illustrative value per share. Arithmetic only.`) : "") +
    h("Appraisal components") +
    waterfall({ title: "Appraisal-style components", caption: "Adjusted net worth + value in force + multiple x new business. Hypothetical, Rs crore.", steps: [{ label: "Net worth", value: x("anw") }, { label: "In-force", value: x("vif") }, { label: "New business", value: r.franchise }, { label: "Total", value: r.total, total: true }] }) +
    tail(["Persistency, solvency, risk margin, product mix and the time value of options are not modelled. Treat the figure as arithmetic, not as embedded value."])
  );
}

const PANELS: [string, string][] = [
  ["Issuer context and source IDs", "Partial: no ISIN, filing or snapshot IDs are loaded"],
  ["Historical income statement", "Not built: no sourced data loaded"],
  ["Balance sheet and cash-flow reconciliation", "Partial: bridge identity check only"],
  ["Changed-versus-sourced diff", "Not built: nothing is sourced. Reset restores the hypothetical defaults"],
  ["Monte Carlo", "Not built: gated until an independent oracle exists"],
];
function tail(qa: string[]) {
  return (
    h("Monte Carlo") + label("Not built: gated until an independent oracle exists.", "warn") +
    h("QA and limitations") + list([...qa, "Every value here is user-edited and EXPLORATORY. Nothing reconciles to a filing, and no market data is loaded."]) + table("Panel status", ["Panel", "Status"], PANELS)
  );
}

const BODY: Record<Method, (form: HTMLFormElement, c: Company) => string> = { FCFF_DCF: dcfBody, RESIDUAL_INCOME: riBody, PROJECT_NAV: navBody, EV_VNB: appraisalBody };

function render(c: Company, form: HTMLFormElement) {
  const attempt = str(form, "attempt") as Method;
  const top =
    HYP +
    table("Issuer context", ["Field", "Value"], [["Company", `${c.name} (${c.ticker})`], ["Archetype", c.archetype], ["Registered method", methodLabel(c.method)], ["Data basis", "None: hypothetical user-typed inputs"], ["Currency and units", "Rs, crore unless stated"]]) +
    table("Method router", ["Method", "Verdict", "Reason"], METHODS.map((m) => { const v = methodVerdict(c.ticker, m); return [methodLabel(m), v.allowed ? "Registered" : "Rejected", v.allowed ? `Registered for ${c.name}. Computed below on hypothetical inputs only; no verified engine.` : v.text]; }));
  if (attempt !== c.method) return top + label(`Attempted ${methodLabel(attempt)}: rejected. ${methodVerdict(c.ticker, attempt).text} No valuation is computed.`, "no");
  return top + BODY[c.method](form, c);
}

export const mount: Mount = (root, ctx) => {
  const paint = () => root.querySelectorAll<HTMLElement>("td[data-bg]").forEach((td) => { td.style.background = td.dataset.bg!; td.style.color = td.dataset.fg!; });
  const build = () => {
    const c = COMPANIES.find((x) => x.ticker === ctx.company())!;
    workstation(root, `<p class="val-hyp val-hyp-sm"><b>HYPOTHETICAL INPUTS.</b> Not the company's financials.</p>${routerCtl(c.method)}${CONTROLS[c.method]()}`, (form) => render(c, form));
    new MutationObserver(paint).observe(root.querySelector(".ws-out")!, { childList: true });
    paint();
  };
  root.addEventListener("click", (ev) => { if ((ev.target as HTMLElement).closest("[data-reset]")) build(); });
  ctx.onCompany(build);
  build();
};
