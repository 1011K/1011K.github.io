import "./demo-risk.css";
import type { Mount } from "./demo-ctx.ts";
import { COMPANIES } from "./content.ts";
import { lineChart, redScale } from "./charts.ts";
import { e, fmt, group, label, metrics, number, pct, select, str, table, val, workstation } from "./ui.ts";
import { PAIRS, SESSIONS, TRADING_DAYS, WEIGHT_TOL, annualSd, corrFromUpper, maxAbsDiff, portfolioPath, portfolioRisk, rollingCorr, sampleCorr, simulate, stress, validateModel, validateWeights, type Kind, type Mat } from "./risk.ts";

const BANNER = "HYPOTHETICAL volatilities and correlations. Simulated returns are not market data.";
const SHORT: Record<string, string> = { HDFCBANK: "HDFCB", DLF: "DLF", BHARTIARTL: "BHARTI", BAJFINANCE: "BAJFIN", HDFCLIFE: "HDFCL" };
const NAMES = COMPANIES.map((c) => c.name), SH = COMPANIES.map((c) => SHORT[c.ticker] ?? c.ticker), N = COMPANIES.length, IDX = SH.map((_, i) => i);
const DEF = { vol: 20, w: 20, rho: 0.3, seed: 2026 };
/** Signed to 2 dp so sign never depends on colour. Rounds first so -0.001 reads 0.00. */
const sg = (v: number) => { if (!Number.isFinite(v)) return "n/a"; const r = Math.round(v * 100) / 100; return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(2)}`; };

function heat(m: Mat, caption: string) {
  const rows = m.map((r, i) => `<tr><th scope="row" title="${e(NAMES[i])}">${e(SH[i])}</th>${r.map((v, j) => { const [bg, fg] = redScale(v), t = i === j ? "1.00" : sg(v); return `<td style="background:${bg};color:${fg}" title="${e(`${NAMES[i]} vs ${NAMES[j]}: ${t}`)}" aria-label="${e(`${NAMES[i]} and ${NAMES[j]} correlation ${t}`)}">${t}</td>`; }).join("")}</tr>`).join("");
  return `<table class="rk-heat"><caption>${e(caption)}</caption><thead><tr><td class="rk-corner"><span class="sr">Company</span></td>${SH.map((s, j) => `<th scope="col" title="${e(NAMES[j])}">${e(s)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}
const legend = () => `<div class="rk-legend"><span class="rk-bar" role="img" aria-label="Colour scale: negative correlation muted rose, zero pale rose, positive deep red" style="background:linear-gradient(90deg,${[-1, -0.5, 0, 0.5, 1].map((v) => redScale(v)[0]).join(",")})"></span><span class="rk-ticks"><span>−1 negative</span><span>0 none</span><span>+1 perfect</span></span></div>`;

/** Weight vs share of portfolio volatility, two bars per company. */
function pairBars(a: number[], b: number[]) {
  const W = 480, H = 230, L = 40, R = 8, T = 22, B = 30, hi = Math.max(...a, ...b, 0.05) * 1.12, gw = (W - L - R) / N, bw = gw * 0.32, py = (v: number) => T + (1 - v / hi) * (H - T - B);
  const grid = [0, 0.5, 1].map((k) => `<line class="gl" x1="${L}" x2="${W - R}" y1="${py(hi * k)}" y2="${py(hi * k)}"/><text x="${L - 4}" y="${py(hi * k) + 4}" text-anchor="end">${pct(hi * k, 0)}</text>`).join("");
  const bars = SH.map((s, i) => { const x = L + (i + 0.5) * gw; return [[a[i], x - bw - 1, "rk-bw", "Weight"], [b[i], x + 1, "rk-bc", "Share of volatility"]].map(([v, bx, c, n]) => `<rect class="${c}" x="${(bx as number).toFixed(1)}" y="${py(v as number).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, py(0) - py(v as number)).toFixed(1)}"><title>${e(`${NAMES[i]} ${n}: ${pct(v as number)}`)}</title></rect><text x="${((bx as number) + bw / 2).toFixed(1)}" y="${(py(v as number) - 4).toFixed(1)}" text-anchor="middle">${Number.isFinite(v as number) ? pct(v as number, 0) : "n/a"}</text>`).join("") + `<text x="${x}" y="${H - 10}" text-anchor="middle">${e(s)}</text>`; }).join("");
  const t = "Portfolio weight and share of portfolio volatility by company";
  return `<figure class="chart"><ul class="legend"><li class="s0">Weight</li><li class="s1">Share of portfolio volatility</li></ul><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(t)}"><title>${e(t)}</title>${grid}${bars}</svg><figcaption>Bars sum to 100% each. Exact values are in the table above.</figcaption></figure>`;
}

