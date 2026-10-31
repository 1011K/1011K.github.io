import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const html = readFileSync('index.html', 'utf8');
const manifest = JSON.parse(readFileSync('publication-manifest.json', 'utf8'));
test('full identity and recruiter sections work without JavaScript', () => {
  assert.doesNotMatch(html, /Krishiv\.r|PRIVATE REVIEW|private design preview|noindex/i);
  assert.match(html, /<title>Krishiv Ramchandani/);
  assert.match(html, /<h1[^>]*>Krishiv/);
  for (const id of ['research','experience','astra','experiments','credentials','contact']) assert.ok(html.includes(`id="${id}"`), id);
  for (const href of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${href[1]}"`), href[1]);
  assert.ok(html.includes('I am a final-year BBA student at Jai Hind College'));
  assert.ok(html.includes('Expected graduation: April 2027'));
  assert.ok(html.includes('Level II candidate for May 2027'));
  assert.ok(html.includes('Ascendas Firstspace Development Management Pvt. Ltd.'));
  assert.match(html, /virtual job simulations/i);
  assert.ok(html.includes('mailto:krishivramchandani@gmail.com'));
  assert.match(html, /href="#main" class="skip"/);
});
test('research and demonstrations preserve evidence and withheld states', () => {
  for (const post of ['astra-equityresearch-finance-activity-7511489584879538176-ShWh','reliance-report-activity-7511490572344512512-99Oc','astra-reliance-excel-report-activity-7511495036921073664-tM6T']) assert.ok(html.includes(post));
  assert.match(html, /AI-assisted/);
  assert.match(html, /historical, owner-reported/i);
  assert.match(html, /Portfolio Risk/);
  assert.match(html, /Market Scan/);
  assert.match(html, /Not available/);
  assert.doesNotMatch(html, /<video|<iframe|class="play"|id="lab-|<input|<canvas|target price|BUY\/HOLD\/SELL/);
  assert.equal(manifest.research.length, 0);
  assert.doesNotMatch(html, /href="[^"]*reports\/[^" ]+\.pdf/);
});
test('only manifest-approved exact bytes have public download links', () => {
  for (const match of html.matchAll(/href="\/?(media\/[^" ]+\.pdf)"/g)) {
    const item = manifest.media.find(a => a.kind === 'CV' && a.path === match[1]);
    assert.equal(item?.approved, true);
    assert.equal(createHash('sha256').update(readFileSync(`public/${item.path}`)).digest('hex'), item.sha256);
  }
  const portrait = manifest.media.find(a => a.kind === 'PORTRAIT');
  assert.equal(portrait.sha256, 'a87403e8a2f3c96777a80fad14652c06ca370622c2ec26136c95fb768d6921de');
  assert.equal(createHash('sha256').update(readFileSync(`public/${portrait.path}`)).digest('hex'), portrait.sha256);
  assert.ok(html.includes('src="/media/krishiv-ramchandani-portrait.jpg"'));
  assert.ok(html.includes('alt="Krishiv Ramchandani"'));
});
