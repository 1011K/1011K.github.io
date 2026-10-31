import {
  diversificationPoints,
  minVarWeight,
  portfolioVol,
  undiversifiedVol,
  type TwoAsset,
} from "./portfolio";

const pct = (x: number) => (x * 100).toFixed(1) + "%";

export function demoHTML(): string {
  const r = (
    id: string,
    label: string,
    min: number,
    max: number,
    step: number,
    val: number,
  ) =>
    `<label for="${id}"><span>${label}<output id="${id}-o"></output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  return `<div class="demo">
    <div class="demo-grid">
      <div class="controls">
        ${r("d-w", "Weight in asset A", 0, 100, 1, 50)}
        ${r("d-a", "Volatility of A", 0, 60, 1, 20)}
        ${r("d-b", "Volatility of B", 0, 60, 1, 30)}
        ${r("d-r", "Correlation", -100, 100, 5, 25)}
      </div>
      <div class="readout" aria-live="polite">
        <dl class="stats">
          <div><dt>Portfolio vol</dt><dd id="d-vol"></dd></div>
          <div><dt>Weighted average</dt><dd id="d-avg"></dd></div>
          <div><dt>Diversification</dt><dd id="d-div"></dd></div>
          <div><dt>Min-variance A</dt><dd id="d-mv"></dd></div>
        </dl>
        <svg class="chart" id="d-chart" viewBox="0 0 400 170" role="img" aria-label="Portfolio volatility across weights in asset A"></svg>
      </div>
    </div>
    <p class="demo-note">Educational illustration with hypothetical inputs; not ASTRA analytics, live market information or investment advice. Long-only, annualised volatility, textbook two-asset formula.</p>
  </div>`;
}

export function wireDemo(): void {
  const $ = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const ids = ["d-w", "d-a", "d-b", "d-r"];
  if (!ids.every((i) => document.getElementById(i))) return;
  const read = (): TwoAsset => ({
    w1: +$<HTMLInputElement>("d-w").value / 100,
    s1: +$<HTMLInputElement>("d-a").value / 100,
    s2: +$<HTMLInputElement>("d-b").value / 100,
    rho: +$<HTMLInputElement>("d-r").value / 100,
  });
  const update = () => {
    const i = read();
    $("d-w-o").textContent =
      `${Math.round(i.w1 * 100)}% / ${Math.round((1 - i.w1) * 100)}%`;
    $("d-a-o").textContent = pct(i.s1);
    $("d-b-o").textContent = pct(i.s2);
    $("d-r-o").textContent = i.rho.toFixed(2);
    const v = portfolioVol(i),
      u = undiversifiedVol(i),
      mv = minVarWeight(i);
    $("d-vol").textContent = pct(v);
    $("d-avg").textContent = pct(u);
    $("d-div").textContent =
      u > 0
        ? diversificationPoints(i).toFixed(1) + " percentage points"
        : "0.0 percentage points";
    $("d-mv").textContent = mv === null ? "—" : Math.round(mv * 100) + "%";
    // chart: vol vs weight in A
    const W = 400,
      H = 170,
      L = 34,
      B = 24,
      T = 10;
    const pts = Array.from({ length: 101 }, (_, k) => ({
      w: k / 100,
      v: portfolioVol({ ...i, w1: k / 100 }),
    }));
    const max = Math.max(0.01, ...pts.map((p) => p.v), i.s1, i.s2) * 1.1;
    const x = (w: number) => L + w * (W - L - 6),
      y = (val: number) => H - B - (val / max) * (H - B - T);
    const path = pts
      .map(
        (p, k) => `${k ? "L" : "M"}${x(p.w).toFixed(1)},${y(p.v).toFixed(1)}`,
      )
      .join("");
    $("d-chart").innerHTML = `
      <line x1="${L}" y1="${H - B}" x2="${W - 6}" y2="${H - B}" stroke="currentColor" stroke-opacity=".5"/>
      <line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="currentColor" stroke-opacity=".5"/>
      <line x1="${x(0)}" y1="${y(i.s2)}" x2="${x(1)}" y2="${y(i.s1)}" stroke="currentColor" stroke-opacity=".45" stroke-dasharray="3 3"/>
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="${x(i.w1)}" cy="${y(v)}" r="4.5" fill="currentColor"/>
      <text x="${L}" y="${H - 8}">0% A</text><text x="${W - 6}" y="${H - 8}" text-anchor="end">100% A</text>
      <text x="${L - 4}" y="${y(max / 1.1)}" text-anchor="end">${pct(max / 1.1)}</text><text x="${L - 4}" y="${H - B}" text-anchor="end">0</text>
      <text x="${W - 6}" y="${T + 6}" text-anchor="end">solid: portfolio · dashed: weighted avg</text>`;
  };
  ids.forEach((id) => $(id).addEventListener("input", update));
  update();
}
