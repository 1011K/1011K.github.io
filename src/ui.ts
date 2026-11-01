// Shared form, table and workstation helpers for the demonstrations. Pure strings plus one DOM binder.
import { escapeHTML as e } from "./publication.ts";
export { e };
export const fmt = (n: number, d = 2) =>
  Number.isFinite(n) ? n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "n/a";
export const pct = (n: number, d = 1) => (Number.isFinite(n) ? `${fmt(n * 100, d)}%` : "n/a");
export const number = (id: string, label: string, value: number | string, step = "any", unit = "", hint = "") =>
  `<label class="field" for="${id}"><span>${e(label)}${unit ? ` <i>${e(unit)}</i>` : ""}</span><input id="${id}" name="${id}" type="number" step="${step}" value="${value}" inputmode="decimal">${hint ? `<small>${e(hint)}</small>` : ""}</label>`;
export const select = (id: string, label: string, options: [string, string][], value = "") =>
  `<label class="field" for="${id}"><span>${e(label)}</span><select id="${id}" name="${id}">${options.map(([v, t]) => `<option value="${e(v)}"${v === value ? " selected" : ""}>${e(t)}</option>`).join("")}</select></label>`;
export const group = (legend: string, inner: string) => `<fieldset class="ws-group"><legend>${e(legend)}</legend>${inner}</fieldset>`;
export const metrics = (pairs: [string, string][]) =>
  `<dl class="ws-metrics">${pairs.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl>`;
export const table = (caption: string, headers: string[], rows: string[][], cls = "grid") =>
  `<div class="tscroll" role="region" aria-label="${e(caption)}" tabindex="0"><table class="${cls}"><caption>${e(caption)}</caption><thead><tr>${headers.map((h) => `<th scope="col">${e(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${e(c)}</td>` : `<th scope="row">${e(c)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
export const label = (text: string, kind: "warn" | "no" | "ok" = "warn") => `<p class="status ${kind}">${e(text)}</p>`;
/** Reads a numeric field; blank is NaN so models can fail closed. */
export const val = (form: HTMLFormElement, name: string) => {
  const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
  if (!el) throw new Error(`Missing field ${name}`);
  return el.value.trim() === "" ? NaN : Number(el.value);
};
export const str = (form: HTMLFormElement, name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
/** Controls on the left, results on the right. Recomputes on every input; errors are shown, never swallowed. */
export function workstation(root: HTMLElement, controls: string, render: (form: HTMLFormElement) => string) {
  root.innerHTML = `<div class="ws"><form class="ws-controls" novalidate autocomplete="off">${controls}</form><div class="ws-results"><p class="ws-error" role="alert"></p><div class="ws-out"></div><p class="sr" role="status" id="${root.dataset.demo}-live"></p></div></div>`;
  const form = root.querySelector("form")!, out = root.querySelector<HTMLElement>(".ws-out")!, err = root.querySelector<HTMLElement>(".ws-error")!;
  const live = root.querySelector<HTMLElement>(".sr")!;
  const redraw = () => {
    try {
      out.innerHTML = render(form);
      err.textContent = "";
      live.textContent = "Results updated.";
    } catch (x) {
      out.replaceChildren();
      err.textContent = (x as Error).message;
      live.textContent = "Results unavailable. Correct the inputs.";
    }
  };
  form.addEventListener("input", redraw);
  form.addEventListener("change", redraw);
  form.addEventListener("submit", (ev) => ev.preventDefault());
  redraw();
  return { form, redraw };
}