const controls = () => {
  const pairs = PAIRS(N).map(([i, j]) => number(`rk-r-${i}-${j}`, `${SH[i]} / ${SH[j]}`, DEF.rho, "0.05"));
  return [
    `<p class="status warn rk-banner">${e(BANNER)}</p>`,
    group("Annual volatility (hypothetical)", `<div class="rk-grid2">${IDX.map((i) => number(`rk-v${i}`, SH[i], DEF.vol, "0.5", "%")).join("")}</div>`),
    group("Weights (must sum to 100%)", `<div class="rk-grid2">${IDX.map((i) => number(`rk-w${i}`, SH[i], DEF.w, "0.5", "%")).join("")}</div><small class="rk-hint">Long-only. Weights are never renormalised for you.</small>`),
    group("Pair correlations (upper triangle; matrix is symmetric)", `<div class="rk-grid2">${pairs.join("")}</div><div class="rk-setall">${number("rk-all", "Set all pairs to", DEF.rho, "0.05")}<button type="button" class="btn" data-act="all">Apply to all pairs</button></div>`),
    group("Simulation", [select("rk-kind", "Return basis", [["simple", "Simple returns"], ["log", "Log returns"]], "simple"), select("rk-win", "Rolling window (sessions)", [["60", "60"], ["120", "120"], ["252", "252"]], "60"), select("rk-pair", "Rolling pair", PAIRS(N).map(([i, j]) => [`${i}-${j}`, `${SH[i]} / ${SH[j]}`] as [string, string]), "0-1"), number("rk-seed", "Seed", DEF.seed, "1", "", `${SESSIONS} sessions, ${TRADING_DAYS} per year`)].join("")),
    group("Scenario stress", number("rk-k", "Volatility multiplier", 1.5, "0.1", "x") + number("rk-s", "Correlation shrink toward +1", 0.5, "0.05", "", "0 = none, 1 = all pairs at +1")),
    `<button type="reset" class="btn" data-act="reset">Reset to defaults</button>`,
  ].join("");
};

