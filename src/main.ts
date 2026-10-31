import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./style.css";
import {
  education,
  experience,
  person,
  profile,
  qualifications,
  researchCase,
  simulations,
} from "./content";
import { assignments, filterResearch, released } from "./research";
import { escapeHTML as e, isApprovedMedia } from "./publication";
import manifest from "../publication-manifest.json";
import { labHTML, wireLab } from "./lab";

const page = document.body.dataset.page || "profile";
const base = page === "profile" ? "./" : "../";
const href = (key: string) => base + (key === "profile" ? "" : key + "/");
const media = (manifest.media as unknown[]).filter(isApprovedMedia);
const cv = media.find(a=>a.kind === 'CV');
const cvLink = () => cv ? `<a class="button" href="${base}${e(cv.path)}" download>Download professional CV</a>` : '';
const designGallery = () => `<section class="ruled" id="design-references"><h2>Design references.</h2><p class="muted">Three supplied visual studies behind this portfolio. Conceptual designs, not private ASTRA screenshots or published research results.</p><div class="cards design-references">${media.filter(a=>a.kind==='DESIGN_REFERENCE').map(a=>`<figure class="panel"><a href="${base}${e(a.path)}"><img src="${base}${e(a.path)}" alt="${e(a.alt)}" loading="lazy" width="1600" height="1000"></a><figcaption>${e(a.title)} · Conceptual design</figcaption></figure>`).join('')}</div></section>`;
const nav = [
  ["profile", "Profile"],
  ["research", "Research"],
  ["lab", "Interactive Lab"],
  ["astra", "ASTRA"],
  ["about", "About & CV"],
  ["contact", "Contact"],
];
const link = (key: string, label: string, solid = false) =>
  `<a class="button ${solid ? "solid" : ""}" href="${href(key)}">${label}</a>`;
const intro = (eyebrow: string, title: string, description: string) =>
  `<header class="page-intro"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></header>`;
const qualRail = () =>
  `<aside class="qualification-rail" aria-label="Education and qualifications"><p class="eyebrow">Education & qualifications</p><p class="eyebrow small-label">Education</p><h2>BBA, final year</h2><p class="muted">Jai Hind College, Mumbai · Expected 2027</p><hr><p class="eyebrow small-label">Qualifications</p><p>CFA Level I passed<br>CFA Level II candidate · May 2027<br>NISM Research Analyst · passed<br>NISM Equity Derivatives · passed<br>NISM Merchant Banking · passed</p><p class="fine">Owner-provided professional record.</p></aside>`;
const card = (r: (typeof assignments)[number]) =>
  `<article class="research-card"><div class="card-heading"><span class="number">${String(r.id).padStart(2, "0")}</span><h3>${e(r.company)}</h3></div><p class="eyebrow sector">${e(r.sector)}</p><p>${e(r.research_focus)}</p><div class="status">PLANNED · NO PUBLIC FILE</div></article>`;
const featured = () =>
  [4, 11, 1].map((id) => card(assignments.find((r) => r.id === id)!)).join("");
const sectionHead = (title: string, route?: string, label?: string) =>
  `<div class="section-heading"><h2 class="eyebrow">${title}</h2>${route ? `<a href="${href(route)}">${label} <span aria-hidden="true">↗</span></a>` : ""}</div>`;
const experienceHTML = () =>
  experience
    .map(
      (x) =>
        `<article class="experience-entry"><div><p class="eyebrow">${e(x.when)}</p><h3>${e(x.role)}</h3><p>${e(x.org)}</p></div><ul>${x.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul></article>`,
    )
    .join("");
