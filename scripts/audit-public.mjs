// Fail closed before compilation and against the resulting deployable tree.
import { readdirSync, readFileSync, lstatSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { isReleased, isApprovedMedia } from "../src/publication.ts";
const sourceOnly = process.argv.includes("--source-only");
const manifest = JSON.parse(readFileSync("publication-manifest.json", "utf8"));
const errors = [],
  fail = (message) => errors.push(message),
  approved = new Map();
if (
  manifest.schemaVersion !== 1 ||
  !Array.isArray(manifest.research) ||
  !Array.isArray(manifest.media)
)
  throw Error("Invalid publication manifest");
for (const record of manifest.research) {
  if (
    !isReleased(record) ||
    !record.assets.some((a) => a.path.endsWith(".pdf"))
  ) {
    fail("Incomplete or unapproved release record");
    continue;
  }
  for (const a of record.assets) {
    if (approved.has(a.path)) fail("Duplicate approved asset path");
    approved.set(a.path, a.sha256);
  }
}
for (const a of manifest.media) {
  if (!isApprovedMedia(a)) {
    fail("Incomplete or unapproved media record");
    continue;
  }
  if (approved.has(a.path)) fail("Duplicate approved asset path");
  approved.set(a.path, a.sha256);
}
const allowed = new Set([
  ".gitignore",
  ".github/workflows/deploy.yml",
  ".github/workflows/security.yml",
  ".github/workflows/codeql.yml",
  ".github/workflows/scorecard.yml",
  ".github/dependabot.yml",
  ".github/SECURITY.md",
  "README.md",
  "index.html",
  "package.json",
  "package-lock.json",
  "publication-manifest.json",
  "tsconfig.json",
  "vite.config.ts",
  "scripts/audit-public.mjs",
  "scripts/audit-public.test.mjs",
  "scripts/site.test.mjs",
  "scripts/deploy-branch.sh",
  "src/main.ts",
  "src/charts.test.ts",
  "src/charts.ts",
  "src/demo-ctx.ts",
  "src/demo-options.css",
  "src/demo-options.test.ts",
  "src/demo-options.ts",
  "src/demo-peers.css",
  "src/demo-peers.test.ts",
  "src/demo-peers.ts",
  "src/demo-risk.css",
  "src/demo-risk.test.ts",
  "src/demo-risk.ts",
  "src/demo-technical.css",
  "src/demo-technical.test.ts",
  "src/demo-technical.ts",
  "src/demo-valuation.css",
  "src/demo-valuation.test.ts",
  "src/demo-valuation.ts",
  "src/indicators.test.ts",
  "src/indicators.ts",
  "src/peers.test.ts",
  "src/peers.ts",
  "src/profile.css",
  "src/risk.test.ts",
  "src/risk.ts",
  "src/ui.test.ts",
  "src/ui.ts",
  "src/valuation.test.ts",
  "src/valuation.ts",
  "src/workstation.css",
  "src/content.ts",
  "src/content.test.ts",
  "src/render.ts",
  "src/render.test.ts",
  "src/demos.ts",
  "src/options.ts",
  "src/options.test.ts",
  "src/style.css",
  "src/lab.ts",
  "src/labs-models.ts",
  "src/labs-models.test.ts",
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
  /\b(?:residential address|flat no\.?|apartment no\.?)\s*[:#]/i,
];
const scan = (path, data) => {
  const text = data.toString("utf8");
  patterns.forEach((pattern, i) => {
    if (pattern.test(text))
      fail(`Sensitive or development pattern ${i + 1}: ${path}`);
  });
  for (const email of text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ||
    [])
    if (email.toLowerCase() !== "krishivramchandani@gmail.com")
      fail(`Unapproved email: ${path}`);
};
const digest = (data) => createHash("sha256").update(data).digest("hex");
const verify = (path, data) => {
  if (!approved.has(path) || digest(data) !== approved.get(path))
    fail(`Unapproved asset or hash mismatch: ${path}`);
};
const walk = (directory) =>
  !existsSync(directory)
    ? []
    : readdirSync(directory).flatMap((name) => {
        const p = join(directory, name),
          stat = lstatSync(p);
        if (stat.isSymbolicLink()) {
          fail(`Symlink: ${p}`);
          return [];
        }
        return stat.isDirectory() ? walk(p) : [p];
      });
const files = execFileSync("git", [
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z",
])
  .toString()
  .split("\0")
  .filter(Boolean);
for (const path of files) {
  if (!existsSync(path)) continue;
  if (lstatSync(path).isSymbolicLink()) {
    fail(`Symlink in source: ${path}`);
    continue;
  }
  if (path.startsWith("public/")) continue; // All public files, including ignored files, are walked below.
  if (!allowed.has(path)) {
    fail(`Unexpected source file: ${path}`);
    continue;
  }
  // Tooling/test fixtures contain intentional detection patterns and invalid examples, never served.
  if (!path.startsWith("scripts/") && !path.endsWith(".test.ts"))
    scan(path, readFileSync(path));
}
for (const path of walk("public")) verify(path.slice(7), readFileSync(path));
if (!sourceOnly) {
  if (!existsSync("dist/index.html"))
    fail("Build missing: run npm run build first");
  const built = walk("dist"),
    textFiles = built.filter((p) => /\.(html|css|js)$/.test(p));
  const references = textFiles.map((p) => readFileSync(p, "utf8")).join("\n");
  for (const path of built) {
    const p = path.slice(5),
      data = readFileSync(path),
      ext = extname(path).toLowerCase();
    if (approved.has(p)) {
      verify(p, data);
      continue;
    }
    if (
      !(
        p === "index.html" ||
        /^assets\/[A-Za-z0-9_.-]+\.(js|css|woff2)$/.test(p)
      )
    )
      fail(`Unexpected built file: ${p}`);
    if (p.startsWith("assets/") && !references.includes(p.split("/").at(-1)))
      fail(`Unreferenced built file: ${p}`);
    if ([".html", ".js", ".css", ".json", ".svg", ".txt", ".xml"].includes(ext))
      scan(path, data);
  }
  if (built.filter((p) => p.endsWith(".html")).length !== 1)
    fail("Production must contain exactly one root HTML");
}
for (const [p, hash] of approved)
  for (const prefix of sourceOnly ? ["public"] : ["public", "dist"])
    if (
      !existsSync(join(prefix, p)) ||
      digest(readFileSync(join(prefix, p))) !== hash
    )
      fail(`Approved file missing or changed in ${prefix}: ${p}`);
for (const message of errors) console.error(message);
console.log(
  errors.length
    ? `audit FAILED (${errors.length})`
    : `audit passed: ${sourceOnly ? "source allowlist and approved assets" : "source allowlist, release metadata, exact hashes and single-page production files"}`,
);
process.exitCode = errors.length ? 1 : 0;