const row = (k: string, a: string, b: string) => [k, a, b];
function render(f: HTMLFormElement) {
  const vols = IDX.map((i) => val(f, `rk-v${i}`) / 100), w = IDX.map((i) => val(f, `rk-w${i}`) / 100);
  const corr = corrFromUpper(N, PAIRS(N).map(([i, j]) => val(f, `rk-r-${i}-${j}`)));
  const minEig = validateModel(vols, corr, SH);
  validateWeights(w, SH); // throws the invalid-sum message; nothing is renormalised
  const kind = str(f, "rk-kind") as Kind, win = Number(str(f, "rk-win")), [pi, pj] = str(f, "rk-pair").split("-").map(Number);
  const risk = portfolioRisk(vols, corr, w), st = stress(vols, corr, w, val(f, "rk-k"), val(f, "rk-s"));
  const R = simulate(vols, corr, val(f, "rk-seed")), sc = sampleCorr(R), diff = maxAbsDiff(sc, corr), path = portfolioPath(R, w, kind);
  const daily = path.growth.slice(1).map((g, t) => g / path.growth[t] - 1), roll = rollingCorr(R, pi, pj, win), x = (i: number) => `session ${i}`;
  const top = risk.share.reduce((b, s, i) => (s > risk.share[b] ? i : b), 0), withheld = !Number.isFinite(risk.compVol[0]);
  const rho = corr[pi][pj];
  const contrib = IDX.map((i) => [SH[i], pct(w[i]), pct(vols[i]), fmt(risk.marginal[i], 4), fmt(risk.compVar[i], 5), fmt(risk.compVol[i], 4), pct(risk.share[i])]);
  contrib.push(["Total", pct(w.reduce((a, b) => a + b)), "", "", fmt(risk.variance, 5), fmt(risk.vol, 4), withheld ? "n/a" : "100.0%"]);
  const ledger: [string, string][] = [
    ["Data status", "No market data is used anywhere in this demonstration. Volatilities, correlations and weights are hypothetical inputs set on this page. Simulated returns are generated from them and are not observations."],
    ["Defaults", `Uniform generic ${DEF.vol}% volatility, ${DEF.rho.toFixed(2)} correlation and ${DEF.w}% weights. They say nothing about how the five companies actually behave.`],
    ["Input checks", "Each |rho| at most 1, unit diagonal, symmetry, volatility above 0% (and at most 100%), and positive semi-definiteness by Jacobi eigenvalues (tolerance 1e-10). Any failure withholds every result and names the smallest eigenvalue."],
    ["Weights", `Long-only and summing to 100% within ${WEIGHT_TOL}. Never silently renormalised; an invalid sum shows a message instead of results.`],
    ["Risk maths", "Covariance = D R D with D the volatilities. Portfolio variance = w'Sw. Marginal = (Sw)i / portfolio volatility. Contribution to variance = wi (Sw)i; to volatility = that / portfolio volatility. Contributions are checked to sum to the totals. Diversification ratio = sum of wi * volatility i / portfolio volatility. All figures annual."],
    ["Stress", "Every volatility is multiplied by k and every pair correlation moves toward +1 by the shrink factor (rho' = rho + shrink * (1 - rho)). A what-if on inputs, not a forecast."],
    ["Simulation", `Seeded multivariate normal via Cholesky, zero drift, ${SESSIONS} sessions, daily volatility = annual / sqrt(${TRADING_DAYS}). Draws are read as simple or log returns per the selector (log is converted with exp - 1 for the portfolio). Weights reset to target every session. Labelled SIMULATED wherever shown.`],
    ["When real data replaces this", "Volatilities and correlations would come from approved, corporate-action-adjusted return series for the five companies at a stated as-of date, aligned on common trading sessions with a minimum overlap, using a stated sample covariance convention. Not connected yet; no real correlation is shown or implied."],
    ["Not provided", "No value-at-risk, no Monte Carlo certification, no forecast, no recommendation."],
  ];
  return `<p class="status warn rk-banner">${e(BANNER)}</p>
<h4>Correlation heat map (red)</h4>
<div class="rk-pair"><div>${heat(corr, "Input correlation (hypothetical)")}</div><div>${heat(sc, `Sample correlation, SIMULATED (${SESSIONS} sessions)`)}</div></div>
${legend()}
<p class="note">Max absolute difference between input and simulated sample correlation: <b>${fmt(diff, 3)}</b>. Some gap is expected from sampling noise (about 1/sqrt(${SESSIONS}) = ${fmt(1 / Math.sqrt(SESSIONS), 3)} per pair). Every cell shows its signed value.</p>
<h4>Portfolio risk (annual, from hypothetical inputs)</h4>
${metrics([["Portfolio volatility", pct(risk.vol, 2)], ["Portfolio variance", fmt(risk.variance, 5)], ["Weighted average volatility", pct(risk.weightedAvgVol, 2)], ["Diversification ratio", fmt(risk.divRatio, 2)], ["Average pair correlation", sg(risk.avgCorr)], ["Largest risk share", withheld ? "n/a" : `${SH[top]} ${pct(risk.share[top])}`], ["Smallest eigenvalue of R", fmt(minEig, 4)]])}
${withheld ? label("Portfolio volatility is effectively zero, so risk contributions are withheld.") : ""}
${table("Risk contributions by company", ["Company", "Weight", "Volatility", "Marginal", "Contrib. to variance", "Contrib. to volatility", "Share of risk"], contrib)}
${pairBars(w, risk.share)}
<h4>Scenario stress</h4>
${table("Baseline versus stress (volatility x " + fmt(val(f, "rk-k"), 2) + ", correlations " + pct(val(f, "rk-s"), 0) + " of the way to +1)", ["Metric", "Baseline", "Stressed"], [row("Portfolio volatility", pct(st.before.vol, 2), pct(st.after.vol, 2)), row("Diversification ratio", fmt(st.before.divRatio, 2), fmt(st.after.divRatio, 2)), row("Average pair correlation", sg(st.before.avgCorr), sg(st.after.avgCorr)), row("Largest risk share", withheld ? "n/a" : pct(Math.max(...st.before.share)), pct(Math.max(...st.after.share)))])}
<p class="note">Illustrative what-if on hypothetical inputs. It is not a forecast, a value-at-risk figure or a worst case.</p>
<h4>Rolling correlation, ${e(SH[pi])} / ${e(SH[pj])} (SIMULATED)</h4>
${lineChart({ title: `Rolling ${win}-session correlation of ${SH[pi]} and ${SH[pj]}, simulated`, caption: `SIMULATED ${win}-session window on seed ${val(f, "rk-seed")}. Dashed line is the input correlation ${sg(rho)}.`, series: [{ name: `Rolling ${win}-session (SIMULATED)`, values: roll, cls: "s1" }, { name: `Input ${sg(rho)}`, values: roll.map(() => rho), cls: "s3" }], x: (i) => x(i + 1), yFmt: (v) => v.toFixed(2) })}
<h4>Portfolio path (SIMULATED)</h4>
${metrics([["Ending growth of 1.00", fmt(path.growth[SESSIONS], 3)], ["Maximum drawdown", pct(path.maxDD, 1)], ["Sample volatility (annualised)", pct(annualSd(daily), 2)], ["Model volatility", pct(risk.vol, 2)]])}
${lineChart({ title: "Simulated cumulative growth of the weighted portfolio", caption: `SIMULATED, ${kind} return basis, zero drift, weights reset to target each session. Starts at 1.00.`, series: [{ name: "Growth of 1.00 (SIMULATED)", values: path.growth, cls: "s0" }], x, yFmt: (v) => v.toFixed(2) })}
${lineChart({ title: "Simulated drawdown of the weighted portfolio", caption: "SIMULATED drawdown from the running peak.", series: [{ name: "Drawdown (SIMULATED)", values: path.dd, cls: "s1" }], x, zero: true, yFmt: (v) => pct(v, 0), height: 200 })}
<h4>Source and methodology ledger</h4>
${table("Source and methodology ledger", ["Item", "Treatment"], ledger)}`;
}

export const mount: Mount = (root) => {
  const { form, redraw } = workstation(root, controls(), render);
  root.addEventListener("click", (ev) => {
    const act = (ev.target as HTMLElement).closest<HTMLElement>("button[data-act]")?.dataset.act;
    if (act !== "all") return;
    const v = val(form, "rk-all");
    if (!Number.isFinite(v)) return;
    PAIRS(N).forEach(([i, j]) => { (form.elements.namedItem(`rk-r-${i}-${j}`) as HTMLInputElement).value = String(v); });
    redraw();
  });
  form.addEventListener("reset", () => setTimeout(redraw)); // reset restores value attributes first
};
