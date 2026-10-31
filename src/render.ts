// Pure string rendering shared by the Vite HTML transform (static, works without JavaScript)
// and the browser (company-dependent refresh). No DOM access.
import {
  ASTRA_AREAS, AS_OF, AS_OF_LABEL, COMPANIES, CREDENTIALS, DEMOS, ENGINE_REASON, GATES, INDICATORS,
  METHODS, SIMULATIONS, STRATEGIES, methodLabel, methodVerdict,
  type Company, type Demo, type Ticker,
} from "./content.ts";
import { escapeHTML as e, type ReleaseRecord } from "./publication.ts";

const co = (t: Ticker) => COMPANIES.find((c) => c.ticker === t)!;
const list = (items: string[]) => `<ul>${items.map((i) => `<li>${e(i)}</li>`).join("")}</ul>`;

export const credentials = () =>
  CREDENTIALS.map(
    (c) => `<details class="acc" id="cred-${c.id}"><summary><span>${e(c.title)}</span><small>${e(c.status)}</small></summary><dl>
<div><dt>What I studied</dt><dd>${e(c.studied)}</dd></div>
<div><dt>Practical application</dt><dd>${e(c.applied)}</dd></div>
<div><dt>Evidence</dt><dd><a href="/media/krishiv-ramchandani-cv.pdf" download>Listed on standard CV (PDF)</a></dd></div></dl>${c.caution ? `<p class="caution">${e(c.caution)}</p>` : ""}</details>`,
  ).join("");

export const astraAreas = () =>
  ASTRA_AREAS.map(
    (a, i) => `<details class="area" id="area-${a.id}"><summary><b>${String(i + 1).padStart(2, "0")}</b>${e(a.name)}</summary><p>${e(a.covers)}</p><p class="muted"><strong>Why it helps:</strong> ${e(a.useful)}</p></details>`,
  ).join("");

export const simulations = () =>
  SIMULATIONS.map(
    (s, i) => `<details class="acc sim" id="sim-${i + 1}"><summary><span>${e(s.title)}</span><small>${String(i + 1).padStart(2, "0")} · ${e(s.org)} · Virtual Job Simulation, Forage</small></summary><dl>
<div><dt>Focus</dt><dd>${e(s.title.replace(/ Job Simulation$/, ""))}</dd></div>
<div><dt>What I learned</dt><dd>${e(s.learned)}</dd></div>
<div><dt>Connection to my work</dt><dd>${e(s.connection)}</dd></div></dl></details>`,
  ).join("");

const scroll = (label: string, html: string) => `<div class="tscroll" role="region" aria-label="${e(label)}" tabindex="0">${html}</div>`;
const matches = (r: ReleaseRecord, c: Company) => r.ticker === c.ticker;
export function cases(releases: ReleaseRecord[] = []) {
  return COMPANIES.map((c, i) => {
    const files = releases.filter((r) => matches(r, c)).flatMap((r) => r.assets);
    const pdf = files.find((a) => a.path.endsWith(".pdf")), xlsx = files.find((a) => a.path.endsWith(".xlsx"));
    const dl = (a: { path: string } | undefined, label: string) =>
      a ? `<a class="btn" href="/${e(a.path)}" download>${label}</a>` : `<span class="state">${label}: <b>WITHHELD</b></span>`;
    return `<article class="case" id="case-${c.ticker}"><header><span class="idx">${String(i + 1).padStart(2, "0")}</span><div><h3>${e(c.name)}</h3><p class="muted">${e(c.ticker)} · ${e(c.archetype)}</p></div><span class="chip">Research case under verification</span></header>
<p class="q">${e(c.question)}</p>
<dl><div><dt>Valuation method</dt><dd>${e(c.methodText)}</dd></div>
<div><dt>Method limits</dt><dd>${e(c.prohibitedText)}</dd></div>
<div><dt>Economic engine</dt><dd>${e(c.engine)}</dd></div>
<div><dt>Key uncertainty</dt><dd>${e(c.uncertainty)}</dd></div>
<div><dt>What would change the thesis</dt><dd>${e(c.thesisChange)}</dd></div>
<div><dt>Verification focus</dt><dd>${e(c.focus)}</dd></div>
<div><dt>Provenance</dt><dd>Prepared by Krishiv Ramchandani with ASTRA-assisted modelling. Not independently audited. No investment recommendation or target is published.</dd></div></dl>
<footer>${dl(pdf, "Report (PDF)")} ${dl(xlsx, "Workbook (XLSX)")}<a class="text-link" href="#demos" data-pick="${c.ticker}">Open in demonstrations →</a></footer></article>`;
  }).join("");
}

