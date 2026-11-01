import "./demo-technical.css";
import type { Mount } from "./demo-ctx.ts";
import { COMPANIES, STRATEGIES } from "./content.ts";
import { lineChart } from "./charts.ts";
import { e, fmt, group, metrics, number, pct, select, str, table, val, workstation } from "./ui.ts";
import {
  adx, atr, backtest, bollinger, curveStats, drawdownOf, ema, equityOf, holdReturns, levels, macd, MIN_TRADES, registry, relVolume, sampleStats, signals,
  splitIndex, stochastic, STRAT_PARAMS, synthSeries, TRADING_DAYS, type Arr, type Bar, type Params, type Sample, type Seed, type StratId, type Trade,
} from "./indicators.ts";

const W = 680, L = 56, R = 16;
const f1 = (v: number) => v.toFixed(1);
const num = (v: number | null, d = 2) => (v === null ? "n/a" : fmt(v, d));
const OVERLAYS: [string, string][] = [["sma12", "SMA 12"], ["sma26", "SMA 26"], ["ema12", "EMA 12"], ["ema26", "EMA 26"], ["wma20", "WMA 20"], ["bb", "Bollinger 20, 2 sd"], ["sr", "Swing support and resistance"]];
const PANES: [string, string][] = [["rsi", "RSI 14"], ["macd", "MACD 12, 26, 9"], ["stoch", "Stochastic 14, 3"], ["adx", "ADX 14 with +DI and -DI"]];
const RULES: Record<StratId, string> = {
  TREND_MOMENTUM: "Enter when EMA(fast) is above EMA(slow) and RSI(14) is at or above the entry level. Exit when EMA(fast) falls below EMA(slow) or RSI(14) falls below the exit level.",
  BREAKOUT_CONFIRM: "Enter when the close is above the highest high of the previous N bars (plus a buffer in ATR(14) units) and relative volume against the previous 20 bars is at least the minimum. Exit when the close is below the lowest low of the previous M bars. Today's close is never used for today's open.",
  MEAN_REVERSION: "Enter when the close is below the lower Bollinger band while it is above the regime SMA. Exit when the close returns to the band mid line, or when the signal expires after the stated number of bars held.",
};

// ---------- memoised fixed-parameter indicators ----------
type Bundle = ReturnType<typeof makeBundle>;
const memo = new Map<string, Bundle>();
function makeBundle(seed: number, es: Seed) {
  const b = synthSeries(seed), h = b.map((x) => x.h), l = b.map((x) => x.l), c = b.map((x) => x.c), s: Record<string, Arr> = {};
  const rows = registry(b, es);
  rows.forEach((r) => (s[r.id] = r.series));
  return { b, rows, s, bb: bollinger(c), ad: adx(h, l, c), lv: levels(h, l, 5), st: stochastic(h, l, c), mc: macd(c, 12, 26, 9, es), at: atr(h, l, c, 14), rv: relVolume(b.map((x) => x.v), 20) };
}
const bundle = (seed: number, es: Seed) => {
  const k = `${seed}|${es}`;
  if (!memo.has(k)) memo.set(k, makeBundle(seed, es));
  return memo.get(k) as Bundle;
};

// ---------- SVG helpers ----------
const line = (v: Arr, st: number, cw: number, y: (v: number) => number, cls: string) => {
  let d = "", up = false;
  for (let i = st; i < v.length; i++) { const x = v[i]; if (x === null) { up = false; continue; } d += `${up ? "L" : "M"}${f1(L + (i - st + 0.5) * cw)} ${f1(y(x))}`; up = true; }
  return `<path class="ln ${cls}" d="${d}"/>`;
};
const grid = (lo: number, hi: number, y: (v: number) => number, d = 2) =>
  [0, 1, 2, 3, 4].map((k) => { const v = lo + ((hi - lo) * k) / 4; return `<line class="gl" x1="${L}" x2="${W - R}" y1="${f1(y(v))}" y2="${f1(y(v))}"/><text x="${L - 6}" y="${f1(y(v) + 4)}" text-anchor="end">${e(fmt(v, d))}</text>`; }).join("");
