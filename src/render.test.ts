import { expect, it } from "vitest";
import { COMPANIES } from "./content";
import { cases, demos, heatmap, placeholders, peers } from "./render";
const html = placeholders();
it("renders every placeholder the page uses", () => {
  expect(Object.keys(html).sort()).toEqual(["astra-areas", "cases", "credentials", "demos", "labs", "simulations"]);
  expect(Object.values(html).every((s) => s.length > 200)).toBe(true);
});
it("shows five case shells with withheld files and no dead download links", () => {
  const c = cases();
  expect((c.match(/class="case"/g) ?? []).length).toBe(5);
  expect((c.match(/WITHHELD/g) ?? []).length).toBe(10);
  expect(c).not.toMatch(/href="\/reports|\.pdf"|\.xlsx"/);
});
it("shows eleven simulation cards", () => {
  expect((html.simulations.match(/class="acc sim"/g) ?? []).length).toBe(11);
});
it("marks every demo withheld and not engine verified", () => {
  const d = demos();
  expect((d.match(/RELEASE STATUS: WITHHELD/g) ?? []).length).toBe(5);
  expect((d.match(/NOT YET ENGINE VERIFIED/g) ?? []).length).toBe(5);
});
it("heat map is 5x5, diagonal 1.00, every other cell withheld, no invented numbers", () => {
  const h = heatmap();
  expect((h.match(/class="h-diag"/g) ?? []).length).toBe(5);
  expect((h.match(/class="h-na"/g) ?? []).length).toBe(20);
  expect(h.match(/>-?\d\.\d\d</g)).toHaveLength(5);
  expect(h).not.toMatch(/teal|green|#0[0-9a-f]{2}[89a-f]/i);
});
it("every demo shows its authoritative source and source confidence; tables scroll inside regions", () => {
  const d = demos();
  expect((d.match(/Authoritative source/g) ?? []).length).toBe(5);
  expect((d.match(/Source confidence/g) ?? []).length).toBe(5);
  expect(d).toMatch(/Mode<\/dt><dd>HYPOTHETICAL/);
  expect(peers("DLF").match(/class="tscroll" role="region"/g)).toHaveLength(2);
});
it("peer tables give three peers and withhold every ratio", () => {
  for (const c of COMPANIES) {
    const p = peers(c.ticker);
    expect(c.peers).toHaveLength(3);
    expect(p).not.toMatch(/\d+(\.\d+)?%/);
    expect((p.match(/Withheld/g) ?? []).length).toBe(c.ratios.length * 4);
  }
});
