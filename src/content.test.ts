import { expect, it } from "vitest";
import { ACADEMIC_RECORD, ASTRA_AREAS, CASE_DETAIL, COMPANIES, CREDENTIALS, DEMOS, EXPERIENCE, FACTS, LEADERSHIP, LINKS, METHODS, SIMULATIONS, SKILLS, STUDY, methodVerdict } from "./content";
import { isReleased } from "./publication";
it("has exactly the five core companies in fixed order, never Reliance", () => {
  expect(COMPANIES.map((c) => c.ticker)).toEqual(["HDFCBANK", "DLF", "BHARTIARTL", "BAJFINANCE", "HDFCLIFE"]);
  expect(JSON.stringify([COMPANIES, DEMOS])).not.toMatch(/reliance/i);
});
it("has exactly five demos, six ASTRA areas and eleven distinct simulations", () => {
  expect(DEMOS).toHaveLength(5);
  expect(ASTRA_AREAS.map((a) => a.name)).toContain("Mosaic");
  expect(ASTRA_AREAS).toHaveLength(6);
  expect(SIMULATIONS).toHaveLength(11);
  expect(new Set(SIMULATIONS.map((s) => `${s.org}|${s.title}`)).size).toBe(11);
  expect(new Set(SIMULATIONS.map((s) => s.org)).size).toBe(7);
});
it("routes each company to exactly one method and rejects the rest", () => {
  for (const c of COMPANIES) {
    const ok = METHODS.filter((m) => methodVerdict(c.ticker, m).allowed);
    expect(ok).toEqual([c.method]);
  }
  expect(methodVerdict("HDFCBANK", "FCFF_DCF").allowed).toBe(false);
  expect(methodVerdict("BAJFINANCE", "FCFF_DCF").allowed).toBe(false);
  expect(methodVerdict("DLF", "FCFF_DCF").allowed).toBe(false);
  expect(methodVerdict("HDFCLIFE", "FCFF_DCF").allowed).toBe(false);
  expect(methodVerdict("BHARTIARTL", "FCFF_DCF").allowed).toBe(true);
  expect(methodVerdict("HDFCLIFE", "EV_VNB").text).toMatch(/withheld/i);
});
it("never claims unverified credentials", () => {
  const text = JSON.stringify(CREDENTIALS);
  expect(text).not.toMatch(/(?<!Not a )CFA charterholder|Level II passed|\bC?GPA\b/i);
  expect(text).toMatch(/Not a CFA charterholder/);
  expect(text).toMatch(/Not a SEBI research analyst registration/);
});
it("rejects a release record naming a non-core ticker", () => {
  expect(isReleased({ ticker: "RELIANCE" })).toBe(false);
});
it("gives each company two open questions and three risks, and no conclusion words", () => {
  for (const c of COMPANIES) {
    const d = CASE_DETAIL[c.ticker];
    expect(d.hypotheses).toHaveLength(2);
    expect(d.risks).toHaveLength(3);
  }
  expect(JSON.stringify(CASE_DETAIL)).not.toMatch(/target price|\bbuy\b|\bsell\b|undervalued|overvalued|reliance/i);
});
it("keeps profile facts to the approved CV: no GPA, report counts, phone or address", () => {
  const text = JSON.stringify([FACTS, ACADEMIC_RECORD, EXPERIENCE, LEADERSHIP, SKILLS, LINKS]);
  expect(text).not.toMatch(/\bC?GPA\b|\b266\b|\b66\b|\+91|address|charterholder/i);
  expect(text).toMatch(/91%/);
  expect(text).toMatch(/97\.2%/);
  expect(LINKS.email).toBe("krishivramchandani@gmail.com");
});
it("describes the Reliance study as separate, with exactly its two LinkedIn posts and no PDF", () => {
  expect(STUDY.links.map((l) => l.href)).toEqual([
    "https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_reliance-report-activity-7511490572344512512-99Oc",
    "https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_astra-reliance-excel-report-activity-7511495036921073664-tM6T",
  ]);
  expect(STUDY.methods).toHaveLength(6);
  expect(JSON.stringify(STUDY)).not.toMatch(/\.pdf/);
});
