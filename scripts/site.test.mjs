import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/style.css', 'utf8');
const manifest = JSON.parse(readFileSync('publication-manifest.json', 'utf8'));
const built = existsSync('dist/index.html') ? readFileSync('dist/index.html', 'utf8') : null;
test('identity, navigation and contact work without JavaScript', () => {
  assert.doesNotMatch(html, /Krishiv\.r|PRIVATE REVIEW|private design preview|noindex/i);
  assert.match(html, /<title>Krishiv Ramchandani/);
  assert.match(html, /<h1[^>]*>Krishiv/);
  for (const id of ['about','education','astra','research','demos','experience','simulations','contact']) assert.ok(html.includes(`id="${id}"`), id);
  const nav = [...html.matchAll(/<nav id="main-nav"[\s\S]*?<\/nav>/g)][0][0];
  assert.deepEqual([...nav.matchAll(/>([^<]+)<\/a>/g)].map(m => m[1]), ['About','Education','ASTRA','Research','Demonstrations','Experience','Simulations','Contact']);
  for (const href of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${href[1]}"`) || html.includes('<!--@labs-->'), href[1]);
  assert.ok(html.includes('final-year BBA student at Jai Hind College, Mumbai'));
  assert.ok(html.includes('CFA Level I') && html.includes('Level II candidate'));
  assert.ok(html.includes('Ascendas Firstspace Development Management Pvt. Ltd.'));
  assert.ok(html.includes('mailto:krishivramchandani@gmail.com'));
  assert.match(html, /href="#main" class="skip"/);
  assert.match(html, /id="theme"/);
});
test('no-JS fallback wins the cascade and hides dead controls', () => {
  const ns = html.match(/<noscript><style>([\s\S]*?)<\/style>/)[1];
  for (const decl of ns.split(';')) if (decl.trim() && !decl.includes('{')) assert.match(decl, /!important/, decl);
  for (const sel of ['.tabs', '.menu-toggle', '#opt', '.weights', '[role=tabpanel][hidden]']) assert.ok(ns.includes(sel), sel);
  assert.match(ns, /\[role=tabpanel\]\[hidden\]\{display:block!important\}/);
});
test('portrait is the exact approved colour file and is never filtered', () => {
  const portrait = manifest.media.find(a => a.kind === 'PORTRAIT');
  assert.equal(portrait.sha256, 'a87403e8a2f3c96777a80fad14652c06ca370622c2ec26136c95fb768d6921de');
  assert.equal(createHash('sha256').update(readFileSync(`public/${portrait.path}`)).digest('hex'), portrait.sha256);
  assert.ok(html.includes('src="/media/krishiv-ramchandani-portrait.jpg"'));
  assert.ok(html.includes('alt="Krishiv Ramchandani"'));
  assert.doesNotMatch(css, /grayscale|sepia|saturate\(|hue-rotate|mix-blend|opacity[^;{}]*\}[^{]*\.portrait img/i);
  const rule = css.match(/\.portrait img\{[^}]*\}/)[0];
  assert.match(rule, /filter:none/);
  assert.doesNotMatch(css, /\.portrait[^{]*\{[^}]*(filter|backdrop-filter):(?!none)/);
});
test('ASTRA video opens the exact original LinkedIn post; Reliance, 266 and 66 claims are absent', () => {
  assert.ok(html.includes('href="https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_astra-equityresearch-finance-activity-7511489584879538176-ShWh"'));
  assert.doesNotMatch(html, /reliance|266|\b66 /i);
  assert.doesNotMatch(html, /<video|<iframe|class="play"|<canvas|target price|BUY\/HOLD\/SELL|CGPA/i);
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
  assert.equal(cv.sha256, 'aeabe2ef5ab3ef5d6a627fa58e6421225e0b111c59f54ce72528d00bb05ed68e');
  assert.ok(html.includes('href="/media/krishiv-ramchandani-cv.pdf" download'));
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
  assert.doesNotMatch(built, /reliance|\bCGPA\b|Level II passed|(?<!Not a )CFA charterholder/i);
  assert.doesNotMatch(built, /teal|filter:\s*grayscale/i);
  assert.doesNotMatch(built, /<!--@/);
  assert.equal((built.match(/class="acc sim"/g) ?? []).length, 11);
  assert.equal((built.match(/class="case"/g) ?? []).length, 5);
  assert.equal((built.match(/role="tabpanel" class="panel"/g) ?? []).length, 5);
  assert.equal((built.match(/class="area"/g) ?? []).length, 6);
  assert.equal((built.match(/class="h-diag"/g) ?? []).length, 5);
});
