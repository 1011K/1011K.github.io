// Fail closed across the proposed source tree and actual production files.
import { readdirSync, readFileSync, lstatSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { isReleased, isApprovedMedia } from "../src/publication.ts";
const manifest = JSON.parse(readFileSync("publication-manifest.json", "utf8"));
const errors = [];
const fail = (message) => errors.push(message);
if (
  manifest.schemaVersion !== 1 ||
  !Array.isArray(manifest.research) ||
  !Array.isArray(manifest.media)
)
  throw Error("Invalid publication manifest");
const approved = new Map();
for (const record of manifest.research) {
  if (!isReleased(record)) {
    fail("Incomplete or unapproved release record");
    continue;
  }
  for (const a of record.assets) {
    if (approved.has(a.path)) fail("Duplicate approved asset path");
    approved.set(a.path, a.sha256);
  }
}
for (const asset of manifest.media) {
  if (!isApprovedMedia(asset)) { fail("Incomplete or unapproved media record"); continue; }
  if (approved.has(asset.path)) fail("Duplicate approved asset path");
  approved.set(asset.path, asset.sha256);
}
const sourceFiles = new Set([
  ".gitignore",
  ".github/workflows/deploy.yml",
  "README.md",
  "index.html",
  "about/index.html",
  "astra/index.html",
  "contact/index.html",
  "lab/index.html",
  "research/index.html",
  "package.json",
  "package-lock.json",
  "publication-manifest.json",
  "tsconfig.json",
  "vite.config.ts",
  "scripts/audit-public.mjs",
  "scripts/audit-public.test.mjs",
  "scripts/deploy-branch.sh",
  "src/content.ts",
  "src/lab.ts",
  "src/main.ts",
  "src/style.css",
  "src/demo.ts",
  "src/portfolio.ts",
  "src/portfolio.test.ts",
  "src/models.ts",
  "src/models.test.ts",
  "src/publication.ts",
  "src/publication.test.ts",
  "src/research.ts",
  "src/assignments.json",
]);
const patterns = [
  /\/Users\//,
  /\+91[\s-]*\d[\d\s-]{8,}/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-proj-[A-Za-z0-9_-]{15,})\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /astra-financial-platform/i,
  /sourceMappingURL/,
];
const scan = (path, data) => {
  const t = data.toString("utf8");
  for (const [n, re] of patterns.entries())
    if (re.test(t)) fail(`Sensitive or development pattern ${n + 1}: ${path}`);
  const emails = t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  for (const email of emails)
    if (email.toLowerCase() !== "krishivramchandani@gmail.com")
      fail(`Unapproved email: ${path}`);
};
const digest = (data) => createHash("sha256").update(data).digest("hex");
const verifyAsset = (p, data) => {
  if (!approved.has(p) || digest(data) !== approved.get(p))
    fail(`Unapproved asset or hash mismatch: ${p}`);
};
const proposed = execFileSync("git", [
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z",
])
  .toString()
  .split("\0")
  .filter(Boolean);
for (const p of proposed) {
  if (!existsSync(p)) continue;
  if (lstatSync(p).isSymbolicLink()) {
    fail(`Symlink in source: ${p}`);
    continue;
  }
  if (p.startsWith("public/")) verifyAsset(p.slice(7), readFileSync(p));
  else if (!sourceFiles.has(p)) fail(`Unexpected source file: ${p}`);
  // Tooling contains detection patterns and synthetic hostile fixtures; it is not served.
  else if (
    (p.startsWith("src/") && !p.endsWith(".test.ts")) ||
    p.endsWith(".html")
  )
    scan(p, readFileSync(p));
}
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n),
      s = lstatSync(p);
    if (s.isSymbolicLink()) {
      fail(`Symlink in build: ${p}`);
      return [];
    }
    return s.isDirectory() ? walk(p) : [p];
  });
if (!existsSync("dist")) fail("Build missing: run npm run build first");
else
  for (const f of walk("dist")) {
    const p = f.slice(5).replaceAll("\\", "/"),
      data = readFileSync(f),
      ext = extname(f).toLowerCase();
    if (approved.has(p)) {
      verifyAsset(p, data);
      continue;
    }
    if (!(
      /^(?:index|(?:about|astra|contact|lab|research)\/index)\.html$/.test(p) ||
      /^assets\/[A-Za-z0-9_.-]+\.(?:js|css|woff2)$/.test(p)
    ))
      fail(`Unexpected built file: ${p}`);
    if ([".html", ".js", ".css", ".json", ".svg", ".txt", ".xml"].includes(ext))
      scan(f, data);
  }
for (const [p, hash] of approved) {
  for (const prefix of ["public", "dist"])
    if (
      !existsSync(join(prefix, p)) ||
      digest(readFileSync(join(prefix, p))) !== hash
    )
      fail(`Approved file missing or changed in ${prefix}: ${p}`);
}
for (const message of errors) console.error(message);
console.log(
  errors.length
    ? `audit FAILED (${errors.length})`
    : "audit passed: source allowlist, release metadata, exact hashes and production files",
);
process.exitCode = errors.length ? 1 : 0;