export const companySelect = (selected: Ticker = "HDFCBANK") =>
  `<label class="field" for="company"><span>Company</span><select id="company" name="company">${COMPANIES.map((c) => `<option value="${c.ticker}"${c.ticker === selected ? " selected" : ""}>${e(c.name)} (${c.ticker})</option>`).join("")}</select></label>`;

// --- Company-dependent fragments (refreshed in the browser when the selector changes) ---
export function methodRouter(t: Ticker) {
  const c = co(t);
  return scroll(`Method router for ${c.name}`, `<table class="grid"><caption>Method router for ${e(c.name)} (${e(c.archetype)})</caption><thead><tr><th scope="col">Method</th><th scope="col">Verdict</th></tr></thead><tbody>${METHODS.map((m) => {
    const v = methodVerdict(t, m);
    return `<tr class="${v.allowed ? "ok" : "no"}"><th scope="row">${e(methodLabel(m))}</th><td>${v.allowed ? "Registered method" : "Rejected"}</td></tr>`;
  }).join("")}</tbody></table>`) + `<p class="muted">${e(c.methodText)}.</p>`;
}
export function peers(t: Ticker) {
  const c = co(t);
  return scroll(`Proposed peers for ${c.name}`, `<table class="grid"><caption>Proposed peers for ${e(c.name)}. Not verified as the largest rivals.</caption><thead><tr><th scope="col">Peer</th><th scope="col">Class</th><th scope="col">Rationale</th></tr></thead><tbody>${c.peers.map((p) => `<tr><th scope="row">${e(p.name)}</th><td>${p.cls}</td><td>${e(p.note)}</td></tr>`).join("")}</tbody></table>`) + `<p class="muted">${e(c.peerNote)}</p>` + scroll(`Peer ratios for ${c.name}`, `<table class="grid"><caption>Ratios for this archetype (${e(c.archetype)}). All values withheld: no matched-period filings are loaded.</caption><thead><tr><th scope="col">Ratio</th><th scope="col">${e(c.name)}</th>${c.peers.map((p) => `<th scope="col">${e(p.name)}</th>`).join("")}</tr></thead><tbody>${c.ratios.map((r) => `<tr><th scope="row">${e(r)}</th>${"<td>Withheld</td>".repeat(4)}</tr>`).join("")}</tbody></table>`);
}
export const refresh = (t: Ticker) => ({ router: methodRouter(t), peers: peers(t), name: co(t).name, ticker: t });

// --- Demonstrations ---
const status = () => `<div class="banner" role="note"><b>RELEASE STATUS: WITHHELD</b><span>NOT YET ENGINE VERIFIED</span><p>${e(ENGINE_REASON)}</p></div>`;
const ledger = (d: Demo) => `<dl class="ledger">${(
  [
    ["Authoritative source", d.authority],
    d.id === "options" ? ["Mode", "HYPOTHETICAL calculator. No market date, no market data."] : ["Target as-of", `${AS_OF} (historical freeze). No data loaded.`],
    ["Source confidence", "Not assessed"],
    ["Data provider", "None loaded"],
    ["Observation period", "Not loaded"],
    ["Licensing", "Not cleared"],
    ["Method version", "Not pinned"],
    ["Owner engine commit", "Not pinned"],
    ["Independent oracle", `Not passed (${d.oracle})`],
    ["In / out of sample", "Not run"],
  ] as [string, string][]
).map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl>`;
const gates = () => `<details class="acc gates"><summary><span>Release gates</span><small>0 of ${GATES.length} passed</small></summary><ul class="gatelist">${GATES.map((g) => `<li><span aria-hidden="true">○</span> ${e(g)}: <b>pending</b></li>`).join("")}</ul></details>`;
const registry = (d: Demo) => `<details class="acc"><summary><span>Planned panels (${d.panels.length})</span><small>None built or verified</small></summary>${list(d.panels)}</details>`;
const labLink = (d: Demo) => d.lab ? `<p class="muted">A separate hypothetical <a href="#${d.lab}">educational lab</a> exists below. It is a textbook illustration, not this demonstration.</p>` : "";
const head = (d: Demo) => `<header class="dhead"><p class="eyebrow">Demo ${d.n} · ${e(d.lens)}</p><h3>${e(d.title)}</h3><p>${e(d.summary)}</p></header>`;

