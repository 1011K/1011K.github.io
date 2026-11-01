import { expect, it } from "vitest";
import { cases, demos, placeholders, study } from "./render";
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
  expect((c.match(/<li>/g) ?? []).length).toBe(15);
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
  for (const t of ["91%", "97.2%", "Ascendas Firstspace", "TALAASH", "Python (basic)", "SQL (introductory)", "Hindi"]) expect(p).toContain(t);
  expect(p).not.toMatch(/\bC?GPA\b|\b266\b|\+91|charterholder/i);
});
it("shows eleven simulation cards", () => {
  expect((html.simulations.match(/class="acc sim"/g) ?? []).length).toBe(11);
});
it("marks every demo withheld and not engine verified", () => {
  const d = demos();
  expect((d.match(/RELEASE STATUS: WITHHELD/g) ?? []).length).toBe(5);
  expect((d.match(/NOT YET ENGINE VERIFIED/g) ?? []).length).toBe(5);
});
it("every demo shows its authoritative source and source confidence; tables scroll inside regions", () => {
  const d = demos();
  expect((d.match(/Authoritative source/g) ?? []).length).toBe(5);
  expect((d.match(/Source confidence/g) ?? []).length).toBe(5);
  expect((d.match(/Workstation mode/g) ?? []).length).toBe(10);
  expect((d.match(/data-demo="/g) ?? []).length).toBe(5);
});
