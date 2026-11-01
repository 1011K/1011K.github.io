import "./demo-options.css";
import type { Mount } from "./demo-ctx.ts";
import { e, fmt, pct, number, select, group, metrics, table, label, val, str, workstation } from "./ui.ts";
import { lineChart, redScale } from "./charts.ts";
import {
  bsm, impliedVol, premiumBounds, intrinsic, positionValue, positionGreeks, positionPayoff, breakevens, futuresFair, legs, toCalendarDays,
  type BSMInput, type Position, type Right,
} from "./options.ts";

const N = (k: string) => `op-${k}`;
const LABEL: Record<Position, string> = { call: "Long call", put: "Long put", straddle: "Long straddle (call + put, same strike)" };
const sp = (lo: number, hi: number, n: number) => Array.from({ length: n }, (_, k) => lo + ((hi - lo) * k) / (n - 1));
const num = (f: HTMLFormElement, k: string, what: string) => {
  const v = val(f, N(k));
  if (!Number.isFinite(v)) throw new Error(`${what} is blank or not a number. Enter a value; nothing is assumed for it.`);
  return v;
};
/** Optional field: blank -> undefined, otherwise it must be a finite non-negative number. */
const opt = (f: HTMLFormElement, k: string, what: string) => {
  const v = val(f, N(k));
  if (str(f, N(k)).trim() === "") return undefined;
  if (!Number.isFinite(v) || v < 0) throw new Error(`${what} must be a finite number of zero or more, or left blank.`);
  return v;
};
const whole = (f: HTMLFormElement, k: string, what: string) => {
  const v = val(f, N(k));
  if (str(f, N(k)).trim() === "") return 1;
  if (!Number.isInteger(v) || v < 1) throw new Error(`${what} must be a whole number of at least 1, or blank (treated as 1).`);
  return v;
};

const controls = [
  group("Underlying and contract (hypothetical)", [
    number(N("spot"), "Spot price S", 100, "any", "price", "User-entered. A spot price alone cannot determine a premium."),
    select(N("position"), "Position", [["call", LABEL.call], ["put", LABEL.put], ["straddle", LABEL.straddle]], "call"),
    number(N("strike"), "Strike K", 100),
    number(N("expiry"), "Time to expiry", 90, "any", "", "0 or negative means expired: intrinsic value only."),
    select(N("basis"), "Expiry entered as", [["calendar", "Calendar days (365 per year)"], ["trading", "Trading days (252 per year)"], ["years", "Years"]], "calendar"),
  ].join("")),
  group("Model assumptions", [
    number(N("vol"), "Volatility σ", 25, "any", "% per year", "An assumption. 0 is allowed and handled separately."),
    number(N("rate"), "Risk-free rate r", 6, "any", "% continuous"),
    number(N("yield"), "Dividend yield q", 1, "any", "% continuous"),
    select(N("model"), "Model", [["bsm", "European Black-Scholes-Merton, continuous yield"]], "bsm"),
  ].join("")),
  group("Optional observations and size", [
    number(N("premium"), "Observed premium", "", "any", "per unit", "Optional. Your own entry, not sourced here. Straddle: total of both legs."),
    number(N("fut"), "Observed futures price", "", "any", "", "Optional. Your own entry, compared with carry fair value."),
    number(N("lotsize"), "Lot size", 1, "1", "units", "Hypothetical. Blank = 1 (per unit)."),
    number(N("lots"), "Number of lots", 1, "1", "", "Blank = 1."),
  ].join("")),
].join("");

const CONV = "Conventions: delta per 1 unit of spot; gamma is the delta change per 1 unit of spot; vega per 1 volatility point (σ moves 0.01); theta per calendar day (365-day year); rho per 1 rate point (r moves 0.01).";
const LIMITS = "Limitations: European exercise only, constant volatility, continuous dividend yield and no transaction costs, taxes, margin, skew, liquidity or discrete dividends. Real contracts differ. Nothing here is a quote, a recommendation or advice.";