const home =
  () => `<section class="hero"><div><p class="eyebrow">01 / Professional portfolio</p><h1>Krishiv<br>Ramchandani</h1><p class="tagline">${e(person.tagline)}</p><p class="identity">Final-year BBA student · Jai Hind College, Mumbai<br>CFA Level I passed · CFA Level II candidate (May 2027)</p><p class="muted hero-context">Equity research, corporate finance, valuation, derivatives and financial technology.<br>An evidence-led academic and professional portfolio.</p><div class="actions">${link("research", "Explore research", true)}${link("astra", "Project: ASTRA")}${cvLink()}</div></div>${qualRail()}</section>
<section class="ruled">${sectionHead("Selected research / proposed subjects", "research", "Research register")}<div class="cards">${featured()}</div></section>
<section class="ruled">${sectionHead("Approach to research")}<div class="editorial"><h2>Understand the business.<br>Inspect the assumptions.</h2><div><p>${e(profile.summary[0])}</p><p class="muted">${e(profile.summary[1])}</p></div></div><div class="cards focus-cards">${profile.focuses.map((f) => `<article><h3>${e(f.heading)}</h3><p>${e(f.description)}</p></article>`).join("")}</div></section>
<section class="ruled">${sectionHead("Experience", "about", "Professional record")}${experienceHTML()}</section>
<section class="ruled two-up"><div><p class="eyebrow">Independent educational lab</p><h2>Make an assumption.<br>See what changes.</h2><p class="muted">Explore valuation sensitivity, diversification and textbook options. Local, hypothetical inputs. Inspectable calculations.</p>${link("lab", "Open interactive lab")}</div><div class="project-teaser"><p class="eyebrow">Independent project / 2026–present</p><h2>ASTRA</h2><p class="muted">An evolving project bringing financial, technical and market research disciplines together.</p>${link("astra", "Explore the project")}</div></section><section class="ruled">${sectionHead("Let’s connect", "contact", "Contact")}<p>Open to internships in investment research, valuation and corporate finance.</p></section>`;
const research =
  () => `${intro("Research / Independent company studies", "Questions before conclusions.", "A growing research practice across business models, financial statements and valuation methods.")}<section class="panel case-study"><p class="eyebrow">Separate cross-sector study / 2026</p><h2>${e(researchCase.title)}</h2><p class="question">${e(researchCase.question)}</p><dl class="record"><div><dt>Method</dt><dd>${e(researchCase.approach)}</dd></div><div><dt>My contribution</dt><dd>${e(researchCase.contribution)}</dd></div><div><dt>Publication</dt><dd>${e(researchCase.status)}</dd></div><div><dt>Limitations</dt><dd>${e(researchCase.limitations)}</dd></div></dl><p class="fine">Separate from the 17 planned assignments. No valuation figure or downloadable report is released.</p></section>
<section class="ruled">${sectionHead("Planned coverage / 17 assignments")}<p class="muted catalogue-intro">Research agenda, not completed reports. Each assignment requires source reconciliation, an appropriate model and individual publication approval.</p><form class="filters" role="search"><label for="research-search">Search company, sector or method<input id="research-search" type="search" placeholder="e.g. TCS, banking, FCFF" autocomplete="off"></label><label for="sector-filter">Sector<select id="sector-filter"><option value="All">All sectors</option>${assignments.map((r) => `<option>${e(r.sector)}</option>`).join("")}</select></label></form><p id="research-count" class="fine" aria-live="polite"></p><div class="cards catalogue" id="research-results"></div></section>
<section class="ruled"><h2>Publication follows evidence.</h2><div class="cards focus-cards"><article><p class="eyebrow">01 / Reconcile</p><p>Verify primary sources, fiscal periods, units and sector methodology. Preserve missing inputs and unresolved differences.</p></article><article><p class="eyebrow">02 / Review</p><p>Check calculations, assumptions, authorship, limitations and redistribution rights. Disputed work remains withheld.</p></article><article><p class="eyebrow">03 / Release</p><p>Require owner approval of each exact file version, plus privacy, accuracy and compliance review. No automatic publication.</p></article></div><details><summary>Withheld research</summary><p>HUL remains withheld pending numerical reconciliation and publication review. No figures or source document are public here.</p></details>${released.length ? released.map((r) => `<article class="panel"><h3>${e(r.title)}</h3><p>${e(r.synopsis)}</p><p>${e(r.asOf)} · ${e(r.methodology)}</p><p>${e(r.authoredContributions.join("; "))}</p><p>${e(r.limitations.join("; "))}</p>${r.assets.map((a) => `<a href="${base}${e(a.path)}">Download reviewed ${a.path.endsWith(".xlsx") ? "workbook" : "asset"}</a>`).join(" ")}</article>`).join("") : '<p class="fine">No public research downloads approved.</p>'}</section>`;
const domains = [
  [
    "Financial Intelligence",
    "Financial statements, valuation and peers",
    "Work in progress · owner-described",
  ],
  [
    "Technical Intelligence",
    "Trends, indicators and market structure",
    "Work in progress · owner-described",
  ],
  [
    "Mosaic Intelligence",
    "Filings, events and company developments",
    "Scope only · capability verification pending",
  ],
  [
    "Derivatives / Quant",
    "Pricing, Greeks and volatility research",
    "Scope only · capability verification pending",
  ],
  [
    "Portfolio Intelligence",
    "Risk, allocation and attribution studies",
    "Work in progress · owner-described",
  ],
  [
    "Market Scan",
    "Company discovery and screening research",
    "Work in progress · owner-described",
  ],
];
const astra = () =>
  `${intro("03 / Independent flagship project", "ASTRA", "Integrated financial intelligence and market research.")}<p class="astra-intro muted">An evolving independent project connecting distinct research disciplines.<br>Conceptual product scope, not a private interface or production certification.</p><section class="ruled"><h2 class="eyebrow">Core research disciplines / conceptual domain map</h2><div class="cards domain-cards">${domains.map(([name, desc, status], i) => `<article class="panel"><div class="domain-heading"><span class="domain-number">0${i + 1}</span><h3>${name}</h3></div><p>${desc}</p><span class="fine">${status}</span></article>`).join("")}</div></section><section class="ruled secondary-areas"><h2 class="eyebrow">Additional research areas</h2><p>Global Pulse / Morning Brief / Search / Research Outputs</p><p class="fine">Planned public case-study coverage. Individual capability status is not verified here.</p></section><section class="ruled editorial"><div><p class="eyebrow">The research problem</p><h2>Different lenses.<br>One research question.</h2></div><div><p>Financial statements, market context and company developments answer different questions. ASTRA explores how these disciplines can support a more coherent investigation without hiding uncertainty.</p><p>${e(profile.summary[2])}</p><p class="muted">My contribution combines financial research, modelling concepts, source reconciliation and AI-assisted software development.</p></div></section><section class="ruled"><h2>Integrity is part of the work.</h2><div class="cards focus-cards"><article><h3>What exists</h3><p>Owner-described research and software workflows. Public copy explains their scope; it does not certify individual engines or results.</p></article><article><h3>What remains partial</h3><p>Completeness, source consistency and cross-discipline interpretation require ongoing checks. Missing data must remain visible.</p></article><article><h3>What comes next</h3><p>Individually verified capability notes and approved educational exhibits. No private code, data or system captures are released.</p></article></div><p class="fine">The independent lab uses separate textbook calculations. It does not connect to ASTRA.</p></section>`;