const DIAG_NOTE = "Self-correlation is 1.00 by definition. Every other cell is withheld: no verified aligned return series is loaded, so the colours here show the palette only, not data.";
export function heatmap() {
  const rows = COMPANIES.map((r) => `<tr><th scope="row">${e(r.name)}</th>${COMPANIES.map((c) => r.ticker === c.ticker
    ? `<td class="h-diag" aria-label="${e(r.name)} with itself, 1.00">1.00</td>`
    : `<td class="h-na" aria-label="${e(r.name)} with ${e(c.name)}: withheld">—</td>`).join("")}</tr>`).join("");
  return `<table class="heat" id="heatmap"><caption>Five by five Pearson return-correlation matrix (withheld)</caption><thead><tr><th scope="col"><span class="sr">Company</span></th>${COMPANIES.map((c) => `<th scope="col">${e(c.name)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
<div class="legendbar" aria-hidden="true"><span>−1.00</span><i></i><span>0</span><i class="pos"></i><span>+1.00</span></div>
<p class="muted">${DIAG_NOTE} Negative values will use muted rose, zero pale rose, positive deep red. Every populated cell will carry its number.</p>`;
}
const weights = () => `<fieldset class="weights"><legend>Portfolio weights (%)</legend>${COMPANIES.map((c) => `<label class="field" for="w-${c.ticker}"><span>${e(c.name)}</span><input id="w-${c.ticker}" name="w-${c.ticker}" type="number" min="0" max="100" step="0.5" value="20" inputmode="decimal"></label>`).join("")}<p id="wsum" class="status ok" role="status">Weights sum to 100%.</p></fieldset>`;

const optionForm = () => `<form id="opt" class="optform" novalidate autocomplete="off"><fieldset><legend>Hypothetical inputs (not market data)</legend>
<div class="radios"><label><input type="radio" name="right" value="call" checked> Call</label><label><input type="radio" name="right" value="put"> Put</label></div>
${[["spot", "Spot S (₹)", 100, "0.01"], ["strike", "Strike K (₹)", 100, "0.01"], ["days", "Days to expiry", 30, "1"], ["vol", "Volatility σ (% a year)", 25, "0.1"], ["rate", "Risk-free rate r (% a year)", 6, "0.1"], ["yield", "Dividend yield q (% a year)", 0, "0.1"], ["premium", "Observed premium (₹, optional)", "", "0.01"]]
    .map(([id, l, v, s]) => `<label class="field" for="o-${id}"><span>${l}</span><input id="o-${id}" name="${id}" type="number" step="${s}" value="${v}" inputmode="decimal"></label>`).join("")}
</fieldset></form>`;

function demoBody(d: Demo, t: Ticker) {
  switch (d.id) {
    case "valuation":
      return `<div class="two"><div><h4>Method router</h4><div data-part="router">${methodRouter(t)}</div>
<form id="verdict" class="inline"><label class="field" for="vm"><span>Try a method for the selected company</span><select id="vm" name="vm">${METHODS.map((m) => `<option value="${m}">${e(methodLabel(m))}</option>`).join("")}</select></label><p id="vout" class="status" role="status"></p></form></div>
<div><h4>Outputs</h4><dl class="ledger"><div><dt>Enterprise value</dt><dd>Withheld</dd></div><div><dt>Equity value</dt><dd>Withheld</dd></div><div><dt>Cost of capital</dt><dd>Withheld</dd></div><div><dt>Sensitivity grid</dt><dd>Withheld</dd></div></dl>
<p class="muted">Assumption inputs (revenue, margin, beta, equity risk premium, terminal growth) unlock only when a verified engine and audited filings exist.</p></div></div>`;
    case "technical":
      return `<div class="two"><div><h4>Indicator registry</h4>${scroll("Indicator registry", `<table class="grid"><caption>Planned families. Each needs a pinned function, warm-up rule and parity test.</caption><thead><tr><th scope="col">Family</th><th scope="col">Indicators</th></tr></thead><tbody>${INDICATORS.map(([a, b]) => `<tr><th scope="row">${e(a)}</th><td>${e(b)}</td></tr>`).join("")}</tbody></table>`)}</div>
<div><h4>Strategy families (exactly three)</h4><div role="tablist" aria-label="Strategies" class="mini-tabs" id="strat-tabs">${STRATEGIES.map(([s], i) => `<button type="button" role="tab" id="st-${i}" aria-selected="${i === 0}" aria-controls="sp-${i}" tabindex="${i ? -1 : 0}">${e(s.replace("_", " "))}</button>`).join("")}</div>${STRATEGIES.map(([, txt], i) => `<div role="tabpanel" id="sp-${i}" aria-labelledby="st-${i}"${i ? " hidden" : ""}><p>${e(txt)}</p></div>`).join("")}
<p class="muted">A signal state is a historical research output, not a recommendation.</p></div></div>
<figure class="chart-empty" role="img" aria-label="Price chart area. No price series is loaded."><svg viewBox="0 0 680 200"><rect x="1" y="1" width="678" height="198" class="frame"/><text x="340" y="96" text-anchor="middle">No price series loaded</text><text x="340" y="120" text-anchor="middle" class="sub">A synthetic series is never shown as three years of real prices.</text></svg></figure>`;
    case "options":
      return `<div class="two"><div>${optionForm()}</div><div><h4>Contract finder</h4><p class="status no">UNAVAILABLE for ${AS_OF}: no licensed exchange derivatives archive is loaded, so no listed contract, lot size or observed premium can be shown for <span data-part="name">${e(co(t).name)}</span>.</p>
<p class="muted">The calculator is a <b>THEORETICAL ONLY</b> European Black-Scholes-Merton model with continuous dividend yield. It does not use the selected company's price or any market quote.</p><p id="opt-sum" class="sr" role="status"></p><div id="opt-out"></div></div></div>`;
    case "peers":
      return `<div data-part="peers">${peers(t)}</div>`;
    case "correlation":
      return `<div class="two"><div>${heatmap()}</div><div>${weights()}<h4>Risk breakdown</h4><dl class="ledger"><div><dt>Portfolio volatility</dt><dd>Withheld</dd></div><div><dt>Contribution by company</dt><dd>Withheld</dd></div><div><dt>Rolling correlation</dt><dd>Withheld</dd></div><div><dt>Drawdown</dt><dd>Withheld</dd></div></dl></div></div>`;
  }
  return "";
}

