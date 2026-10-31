import { expect, it } from "vitest";
import { ASTRA_AREAS, COMPANIES, CREDENTIALS, DEMOS, METHODS, SIMULATIONS, methodVerdict } from "./content";
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