const range = (arrs: Arr[], st: number) => {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (let i = st; i < a.length; i++) { const v = a[i]; if (v !== null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
  return [lo, hi] as const;
};
const legend = (items: [string, string][]) => `<ul class="legend tc-legend">${items.map(([t, c]) => `<li class="${c}">${e(t)}</li>`).join("")}</ul>`;

interface PriceOpts { b: Bar[]; st: number; candles: boolean; ov: { name: string; lines: Arr[]; cls: string }[]; trades: Trade[]; showFills: boolean; rvol: Arr }
function pricePane(o: PriceOpts) {
  const { b, st } = o, n = b.length, win = n - st, cw = (W - L - R) / win, bw = Math.max(0.8, cw * 0.68), H = 320, pb = 232, vt = 244, vb = 296;
  const lines = o.ov.flatMap((x) => x.lines), [alo, ahi] = range([...lines, b.map((x) => x.h), b.map((x) => x.l)], st);
  const pad = (ahi - alo) * 0.05 || 1, lo = alo - pad, hi = ahi + pad, y = (v: number) => 10 + (1 - (v - lo) / (hi - lo)) * (pb - 10);
  const vmax = Math.max(...b.slice(st).map((x) => x.v)), vy = (v: number) => vb - (v / vmax) * (vb - vt);
  const X = (i: number) => L + (i - st + 0.5) * cw;
  let uw = "", ub = "", dw = "", db = "", close = "", vn = "", vs = "";
  for (let i = st; i < n; i++) {
    const x = b[i];
    if (o.candles) {
      const up = x.c >= x.o, top = y(Math.max(x.o, x.c)), h = Math.max(0.8, y(Math.min(x.o, x.c)) - top), w = `M${f1(X(i))} ${f1(y(x.h))}V${f1(y(x.l))}`, body = `M${f1(X(i) - bw / 2)} ${f1(top)}h${f1(bw)}v${f1(h)}h${f1(-bw)}Z`;
      if (up) { uw += w; ub += body; } else { dw += w; db += body; }
    } else close += `${i === st ? "M" : "L"}${f1(X(i))} ${f1(y(x.c))}`;
    const bar = `M${f1(X(i) - bw / 2)} ${vb}V${f1(vy(x.v))}h${f1(bw)}V${vb}Z`;
    if ((o.rvol[i] ?? 0) >= 2) vs += bar; else vn += bar;
  }
  const marks = o.showFills ? o.trades.flatMap((t) => {
    const m: string[] = [];
    if (t.inI >= st) m.push(`<path class="tc-in" d="M${f1(X(t.inI))} ${f1(y(b[t.inI].l) + 4)}l-4.5 8h9z"><title>Entry fill ${e(b[t.inI].d)} at ${e(fmt(t.inPx))}</title></path>`);
    if (t.outI !== null && t.outI >= st && t.outPx !== null) m.push(`<path class="tc-out" d="M${f1(X(t.outI))} ${f1(y(b[t.outI].h) - 4)}l-4.5 -8h9z"><title>Exit fill ${e(b[t.outI].d)} at ${e(fmt(t.outPx))}</title></path>`);
    return m;
  }).join("") : "";
  const first = b[st].d, last = b[n - 1].d, mid = b[st + Math.floor(win / 2)].d;
  const xl = [[L, first, "start"], [(L + W - R) / 2, mid, "middle"], [W - R, last, "end"]].map(([x, t, a]) => `<text x="${x}" y="${H - 6}" text-anchor="${a}">${e(String(t))}</text>`).join("");
  const label = `Synthetic ${o.candles ? "candlestick" : "close line"} chart with volume, ${win} sessions from ${first} to ${last}. Close moved from ${fmt(b[st].c)} to ${fmt(b[n - 1].c)}. Synthetic series, not market data.`;
  const items: [string, string][] = o.candles ? [["Up bar (hollow)", "tc-lgu"], ["Down bar (filled)", "tc-lgd"]] : [["Close", "s0"]];
  o.ov.forEach((x, k) => items.push([x.name, `tc-lg${k}`]));
  if (o.showFills) items.push(["Entry fill", "tc-lgin"], ["Exit fill", "tc-lgout"]);
  items.push(["Volume (relative volume of 2 or more highlighted)", "tc-lgv"]);
  return `<figure class="chart tc-chart">${legend(items)}
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(label)}"><title>${e(label)}</title>${grid(lo, hi, y)}
<path class="tc-vol" d="${vn}"/><path class="tc-vol hot" d="${vs}"/>
${o.candles ? `<path class="tc-wick up" d="${uw}"/><path class="tc-body up" d="${ub}"/><path class="tc-wick dn" d="${dw}"/><path class="tc-body dn" d="${db}"/>` : `<path class="ln s0" d="${close}"/>`}
${o.ov.map((x, k) => x.lines.map((a, j) => line(a, st, cw, y, `tc-ov${k}${x.cls}${j ? " thin" : ""}`)).join("")).join("")}${marks}${xl}</svg>
<figcaption>Synthetic series. Prices are generated, not observed. Axis: price (above), volume (below).</figcaption></figure>`;
}

interface OscLine { name: string; v: Arr; cls: string }
function osc(title: string, ls: OscLine[], b: Bar[], st: number, lo: number, hi: number, refs: number[], hist?: Arr, cap = "") {
  const n = b.length, win = n - st, cw = (W - L - R) / win, H = 150, y = (v: number) => 10 + (1 - (v - lo) / (hi - lo)) * (H - 24), z = y(Math.max(lo, Math.min(hi, 0)));
  let hp = "", hn = "";
  if (hist) for (let i = st; i < n; i++) { const v = hist[i]; if (v === null) continue; const x = L + (i - st + 0.5) * cw, d = `M${f1(x - cw * 0.35)} ${f1(z)}V${f1(y(v))}h${f1(cw * 0.7)}V${f1(z)}Z`; if (v >= 0) hp += d; else hn += d; }
  const rf = refs.map((r) => `<line class="zero" x1="${L}" x2="${W - R}" y1="${f1(y(r))}" y2="${f1(y(r))}"/><text x="${W - R}" y="${f1(y(r) - 3)}" text-anchor="end">${r}</text>`).join("");
  const label = `${title}, synthetic series, ${win} sessions. ${ls.map((x) => `${x.name} last ${num(x.v[n - 1])}`).join(", ")}.`;
  return `<figure class="chart tc-chart"><h4>${e(title)}</h4>${legend(ls.map((x) => [x.name, x.cls]))}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(label)}"><title>${e(label)}</title>${grid(lo, hi, y, 0)}${rf}${hist ? `<path class="tc-hp" d="${hp}"/><path class="tc-hn" d="${hn}"/>` : ""}${ls.map((x) => line(x.v, st, cw, y, x.cls)).join("")}</svg><figcaption>${e(cap || "Synthetic series.")}</figcaption></figure>`;
}

// ---------- strategy view ----------
function statsRows(a: Sample, ba: ReturnType<typeof curveStats>, bb: Sample, bbb: ReturnType<typeof curveStats>, years: [number, number]) {
  const cell = (s: Sample, k: "total" | "cagr" | "mdd" | "sharpe" | "hit" | "turnover", fmtr: (v: number) => string) => (s.insufficient ? "Insufficient sample" : fmtr(s[k]));
  const cg = (s: Sample, yrs: number) => (yrs < 1 ? "n/a (under 1 year)" : s.insufficient ? "Insufficient sample" : pct(s.cagr));
  const bcg = (c: ReturnType<typeof curveStats>, yrs: number) => (yrs < 1 ? "n/a (under 1 year)" : pct(c.cagr));
  return [
    ["Total return", cell(a, "total", pct), pct(ba.total), cell(bb, "total", pct), pct(bbb.total)],
    ["CAGR", cg(a, years[0]), bcg(ba, years[0]), cg(bb, years[1]), bcg(bbb, years[1])],
    ["Max drawdown", cell(a, "mdd", pct), pct(ba.mdd), cell(bb, "mdd", pct), pct(bbb.mdd)],
    ["Sharpe (252, rf = 0)", cell(a, "sharpe", (v) => fmt(v)), fmt(ba.sharpe), cell(bb, "sharpe", (v) => fmt(v)), fmt(bbb.sharpe)],
    ["Closed trades", a.insufficient ? `${a.trades} of ${MIN_TRADES} needed` : String(a.trades), "n/a", bb.insufficient ? `${bb.trades} of ${MIN_TRADES} needed` : String(bb.trades), "n/a"],
    ["Hit rate", cell(a, "hit", pct), "n/a", cell(bb, "hit", pct), "n/a"],
    ["Turnover (one-way fills per year)", cell(a, "turnover", (v) => fmt(v, 1)), "0", cell(bb, "turnover", (v) => fmt(v, 1)), "0"],
  ];
}

export const mount: Mount = (root, ctx) => {
  const name = () => COMPANIES.find((c) => c.ticker === ctx.company())?.name ?? ctx.company();
  const banner = () => `SYNTHETIC SERIES. Not ${name()} prices and not market history.`;
  const chk = (id: string, text: string, on = false) => `<label class="chk" for="tc_${id}"><input id="tc_${id}" name="tc_${id}" type="checkbox"${on ? " checked" : ""}> <span>${e(text)}</span></label>`;
  const params = (Object.keys(STRAT_PARAMS) as StratId[]).map((id) => `<div class="tc-params" data-strat="${id}">${STRAT_PARAMS[id].map((p) => number(`tc_${p.key}`, p.label, p.value, String(p.step))).join("")}</div>`).join("");
  const controls = `<p class="status warn tc-banner" id="tc-banner" role="note">${e(banner())}</p>
${group("Synthetic series", select("tc_seed", "Series seed (independent of the company)", [1, 2, 3, 4, 5].map((k) => [String(k), `Series ${k}`]), "1") + select("tc_win", "Sessions shown", [["120", "Last 120"], ["250", "Last 250"], ["504", "Last 504"], ["756", "All 756"]], "250") + select("tc_type", "Price display", [["candle", "Candlesticks"], ["line", "Close line"]], "candle") + select("tc_eseed", "EMA initialisation", [["sma", "SMA seed (mean of first n)"], ["first", "First price seed"]], "sma"))}
${group("Price overlays (maximum 3)", OVERLAYS.map(([k, t]) => chk(`ov_${k}`, t, k === "sma12" || k === "ema26")).join(""))}
${group("Panes and tables", PANES.map(([k, t]) => chk(`p_${k}`, t, k === "rsi" || k === "macd")).join("") + chk("fills", "Strategy entry and exit fills on chart", true) + chk("tbl", "Data table for the chart window") + chk("reg", "Indicator registry", true))}
${group("Strategy", select("tc_strat", "Strategy", STRATEGIES.map(([k]): [string, string] => [k, k]), "TREND_MOMENTUM") + params + number("tc_cost", "One-way cost", 10, "1", "bps", "Charged on every fill.") + number("tc_stop", "ATR stop multiple", 0, "0.5", "x ATR(14)", "0 switches the stop off."))}`;
  let notice = "";
  const { form, redraw } = workstation(root, controls, (fm) => {
    const g = (k: string) => (fm.elements.namedItem(`tc_${k}`) as HTMLInputElement).checked;
    const seed = val(fm, "tc_seed"), win = val(fm, "tc_win"), es = str(fm, "tc_eseed") as Seed, strat = str(fm, "tc_strat") as StratId, cost = val(fm, "tc_cost"), stopK = val(fm, "tc_stop");
    if (![1, 2, 3, 4, 5].includes(seed) || ![120, 250, 504, 756].includes(win) || !(es === "sma" || es === "first") || !(strat in STRAT_PARAMS)) throw new Error("Choose a valid series, window, EMA initialisation and strategy.");
    if (!(cost >= 0 && cost <= 500) || !(stopK >= 0 && stopK <= 20)) throw new Error("Cost must be 0 to 500 bps and the ATR stop 0 to 20.");
    fm.querySelectorAll<HTMLElement>("[data-strat]").forEach((el) => (el.hidden = el.dataset.strat !== strat));
    const p: Params = {};
    for (const d of STRAT_PARAMS[strat]) {
      const v = val(fm, `tc_${d.key}`);
      if (!Number.isFinite(v) || v < d.min || (d.int && !Number.isInteger(v)) || v > 400) throw new Error(`${d.label}: enter ${d.int ? "a whole number" : "a number"} from ${d.min} to 400.`);
      p[d.key] = v;
    }
    if (strat === "TREND_MOMENTUM" && p.fast >= p.slow) throw new Error("Fast EMA must be shorter than slow EMA.");
    const B = bundle(seed, es), b = B.b, n = b.length, st = n - win, k = splitIndex(n), c = b.map((x) => x.c);
    const sig = signals(strat, b, p, es), bt = backtest(b, sig, { costBps: cost, stopK });
    const cols: [string, Arr][] = [];
    // overlays (at most three)
    const on = OVERLAYS.filter(([id]) => g(`ov_${id}`)).slice(0, 3).map(([id, t]) => {
      const ls = id === "bb" ? [B.bb.mid, B.bb.up, B.bb.lo] : id === "sr" ? [B.lv.res, B.lv.sup] : [B.s[id]];
      ls.forEach((a, q) => cols.push([ls.length > 1 ? `${t} ${["a", "b", "c"][q]}` : t, a]));
      return { name: t, lines: ls, cls: id === "sr" ? " dash" : "" };
    });
    const html: string[] = [];
    html.push(`<p class="status warn tc-banner">${e(banner())}</p><p class="note">Series ${seed} is a seeded random walk with regime and volatility clustering. Dates are weekdays with no holidays. Changing the company does not change these prices.${notice ? ` ${e(notice)}` : ""}</p>`);
    // readout
    const L1 = n - 1;
    html.push(`<h4>Indicator readout at the last synthetic session (${e(b[L1].d)})</h4>${metrics([["Close", num(c[L1])], ["RSI 14", num(B.s.rsi[L1])], ["MACD histogram", num(B.mc.hist[L1])], ["ATR 14", num(B.at[L1])], ["ADX 14", num(B.ad.adx[L1])], ["Relative volume", num(B.rv[L1])], ["Realised vol", B.s.rv[L1] === null ? "n/a" : pct(B.s.rv[L1] as number)], ["OBV", num(B.s.obv[L1], 0)]])}`);
    html.push(pricePane({ b, st, candles: str(fm, "tc_type") === "candle", ov: on, trades: bt.trades, showFills: g("fills"), rvol: B.rv }));
    // panes
    const panes: string[] = [];
    if (g("p_rsi")) { panes.push(osc("RSI 14 (Wilder)", [{ name: "RSI", v: B.s.rsi, cls: "s1" }], b, st, 0, 100, [30, 70], undefined, "Reference lines at 30 and 70.")); cols.push(["RSI 14", B.s.rsi]); }
    if (g("p_macd")) {
      const [lo, hi] = range([B.mc.line, B.mc.signal, B.mc.hist], st), m = Math.max(Math.abs(lo), Math.abs(hi)) * 1.1 || 1;
      panes.push(osc("MACD 12, 26, 9", [{ name: "MACD line", v: B.mc.line, cls: "s1" }, { name: "Signal", v: B.mc.signal, cls: "s2" }], b, st, -m, m, [0], B.mc.hist, `EMA seed: ${es === "sma" ? "mean of first n" : "first price"}. Bars are the histogram.`));
      cols.push(["MACD", B.mc.line], ["MACD signal", B.mc.signal], ["MACD hist", B.mc.hist]);
    }
    if (g("p_stoch")) { panes.push(osc("Stochastic 14, 3", [{ name: "%K", v: B.st.k, cls: "s1" }, { name: "%D", v: B.st.d, cls: "s2" }], b, st, 0, 100, [20, 80], undefined, "Reference lines at 20 and 80.")); cols.push(["Stoch %K", B.st.k], ["Stoch %D", B.st.d]); }
    if (g("p_adx")) {
      const [, hi] = range([B.ad.adx, B.ad.pdi, B.ad.mdi], st);
      panes.push(osc("ADX 14, +DI, -DI", [{ name: "ADX", v: B.ad.adx, cls: "s0" }, { name: "+DI", v: B.ad.pdi, cls: "s1" }, { name: "-DI", v: B.ad.mdi, cls: "s4" }], b, st, 0, Math.max(40, Math.ceil(hi / 10) * 10), [25], undefined, "Reference line at 25."));
      cols.push(["ADX", B.ad.adx], ["+DI", B.ad.pdi], ["-DI", B.ad.mdi]);
    }
    html.push(panes.join(""));
    if (g("tbl")) {
      const rows: string[][] = [];
      for (let i = st; i < n; i++) rows.push([b[i].d, fmt(b[i].o), fmt(b[i].h), fmt(b[i].l), fmt(b[i].c), fmt(b[i].v, 0), ...cols.map(([, a]) => num(a[i]))]);
      html.push(`<h4>Data table (synthetic)</h4>${table(`Synthetic OHLCV and selected indicators, ${win} sessions`, ["Date", "Open", "High", "Low", "Close", "Volume", ...cols.map(([t]) => t)], rows, "grid tc-data")}`);
    }
    // EMA seed comparison
    const ea = ema(c, 26, "sma"), ef = ema(c, 26, "first"), pts = [25, 26, 30, 40, 60, 100, 200];
    html.push(`<h4>EMA initialisation: the two seeds differ in warm-up</h4>${table("EMA 26 under both seeds, same synthetic closes", ["Bar", "Date", "SMA seed", "First price seed", "Difference"], pts.map((i) => [String(i), b[i].d, num(ea[i], 4), num(ef[i], 4), num(Math.abs((ea[i] as number) - (ef[i] as number)), 4)]))}<p class="note">The SMA seed is undefined until bar 25. The first price seed exists from bar 0 but is biased by the first close. The gap shrinks by a factor of (1 - 2/27) per bar, so it is negligible after a few hundred bars. The control above chooses the seed for the chart, MACD and the trend strategy.</p>`);
    // strategy
    const years = (a: number, z: number) => (z - a) / TRADING_DAYS, hold = holdReturns(b);
    const is = sampleStats(bt, 0, k), oos = sampleStats(bt, k, n), bi = curveStats(hold, 0, k), bo = curveStats(hold, k, n);
    html.push(`<h2 class="tc-h">Strategy: ${e(strat)}</h2><p class="note">${e(STRATEGIES.find(([s]) => s === strat)?.[1] ?? "")} ${e(RULES[strat])}</p>
<p class="note">Long or cash only, no leverage. A signal is computed on the close of bar t and filled at the open of bar t+1. One-way cost ${e(String(cost))} bps on every fill. ${stopK > 0 ? `ATR stop at ${e(String(stopK))} x ATR(14) of the signal bar below the entry fill; after a stop the rule waits for a fresh entry condition.` : "No stop."} Sharpe uses ${TRADING_DAYS} sessions a year and a zero risk-free rate. The benchmark is buy and hold with no costs. A signal state is a historical research output on a synthetic series, not a recommendation.</p>`);
    html.push(`<h4>In-sample and out-of-sample</h4>${table(`Strategy metrics. In-sample: ${b[0].d} to ${b[k - 1].d} (first 70%). Out-of-sample: ${b[k].d} to ${b[n - 1].d} (last 30%).`, ["Metric", `In-sample strategy (${k} bars)`, "In-sample buy and hold", `Out-of-sample strategy (${n - k} bars)`, "Out-of-sample buy and hold"], statsRows(is, bi, oos, bo, [years(0, k), years(k, n)]))}`);
    if (is.insufficient || oos.insufficient) html.push(`<p class="status warn">Insufficient sample: metrics are withheld for any sample with fewer than ${MIN_TRADES} closed trades. Fewer trades than that cannot separate skill from chance. A trade is counted in the sample of its entry fill, and the equity curve is continuous across the split.</p>`);
    const lastSig = bt.pending === "enter" ? "Cash at the last close; the entry condition is met, with a fill due at the next open (outside this series)." : bt.pending === "exit" ? "Long at the last close; the exit condition is met, with a fill due at the next open (outside this series)." : bt.inPos ? "Long state at the last close." : "Cash state at the last close.";
    html.push(`<p class="note"><strong>Signal state at ${e(b[L1].d)}:</strong> ${e(lastSig)} Historical research output on synthetic data.</p>`);
    const date = (i: number) => b[i].d;
    html.push(lineChart({ title: `Equity curve of ${strat} against buy and hold, synthetic series ${seed}`, caption: `Growth of 1 after ${cost} bps one-way costs. Out-of-sample begins ${date(k)}. Synthetic series.`, series: [{ name: "Strategy", values: equityOf(bt.ret), cls: "s1" }, { name: "Buy and hold", values: equityOf(hold), cls: "s4" }], x: date, height: 240 }));
    html.push(lineChart({ title: `Drawdown of ${strat} against buy and hold, synthetic series ${seed}`, caption: "Drawdown from the running peak. Synthetic series.", series: [{ name: "Strategy", values: drawdownOf(bt.ret), cls: "s1" }, { name: "Buy and hold", values: drawdownOf(hold), cls: "s4" }], x: date, zero: true, yFmt: (v) => pct(v, 0), height: 200 }));
    const tr = bt.trades.map((t, q) => [String(q + 1), date(t.sigI), date(t.inI), fmt(t.inPx), t.outSig === null && t.outI !== null ? "stop order" : t.outSig === null ? "none yet" : date(t.outSig), t.outI === null ? "open" : date(t.outI), t.outPx === null ? "open" : fmt(t.outPx), t.why, pct(t.ret), t.inI < k ? "In-sample" : "Out-of-sample"]);
    html.push(`<h4>Trades (${bt.trades.length})</h4>${tr.length ? table("Trades with signal date and execution date", ["#", "Entry signal date", "Entry fill date", "Entry fill price", "Exit signal date", "Exit fill date", "Exit fill price", "Exit reason", "Net return", "Sample"], tr, "grid tc-trades") : '<p class="note">No trades on this series with these parameters.</p>'}`);
    // registry
    if (g("reg")) html.push(`<h4>Indicator registry</h4>${table(`Indicators, parameters, initialisation and warm-up for EMA seed "${es}"`, ["Indicator", "Group", "Parameters", "Initialisation", "Warm-up (null bars)", "First valid date"], B.rows.map((r) => [r.name, r.group, r.params, r.init, String(r.warmup), r.warmup < n ? b[r.warmup].d : "n/a"]), "grid tc-reg")}<p class="note">Warm-up is the number of leading bars with no value. Each declared figure is checked against the computed output in the test suite. Swing levels are confirmed five bars after the extreme, so a level is never drawn before it could have been known.</p>`);
    html.push(`<p class="note">Limitations: one synthetic path per seed, no real prices, no splits or dividends, no spread or slippage beyond the stated bps, no tax. With about three years of daily bars most rules trade too rarely to measure, which is why small samples are withheld rather than reported.</p>`);
    return html.join("");
  });
  // Enforce at most three price overlays before the redraw reads the form (capture runs ahead of the form's own listeners).
  root.addEventListener("input", (ev) => {
    const t = ev.target as HTMLInputElement;
    if (!t.name?.startsWith("tc_ov_")) return;
    const over = form.querySelectorAll<HTMLInputElement>('input[name^="tc_ov_"]:checked').length > 3;
    if (over) t.checked = false;
    notice = over ? "At most three price overlays can be shown at once; clear one first." : "";
  }, true);
  ctx.onCompany(() => {
    const el = root.querySelector("#tc-banner");
    if (el) el.textContent = banner();
    redraw();
  });
};
