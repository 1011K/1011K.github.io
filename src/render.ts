// Pure string rendering shared by the Vite HTML transform (static, works without JavaScript)
// and the browser (company-dependent refresh). No DOM access.
import {
  ACADEMIC_RECORD, ASTRA_AREAS, ASTRA_WORKSTREAMS, AS_OF, AS_OF_LABEL, CASE_DATA_STATUS, CASE_DETAIL, CASE_STUDY, COMPANIES, CREDENTIALS, DEMOS,
  ENGINE_REASON, EXPERIENCE, FACTS, GATES, INTERESTS, LEADERSHIP, SIMULATIONS, SKILLS, STUDY,
  type Company, type Demo, type Role, type Ticker,
} from "./content.ts";
import { escapeHTML as e, type ReleaseRecord } from "./publication.ts";

const list = (items: string[]) => `<ul>${items.map((i) => `<li>${e(i)}</li>`).join("")}</ul>`;

export const facts = () =>
  `<dl class="facts">${FACTS.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl>`;

// The BBA is shown in the academic record; the accordions cover professional qualifications.
export const academic = () => {
  const bba = CREDENTIALS.find((c) => c.id === "bba")!;
  return `<div class="tscroll" role="region" aria-label="Academic record" tabindex="0"><table class="ledger-table"><caption class="sr">Academic record</caption><thead><tr><th scope="col">Qualification</th><th scope="col">Result or status</th></tr></thead><tbody>${ACADEMIC_RECORD.map(
    (r, i) => `<tr><th scope="row">${e(r.level)}<small>${e(r.detail)}</small>${i === 0 ? `<small>${e(bba.studied)}</small>` : ""}</th><td>${e(r.result)}</td></tr>`,
  ).join("")}</tbody></table></div>`;
};

export const credentials = () =>
  CREDENTIALS.filter((c) => c.id !== "bba").map(
    (c) => `<details class="acc" id="cred-${c.id}"><summary><span>${e(c.title)}</span><small>${e(c.status)}</small></summary><dl>
<div><dt>What I studied</dt><dd>${e(c.studied)}</dd></div>
<div><dt>Practical application</dt><dd>${e(c.applied)}</dd></div>
<div><dt>Evidence</dt><dd><a href="/media/krishiv-ramchandani-cv.pdf" download>Listed on standard CV (PDF)</a></dd></div></dl>${c.caution ? `<p class="caution">${e(c.caution)}</p>` : ""}</details>`,
  ).join("");

export const astraAreas = () =>
  ASTRA_AREAS.map(
    (a, i) => `<details class="area" id="area-${a.id}"><summary><b>${String(i + 1).padStart(2, "0")}</b>${e(a.name)}</summary><p>${e(a.covers)}</p><p class="muted"><strong>Why it helps:</strong> ${e(a.useful)}</p></details>`,
  ).join("");

const role = (r: Role) =>
  `<li class="role"><span class="date">${e(r.dates)}</span><div><h4>${e(r.role)}</h4><p class="org">${e(r.org)}</p>${list(r.points)}</div></li>`;
export const experience = () =>
  `<div class="timeline"><h3 class="h4">Employment</h3><ol>${EXPERIENCE.map(role).join("")}</ol><h3 class="h4">Leadership</h3><ol>${LEADERSHIP.map(role).join("")}</ol><h3 class="h4">Virtual job simulations</h3><ol><li class="role"><span class="date">2025 – 2026</span><div><h4>Eleven Forage simulations</h4><p class="org">Not employment or internships</p><p class="muted">Listed separately in <a href="#simulations">Virtual job simulations</a>.</p></div></li></ol></div>`;

export const skills = () =>
  `<div class="skills"><h3 class="h4">Skills</h3>${SKILLS.map(
    (g) => `<div class="skill-group"><h4>${e(g.group)}</h4><ul class="tags">${g.items.map((i) => `<li>${e(i)}</li>`).join("")}</ul></div>`,
  ).join("")}<div class="skill-group"><h4>Career interests, in order</h4><ol class="ranked">${INTERESTS.map((i) => `<li>${e(i)}</li>`).join("")}</ol></div></div>`;

export const astraWorkstreams = () => `<p class="muted">Workstreams, 2026 to present:</p>${list(ASTRA_WORKSTREAMS)}`;

export const study = () =>
  `<article class="project" id="project-independent-study"><header class="phead"><span class="pno">03</span><div><p class="eyebrow">Independent project · ${e(STUDY.period)} · Separate from ASTRA</p><h3>${e(STUDY.title)}</h3></div></header>
<p class="plede">${e(STUDY.summary)}</p>
<ul class="tags">${STUDY.methods.map((m) => `<li>${e(m)}</li>`).join("")}</ul>
<p class="muted">${e(STUDY.note)}</p>
<div class="plinks">${STUDY.links.map((l) => `<a class="btn" target="_blank" rel="noopener noreferrer" href="${e(l.href)}">${e(l.label)} ↗</a>`).join("")}</div></article>`;

