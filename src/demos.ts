import { COMPANIES, methodVerdict, type Method, type Ticker } from "./content.ts";
import { refresh } from "./render.ts";
import { bsm, breakeven, impliedVol, payoff, type Right } from "./options.ts";
import { escapeHTML as e } from "./publication.ts";

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const fmt = (n: number, d = 2) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const select = () => $<HTMLSelectElement>("#company")!;

// Roving-tabindex tablist: arrows, Home, End.
function tabs(list: HTMLElement, onSelect?: (tab: HTMLElement) => void) {
  const all = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
  const pick = (tab: HTMLElement, focus = false) => {
    all.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls")!);
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    onSelect?.(tab);
  };
  all.forEach((t, i) => {
    t.addEventListener("click", () => pick(t));
    t.addEventListener("keydown", (ev) => {
      const k = ev.key,
        next = k === "ArrowRight" ? (i + 1) % all.length : k === "ArrowLeft" ? (i + all.length - 1) % all.length : k === "Home" ? 0 : k === "End" ? all.length - 1 : -1;
      if (next < 0) return;
      ev.preventDefault();
      pick(all[next], true);
    });
  });
  return pick;
}

function company() {
  const sel = select(),
    out = $<HTMLElement>("#vout")!,
    vm = $<HTMLSelectElement>("#vm")!;
  const verdict = () => {
    const v = methodVerdict(sel.value as Ticker, vm.value as Method);
    out.textContent = v.text;
    out.className = `status ${v.allowed ? "ok" : "no"}`;
  };
  const update = () => {
    const r = refresh(sel.value as Ticker);
    $('[data-part="router"]')!.innerHTML = r.router;
    $('[data-part="peers"]')!.innerHTML = r.peers;
    document.querySelectorAll('[data-part="name"]').forEach((n) => (n.textContent = r.name));
    verdict();
  };
  sel.addEventListener("change", update);
  vm.addEventListener("change", verdict);
  // Case cards and deep links choose the company, then show the demonstrations.
  document.querySelectorAll<HTMLAnchorElement>("[data-pick]").forEach((a) =>
    a.addEventListener("click", () => {
      const t = a.dataset.pick!;
      if (COMPANIES.some((c) => c.ticker === t)) {
        sel.value = t;
        update();
      }
    }),
  );
  update();
}

