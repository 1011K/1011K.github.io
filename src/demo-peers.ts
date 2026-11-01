// Demo 4: sector-aware peer comparison. The visitor types HYPOTHETICAL fundamentals per column;
// ratios are computed with fail-closed unit rules (see peers.ts). No company data is stored here.
import "./demo-peers.css";
import { barChart } from "./charts.ts";
import { COMPANIES, type Company } from "./content.ts";
import type { Mount } from "./demo-ctx.ts";
import { BASES, NM, REASONS, SCOPES, SPECS, type Col, type Unit, compare, hypothetical, validatePeerSet } from "./peers.ts";
import { e, fmt, metrics, pct, select, str, table, val, workstation } from "./ui.ts";

const UNIT: Record<Unit, string> = { x: "times", "%": "%", cr: "INR crore", INR: "INR per month" };
const show = (u: Unit, v: number | null) => (v === null ? NM : u === "%" ? pct(v) : u === "x" ? `${fmt(v)}x` : fmt(v, 0));
const short = (s: string) => (s.length > 20 ? `${s.slice(0, 19)}…` : s);
const opt = (list: string[], ph: string) => `<option value="">${ph}</option>${list.map((x) => `<option>${e(x)}</option>`).join("")}`;

function controls(co: Company) {
  const names = [co.name, ...co.peers.map((p) => p.name)], spec = SPECS[co.archetype];
  const head = names.map((n, i) => `<th scope="col">${e(n)}<span class="pc-cls">${i ? co.peers[i - 1].cls : "MAIN"}</span></th>`).join("");
  const row = (label: string, cell: (i: number) => string, hint = "") => `<tr><th scope="row">${e(label)}${hint ? ` <i>${e(hint)}</i>` : ""}</th>${names.map((_, i) => `<td>${cell(i)}</td>`).join("")}</tr>`;
  const tag = (i: number, what: string) => `${what}, ${e(names[i])}`;
  const meta =
    row("Include in comparison", (i) => (i ? `<input type="checkbox" name="c${i}_inc" checked aria-label="Include ${e(names[i])}">` : "Main company")) +
    row("Exclusion reason", (i) => (i ? `<select name="c${i}_why" aria-label="${tag(i, "Exclusion reason")}">${opt(REASONS, "Required if excluded")}</select>` : "n/a"), "(if excluded)") +
    row("Period basis", (i) => `<select name="c${i}_basis" aria-label="${tag(i, "Period basis")}">${opt(BASES, "Select")}</select>`) +
    row("Scope", (i) => `<select name="c${i}_scope" aria-label="${tag(i, "Scope")}">${opt(SCOPES, "Select")}</select>`) +
    row("Period end", (i) => `<input type="date" name="c${i}_end" aria-label="${tag(i, "Period end")}">`) +
    row("All figures match this period and scope", (i) => `<input type="checkbox" name="c${i}_attest" aria-label="${tag(i, "I confirm every figure matches the stated period, scope and lease basis")}">`, "(you confirm)");
  const data = spec.fields.map((f) => row(f.label, (i) => `<input type="number" step="any" inputmode="decimal" name="c${i}_${f.key}" aria-label="${tag(i, f.label)}">`, f.unit === "cr" ? "INR cr" : "")).join("");
  const lease = co.archetype === "Telecom" ? select("lease", "EV lease treatment (all columns)", [["in", "Include lease liabilities in EV and net debt"], ["out", "Exclude lease liabilities from EV and net debt"]], "in") : "";
  return `<p class="pc-banner"><strong>HYPOTHETICAL inputs you enter. Not company data.</strong> Amounts in INR crore unless a row says otherwise; blank cells stay blank and give ${NM}.</p>
<p class="pc-sub">${e(co.name)} against its three proposed peers. Proposed, not verified as the largest rivals.</p>
<div class="pc-opts">${lease}${select("chart", "Ratio to chart", spec.ratios.map((r) => [r.key, r.label]))}</div>
<div class="ws-actions"><button type="button" class="btn solid" data-act="load">Load hypothetical example</button><button type="button" class="btn" data-act="clear">Clear</button></div>
<div class="tscroll" role="region" aria-label="Inputs by company" tabindex="0"><table class="pc-in"><caption>Inputs by company (HYPOTHETICAL)</caption><thead><tr><th scope="col">Field</th>${head}</tr></thead><tbody>${meta}${data}</tbody></table></div>`;
}

function readCols(co: Company, form: HTMLFormElement): Col[] {
  const spec = SPECS[co.archetype];
  return [co.name, ...co.peers.map((p) => p.name)].map((name, i) => ({
    name,
    cls: i ? co.peers[i - 1].cls : "MAIN",
    included: !i || (form.elements.namedItem(`c${i}_inc`) as HTMLInputElement).checked,
    reason: i ? str(form, `c${i}_why`) : "",
    basis: str(form, `c${i}_basis`),
    scope: str(form, `c${i}_scope`),
    end: str(form, `c${i}_end`),
    attest: (form.elements.namedItem(`c${i}_attest`) as HTMLInputElement).checked,
    raw: Object.fromEntries(spec.fields.map((f) => [f.key, val(form, `c${i}_${f.key}`)])),
  }));
}

