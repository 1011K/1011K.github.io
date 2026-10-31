import { dcf, blackScholes, type DCFInput, type OptionInput } from "./models";
import { demoHTML, wireDemo } from "./demo";
import { escapeHTML as e } from "./publication";
const warning =
  '<p class="fine model-note">Hypothetical inputs only. Independent educational model; not an ASTRA model, market data or investment advice.</p>';
const range = (
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  unit: string,
) =>
  `<label class="control" for="${id}"><span>${label}<output id="${id}-out">${value}${unit}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></label>`;
const number = (
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
) =>
  `<label class="control" for="${id}">${label}<input id="${id}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" required></label>`;
export const labHTML = () =>
  `<header class="page-intro"><p class="eyebrow">02 / Independent educational research lab</p><h1>Research models<br class="mobile-break"> you can inspect.</h1><p>Deterministic calculations. Transparent assumptions. Educational, not investment advice.</p></header><div class="module-nav" role="group" aria-label="Educational modules"><button data-module="dcf" aria-pressed="true">01 / Valuation</button><button data-module="portfolio" aria-pressed="false">02 / Portfolio risk</button><button data-module="options" aria-pressed="false">03 / Options & Greeks</button><button data-module="statements" aria-pressed="false">04 / Financial statements</button></div><div id="module"></div>`;
const dcfHTML =
  () => `<section class="lab-grid" aria-labelledby="model-heading"><form class="panel assumptions" id="dcf-form"><h2 class="eyebrow">Illustrative DCF assumptions</h2>
${range("revenue", "Revenue · base year", 100, 3000, 50, 1000, " cr")}${range("growth", "Revenue growth", 0, 20, 0.5, 8, "%")}${range("margin", "Operating margin", 1, 40, 0.5, 18, "%")}${range("wacc", "Discount rate / WACC", 4, 20, 0.5, 11, "%")}${range("terminalGrowth", "Terminal growth", 0, 6, 0.5, 3, "%")}
<details><summary>Tax & reinvestment</summary>${range("tax", "Tax rate", 0, 50, 1, 25, "%")}${range("reinvestment", "Reinvestment / NOPAT", 0, 100, 1, 30, "%")}</details><p class="fine">All amounts in hypothetical ₹ crore. Five forecast years.</p></form>
<div class="panel workspace"><p class="eyebrow">Model 01 / Valuation sensitivity</p><h2 id="model-heading">Discount-rate sensitivity</h2><p class="muted">Enterprise value as a function of WACC.</p><div id="dcf-error" role="alert"></div><div class="chart-layout"><figure><svg id="dcf-chart" viewBox="0 0 660 330" role="img" aria-label="Hypothetical enterprise value in crore across discount rates"></svg><figcaption>Horizontal: WACC (%) · Vertical: enterprise value (₹ cr). Solid line: same assumptions, varying WACC.</figcaption></figure><aside class="interpretation"><p class="eyebrow">Interpretation</p><p>Higher WACC reduces present value in this positive cash-flow example.</p><hr><dl aria-live="polite"><dt>Enterprise value</dt><dd id="dcf-value"></dd><dt>Terminal share</dt><dd id="dcf-terminal"></dd></dl><p class="fine">Terminal value may dominate outcomes. This is not a per-share target.</p></aside></div><details><summary>Inspect formulas, assumptions & values</summary><p>Revenueₜ = Revenue₀ × (1 + growth)ᵗ<br>NOPATₜ = Revenueₜ × operating margin × (1 − tax)<br>FCFFₜ = NOPATₜ × (1 − reinvestment rate)<br>EV = Σ FCFFₜ / (1 + WACC)ᵗ + [FCFF₅ × (1 + g) / (WACC − g)] / (1 + WACC)⁵</p><p>Fixed margins, tax and reinvestment; constant five-year revenue growth; no explicit debt or share count. Perpetual growth must be below WACC.</p><div id="dcf-table"></div></details>${warning}</div></section>`;
const optionsHTML = () =>
  `<section class="lab-grid" aria-labelledby="model-heading"><form class="panel assumptions" id="options-form"><h2 class="eyebrow">European option assumptions</h2>${number("spot", "Spot · currency units", 100, 1, 10000, 1)}${number("strike", "Strike · currency units", 100, 1, 10000, 1)}${number("rate", "Risk-free rate · % / year", 5, -10, 30, 0.1)}${number("vol", "Volatility · % / year", 20, 1, 200, 1)}${number("time", "Time to expiry · years", 1, 0.01, 10, 0.01)}</form><div class="panel workspace"><p class="eyebrow">Model 03 / Textbook Black–Scholes</p><h2 id="model-heading">Price and its sensitivities.</h2><p>European exercise. No dividends. Constant rate and volatility; lognormal prices, frictionless market.</p><div id="option-result" aria-live="polite"></div><details><summary>Inspect formulas & units</summary><p>d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T); d₂ = d₁ − σ√T<br>Call = S·N(d₁) − K·exp(−rT)·N(d₂)<br>Put = K·exp(−rT)·N(−d₂) − S·N(−d₁)</p><p>Delta: price change per unit of spot. Gamma: delta change per unit of spot. Vega and rho: price change per 1 percentage point in volatility and rate. Theta: price change per calendar day (365-day year). Greeks are local derivatives, not exact finite-shock forecasts. Zero time or volatility are rejected; no expiry or deterministic limit is asserted.</p></details>${warning}</div></section>`;
