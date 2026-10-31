// Integration guard: prove unlinked files and changed bytes fail the actual audit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
const run = () =>
  execFileSync(process.execPath, ["scripts/audit-public.mjs"], {
    encoding: "utf8",
    stdio: "pipe",
  });
test("real public audit rejects unlinked files in source and build", () => {
  assert.match(run(), /audit passed/);
  mkdirSync("public", { recursive: true });
  try {
    writeFileSync("public/unapproved-probe.pdf", "synthetic test only");
    assert.throws(run, /Unapproved asset/);
  } finally {
    rmSync("public/unapproved-probe.pdf");
  }
  try {
    writeFileSync("dist/unapproved-probe.xlsx", "synthetic test only");
    assert.throws(run, /Unexpected built file/);
  } finally {
    rmSync("dist/unapproved-probe.xlsx");
  }
  try {
    writeFileSync(
      "dist/assets/unapproved-probe.js",
      'const contact="person@example.invalid";',
    );
    assert.throws(run, /Unapproved email/);
  } finally {
    rmSync("dist/assets/unapproved-probe.js");
  }
  assert.match(run(), /audit passed/);
});

test("exact approval hashes are required in both source and build", async () => {
  const { readFileSync } = await import("node:fs");
  const { createHash } = await import("node:crypto");
  const original = readFileSync("publication-manifest.json");
  const bytes = "Synthetic audit fixture, never research";
  const record = {
    title: "Synthetic fixture",
    sector: "Test",
    methodology: "Test",
    synopsis: "Test",
    publicationStatus: "APPROVED",
    researchProgress: "COMPLETE",
    verificationStatus: "VERIFIED",
    approvedBy: "Synthetic test owner",
    approvedAt: "2026-10-31",
    reviewReceipt: "Synthetic test only",
    rightsCleared: true,
    privacyCleared: true,
    legalCleared: true,
    accuracyVerified: true,
    asOf: "2026-03-31",
    valuationDate: "2026-03-31",
    currency: "INR",
    scope: "Synthetic",
    fiscalPeriods: ["Test"],
    sources: ["https://example.com/fixture"],
    authoredContributions: ["Test"],
    limitations: ["Synthetic only"],
    assets: [
      {
        path: "reports/synthetic-probe.pdf",
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    ],
  };
  mkdirSync("public/reports", { recursive: true });
  mkdirSync("dist/reports", { recursive: true });
  try {
    writeFileSync(
      "publication-manifest.json",
      JSON.stringify({ ...JSON.parse(original), research: [record] }),
    );
    writeFileSync("public/reports/synthetic-probe.pdf", bytes);
    writeFileSync("dist/reports/synthetic-probe.pdf", bytes);
    assert.match(run(), /audit passed/);
    writeFileSync("dist/reports/synthetic-probe.pdf", "Changed bytes");
    assert.throws(run, /hash mismatch|missing or changed/);
    writeFileSync("dist/reports/synthetic-probe.pdf", bytes);
    writeFileSync(
      "publication-manifest.json",
      JSON.stringify({
        ...JSON.parse(original),
        research: [{ ...record, privacyCleared: false }],
      }),
    );
    assert.throws(run, /Incomplete or unapproved/);
  } finally {
    writeFileSync("publication-manifest.json", original);
    rmSync("public/reports/synthetic-probe.pdf", { force: true });
    rmSync("dist/reports/synthetic-probe.pdf", { force: true });
  }
  assert.match(run(), /audit passed/);
});

test("single-page build rejects extra HTML, source maps and orphan assets", () => {
  for (const [path, bytes, pattern] of [
    [
      "dist/extra.html",
      "<h1>Extra page</h1>",
      /Unexpected built file|exactly one/,
    ],
    ["dist/assets/hidden.js.map", "{}", /Unexpected built file/],
    ["dist/assets/orphan.js", "console.log(1)", /Unreferenced built file/],
  ]) {
    try {
      writeFileSync(path, bytes);
      assert.throws(run, pattern);
    } finally {
      rmSync(path, { force: true });
    }
  }
  assert.match(run(), /audit passed/);
});

test("build preflight refuses an unapproved binary even before compilation", () => {
  try {
    writeFileSync("public/unapproved-preflight.png", "Synthetic fixture");
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          ["scripts/audit-public.mjs", "--source-only"],
          { stdio: "pipe" },
        ),
      /Unapproved asset/,
    );
  } finally {
    rmSync("public/unapproved-preflight.png", { force: true });
  }
});