function options() {
  const form = $<HTMLFormElement>("#opt")!,
    out = $<HTMLElement>("#opt-out")!;
  const num = (name: string) => {
    const el = form.elements.namedItem(name) as HTMLInputElement;
    return el.value.trim() === "" ? NaN : Number(el.value);
  };
  const run = () => {
    const right = (form.querySelector<HTMLInputElement>('input[name="right"]:checked')!.value as Right),
      input = { spot: num("spot"), strike: num("strike"), days: num("days"), vol: num("vol") / 100, rate: num("rate") / 100, yield: num("yield") / 100 };
    try {
      const r = bsm(input),
        side = r[right],
        premium = num("premium");
      let iv = "";
      if (!Number.isNaN(premium)) {
        const { vol: _v, ...rest } = input;
        try {
          iv = `<div><dt>Implied volatility from observed premium</dt><dd>${fmt(impliedVol(rest, right, premium) * 100, 2)}% a year</dd></div>`;
        } catch (err) {
          iv = `<div><dt>Implied volatility</dt><dd class="no">${e((err as Error).message)}</dd></div>`;
        }
      }
      const intrinsic = Math.max(0, right === "call" ? input.spot - input.strike : input.strike - input.spot);
      const lo = input.strike * 0.5, hi = input.strike * 1.5,
        pts = Array.from({ length: 61 }, (_, n) => lo + ((hi - lo) * n) / 60),
        ys = pts.map((p) => payoff(right, input.strike, side.price, p)),
        yMin = Math.min(...ys), yMax = Math.max(...ys, 0.0001),
        x = (p: number) => 50 + ((p - lo) / (hi - lo)) * 600,
        y = (v: number) => 170 - ((v - yMin) / (yMax - yMin || 1)) * 150;
      const be = breakeven(right, input.strike, side.price);
      $("#opt-sum")!.textContent = `Theoretical ${right} premium ${fmt(side.price, 4)} rupees. Theoretical only.`;
      out.innerHTML = `<p class="status warn"><b>THEORETICAL ONLY.</b> Hypothetical inputs. Not a quote, not the selected company's option, not advice.</p>
<dl class="ledger"><div><dt>Theoretical ${right} premium</dt><dd>₹ ${fmt(side.price, 4)}</dd></div><div><dt>Intrinsic / time value</dt><dd>₹ ${fmt(intrinsic, 4)} / ₹ ${fmt(side.price - intrinsic, 4)}</dd></div>
<div><dt>Delta</dt><dd>${fmt(side.delta, 4)}</dd></div><div><dt>Gamma</dt><dd>${fmt(r.gamma, 6)}</dd></div><div><dt>Vega (per 1 vol point)</dt><dd>${fmt(r.vega, 4)}</dd></div><div><dt>Theta (per calendar day)</dt><dd>${fmt(side.theta, 4)}</dd></div><div><dt>Rho (per 1 rate point)</dt><dd>${fmt(side.rho, 4)}</dd></div>
<div><dt>Put-call parity residual</dt><dd>${r.parity.toExponential(2)}</dd></div><div><dt>Break-even at expiry</dt><dd>₹ ${fmt(be, 2)}</dd></div><div><dt>Futures fair value, cost of carry</dt><dd>₹ ${fmt(r.forward, 2)}</dd></div>${iv}</dl>
<figure class="chart"><svg viewBox="0 0 680 200" role="img" aria-label="Expiry profit and loss per share for a long ${right} at the stated premium"><title>Expiry P&amp;L per share</title><line class="gridline" x1="50" x2="650" y1="${y(0)}" y2="${y(0)}"/><path class="primary" d="${pts.map((p, n) => `${n ? "L" : "M"}${x(p).toFixed(1)} ${y(ys[n]).toFixed(1)}`).join(" ")}"/><line class="mark" x1="${x(input.strike)}" x2="${x(input.strike)}" y1="20" y2="170"/><text x="${x(input.strike)}" y="190" text-anchor="middle">K ${fmt(input.strike, 0)}</text><text x="50" y="190">₹ ${fmt(lo, 0)}</text><text x="650" y="190" text-anchor="end">₹ ${fmt(hi, 0)}</text><text x="46" y="${y(yMax) + 4}" text-anchor="end">${fmt(yMax, 0)}</text><text x="46" y="${y(yMin) + 4}" text-anchor="end">${fmt(yMin, 0)}</text></svg><figcaption>Horizontal: price at expiry. Vertical: profit or loss per share for a long ${right} after paying the theoretical premium.</figcaption></figure>`;
    } catch (err) {
      $("#opt-sum")!.textContent = "Cannot price: inputs invalid.";
      out.innerHTML = `<p class="status no" role="alert">Cannot price: ${e((err as Error).message)}</p>`;
    }
  };
  form.addEventListener("input", run);
  form.addEventListener("submit", (ev) => ev.preventDefault());
  run();
}

function weights() {
  const inputs = COMPANIES.map((c) => $<HTMLInputElement>(`#w-${c.ticker}`)!),
    msg = $<HTMLElement>("#wsum")!;
  const check = () => {
    const v = inputs.map((i) => (i.value.trim() === "" ? NaN : Number(i.value))),
      sum = v.reduce((s, n) => s + n, 0);
    let text = "", ok = false;
    if (v.some((n) => !Number.isFinite(n))) text = "Every weight is required.";
    else if (v.some((n) => n < 0)) text = "Negative weights (shorting) are not supported.";
    else if (Math.abs(sum - 100) > 1e-9) text = `Weights sum to ${fmt(sum, 1)}%. They must equal 100%; nothing is rescaled silently.`;
    else (text = "Weights sum to 100%."), (ok = true);
    msg.textContent = text + (ok ? " Risk outputs stay withheld until verified return series exist." : " Risk outputs are withheld.");
    msg.className = `status ${ok ? "ok" : "no"}`;
  };
  inputs.forEach((i) => i.addEventListener("input", check));
  check();
}

export function mountDemos() {
  if (!select()) return;
  const pick = tabs($("#demo-tabs")!);
  // A hash such as #panel-correlation selects that demonstration.
  const fromHash = () => {
    const t = document.getElementById(`tab-${location.hash.replace("#panel-", "")}`);
    if (location.hash.startsWith("#panel-") && t) {
      pick(t);
      const panel = document.getElementById(location.hash.slice(1))!;
      panel.scrollIntoView({ block: "start" });
      panel.focus({ preventScroll: true });
    }
  };
  fromHash();
  window.addEventListener("hashchange", fromHash);
  const st = $("#strat-tabs");
  if (st) tabs(st);
  company();
  options();
  weights();
}
