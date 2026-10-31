import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import './style.css';
import { approved, education, experience, facts, gated, person, projects, qualifications, simulations } from './content';
import { demoHTML, wireDemo } from './demo';

const sections = [
  ['summary', 'Summary'], ['education', 'Education'], ['qualifications', 'Qualifications'], ['experience', 'Experience'],
  ['research', 'Research'], ['projects', 'Projects'], ['illustration', 'Illustration'], ['more', 'Additional'], ['contact', 'Contact'],
] as const;
const num = (id: string) => String(sections.findIndex((s) => s[0] === id)).padStart(2, '0');
const row = (id: string, title: string, inner: string) =>
  `<section class="row" id="${id}" aria-labelledby="${id}-h"><header class="label"><span class="num">§ ${num(id)}</span><h2 id="${id}-h">${title}</h2></header><div class="body">${inner}</div></section>`;
const li = (xs: string[]) => `<ul class="plain">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`;

const resume = approved(gated.resume)[0];
const reports = approved(gated.reports);
const video = approved(gated.video)[0];
const shots = approved(gated.screenshots);

const researchBody = reports.length
  ? reports.map((r) => `<div class="entry"><h3>${r.title}</h3><p class="meta"><a href="${r.asset_path}">Full report (PDF)</a></p></div>`).join('')
  : `<div class="notice"><p style="margin:0">No full reports are published yet. Each report will appear here, with its sector, as-of date, authorship and a PDF, only after it has been reviewed for release.</p></div>
     <p class="fine">Current work: an independent Reliance Industries valuation (see Projects). Research here is educational and is not investment advice.</p>`;

const projectBody =
  projects.map((p) => `<article class="entry"><div class="entry-head"><h3>${p.name} <span class="meta">· ${p.kind}</span></h3><span class="when">${p.when}</span></div>
    <p style="max-width:66ch">${p.body}</p><ul class="tags">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul></article>`).join('') +
  (video ? `<div class="entry"><h3>${video.title}</h3><p class="meta"><a href="${video.asset_path}" rel="noopener">Watch the original post</a></p></div>` : '') +
  (shots.length ? `<div class="entry"><h3>Interface captures</h3>${shots.map((s) => `<figure><img src="${s.asset_path}" alt="${s.title}" loading="lazy"><figcaption class="fine">${s.title} · prototype view</figcaption></figure>`).join('')}</div>` : '');

const app = document.getElementById('app')!;
app.innerHTML = `<div class="shell">
  <aside class="rail">
    <div class="rail-top">
      <div><a class="mark" href="#top">${person.name}</a><p class="rail-sub">Finance research<br>Mumbai · 2027 graduate</p></div>
      <button class="theme" id="theme" type="button" aria-label="Switch colour theme"><i aria-hidden="true"></i><span id="theme-t">Theme</span></button>
    </div>
    <nav aria-label="Sections"><ol class="toc" style="list-style:none">${sections.map(([id, t]) => `<li><a href="#${id}"><b>${num(id)}</b>${t}</a></li>`).join('')}</ol></nav>
  </aside>
  <main id="main"><span id="top"></span>
    <section class="hero" id="summary" aria-labelledby="name">
      <p class="eyebrow">Portfolio · Investment research · ${new Date().getFullYear()}</p>
      <h1 id="name">${person.name}</h1>
      <p class="tagline">${person.tagline}</p>
      <p class="lede">${person.lede}</p>
      <div class="cta">
        <a class="btn solid" href="#research">Explore research</a><a class="btn" href="#projects">View work</a>
        ${resume ? `<a class="btn" href="${resume.asset_path}" download>Résumé</a>` : ''}<a class="btn" href="#contact">Contact</a>
      </div>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </section>
    ${row('education', 'Education', `<h3>${education.school}</h3><p class="meta">${education.degree} · ${education.when}</p>
      <div class="gpas">${education.gpas.map(([s, g]) => `<div><span>${s}</span><strong>${g}</strong></div>`).join('')}</div><p class="fine">${education.note}</p>`)}
    ${row('qualifications', 'Qualifications', `<dl class="deflist">${qualifications.map((q) => `<div><dt>${q.name}</dt><dd>${q.detail}</dd></div>`).join('')}</dl>`)}
    ${row('experience', 'Experience', experience.map((e) => `<article class="entry"><div class="entry-head"><h3>${e.role}</h3><span class="when">${e.when}</span></div><p class="meta">${e.org}</p>${li(e.bullets)}</article>`).join(''))}
    ${row('research', 'Research', researchBody)}
    ${row('projects', 'Projects', projectBody)}
    ${row('illustration', 'Illustration', `<h3>Two-asset diversification</h3><p class="meta" style="max-width:62ch">An independent teaching example of how correlation lowers portfolio volatility. Move the sliders to see the effect.</p><div style="margin-top:1.2rem">${demoHTML()}</div>`)}
    ${row('more', 'Additional', `<dl class="deflist">${simulations.skills.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${li([simulations.training, simulations.forage, simulations.leadership])}`)}
    ${row('contact', 'Contact', `<dl class="deflist">
      <div><dt>Email</dt><dd><a href="mailto:${person.email}">${person.email}</a></dd></div>
      <div><dt>LinkedIn</dt><dd><a href="${person.linkedin}" rel="noopener">linkedin.com/in/krishiv-ramchandani</a></dd></div>
      <div><dt>GitHub</dt><dd><a href="${person.github}" rel="noopener">github.com/1011K</a></dd></div>
      ${resume ? '' : '<div><dt>Résumé</dt><dd>Available on request.</dd></div>'}</dl>
      <p class="fine" style="margin-top:1rem">Open to internships and analyst roles in investment research, valuation and corporate finance.</p>`)}
    <footer>© ${new Date().getFullYear()} Krishiv Ramchandani. Not investment advice. ASTRA is a separate project and is described here only in outline.</footer>
  </main>
</div>`;

// theme toggle
const root = document.documentElement;
const tbtn = document.getElementById('theme')!;
const paint = () => {
  const d = root.dataset.theme === 'dark';
  document.getElementById('theme-t')!.textContent = d ? 'Light mode' : 'Dark mode';
  tbtn.setAttribute('aria-pressed', String(d));
};
tbtn.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch { /* storage blocked: toggle still works for this visit */ }
  paint();
});
paint();

wireDemo();

// highlight current section in the index
const links = new Map<string, HTMLAnchorElement>(sections.map(([id]) => [id, document.querySelector<HTMLAnchorElement>(`.toc a[href="#${id}"]`)!]));
const io = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { links.forEach((a) => a.removeAttribute('aria-current')); links.get(e.target.id)?.setAttribute('aria-current', 'true'); }
}, { rootMargin: '-20% 0px -70% 0px' });
sections.forEach(([id]) => io.observe(document.getElementById(id)!));
