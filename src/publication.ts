// Shared browser/build gate. Approval is an owner decision, never a model output.
export const escapeHTML = (s: unknown): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const safeAssetPath = (p: unknown): p is string =>
  typeof p === "string" &&
  /^(reports|media)\/[a-zA-Z0-9_-]+\.(pdf|xlsx|png|jpg|jpeg|webp|mp4)$/.test(p);
export interface ReleaseAsset {
  path: string;
  sha256: string;
}
export interface ReleaseRecord {
  title: string;
  sector: string;
  methodology: string;
  synopsis: string;
  publicationStatus: string;
  researchProgress: string;
  verificationStatus: string;
  approvedBy: string;
  approvedAt: string;
  reviewReceipt: string;
  rightsCleared: boolean;
  privacyCleared: boolean;
  legalCleared: boolean;
  accuracyVerified: boolean;
  asOf: string;
  valuationDate: string;
  currency: string;
  scope: string;
  fiscalPeriods: string[];
  sources: string[];
  authoredContributions: string[];
  limitations: string[];
  assets: ReleaseAsset[];
}
const text = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
const date = (v: unknown) =>
  text(v) &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function isReleased(raw: unknown): raw is ReleaseRecord {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return (
    r.publicationStatus === "APPROVED" &&
    r.researchProgress === "COMPLETE" &&
    r.verificationStatus === "VERIFIED" &&
    [
      "rightsCleared",
      "privacyCleared",
      "legalCleared",
      "accuracyVerified",
    ].every((k) => r[k] === true) &&
    [
      "title",
      "sector",
      "methodology",
      "synopsis",
      "approvedBy",
      "reviewReceipt",
      "currency",
      "scope",
    ].every((k) => text(r[k])) &&
    ["approvedAt", "asOf", "valuationDate"].every((k) => date(r[k])) &&
    ["fiscalPeriods", "sources", "authoredContributions", "limitations"].every(
      (k) =>
        Array.isArray(r[k]) &&
        (r[k] as unknown[]).length > 0 &&
        (r[k] as unknown[]).every(text),
    ) &&
    (r.sources as string[]).every((s) => {
      try {
        const u = new URL(s);
        return u.protocol === "https:" && !u.username && !u.password;
      } catch {
        return false;
      }
    }) &&
    Array.isArray(r.assets) &&
    r.assets.length > 0 &&
    r.assets.every(
      (a) =>
        a &&
        safeAssetPath(a.path) &&
        typeof a.sha256 === "string" &&
        /^[a-f0-9]{64}$/.test(a.sha256),
    )
  );
}