export const simulations = () =>
  SIMULATIONS.map(
    (s, i) => `<details class="acc sim" id="sim-${i + 1}"><summary><span>${e(s.title)}</span><small>${String(i + 1).padStart(2, "0")} · ${e(s.org)} · Virtual Job Simulation, Forage</small></summary><dl>
<div><dt>Focus</dt><dd>${e(s.title.replace(/ Job Simulation$/, ""))}</dd></div>
<div><dt>What I learned</dt><dd>${e(s.learned)}</dd></div>
<div><dt>Connection to my work</dt><dd>${e(s.connection)}</dd></div></dl></details>`,
  ).join("");

const matches = (r: ReleaseRecord, c: Company) => r.ticker === c.ticker;
export function cases(releases: ReleaseRecord[] = []) {
  return COMPANIES.map((c, i) => {
    const files = releases.filter((r) => matches(r, c)).flatMap((r) => r.assets);
    const pdf = files.find((a) => a.path.endsWith(".pdf")), xlsx = files.find((a) => a.path.endsWith(".xlsx"));
    const dl = (a: { path: string } | undefined, label: string) =>
      a ? `<a class="btn" href="/${e(a.path)}" download>${label}</a>` : `<span class="state">${label}: <b>WITHHELD</b></span>`;
    const d = CASE_DETAIL[c.ticker], s = CASE_STUDY[c.ticker];
    const ul = (xs: string[]) => `<ul>${xs.map((x) => `<li>${e(x)}</li>`).join("")}</ul>`;
    return `<article class="case" id="case-${c.ticker}"><header><span class="idx">${String(i + 1).padStart(2, "0")}</span><div><h3>${e(c.name)}</h3><p class="muted">${e(c.ticker)} · ${e(c.archetype)}</p></div><span class="chip">Under verification</span></header>
<p class="q">${e(c.question)}</p>
<div class="hyp"><div><b>Open question A</b><p>${e(d.hypotheses[0])}</p></div><div><b>Open question B</b><p>${e(d.hypotheses[1])}</p></div></div>
<div class="case-cols"><div><h4>Three key risks</h4><ol class="risks">${d.risks.map((r) => `<li>${e(r)}</li>`).join("")}</ol></div>
<div><h4>Data and filings</h4><dl class="dstatus">${CASE_DATA_STATUS.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl></div></div>
<details class="more"><summary>Method, economics and verification focus</summary><dl>
<div><dt>Valuation method</dt><dd>${e(c.methodText)}</dd></div>
<div><dt>Method limits</dt><dd>${e(c.prohibitedText)}</dd></div>
<div><dt>Economic engine</dt><dd>${e(c.engine)}</dd></div>
<div><dt>Key uncertainty</dt><dd>${e(c.uncertainty)}</dd></div>
<div><dt>What would change the thesis</dt><dd>${e(c.thesisChange)}</dd></div>
<div><dt>Verification focus</dt><dd>${e(c.focus)}</dd></div>
<div><dt>Provenance</dt><dd>Prepared by Krishiv Ramchandani with ASTRA-assisted modelling. Not independently audited. No investment recommendation or target is published.</dd></div></dl></details>
<details class="more study"><summary>In-depth case study: method, checks and verification log</summary><div class="study-body"><p class="note"><strong>Status:</strong> the full report and workbook are in preparation. Early drafts did not pass review, so none is published. No valuation, fair value, rating or price target for these five companies is published. The calculators and labs below run on hypothetical inputs.</p><h4>How the model is built</h4>${ul(s.model)}<h4>What the checks test</h4>${ul(s.checks)}<h4>Verification log: open items</h4>${ul(s.open)}</div></details>
<footer>${dl(pdf, "Report (PDF)")} ${dl(xlsx, "Workbook (XLSX)")}<a class="text-link" href="#demos" data-pick="${c.ticker}">Open in demonstrations →</a></footer></article>`;
  }).join("");
}

export const companySelect = (selected: Ticker = "HDFCBANK") =>
  `<label class="field" for="company"><span>Company</span><select id="company" name="company">${COMPANIES.map((c) => `<option value="${c.ticker}"${c.ticker === selected ? " selected" : ""}>${e(c.name)} (${c.ticker})</option>`).join("")}</select></label>`;

