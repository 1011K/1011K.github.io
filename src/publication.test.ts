import { expect, it } from "vitest";
import { isReleased, safeAssetPath, escapeHTML } from "./publication";
import { assignments, filterResearch } from "./research";
const valid = {
  ticker: "DLF",
  publicationStatus: "APPROVED",
  researchProgress: "COMPLETE",
  verificationStatus: "VERIFIED",
  approvedBy: "Owner",
  approvedAt: "2026-10-31",
  reviewReceipt: "Reviewed exact asset",
  rightsCleared: true,
  privacyCleared: true,
  legalCleared: true,
  accuracyVerified: true,
  asOf: "2026-03-31",
  valuationDate: "2026-03-31",
  currency: "INR",
  scope: "Historical educational",
  fiscalPeriods: ["FY2026"],
  sources: ["https://example.com/filing"],
  authoredContributions: ["Author modelling"],
  limitations: ["Historical only"],
  title: "Example",
  sector: "IT",
  methodology: "FCFF",
  synopsis: "Historical research",
  assets: [{ path: "reports/example.pdf", sha256: "a".repeat(64) }],
};
it("defaults all 17 assignments to planned with no approval or file paths", () => {
  expect(assignments).toHaveLength(17);
  expect(new Set(assignments.map((r) => r.sector)).size).toBe(17);
  for (const r of assignments) {
    expect(r.researchProgress).toBe("PLANNED");
    expect(isReleased(r)).toBe(false);
    expect(r.assets).toEqual([]);
    expect(r.approvedBy).toBeNull();
  }
});
it("filters public research without changing planned state", () => {
  expect(filterResearch("TCS", "All").map((x) => x.company)).toEqual(["TCS"]);
  expect(filterResearch("", "Banking")).toHaveLength(1);
  expect(filterResearch("nothing matches", "All")).toEqual([]);
});
it("fails closed on absent metadata, review flags, approval or hash", () => {
  expect(isReleased(valid)).toBe(true);
  for (const key of Object.keys(valid)) {
    expect(isReleased({ ...valid, [key]: null }), key).toBe(false);
  }
  for (const key of [
    "rightsCleared",
    "privacyCleared",
    "legalCleared",
    "accuracyVerified",
  ])
    expect(isReleased({ ...valid, [key]: false })).toBe(false);
  expect(
    isReleased({
      ...valid,
      assets: [{ path: "reports/example.pdf", sha256: "bad" }],
    }),
  ).toBe(false);
  expect(isReleased({ ...valid, researchProgress: "PLANNED" })).toBe(false);
  expect(isReleased({ ...valid, verificationStatus: "DISPUTED" })).toBe(false);
  expect(isReleased({ ...valid, approvedAt: "not a date" })).toBe(false);
});
it("rejects external, encoded, traversal and active file URLs", () => {
  for (const p of [
    "https://example.com/a.pdf",
    "//evil/a.pdf",
    "javascript:alert(1)",
    "reports/../a.pdf",
    "reports/%2e%2e/a.pdf",
    "reports/a.svg",
    "/reports/a.pdf",
    "reports/a.pdf?x",
    "reports/a\\b.pdf",
  ])
    expect(safeAssetPath(p)).toBe(false);
  expect(safeAssetPath("reports/a.pdf")).toBe(true);
});
it("escapes metadata before HTML interpolation", () =>
  expect(escapeHTML('<img src=x onerror="x">&\'')).toBe(
    "&lt;img src=x onerror=&quot;x&quot;&gt;&amp;&#39;",
  ));

it("approves only reviewed publishable media and rejects design references", async () => {
  const { isApprovedMedia } = await import("./publication");
  const asset = {
    kind: "CV",
    title: "Professional CV",
    alt: "Professional CV",
    path: "media/krishiv-cv.pdf",
    sha256: "a".repeat(64),
    approved: true,
    approvedBy: "Krishiv Ramchandani",
    approvedAt: "2026-10-31",
    reviewReceipt: "Explicit owner publication request",
    rightsCleared: true,
    privacyCleared: true,
  };
  expect(isApprovedMedia(asset)).toBe(true);
  for (const key of Object.keys(asset))
    expect(isApprovedMedia({ ...asset, [key]: null }), key).toBe(false);
  expect(isApprovedMedia({ ...asset, approved: false })).toBe(false);
  expect(isApprovedMedia({ ...asset, privacyCleared: false })).toBe(false);
  expect(isApprovedMedia({ ...asset, kind: "CV", path: "media/cv.png" })).toBe(
    false,
  );
  expect(
    isApprovedMedia({
      ...asset,
      kind: "DESIGN_REFERENCE",
      path: "media/design.png",
    }),
  ).toBe(false);
  expect(
    isApprovedMedia({ ...asset, path: "https://example.com/cv.pdf" }),
  ).toBe(false);
  expect(isApprovedMedia({ ...asset, sha256: "invalid" })).toBe(false);
});