const about = () =>
  `${intro("About / Education, experience & learning", "A foundation in finance.", "Formal study, independent research and practical experience.")}<section class="editorial"><h2>Learning through<br>research and practice.</h2><div>${profile.summary.map((p) => `<p>${e(p)}</p>`).join("")}</div></section><section class="ruled">${sectionHead("Education")}<h2>${e(education.school)}</h2><p>${e(education.degree)} · Expected April 2027</p><div class="academic-record">${education.gpas.map(([s, g]) => `<div><span class="eyebrow">${s}</span><strong>${g}</strong><span class="fine"> / 10</span></div>`).join("")}</div><p class="fine">${e(education.note)} Owner-provided academic record.</p></section><section class="ruled">${sectionHead("Qualifications & application of learning")}<dl class="record qualifications">${qualifications.map((q) => `<div><dt>${e(q.name)}</dt><dd>${e(q.detail)}</dd></div>`).join("")}</dl><p>${e(simulations.training)}</p><p class="muted">Application areas: financial statement interpretation, modelling assumptions, derivatives risk and corporate finance. Exam completion alone does not establish professional proficiency.</p><p class="fine">Passing the NISM Research Analyst examination does not constitute SEBI Research Analyst registration. CFA candidacy does not imply charterholder status.</p></section><section class="ruled">${sectionHead("Experience")}${experienceHTML()}</section><section class="ruled two-up"><div><h2>Skills in context.</h2><dl class="record">${simulations.skills.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl></div><div><h2>Additional learning.</h2><p>${e(simulations.forage)}</p><p>${e(simulations.leadership)}</p><p class="fine">Education, qualifications and experience in one concise professional CV.</p>${cvLink()}</div></section>${designGallery()}`;