// --- Demonstrations ---
const status = () => `<div class="banner" role="note"><b>RELEASE STATUS: WITHHELD</b><span>NOT YET ENGINE VERIFIED</span><p>${e(ENGINE_REASON)} All five workstations below are working calculators on the inputs named in each one's mode line; open "Provenance, status and release gates" under any of them for the full ledger.</p></div>`;
const chip = (d: Demo) => `<p class="modechip"><b>Workstation mode:</b> ${e(d.mode)}</p>`;
const ledger = (d: Demo) => `<dl class="ledger">${(
  [
    ["Authoritative source", d.authority],
    ["Workstation mode", d.mode],
    ["Target as-of for real data", `${AS_OF} (historical freeze). No data loaded.`],
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
const gates = () => `<h4 class="prov-h">Release gates (0 of ${GATES.length} passed)</h4><ul class="gatelist">${GATES.map((g) => `<li><span aria-hidden="true">○</span> ${e(g)}: <b>pending</b></li>`).join("")}</ul>`;
const registry = (d: Demo) => `<h4 class="prov-h">Planned panels for the engine-backed version (${d.panels.length})</h4>${list(d.panels)}`;
const provenance = (d: Demo) => `<details class="acc prov"><summary><span>Provenance, status and release gates</span><small>Source, mode, oracle and rights for this workstation</small></summary><div class="prov-body">${ledger(d)}${gates()}${registry(d)}${labLink(d)}</div></details>`;
const labLink = (d: Demo) => d.lab ? `<p class="muted">A separate hypothetical <a href="#${d.lab}">educational lab</a> exists below. It is a textbook illustration, not this demonstration.</p>` : "";
const head = (d: Demo) => `<header class="dhead"><p class="eyebrow">Demo ${d.n} · ${e(d.lens)}</p><h3>${e(d.title)}</h3><p>${e(d.summary)}</p></header>`;

const demoBody = (d: Demo) => `<div class="workstation" data-demo="${d.id}"><noscript><p class="status warn">This workstation needs JavaScript.</p></noscript></div>`;

export function demos(selected: Ticker = "HDFCBANK") {
  const tabs = `<div role="tablist" aria-label="Demonstrations" class="tabs" id="demo-tabs">${DEMOS.map((d, i) => `<button type="button" role="tab" id="tab-${d.id}" aria-selected="${i === 0}" aria-controls="panel-${d.id}" tabindex="${i ? -1 : 0}"><b>${d.n}</b>${e(d.title)}</button>`).join("")}</div>`;
  const panels = DEMOS.map((d, i) => `<section role="tabpanel" class="panel" id="panel-${d.id}" aria-labelledby="tab-${d.id}"${i ? " hidden" : ""} tabindex="0">${head(d)}${chip(d)}${demoBody(d)}${provenance(d)}</section>`).join("");
  return `${status()}<div class="demobar"><div class="mode"><b>HISTORICAL FREEZE TARGET</b><span>${e(AS_OF_LABEL)}. No data loaded. No live updates.</span></div>${companySelect(selected)}</div>${tabs}${panels}`;
}

export const labs = () => `<nav class="lab-links" aria-label="Educational labs">${["financial:01 Financial", "technical:02 Technical", "derivatives:03 Derivatives", "portfolio:04 Portfolio"].map((s) => { const [id, l] = s.split(":"); return `<a href="#lab-${id}">${l}</a>`; }).join("")}</nav>
${[
  ["financial", "Lab 01 · Valuation", "Value lives in the assumptions.", "Hypothetical diversified company, five forecast years, ₹ crore. Enterprise and equity value, never a stock target."],
  ["technical", "Lab 02 · Technical rules", "Rules, signals and their cost.", "SYNTHETIC EDUCATIONAL SERIES. Hypothetical asset, 180 sessions. No historical share prices."],
  ["derivatives", "Lab 03 · Expiry payoff", "Define the payoff. See the risk.", "Hypothetical underlying, P&L at expiry. Premiums are assumptions, not market quotes."],
  ["portfolio", "Lab 04 · Two-asset risk", "Allocation changes the risk.", "Two hypothetical assets, long-only, weights total 100%. No return forecasts."],
].map(([id, k, h, p]) => `<section id="lab-${id}" class="lab" tabindex="-1" aria-labelledby="${id}-title"><header><p class="eyebrow">${k}</p><h3 id="${id}-title">${h}</h3><p class="muted">${p}</p></header><div id="${id}-workspace"></div><noscript><p>Enable JavaScript to use this lab.</p></noscript></section>`).join("")}`;

export const placeholders = (releases: ReleaseRecord[] = []): Record<string, string> => ({
  facts: facts(),
  academic: academic(),
  credentials: credentials(),
  experience: experience(),
  skills: skills(),
  study: study(),
  "astra-workstreams": astraWorkstreams(),
  "astra-areas": astraAreas(),
  cases: cases(releases),
  demos: demos(),
  labs: labs(),
  simulations: simulations(),
});