export function demos(selected: Ticker = "HDFCBANK") {
  const tabs = `<div role="tablist" aria-label="Demonstrations" class="tabs" id="demo-tabs">${DEMOS.map((d, i) => `<button type="button" role="tab" id="tab-${d.id}" aria-selected="${i === 0}" aria-controls="panel-${d.id}" tabindex="${i ? -1 : 0}"><b>${d.n}</b>${e(d.title)}</button>`).join("")}</div>`;
  const panels = DEMOS.map((d, i) => `<section role="tabpanel" class="panel" id="panel-${d.id}" aria-labelledby="tab-${d.id}"${i ? " hidden" : ""} tabindex="0">${head(d)}${status()}${demoBody(d, selected)}${ledger(d)}${registry(d)}${gates()}${labLink(d)}</section>`).join("");
  return `<div class="demobar"><div class="mode"><b>HISTORICAL FREEZE TARGET</b><span>${e(AS_OF_LABEL)}. No data loaded. No live updates.</span></div>${companySelect(selected)}</div>${tabs}${panels}`;
}

export const labs = () => `<nav class="lab-links" aria-label="Educational labs">${["financial:01 Financial", "technical:02 Technical", "derivatives:03 Derivatives", "portfolio:04 Portfolio"].map((s) => { const [id, l] = s.split(":"); return `<a href="#lab-${id}">${l}</a>`; }).join("")}</nav>
${[
  ["financial", "Lab 01 · Valuation", "Value lives in the assumptions.", "Hypothetical diversified company, five forecast years, ₹ crore. Enterprise and equity value, never a stock target."],
  ["technical", "Lab 02 · Technical rules", "Rules, signals and their cost.", "SYNTHETIC EDUCATIONAL SERIES. Hypothetical asset, 180 sessions. No historical share prices."],
  ["derivatives", "Lab 03 · Expiry payoff", "Define the payoff. See the risk.", "Hypothetical underlying, P&L at expiry. Premiums are assumptions, not market quotes."],
  ["portfolio", "Lab 04 · Two-asset risk", "Allocation changes the risk.", "Two hypothetical assets, long-only, weights total 100%. No return forecasts."],
].map(([id, k, h, p]) => `<section id="lab-${id}" class="lab" tabindex="-1" aria-labelledby="${id}-title"><header><p class="eyebrow">${k}</p><h3 id="${id}-title">${h}</h3><p class="muted">${p}</p></header><div id="${id}-workspace"></div><noscript><p>Enable JavaScript to use this lab.</p></noscript></section>`).join("")}`;

export const placeholders = (releases: ReleaseRecord[] = []): Record<string, string> => ({
  credentials: credentials(),
  "astra-areas": astraAreas(),
  cases: cases(releases),
  demos: demos(),
  labs: labs(),
  simulations: simulations(),
});
