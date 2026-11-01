import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeholders } from '../src/render.ts';
import { COMPANIES, DEMOS } from '../src/content.ts';
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/style.css', 'utf8');
const manifest = JSON.parse(readFileSync('publication-manifest.json', 'utf8'));
// The page as a visitor without JavaScript sees it: index.html with every generated section filled in.
const parts = placeholders();
const page = html.replace(/<!--@([a-z-]+)-->/g, (_, k) => { assert.ok(k in parts, `unknown placeholder ${k}`); return parts[k]; });
// Reliance Industries may appear only inside the separate independent-study project block.
const studyBlock = /<article class="project" id="project-independent-study">[\s\S]*?<\/article>/;
const outsideStudy = (text) => text.replace(studyBlock, '');
const built = existsSync('dist/index.html') ? readFileSync('dist/index.html', 'utf8') : null;
test('identity, navigation and contact work without JavaScript', () => {
  assert.doesNotMatch(html, /Krishiv\.r|PRIVATE REVIEW|private design preview|noindex/i);
  assert.match(html, /<title>Krishiv Ramchandani/);
  assert.match(html, /<h1[^>]*>Krishiv/);
  for (const id of ['about','education','experience','projects','astra','research','demos','simulations','contact']) assert.ok(html.includes(`id="${id}"`), id);
  const nav = [...html.matchAll(/<nav id="main-nav"[\s\S]*?<\/nav>/g)][0][0];
  assert.deepEqual([...nav.matchAll(/>([^<]+)<\/a>/g)].map(m => m[1]), ['About','Demos','Projects','Research','Qualifications','Experience','Simulations','Contact']);
  for (const a of nav.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${a[1]}"`), a[1]);
  for (const href of page.matchAll(/href="#([^"]+)"/g)) assert.ok(page.includes(`id="${href[1]}"`), href[1]);
  assert.ok(html.includes('final-year BBA student at Jai Hind College, Mumbai'));
  assert.ok(html.includes('CFA Level I') && html.includes('Level II candidate'));
  assert.ok(page.includes('CapitaLand (Ascendas Firstspace)'));
  assert.ok(html.includes('mailto:krishivramchandani@gmail.com'));
  assert.ok(html.includes('href="https://in.linkedin.com/in/krishiv-ramchandani-02543835b"') && html.includes('href="https://github.com/1011K"'));
  for (const t of ['Industry Integrated with Tata Consultancy Services', 'Expected graduation: April 2027', 'TALAASH &amp; Jai Hind Conclave', 'Python (basic)', 'SQL (introductory)', 'English', 'Hindi', 'Series XV', 'Series VIII', 'Series IX']) assert.ok(page.includes(t), t);
  assert.match(page, /Private equity and hedge funds[\s\S]*Investment banking[\s\S]*Wealth management/);
  assert.match(html, /href="#main" class="skip"/);
  assert.match(html, /id="theme"/);
});

test('demo-first portfolio and optional deep research remain navigable', () => {
  const ids = ['about','demos','projects','research','education','experience','simulations','contact'];
  for (let i = 1; i < ids.length; i++) {
    assert.ok(html.indexOf(`id="${ids[i - 1]}"`) < html.indexOf(`id="${ids[i]}"`), `unexpected section order: ${ids[i]}`);
  }
  for (const id of ['demos','research','experience','sim']) assert.match(html, new RegExp(`<details class="research-disclosure" id="${id}-details">`), id);
  assert.equal((page.match(/<details class="fold project-fold">/g) ?? []).length, 2, 'ASTRA and the independent study open on demand');
  for (const id of ['about','education','contact']) assert.ok(!new RegExp(`id="${id}"[^>]*>(?:(?!</section>)[\\s\\S])*<details class="research-disclosure"`).test(html), `${id} stays open`);
  assert.match(html, /<details class="fold fold-gallery">/);
  assert.match(html, /<details class="fold fold-labs">/);
  for (const id of ['valuation','technical','options','peers','correlation']) {
    assert.ok(html.includes(`href="#panel-${id}"`), `missing hero shortcut: ${id}`);
    assert.ok(page.includes(`id="panel-${id}"`), `missing linked demo panel: ${id}`);
  }
  assert.match(page, /CapitaLand \(Ascendas Firstspace\)/);
  assert.doesNotMatch(html, /Studying businesses, questioning assumptions|I have researched industrial and logistics real estate investment/);
});
test('no-JS fallback wins the cascade and hides dead controls', () => {
  const ns = html.match(/<noscript><style>([\s\S]*?)<\/style>/)[1];
  for (const decl of ns.split(';')) if (decl.trim() && !decl.includes('{')) assert.match(decl, /!important/, decl);
  for (const sel of ['.tabs', '.menu-toggle', '#opt', '.weights', '[role=tabpanel][hidden]']) assert.ok(ns.includes(sel), sel);
  assert.match(ns, /\[role=tabpanel\]\[hidden\]\{display:block!important\}/);
});
test('portrait is the exact approved colour file and is never filtered', () => {
  const portrait = manifest.media.find(a => a.kind === 'PORTRAIT');
  assert.equal(portrait.sha256, 'ab970268d1029cad2bc71b064bfc88688607b775d01a92b96d69be8835b0452b');
  assert.equal(createHash('sha256').update(readFileSync(`public/${portrait.path}`)).digest('hex'), portrait.sha256);
  assert.ok(html.includes('src="/media/krishiv-ramchandani-portrait.jpg"'));
  assert.ok(html.includes('alt="Krishiv Ramchandani"'));
  assert.doesNotMatch(css, /grayscale|sepia|saturate\(|hue-rotate|mix-blend|opacity[^;{}]*\}[^{]*\.portrait img/i);
  const rule = css.match(/\.portrait img\{[^}]*\}/)[0];
  assert.match(rule, /filter:none/);
  assert.doesNotMatch(css, /\.portrait[^{]*\{[^}]*(filter|backdrop-filter):(?!none)/);
});
test('ASTRA is one project of three; video link exact; Reliance only in its own study block; no 266 or 66 claims', () => {
  const projects = page.match(/<section[^>]*id="projects"[\s\S]*?<\/section>/)[0];
  assert.equal((projects.match(/<article class="project"/g) ?? []).length, 3);
  assert.ok(page.indexOf('id="projects"') < page.indexOf('id="astra"'), 'ASTRA sits inside Projects');
  assert.ok(!html.split('id="projects"')[0].includes('id="astra"'), 'no ASTRA section before Projects');
  const study = page.match(studyBlock)[0];
  assert.ok(study.includes('href="https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_reliance-report-activity-7511490572344512512-99Oc"'));
  assert.ok(study.includes('href="https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_astra-reliance-excel-report-activity-7511495036921073664-tM6T"'));
  for (const m of ['10-year FCFF', 'WACC', 'Reverse DCF', 'Segment SOTP', 'Comparable companies', 'Sensitivity']) assert.ok(study.includes(m), m);
  assert.doesNotMatch(study, /\.pdf|download/);
  assert.doesNotMatch(outsideStudy(page), /reliance/i);
  assert.doesNotMatch(JSON.stringify([COMPANIES, DEMOS]), /reliance/i);
  assert.doesNotMatch(outsideStudy(html), /reliance/i);
  assert.ok(html.includes('href="https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_astra-equityresearch-finance-activity-7511489584879538176-ShWh"'));
  assert.doesNotMatch(page, /\b266\b|\b66 (reports|companies)/i);
  assert.doesNotMatch(page, /<video|<iframe|class="play"|<canvas|target price|BUY\/HOLD\/SELL|\bC?GPA\b|grayscale|\+91/i);
  assert.doesNotMatch(page, /(?<!Not a )CFA charterholder|Level II passed|institutional-grade/i);
  assert.doesNotMatch(page, /FMB|astra-financial-platform/);
  assert.equal(manifest.research.length, 0);
  assert.doesNotMatch(html, /href="[^"]*reports\/[^" ]+/);
});
test('only manifest-approved exact bytes have public download links', () => {
  for (const match of html.matchAll(/href="\/?(media\/[^" ]+\.pdf)"/g)) {
    const item = manifest.media.find(a => a.kind === 'CV' && a.path === match[1]);
    assert.equal(item?.approved, true);
    assert.equal(createHash('sha256').update(readFileSync(`public/${item.path}`)).digest('hex'), item.sha256);
  }
  const cv = manifest.media.find(a => a.kind === 'CV');
  assert.equal(cv.sha256, '8861af27345ec425d4f360cfbe76d6049cbe4a236a840d7f52b1299ebdc69533');
  assert.ok(html.includes('href="/media/krishiv-ramchandani-cv.pdf" download'));
});
test('every screenshot on the page is a manifest-approved SCREENSHOT with exact bytes and no private markers', () => {
  const shots = [...html.matchAll(/src="\/(media\/[^"]+\.webp)"/g)].map(m => m[1]);
  assert.equal(shots.length, 5);
  for (const path of shots) {
    const item = manifest.media.find(a => a.kind === 'SCREENSHOT' && a.path === path);
    assert.equal(item?.approved, true, path);
    assert.equal(createHash('sha256').update(readFileSync(`public/${path}`)).digest('hex'), item.sha256);
    assert.doesNotMatch(item.alt, /reliance/i);
    assert.match(item.reviewReceipt, /No ASTRA screen/);
  }
});
test('heat map palette is red, never teal or green, and both themes define it', () => {
  for (const v of ['--hdiag:#6F0D1B', '--hna:#F5E9E7']) assert.ok(css.includes(v), v);
  assert.match(css, /\[data-theme="dark"\]\{[^}]*--hna:/);
  assert.match(css, /prefers-color-scheme:dark/);
  const heat = css.match(/\/\* RED heat map[\s\S]*?\/\* experience/)[0];
  assert.doesNotMatch(heat, /teal|green|#0[0-9a-f]{2}[89a-f][0-9a-f]{2}/i);
});
test('built page, when present, has every generated section, working anchors and no overclaims', { skip: !built }, () => {
  const ids = new Set([...built.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  for (const href of built.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(href[1]), href[1]);
  assert.equal(ids.size, [...built.matchAll(/\sid="([^"]+)"/g)].length, 'duplicate ids');
  assert.doesNotMatch(outsideStudy(built), /reliance|\bC?GPA\b|Level II passed|(?<!Not a )CFA charterholder/i);
  assert.doesNotMatch(built, /teal|filter:\s*grayscale/i);
  assert.doesNotMatch(built, /<!--@/);
  assert.equal((built.match(/class="acc sim"/g) ?? []).length, 11);
  assert.equal((built.match(/class="case"/g) ?? []).length, 5);
  // Page copy says every case links an unverified draft: the manifest must back that up, and nothing may be called verified.
  assert.equal(manifest.researchDrafts.length, 5);
  assert.equal((built.match(/DRAFT\. UNVERIFIED\./g) ?? []).length, 5);
  assert.equal((built.match(/href="\/reports\/[A-Z]+_NS_(Institutional_Report\.pdf|Financial_Model\.xlsx)" download/g) ?? []).length, 10);
  assert.doesNotMatch(built, /ACCUMULATE|REDUCE|OVERVALUED|UNDERVALUED/);
  // Draft PDFs publish a Bharti simulation and a Bajaj fair value, so the copy may not say they are unpublished or withheld.
  assert.doesNotMatch(built, /so it is not published|shown only once it can be reproduced/);
  assert.ok(manifest.researchDrafts.find(d => d.ticker === 'BAJFINANCE').openIssues.every(i => !/spread is withheld/i.test(i)));
  assert.equal((built.match(/role="tabpanel" class="panel"/g) ?? []).length, 5);
  assert.equal((built.match(/class="area"/g) ?? []).length, 6);
});