export const mount: Mount = (root) => {
  workstation(root, controls, (f) => {
    const pos = str(f, N("position")) as Position;
    if (!(pos in LABEL)) throw new Error("Choose a position.");
    const S = num(f, "spot", "Spot price"), K = num(f, "strike", "Strike"), tIn = num(f, "expiry", "Time to expiry");
    const vol = num(f, "vol", "Volatility") / 100, rate = num(f, "rate", "Risk-free rate") / 100, yld = num(f, "yield", "Dividend yield") / 100;
    const obs = opt(f, "premium", "Observed premium"), obsF = opt(f, "fut", "Observed futures price");
    if (obs === 0) throw new Error("Observed premium must be above zero, or left blank. A zero premium would be a free option.");
    if (obsF === 0) throw new Error("Observed futures price must be above zero, or left blank.");
    const lotSize = whole(f, "lotsize", "Lot size"), lots = whole(f, "lots", "Number of lots"), qty = lotSize * lots;
    if (S <= 0 || K <= 0) throw new Error("Spot and strike must be positive.");
    if (vol < 0) throw new Error("Volatility cannot be negative.");
    const basis = str(f, N("basis")) as "calendar" | "trading" | "years", days = toCalendarDays(tIn, basis);
    const dead = days <= 0, T = Math.max(0, days) / 365, live = !dead && vol > 0;
    const inp: BSMInput = { spot: S, strike: K, days: dead ? 0 : days, vol, rate, yield: yld };
    const val0 = positionValue(inp, pos), intr = legs(pos).reduce((a, r) => a + intrinsic(r, S, K), 0);
    const g = live ? bsm(inp) : null, pg = g ? positionGreeks(g, pos) : null;
    const paid = obs ?? val0, paidSrc = obs === undefined ? "theoretical value (no observed premium entered)" : "your observed premium";
    const money = (v: number) => fmt(v, 2), signed = (v: number) => (v > 0 ? "+" : "") + money(v);

    // Regime notes: every limit branch is explained, never silently priced.
    const notes: string[] = [];
    if (dead) notes.push("Expired or time to expiry is zero: only intrinsic value remains, time value is zero, and Greeks, implied volatility and the volatility surfaces are undefined. Only the expiry payoff is drawn.");
    else if (vol === 0) notes.push("σ = 0: there is no randomness, so the value is the discounted deterministic intrinsic. Greeks, implied volatility and the volatility charts are degenerate and are not shown.");
    if (live && val0 < 1e-6 * K) notes.push("Deep out-of-the-money: the theoretical value is effectively zero, so Greeks are near zero and implied volatility cannot be recovered from a near-zero premium.");
    if (g && legs(pos).some((r) => Math.abs(g[r].delta) > 0.99)) notes.push("Deep in-the-money leg: delta is near ±1. A European option's time value can be near zero or negative because of carry, so price below intrinsic is possible.");

    const out: string[] = [];
    out.push(metrics([
      [`Theoretical value, ${pos === "straddle" ? "straddle" : pos}`, money(val0)],
      ["Intrinsic value", money(intr)],
      ["Time value (value − intrinsic)", dead ? "0.00 (expired)" : money(val0 - intr)],
      [`Premium used (${paidSrc})`, money(paid)],
      ["Quantity (lot size × lots)", `${fmt(qty, 0)} units`],
      ["Total premium paid", money(paid * qty)],
    ]));
    out.push(`<p class="note">${e(`Per unit unless stated. T = ${fmt(days, 2)} calendar days = ${fmt(T, 4)} years on a 365-day basis${basis === "trading" ? " (entered as trading days, converted at 252 per year)" : ""}. Moneyness at spot: ${S > K ? "call in the money" : S < K ? "put in the money" : "at the money"}. ${LABEL[pos]}.`)}</p>`);
    out.push(...notes.map((n) => label(n, "warn")));

    // Greeks
    out.push("<h4>Greeks</h4>");
    if (g && pg) {
      const rows: [string, string, number, number, number, number][] = [
        ["Delta", "per 1 spot unit", g.call.delta, g.put.delta, pg.delta, pg.delta * qty],
        ["Gamma", "delta change per 1 spot unit", g.gamma, g.gamma, pg.gamma, pg.gamma * qty],
        ["Vega", "per 1 vol point", g.vega, g.vega, pg.vega, pg.vega * qty],
        ["Theta", "per calendar day", g.call.theta, g.put.theta, pg.theta, pg.theta * qty],
        ["Rho", "per 1 rate point", g.call.rho, g.put.rho, pg.rho, pg.rho * qty],
      ];
      out.push(table("Greeks under the stated conventions", ["Greek", "Convention", "Call", "Put", `${LABEL[pos].split(" (")[0]}, per unit`, "Position × quantity"], rows.map(([a, b, c, d, p, t]) => [a, b, fmt(c, 4), fmt(d, 4), fmt(p, 4), fmt(t, 2)])));
      out.push(`<p class="note">${e(CONV)}</p>`);
    } else out.push(label("Greeks unavailable: they need a positive time to expiry and a positive volatility.", "warn"));

    // Put-call parity
    const C = positionValue(inp, "call"), P = positionValue(inp, "put"), dq = Math.exp(-yld * T), dr = Math.exp(-rate * T), rhs = S * dq - K * dr, res = C - P - rhs;
    out.push("<h4>Put-call parity (with dividend yield)</h4>");
    out.push(table("C − P versus S·e^(−qT) − K·e^(−rT)", ["Quantity", "Value"], [
      ["Call C", fmt(C, 6)], ["Put P", fmt(P, 6)], ["C − P", fmt(C - P, 6)], ["S·e^(−qT) − K·e^(−rT)", fmt(rhs, 6)],
      ["Residual", `${res.toExponential(2)} ${Math.abs(res) < 1e-8 ? "(parity holds within numerical tolerance)" : "(CHECK: parity violated)"}`],
    ]));

    // Implied volatility
    out.push("<h4>Implied volatility from an observed premium</h4>");
    if (obs === undefined) out.push(label("No observed premium entered. Implied volatility needs a premium you observed; none is assumed or derived from the spot price.", "warn"));
    else if (pos === "straddle") out.push(label("Select a long call or long put to solve implied volatility. For the straddle the observed premium is used only as the premium paid.", "warn"));
    else if (dead) out.push(label("Expired: no implied volatility. At expiry the premium can only equal intrinsic value.", "warn"));
    else {
      const { vol: _v, ...rest } = inp, b = premiumBounds(rest, pos as Right);
      let iv = "";
      try {
        iv = pct(impliedVol(rest, pos as Right, obs), 2);
      } catch (x) {
        iv = `Fails closed: ${(x as Error).message}`;
      }
      out.push(table("Implied volatility solve (bisection)", ["Item", "Value"], [
        ["No-arbitrage bounds on the premium", `${fmt(b.lower, 4)} to ${fmt(b.upper, 4)}`], ["Observed premium", fmt(obs, 4)],
        ["Theoretical value at your σ", fmt(val0, 4)], ["Observed − theoretical", `${signed(obs - val0)} (model difference, not a signal)`],
        ["Implied volatility", iv],
      ]));
    }

    // Futures
    const F = futuresFair(S, rate, yld, dead ? 0 : days);
    out.push("<h4>Futures fair value (cost of carry)</h4>");
    out.push(table("F = S·exp((r − q)·T) versus an optional observed futures price", ["Item", "Value"], [
      ["Fair value F", fmt(F, 4)], ["Carry (F − S)", signed(F - S)],
      ["Observed futures price", obsF === undefined ? "not entered" : fmt(obsF, 4)],
      ["Observed − fair", obsF === undefined ? "n/a" : `${signed(obsF - F)} (${pct((obsF - F) / F, 2)}), a model difference, not a signal`],
    ]));

    // Break-even and expiry P&L
    const be = breakevens(pos, K, paid);
    out.push("<h4>Break-even and net profit at expiry</h4>");
    out.push(`<p class="note">${e(`Break-even at expiry: ${be.length ? be.map((x) => fmt(x, 2)).join(" and ") : "none reachable"} (strike ${pos === "put" ? "−" : pos === "straddle" ? "±" : "+"} premium ${money(paid)}). Maximum loss for a long position is the total premium paid, ${money(paid * qty)}. Net = payoff − premium paid, times ${fmt(qty, 0)} units.`)}</p>`);
    const sc = [...new Set([0.8, 0.9, 1, 1.1, 1.2].map((m) => K * m).concat(S))].sort((a, b) => a - b);
    out.push(table("Net profit or loss at expiry by underlying price", ["Underlying at expiry", "Payoff per unit", "Net per unit", "Net × quantity"], sc.map((x) => {
      const gross = positionPayoff(pos, K, 0, x), net = gross - paid;
      return [`${fmt(x, 2)}${x === S ? " (current spot)" : ""}`, fmt(gross, 2), signed(net), signed(net * qty)];
    })));

    // Charts
    const lo = 0.6 * Math.min(S, K), hi = 1.4 * Math.max(S, K), xs = sp(lo, hi, 61), xl = (i: number) => fmt(xs[i], 0);
    const todayAt = (x: number) => positionValue({ ...inp, spot: x }, pos);
    out.push("<h4>Payoff at expiry and theoretical value today</h4>");
    out.push(lineChart({
      title: `${LABEL[pos]}: net profit at expiry and theoretical net value today versus underlying price`, zero: true, x: xl,
      caption: `Horizontal: underlying price. Vertical: net profit or loss for ${fmt(qty, 0)} units after paying the premium ${money(paid)} per unit. ${dead ? "Expired: only the expiry line applies." : "The curved line marks the position at today's theoretical value, not an expected outcome."}`,
      series: [{ name: "Net at expiry", values: xs.map((x) => positionPayoff(pos, K, paid, x) * qty), cls: "s0" },
        ...(dead ? [] : [{ name: "Theoretical net value today", values: xs.map((x) => (todayAt(x) - paid) * qty), cls: "s1" }])],
    }));
    if (live) {
      const gs = xs.map((x) => positionGreeks(bsm({ ...inp, spot: x }), pos));
      out.push("<h4>Greeks versus spot</h4><div class=\"opt-grid\">");
      for (const [k, nm, unit] of [["delta", "Delta", "per 1 spot unit"], ["gamma", "Gamma", "per 1 spot unit"], ["theta", "Theta", "per calendar day"], ["vega", "Vega", "per 1 vol point"]] as const)
        out.push(lineChart({ title: `${nm} of the ${pos} position versus spot`, caption: `${nm} ${unit}, per unit, versus spot.`, x: xl, height: 190, zero: true, series: [{ name: nm, values: gs.map((v) => v[k]), cls: "s0" }] }));
      out.push("</div>");
      const vs = sp(0.01, 1, 50);
      const at = (v: number, p: Position) => positionValue({ ...inp, vol: v }, p);
      out.push("<h4>Theoretical price versus volatility</h4>");
      out.push(lineChart({
        title: `Theoretical price versus volatility for ${LABEL[pos]}`, caption: `Price per unit at spot ${money(S)}, strike ${money(K)}, other inputs fixed. Your σ is ${pct(vol, 1)}.`, x: (i) => pct(vs[i], 0),
        series: [{ name: pos === "straddle" ? "Straddle" : LABEL[pos], values: vs.map((v) => at(v, pos)), cls: "s0" },
          ...(pos === "straddle" ? [{ name: "Call", values: vs.map((v) => at(v, "call")), cls: "s1" }, { name: "Put", values: vs.map((v) => at(v, "put")), cls: "s2" }] : [])],
      }));
    }

    // Heat table: spot x volatility
    out.push("<h4>Price heat table: spot × volatility</h4>");
    if (dead) out.push(label("Not shown: an expired contract has no volatility dependence.", "warn"));
    else {
      const ss = [0.8, 0.9, 0.95, 1, 1.05, 1.1, 1.2].map((m) => S * m), vv = vol > 0 ? [0.5, 0.75, 1, 1.25, 1.5].map((m) => vol * m) : [0.1, 0.2, 0.3, 0.4, 0.5];
      const grid = vv.map((v) => ss.map((s) => positionValue({ ...inp, spot: s, vol: v }, pos))), mx = Math.max(...grid.flat(), 1e-12);
      out.push(`<div class="tscroll" role="region" aria-label="Theoretical price by spot and volatility" tabindex="0"><table class="heat opt-heat"><caption>${e(`${LABEL[pos]} theoretical price per unit. Columns: spot. Rows: volatility. Deeper red is a higher price.`)}</caption><thead><tr><th scope="col">σ \\ S</th>${ss.map((s) => `<th scope="col">${fmt(s, 1)}</th>`).join("")}</tr></thead><tbody>${vv.map((v, r) => `<tr><th scope="row">${pct(v, 1)}</th>${grid[r].map((x, c) => { const [bg, fg] = redScale(x, 0, mx); return `<td${vol > 0 && r === 2 && c === 3 ? ' class="base"' : ""} style="background:${bg};color:${fg}">${fmt(x, 2)}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`);
    }
    out.push(`<p class="note">${e(LIMITS)}</p>`);
    return out.join("");
  });
  const banner = document.createElement("div");
  banner.className = "opt-banner";
  banner.innerHTML = label("THEORETICAL ONLY. Hypothetical inputs, not a quote, not the selected company's option.", "warn") + label("Contract finder: UNAVAILABLE — no licensed exchange derivatives archive is loaded.", "no");
  root.prepend(banner);
};