const contact = () =>
  `${intro("Contact / Professional enquiries", "Start a conversation.", "Investment research, valuation, corporate finance and analytical software.")}<section class="contact-grid"><div><p class="eyebrow">Professional email</p><a class="email-link" href="mailto:${e(person.email)}">${e(person.email)}</a><p class="muted">Open to internships and opportunities to learn through rigorous financial research.</p></div><dl class="record"><div><dt>LinkedIn</dt><dd><a href="${e(person.linkedin)}" rel="noopener noreferrer">Krishiv Ramchandani ↗</a></dd></div><div><dt>GitHub</dt><dd><a href="${e(person.github)}" rel="noopener noreferrer">1011K ↗</a></dd></div><div><dt>CV</dt><dd>${cvLink()}</dd></div></dl></section>`;
const content =
  page === "research"
    ? research()
    : page === "lab"
      ? labHTML()
      : page === "astra"
        ? astra()
        : page === "about"
          ? about()
          : page === "contact"
            ? contact()
            : home();
document.getElementById("app")!.innerHTML =
  `<div class="shell"><header class="masthead"><a class="wordmark" href="${href("profile")}" aria-label="Krishiv Ramchandani, home">KRISHIV R.</a><nav aria-label="Main navigation">${nav.map(([key, label]) => `<a href="${href(key)}" ${page === key ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav><button id="theme" aria-label="Use light theme" aria-pressed="false" type="button">Light</button></header><main id="main" tabindex="-1" class="page-${page}">${content}</main><footer><span>© ${new Date().getFullYear()} Krishiv Ramchandani</span><span>Independent learning & research · Not investment advice.</span><a href="${href("contact")}">Contact ↗</a></footer></div>`;
const root = document.documentElement,
  theme = document.getElementById("theme")!;
const paint = () => {
  const dark = root.dataset.theme !== "light";
  theme.textContent = dark ? "Light" : "Dark";
  theme.setAttribute("aria-label", dark ? "Use light theme" : "Use dark theme");
  theme.setAttribute("aria-pressed", String(!dark));
};
theme.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
  try {
    localStorage.setItem("theme", root.dataset.theme);
  } catch {
    /* Optional persistence. */
  }
  paint();
});
paint();
if (page === "lab") wireLab();
if (page === "research") {
  const query = document.getElementById("research-search") as HTMLInputElement,
    sector = document.getElementById("sector-filter") as HTMLSelectElement;
  const update = () => {
    const rows = filterResearch(query.value, sector.value);
    document.getElementById("research-count")!.textContent =
      `${rows.length} of 17 planned assignments · 0 public files`;
    document.getElementById("research-results")!.innerHTML = rows.length
      ? rows.map(card).join("")
      : "<p>No planned assignments match. Try another company or sector.</p>";
  };
  query.addEventListener("input", update);
  sector.addEventListener("change", update);
  document
    .querySelector(".filters")!
    .addEventListener("submit", (ev) => ev.preventDefault());
  update();
}