const portfolioHTML = () =>
  `<section class="panel workspace"><p class="eyebrow">Model 02 / Portfolio risk</p><h2>Two-asset diversification.</h2><p>A 25% weighted average and 20% portfolio volatility differ by 5 percentage points (20% relative reduction).</p>${demoHTML()}<details><summary>Inspect formula & limitations</summary><p>σₚ = √[w²σₐ² + (1−w)²σᵦ² + 2w(1−w)ρσₐσᵦ]</p><p>Long-only weights, fixed annual volatility and correlation. No expected returns, fees, liquidity constraints or changing correlations.</p></details></section>`;
const statementsHTML = () =>
  `<section class="panel workspace"><p class="eyebrow">Model 04 / Conceptual accounting map</p><h2>Three statements. One connected story.</h2><div class="cards"><article><span class="eyebrow">01 / Income statement</span><h3>Profit</h3><p>Revenue less operating costs, depreciation, interest and tax gives net income.</p></article><article><span class="eyebrow">02 / Cash flow</span><h3>Movement</h3><p>Net income plus non-cash adjustments and working-capital changes gives operating cash flow. Investing and financing explain the remaining cash movement.</p></article><article><span class="eyebrow">03 / Balance sheet</span><h3>Position</h3><p>Assets = liabilities + equity. Ending cash matches opening cash plus net cash movement; retained earnings reconcile profit and distributions.</p></article></div><p class="fine">Conceptual illustration only; no issuer figures or full forecasting engine.</p>${warning}</section>`;