function render(co: Company, form: HTMLFormElement) {
  const bad = validatePeerSet(co.name, co.peers.map((p) => p.name));
  if (bad) throw new Error(`Peer set rejected. ${bad}`);
  const leaseIn = co.archetype === "Telecom" && str(form, "lease") === "in";
  const r = compare(co.archetype, readCols(co, form), { leaseInEV: leaseIn });
  const names = r.inc.map((c) => c.name), main = r.inc[0];
  const facts: [string, string][] = [["Period basis", main.basis], ["Scope", main.scope], ["Period end", main.end], ["Columns compared", `${names.length} of ${co.peers.length + 1}`]];
  if (co.archetype === "Telecom") facts.push(["EV lease treatment", leaseIn ? "Lease liabilities included" : "Lease liabilities excluded"]);
  const vals = table("Ratios by company (HYPOTHETICAL inputs)", ["Ratio", "Unit", ...names.map((n, i) => (i ? n : `${n} (main)`))], r.rows.map((x) => [x.ratio.label, UNIT[x.ratio.unit], ...x.values.map((v) => show(x.ratio.unit, v))]));
  const ranks = table("Rank and percentile among included columns", ["Ratio", ...names], r.rows.map((x) => [x.ratio.label, ...x.ranks.map((k, i) => (x.values[i] === null ? NM : r.inc[i].cls === "ADJACENT" ? "Context only: adjacent peer, not ranked" : k ? `rank ${k.rank} of ${k.of}, percentile ${fmt(k.pct, 0)}` : "n/a (needs 2+ meaningful)"))]));
  const sel = r.rows.find((x) => x.ratio.key === str(form, "chart")) ?? r.rows[0], u = sel.ratio.unit, ix = sel.values.flatMap((v, i) => (v === null ? [] : [i]));
  const skipped = names.filter((_, i) => sel.values[i] === null);
  const chart = ix.length
    ? barChart({ title: `${sel.ratio.label} by company, hypothetical inputs`, caption: `${sel.ratio.label} (${UNIT[u]}), HYPOTHETICAL inputs.${skipped.length ? ` Not plotted, ${NM}: ${skipped.join(", ")}.` : ""}`, labels: ix.map((i) => short(names[i] + (i ? (r.inc[i].cls === "ADJACENT" ? " (adj.)" : "") : " (main)"))), values: ix.map((i) => sel.values[i]! * (u === "%" ? 100 : 1)), yFmt: (v) => (u === "%" ? `${v.toFixed(1)}%` : u === "x" ? `${v.toFixed(2)}x` : v.toFixed(0)) })
    : `<p class="note">${e(sel.ratio.label)}: ${NM} for every included column, so there is nothing to plot.</p>`;
  const peerRows = co.peers.map((p) => `<li><strong>${e(p.name)}</strong> <span class="pc-cls">${p.cls}</span> ${e(p.note)}${names.includes(p.name) ? "" : " <em>(excluded)</em>"}</li>`).join("");
  const ex = r.excluded.length ? `<ul class="pc-list">${r.excluded.map((x) => `<li><strong>${e(x.name)}</strong>: ${e(x.reason)}</li>`).join("")}</ul>` : `<p class="note">None. All proposed peers are included.</p>`;
  return `<p class="pc-banner"><strong>HYPOTHETICAL inputs you enter. Not company data.</strong> No rating, target or recommendation.</p>${metrics(facts)}<h4>Ratios</h4>${vals}<h4>Chart</h4>${chart}<h4>Rank and percentile</h4>${ranks}<p class="note">Rank 1 is the highest value and is not a quality judgement. Percentile is the share of the other meaningful columns with a strictly lower value. Ratios are never combined into one score.</p><h4>Direct vs adjacent</h4><ul class="pc-list">${peerRows}</ul><p class="note">Proposed, not verified as the largest rivals. ${e(co.peerNote)} Direct peers are the closest like-for-like; adjacent peers have different economics, so read their ratios as context, not a matched benchmark.${co.archetype === "Telecom" ? " EBITDA must be on the same lease basis as the EV treatment chosen." : ""}</p><h4>Exclusions</h4>${ex}`;
}

export const mount: Mount = (root, ctx) => {
  const build = () => {
    const co = COMPANIES.find((c) => c.ticker === ctx.company());
    if (!co) { root.textContent = "Unknown company."; return; }
    const { form, redraw } = workstation(root, controls(co), (f) => render(co, f));
    form.addEventListener("click", (ev) => {
      const act = (ev.target as HTMLElement).closest<HTMLElement>("[data-act]")?.dataset.act;
      if (!act) return;
      const spec = SPECS[co.archetype];
      for (let i = 0; i <= co.peers.length; i++) {
        const set = (n: string, v: string) => ((form.elements.namedItem(n) as HTMLInputElement | null) ?? { value: "" }).value = v;
        spec.fields.forEach((f) => set(`c${i}_${f.key}`, act === "load" ? String(hypothetical(co.archetype, i)[f.key]) : ""));
        (form.elements.namedItem(`c${i}_attest`) as HTMLInputElement).checked = act === "load";
        set(`c${i}_basis`, act === "load" ? "FY" : ""); set(`c${i}_scope`, act === "load" ? "Consolidated" : ""); set(`c${i}_end`, act === "load" ? "2026-03-31" : "");
        if (i) { set(`c${i}_why`, ""); (form.elements.namedItem(`c${i}_inc`) as HTMLInputElement).checked = true; }
      }
      redraw();
    });
    // Open with the labelled hypothetical example so the first view shows output, not a blocked state.
    form.querySelector<HTMLElement>('[data-act="load"]')!.click();
  };
  build();
  ctx.onCompany(build);
};
