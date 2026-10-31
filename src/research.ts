import raw from "./assignments.json";
import manifest from "../publication-manifest.json";
import { isReleased } from "./publication";
export const assignments = raw.map((r) => ({
  ...r,
  slug: r.company
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-"),
  title: `${r.company} · ${r.sector}`,
  researchQuestion: r.research_focus,
  methodology: r.methodology_bucket,
  researchProgress: "PLANNED",
  publicationStatus: "WITHHELD",
  verificationStatus: "UNVERIFIED",
  asOf: null,
  fiscalPeriods: null,
  valuationDate: null,
  currency: null,
  scope: null,
  sources: [],
  authoredContributions: null,
  pdfPath: null,
  workbookPath: null,
  assets: [],
  limitations: ["Proposed coverage; sources and model not yet verified."],
  approvedBy: null,
  approvedAt: null,
}));
export const filterResearch = (query: string, sector: string) =>
  assignments.filter(
    (r) =>
      (sector === "All" || r.sector === sector) &&
      `${r.company} ${r.sector} ${r.research_focus} ${r.methodology}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
export const released = (manifest.research as unknown[]).filter(isReleased);
