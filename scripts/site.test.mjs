import { readFileSync } from "node:fs";
import { test as it } from "node:test";
import assert from "node:assert/strict";
const html = readFileSync("index.html", "utf8");
it("uses exact identity, one continuous semantic page and all four lab anchors", () => {
  assert.ok(
    /<a[^>]*class="wordmark"[^>]*>\s*Krishiv\.r\s*<\/a\s*>/.test(html),
    "exact wordmark text",
  );
  assert.ok(html.includes('title="Krishiv.r"'));
  assert.match(html, /<h1[^>]*>\s*Krishiv<br/);
  for (const id of [
    "about",
    "education",
    "qualifications",
    "research",
    "experience",
    "astra",
    "labs",
    "direction",
    "contact",
    "lab-financial",
    "lab-technical",
    "lab-derivatives",
    "lab-portfolio",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.doesNotMatch(
    html,
    /KRISHIV R\.|Expected April|Expected May|design-references|Download.*CV/,
  );
  assert.ok(html.includes("Expected graduation 2027"));
  assert.ok(html.includes("CFA Level II registered candidate, May 2027"));
});
it("keeps record and anchor destinations available without JavaScript", () => {
  assert.ok(
    html
      .replace(/\s+/g, " ")
      .includes("I am a final-year BBA student at Jai Hind College"),
  );
  assert.ok(
    html
      .replace(/\s+/g, " ")
      .includes("Ascendas Firstspace Development Management Pvt. Ltd."),
  );
  assert.ok(html.includes("mailto:krishivramchandani@gmail.com"));
  assert.ok(html.includes("Virtual Job Simulations"));
  assert.doesNotMatch(html, /href="(?:about|research|astra|lab|contact)\//);
});

it("publishes only the owner-supplied portrait with a pinned hash and descriptive alt text", () => {
  const manifest = JSON.parse(
    readFileSync("publication-manifest.json", "utf8"),
  );
  const portrait = manifest.media.find((a) => a.kind === "PORTRAIT");
  assert.ok(portrait, "approved portrait record");
  assert.equal(portrait.path, "media/krishiv-ramchandani-portrait.jpg");
  assert.equal(portrait.alt, "Krishiv Ramchandani");
  assert.equal(portrait.approved, true);
  assert.match(portrait.sha256, /^[a-f0-9]{64}$/);
  assert.ok(html.includes('src="/media/krishiv-ramchandani-portrait.jpg"'));
  assert.ok(html.includes('alt="Krishiv Ramchandani"'));
  assert.doesNotMatch(
    html,
    /Portrait withheld|Space reserved for|Portrait pending owner verification/,
  );
});
