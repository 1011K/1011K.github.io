import { expect, it } from "vitest";
import { cases, demos, placeholders, study } from "./render";
import type { DraftRelease } from "./publication";
const html = placeholders();
it("renders every placeholder the page uses", () => {
  expect(Object.keys(html).sort()).toEqual(["academic", "astra-areas", "astra-workstreams", "cases", "credentials", "demos", "experience", "facts", "labs", "simulations", "skills", "study"]);
  expect(Object.values(html).every((s) => s.length > 200)).toBe(true);
});
it("shows five case shells with withheld files and no dead download links", () => {
  const c = cases();
  expect((c.match(/class="case"/g) ?? []).length).toBe(5);
  expect((c.match(/WITHHELD/g) ?? []).length).toBe(10);
  expect(c).not.toMatch(/href="\/reports|\.pdf"|\.xlsx"/);
});
it("gives every case two open questions, three key risks and a data status, without conclusions", () => {
  const c = cases();
  expect((c.match(/Open question A/g) ?? []).length).toBe(5);
  expect((c.match(/Open question B/g) ?? []).length).toBe(5);
  expect((c.match(/<ol class="risks">/g) ?? []).length).toBe(5);
  expect((c.match(/<ol class="risks"><li>.*?<\/ol>/g) ?? []).map((x) => (x.match(/<li>/g) ?? []).length)).toEqual([3, 3, 3, 3, 3]);
  expect((c.match(/<details class="more study">/g) ?? []).length).toBe(5);
  expect((c.match(/<details class="fold case-fold"/g) ?? []).length).toBe(5);
  expect((c.match(/Verification log: open items/g) ?? []).length).toBe(5);
  expect((c.match(/Filings and annual reports/g) ?? []).length).toBe(5);
  expect((c.match(/Not loaded/g) ?? []).length).toBe(10);
  expect(c).not.toMatch(/reliance|target price|\bbuy\b|\bsell\b|outperform|undervalued|overvalued/i);
});
it("keeps Reliance inside the independent study block only, with both LinkedIn posts", () => {
  const rest = Object.entries(html).filter(([k]) => k !== "study").map(([, v]) => v).join("");
  expect(rest).not.toMatch(/reliance/i);
  const s = study();
  expect(s).toMatch(/Reliance Industries/);
  expect(s).toContain("reliance-report-activity-7511490572344512512-99Oc");
  expect(s).toContain("astra-reliance-excel-report-activity-7511495036921073664-tM6T");
  expect(s).not.toMatch(/\.pdf|download/);
});
it("renders the profile details from the approved CV and none of the withheld ones", () => {
  const p = [html.facts, html.academic, html.experience, html.skills].join("");
  for (const t of ["Ascendas Firstspace", "TALAASH", "Python (basic)", "SQL (introductory)", "Hindi"]) expect(p).toContain(t);
  expect(p).not.toMatch(/\bC?GPA\b|\b266\b|\+91|charterholder/i);
});
it("shows eleven simulation cards", () => {
  expect((html.simulations.match(/class="acc sim"/g) ?? []).length).toBe(11);
});
it("marks every demo withheld and not engine verified", () => {
  const d = demos();
  expect((d.match(/RELEASE STATUS: WITHHELD/g) ?? []).length).toBe(1);
  expect((d.match(/NOT YET ENGINE VERIFIED/g) ?? []).length).toBe(1);
  expect((d.match(/<span>Provenance, status and release gates<\/span>/g) ?? []).length).toBe(5);
});
it("every demo shows its authoritative source and source confidence; tables scroll inside regions", () => {
  const d = demos();
  expect((d.match(/Authoritative source/g) ?? []).length).toBe(5);
  expect((d.match(/Source confidence/g) ?? []).length).toBe(5);
  expect((d.match(/Workstation mode/g) ?? []).length).toBe(10);
  expect((d.match(/data-demo="/g) ?? []).length).toBe(5);
});

it("links an owner-approved draft with its unverified label and open issues, only for its company", () => {
  const d: DraftRelease = {
    ticker: "DLF", title: "DLF draft", publicationStatus: "OWNER_APPROVED_DRAFT", verificationStatus: "UNVERIFIED", accuracyVerified: false,
    approvedBy: "Owner", approvedAt: "2026-11-01", asOf: "2026-10-30", reviewReceipt: "x", rightsCleared: true, privacyCleared: true,
    openIssues: ["Issue <one>"], assets: [{ path: "reports/dlf-draft.pdf", sha256: "a".repeat(64) }, { path: "reports/dlf-draft.xlsx", sha256: "b".repeat(64) }],
  };
  const c = cases([], [d]);
  expect(c).toContain('href="/reports/dlf-draft.pdf" download');
  expect(c).toContain('href="/reports/dlf-draft.xlsx" download');
  expect((c.match(/DRAFT\. UNVERIFIED\./g) ?? []).length).toBe(1);
  expect(c).toContain("Issue &lt;one&gt;");
  expect(c).toContain("not a SEBI-registered research analyst");
  expect((c.match(/WITHHELD/g) ?? []).length).toBe(8);
});

it("shows a verified release instead of a draft for the same company", () => {
  const sha = "c".repeat(64);
  const rel = { ticker: "DLF", assets: [{ path: "reports/dlf-verified.pdf", sha256: sha }, { path: "reports/dlf-verified.xlsx", sha256: sha }] } as never;
  const d = { ticker: "DLF", asOf: "2026-10-30", openIssues: ["x"], assets: [{ path: "reports/dlf-draft.pdf", sha256: sha }, { path: "reports/dlf-draft.xlsx", sha256: sha }] } as never;
  const c = cases([rel], [d]);
  expect(c).toContain("reports/dlf-verified.pdf");
  expect(c).not.toContain("dlf-draft");
  expect(c).not.toContain("DRAFT. UNVERIFIED.");
});
