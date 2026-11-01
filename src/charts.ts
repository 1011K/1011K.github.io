// Dependency-free SVG chart strings. Colours come from CSS classes so both themes work.
import { escapeHTML as e } from "./publication.ts";
const W = 680, L = 56, R = 16, T = 14;
const nf = (v: number) => (Math.abs(v) >= 1000 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));
export interface Series { name: string; values: (number | null)[]; cls?: string }
export interface LineOpts { title: string; caption: string; series: Series[]; x?: (i: number) => string; height?: number; zero?: boolean; yFmt?: (v: number) => string }
export function lineChart(o: LineOpts) {
  const H = o.height ?? 240, B = 28, all = o.series.flatMap((s) => s.values.filter((v): v is number => v !== null && Number.isFinite(v)));
  if (!all.length) return "";
  let lo = Math.min(...all, ...(o.zero ? [0] : [])), hi = Math.max(...all, ...(o.zero ? [0] : []));
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
  const n = Math.max(...o.series.map((s) => s.values.length)), px = (i: number) => L + (i / Math.max(1, n - 1)) * (W - L - R), py = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const yf = o.yFmt ?? nf;
  const grid = [0, 1, 2, 3, 4].map((k) => { const v = lo + ((hi - lo) * k) / 4; return `<line class="gl" x1="${L}" x2="${W - R}" y1="${py(v)}" y2="${py(v)}"/><text x="${L - 6}" y="${py(v) + 4}" text-anchor="end">${e(yf(v))}</text>`; }).join("");
  const zero = o.zero && lo < 0 && hi > 0 ? `<line class="zero" x1="${L}" x2="${W - R}" y1="${py(0)}" y2="${py(0)}"/>` : "";
  const paths = o.series.map((s, k) => { let d = "", up = false; s.values.forEach((v, i) => { if (v === null || !Number.isFinite(v)) { up = false; return; } d += `${up ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`; up = true; }); return `<path class="ln ${s.cls ?? `s${k}`}" d="${d}"/>`; }).join("");
  const xl = o.x ? [0, Math.floor((n - 1) / 2), n - 1].map((i, k) => `<text x="${px(i)}" y="${H - 8}" text-anchor="${k === 0 ? "start" : k === 2 ? "end" : "middle"}">${e(o.x!(i))}</text>`).join("") : "";
  const legend = o.series.length > 1 ? `<ul class="legend">${o.series.map((s, k) => `<li class="${s.cls ?? `s${k}`}">${e(s.name)}</li>`).join("")}</ul>` : "";
  return `<figure class="chart">${legend}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(o.title)}"><title>${e(o.title)}</title>${grid}${zero}${paths}${xl}</svg><figcaption>${e(o.caption)}</figcaption></figure>`;
}
export interface BarOpts { title: string; caption: string; labels: string[]; values: number[]; height?: number; yFmt?: (v: number) => string; cls?: string }
export function barChart(o: BarOpts) {
  const H = o.height ?? 220, B = 40, lo = Math.min(0, ...o.values), hi = Math.max(0, ...o.values, 1e-12), span = hi - lo || 1;
  const py = (v: number) => T + (1 - (v - lo) / span) * (H - T - B), n = o.values.length, bw = ((W - L - R) / n) * 0.62, yf = o.yFmt ?? nf;
  const bars = o.values.map((v, i) => { const cx = L + ((i + 0.5) / n) * (W - L - R), y0 = py(0), y1 = py(v); return `<rect class="bar ${o.cls ?? ""}${v < 0 ? " neg" : ""}" x="${cx - bw / 2}" y="${Math.min(y0, y1)}" width="${bw}" height="${Math.abs(y1 - y0)}"><title>${e(o.labels[i])}: ${e(yf(v))}</title></rect><text x="${cx}" y="${Math.min(y0, y1) - 4}" text-anchor="middle">${e(yf(v))}</text><text x="${cx}" y="${H - 22}" text-anchor="middle">${e(o.labels[i])}</text>`; }).join("");
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(o.title)}"><title>${e(o.title)}</title><line class="zero" x1="${L}" x2="${W - R}" y1="${py(0)}" y2="${py(0)}"/>${bars}</svg><figcaption>${e(o.caption)}</figcaption></figure>`;
}
/** Waterfall: steps are signed deltas; `total` marks a subtotal bar. */
export function waterfall(o: { title: string; caption: string; steps: { label: string; value: number; total?: boolean }[]; yFmt?: (v: number) => string }) {
  const H = 260, B = 46; let run = 0; const bars = o.steps.map((s) => { const from = s.total ? 0 : run, to = s.total ? s.value : run + s.value; run = s.total ? s.value : run + s.value; return { ...s, from, to }; });
  const lo = Math.min(0, ...bars.flatMap((b) => [b.from, b.to])), hi = Math.max(0, ...bars.flatMap((b) => [b.from, b.to]), 1e-12), py = (v: number) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B), n = bars.length, bw = ((W - L - R) / n) * 0.62, yf = o.yFmt ?? nf;
  const g = bars.map((b, i) => { const cx = L + ((i + 0.5) / n) * (W - L - R); return `<rect class="bar ${b.total ? "tot" : b.value < 0 ? "neg" : ""}" x="${cx - bw / 2}" y="${Math.min(py(b.from), py(b.to))}" width="${bw}" height="${Math.max(1, Math.abs(py(b.to) - py(b.from)))}"><title>${e(b.label)}: ${e(yf(b.value))}</title></rect><text x="${cx}" y="${Math.min(py(b.from), py(b.to)) - 4}" text-anchor="middle">${e(yf(b.value))}</text><text x="${cx}" y="${H - 26}" text-anchor="middle">${e(b.label)}</text>`; }).join("");
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(o.title)}"><title>${e(o.title)}</title><line class="zero" x1="${L}" x2="${W - R}" y1="${py(0)}" y2="${py(0)}"/>${g}</svg><figcaption>${e(o.caption)}</figcaption></figure>`;
}
/** Red scale for correlations and sensitivities: negative muted rose, zero pale rose, positive deep red. Returns [background, text]. */
export function redScale(v: number, lo = -1, hi = 1): [string, string] {
  const t = Math.max(-1, Math.min(1, v >= 0 ? (hi ? v / hi : 0) : lo ? -(v / Math.abs(lo)) : 0));
  const mix = (a: number[], b: number[], k: number) => a.map((x, i) => Math.round(x + (b[i] - x) * k));
  const neg = [232, 183, 192], zero = [245, 233, 231], mid = [201, 60, 79], deep = [111, 13, 27];
  const c = t < 0 ? mix(zero, neg, -t) : t < 0.55 ? mix(zero, mid, t / 0.55) : mix(mid, deep, (t - 0.55) / 0.45);
  const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  return [`rgb(${c.join(",")})`, lum < 0.5 ? "#ffffff" : "#3a0d16"];
}