export function wireLab() {
  const host = document.getElementById("module");
  if (!host) return;
  const show = (name: string) => {
    document
      .querySelectorAll<HTMLButtonElement>("[data-module]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.module === name)),
      );
    host.innerHTML =
      name === "portfolio"
        ? portfolioHTML()
        : name === "options"
          ? optionsHTML()
          : name === "statements"
            ? statementsHTML()
            : dcfHTML();
    if (name === "portfolio") {
      wireDemo();
      return;
    }
    if (name === "statements") return;
    const form = host.querySelector<HTMLFormElement>("form")!;
    const val = (id: string) =>
      Number((document.getElementById(id) as HTMLInputElement).value);
    const update = () => {
      form
        .querySelectorAll<HTMLInputElement>('input[type="range"]')
        .forEach((i) => {
          document.getElementById(i.id + "-out")!.textContent =
            i.value + i.dataset.unit;
        });
      if (name === "options") {
        const target = document.getElementById("option-result")!;
        try {
          if (!form.checkValidity())
            throw new Error("Use finite inputs within the displayed bounds.");
          const i: OptionInput = {
            spot: val("spot"),
            strike: val("strike"),
            rate: val("rate") / 100,
            vol: val("vol") / 100,
            time: val("time"),
          };
          const r = blackScholes(i);
          target.innerHTML = `<table><caption>Hypothetical price and Greeks</caption><thead><tr><th scope="col">Measure</th><th scope="col">Call</th><th scope="col">Put</th></tr></thead><tbody>${(["price", "delta", "theta", "rho"] as const).map((k) => `<tr><th scope="row">${k === "theta" ? "Theta / day" : k === "rho" ? "Rho / 1 pp" : k}</th><td>${r.call[k].toFixed(4)}</td><td>${r.put[k].toFixed(4)}</td></tr>`).join("")}<tr><th scope="row">Gamma</th><td colspan="2">${r.gamma.toFixed(6)}</td></tr><tr><th scope="row">Vega / 1 pp</th><td colspan="2">${r.vega.toFixed(4)}</td></tr></tbody></table>`;
        } catch (err) {
          target.innerHTML = `<p role="alert">${e((err as Error).message)}</p>`;
        }
        return;
      }
      try {
        const i: DCFInput = {
          revenue: val("revenue"),
          growth: val("growth") / 100,
          margin: val("margin") / 100,
          wacc: val("wacc") / 100,
          terminalGrowth: val("terminalGrowth") / 100,
          tax: val("tax") / 100,
          reinvestment: val("reinvestment") / 100,
        };
        const r = dcf(i);
        document.getElementById("dcf-error")!.textContent = "";
        document.getElementById("dcf-value")!.textContent =
          "₹ " +
          r.value.toLocaleString("en-IN", { maximumFractionDigits: 0 }) +
          " cr";
        document.getElementById("dcf-terminal")!.textContent =
          r.terminalShare === null ? "Not applicable · zero FCFF" : (r.terminalShare * 100).toFixed(1) + "%";
        const start = Math.max(i.terminalGrowth + 0.01, i.wacc - 0.04);
        const points = Array.from({ length: 9 }, (_, n) => ({
          w: start + n * 0.01,
          v: dcf({ ...i, wacc: start + n * 0.01 }).value,
        }));
        const max = Math.max(1, ...points.map((p) => p.v)) * 1.1;
        const x = (w: number) => 62 + ((w - start) / 0.08) * 570,
          y = (v: number) => 280 - (v / max) * 250;
        document.getElementById("dcf-chart")!.innerHTML =
          `${[0, 0.25, 0.5, 0.75, 1].map((q) => `<line x1="62" y1="${y(q * max)}" x2="632" y2="${y(q * max)}" class="gridline"/><text x="52" y="${y(q * max) + 4}" text-anchor="end">${Math.round(q * max)}</text>`).join("")}<path d="${points.map((p, n) => `${n ? "L" : "M"}${x(p.w)},${y(p.v)}`).join(" ")}" fill="none" stroke="currentColor" stroke-width="3"/>${points.map((p, n) => `<circle cx="${x(p.w)}" cy="${y(p.v)}" r="3" fill="currentColor"/>${n % 2 === 0 ? `<text x="${x(p.w)}" y="308" text-anchor="middle">${(p.w * 100).toFixed(0)}%</text>` : ""}`).join("")}`;
        document.getElementById("dcf-table")!.innerHTML =
          `<table><caption>Five-year hypothetical FCFF · ₹ cr</caption><thead><tr><th scope="col">Year</th><th scope="col">FCFF</th></tr></thead><tbody>${r.cashFlows.map((c, n) => `<tr><th scope="row">${n + 1}</th><td>${c.toFixed(2)}</td></tr>`).join("")}</tbody></table><table><caption>Sensitivity values used in chart</caption><thead><tr><th scope="col">WACC</th><th scope="col">Enterprise value · ₹ cr</th></tr></thead><tbody>${points.map((p) => `<tr><th scope="row">${(p.w * 100).toFixed(1)}%</th><td>${p.v.toFixed(2)}</td></tr>`).join("")}</tbody></table>`;
      } catch (err) {
        document.getElementById("dcf-error")!.textContent = (
          err as Error
        ).message;
        for (const id of [
          "dcf-value",
          "dcf-terminal",
          "dcf-chart",
          "dcf-table",
        ])
          document.getElementById(id)!.textContent = "";
      }
    };
    form.addEventListener("submit", (ev) => ev.preventDefault());
    form.addEventListener("input", update);
    update();
  };
  document
    .querySelectorAll<HTMLButtonElement>("[data-module]")
    .forEach((b) => b.addEventListener("click", () => show(b.dataset.module!)));
  show("dcf");
}
