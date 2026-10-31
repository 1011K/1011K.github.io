import { dcf, type DCFInput } from "./models";
import {
  syntheticSeries,
  backtest,
  expiryPayoff,
  allocation,
} from "./labs-models";
import { escapeHTML as e } from "./publication";
const fmt = (n: number, d = 1) =>
  n.toLocaleString("en-IN", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
const pct = (n: number) => `${fmt(n * 100)}%`;
const range = (
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  unit = "",
) =>
  `<label class="control" for="${id}"><span>${label}<output for="${id}" id="${id}-out">${value}${unit}</output></span><input id="${id}" name="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></label>`;
const number = (
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
) =>
  `<label class="control" for="${id}">${label}<input id="${id}" name="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}" required></label>`;
const select = (id: string, label: string, options: [string, string][]) =>
  `<label class="control" for="${id}">${label}<select id="${id}" name="${id}">${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join("")}</select></label>`;
const metrics = (values: [string, string][]) =>
  `<dl class="metrics">${values.map(([name, value]) => `<div><dt>${e(name)}</dt><dd>${e(value)}</dd></div>`).join("")}</dl>`;
const figure = (label: string, content: string, caption: string) =>
  `<figure class="chart"><svg viewBox="0 0 680 280" role="img" aria-label="${e(label)}"><title>${e(label)}</title>${content}</svg><figcaption>${caption}</figcaption></figure>`;
const table = (caption: string, headers: string[], rows: string[][]) =>
  `<div class="table-wrap"><table><caption>${caption}</caption><thead><tr>${headers.map((h) => `<th scope="col">${e(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v, i) => (i ? `<td>${e(v)}</td>` : `<th scope="row">${e(v)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
const chart = (
  label: string,
  series: { name: string; values: number[]; className?: string }[],
  caption: string,
  xLabel = (i: number) => String(i + 1),
  highlight?: { fraction: number; value: number; label: string },
) => {
  const values = series.flatMap((s) => s.values);
  const low = Math.min(...values),
    high = Math.max(...values);
  const pad = Math.max((high - low) * 0.1, 0.01);
  const min = low - pad,
    max = high + pad;
  const x = (i: number) => 62 + (i / (series[0].values.length - 1)) * 590,
    y = (v: number) => 235 - ((v - min) / (max - min)) * 210;
  let body = Array.from({ length: 5 }, (_, i) => {
    const v = min + ((max - min) * i) / 4;
    return `<line class="gridline" x1="62" x2="652" y1="${y(v)}" y2="${y(v)}"/><text x="53" y="${y(v) + 4}" text-anchor="end">${fmt(v, Math.abs(v) < 2 ? 2 : 0)}</text>`;
  }).join("");
  body += series
    .map(
      (s, i) =>
        `<path class="${s.className || ["primary", "secondary", "third"][i]}" d="${s.values.map((v, j) => `${j ? "L" : "M"}${x(j).toFixed(2)} ${y(v).toFixed(2)}`).join(" ")}"/>`,
    )
    .join("");
  const n = series[0].values.length;
  body += [0, Math.floor((n - 1) / 2), n - 1]
    .map(
      (i) =>
        `<text x="${x(i)}" y="261" text-anchor="middle">${e(xLabel(i))}</text>`,
    )
    .join("");
  if (highlight)
    body += `<line x1="${62 + highlight.fraction * 590}" x2="${62 + highlight.fraction * 590}" y1="25" y2="235" stroke="#b39371" stroke-dasharray="3 5"/><circle cx="${62 + highlight.fraction * 590}" cy="${y(highlight.value)}" r="5" fill="#f1d0a6"><title>${e(highlight.label)}</title></circle>`;
  return `<div class="legend">${series.map((s) => `<span>${e(s.name)}</span>`).join("")}</div>${figure(label, body, caption)}`;
};
function bind(
  id: string,
  controls: string,
  render: (v: (id: string) => number, form: HTMLFormElement) => string,
) {
  const host = document.getElementById(`${id}-workspace`)!;
  host.innerHTML = `<div class="lab-grid"><form class="assumptions" id="${id}-form"><h4>Assumptions & controls</h4>${controls}</form><div class="workspace"><div class="lab-error" role="alert"></div><div class="result" aria-live="off"></div><p class="fine update-status" role="status" aria-live="polite"></p></div></div>`;
  const form = host.querySelector("form")!,
    result = host.querySelector<HTMLElement>(".result")!,
    error = host.querySelector<HTMLElement>(".lab-error")!;
  const update = () => {
    form
      .querySelectorAll<HTMLInputElement>('input[type="range"]')
      .forEach((i) => {
        form.querySelector(`#${i.id}-out`)!.textContent =
          i.value + i.dataset.unit;
      });
    try {
      if (!form.checkValidity())
        throw Error(
          "Enter values within the displayed limits; required fields cannot be blank.",
        );
      const v = (name: string) => {
        const field = form.elements.namedItem(name) as HTMLInputElement;
        if (field.value.trim() === "")
          throw Error("Required values cannot be blank.");
        return Number(field.value);
      };
      const previousOpen = Array.from(result.querySelectorAll("details")).map(
        (d) => d.open,
      );
      result.innerHTML = render(v, form);
      result
        .querySelectorAll("details")
        .forEach((d, i) => (d.open = previousOpen[i] ?? false));
      error.textContent = "";
      host.querySelector(".update-status")!.textContent =
        "Charts and results updated from current assumptions.";
    } catch (err) {
      result.replaceChildren();
      error.textContent = (err as Error).message;
      host.querySelector(".update-status")!.textContent =
        "Results unavailable. Correct inputs to recompute.";
    }
  };
  form.addEventListener("submit", (ev) => ev.preventDefault());
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
export function mountLabs() {
  bind(
    "financial",
    range("revenue", "Base revenue / ₹ cr", 100, 3000, 50, 1000) +
      range("growth", "Annual revenue growth", -5, 20, 0.5, 8, "%") +
      range("margin", "Operating margin", 0, 40, 0.5, 18, "%") +
      range("wacc", "WACC / annual", 3, 20, 0.5, 11, "%") +
      range("terminalGrowth", "Terminal growth", 0, 8, 0.5, 3, "%") +
      range("tax", "Tax rate", 0, 50, 1, 25, "%") +
      range("reinvestment", "Reinvestment / NOPAT", 0, 100, 1, 30, "%") +
      number(
        "debt",
        "Net debt / ₹ cr (negative = cash)",
        -5000,
        5000,
        10,
        200,
      ) +
      select("scenario", "Scenario growth adjustment", [
        ["0", "Base / no adjustment"],
        ["2", "Higher growth / +2 pp"],
        ["-2", "Lower growth / −2 pp"],
      ]) +
      '<p class="fine">Hypothetical consolidated business. No issuer inputs, sourced peers or quoted prices.</p>',
    (v) => {
      const i: DCFInput = {
        revenue: v("revenue"),
        growth: (v("growth") + v("scenario")) / 100,
        margin: v("margin") / 100,
        wacc: v("wacc") / 100,
        terminalGrowth: v("terminalGrowth") / 100,
        tax: v("tax") / 100,
        reinvestment: v("reinvestment") / 100,
      };
      const r = dcf(i),
        debt = v("debt");
      const rates = [-2, -1, 0, 1, 2].map((offset) => i.wacc + offset / 100),
        gs = [-1, 0, 1].map((offset) => i.terminalGrowth + offset / 100);
      const validValues = rates.flatMap((w) =>
        gs.flatMap((g) =>
          w > g && w > 0
            ? [dcf({ ...i, wacc: w, terminalGrowth: g }).value]
            : [],
        ),
      );
      const max = Math.max(1, ...validValues);
      const heat = `<div class="table-wrap"><table class="heat"><caption>WACC × terminal growth sensitivity / enterprise value ₹ cr. Invalid WACC ≤ growth cells remain unavailable.</caption><thead><tr><th scope="col">WACC / g</th>${gs.map((g) => `<th scope="col">${pct(g)}</th>`).join("")}</tr></thead><tbody>${rates
        .map(
          (w) =>
            `<tr><th scope="row">${pct(w)}</th>${gs
              .map((g) => {
                if (w <= g || w <= 0) return "<td>Unavailable</td>";
                const value = dcf({ ...i, wacc: w, terminalGrowth: g }).value;
                return `<td style="--heat:${(0.08 + (0.5 * value) / max).toFixed(3)}">${fmt(value, 0)}</td>`;
              })
              .join("")}</tr>`,
        )
        .join("")}</tbody></table></div>`;
      const safeRates = Array.from(
        { length: 9 },
        (_, n) =>
          Math.max(i.terminalGrowth + 0.01, 0.01, i.wacc - 0.04) + n * 0.01,
      );
      const interpretation =
        r.value === 0
          ? "Zero operating cash flow gives zero enterprise value. Terminal share is undefined."
          : `Terminal value supplies ${pct(r.terminalShare!)} of enterprise value. A higher discount rate reduces value in this positive-cash-flow illustration.`;
      return (
        metrics([
          ["Enterprise value / ₹ cr", fmt(r.value, 0)],
          ["Equity value / ₹ cr", fmt(r.value - debt, 0)],
          [
            "Terminal share",
            r.terminalShare === null ? "Unavailable" : pct(r.terminalShare),
          ],
        ]) +
        chart(
          "Enterprise value across WACC",
          [
            {
              name: "EV / ₹ cr",
              values: safeRates.map((w) => dcf({ ...i, wacc: w }).value),
            },
          ],
          "Horizontal: annual WACC. Vertical: hypothetical enterprise value in ₹ crore.",
          (n) => pct(safeRates[n]),
        ) +
        `<p class="interpretation">${interpretation} Equity value = EV − net debt; negative equity is not a per-share target.</p>` +
        heat +
        `<details><summary>Methods, provenance & annual cash flows</summary><p>Independent standard FCFF / Gordon-growth illustration. Revenueₜ = revenue₀ × (1 + growth)ᵗ; NOPAT = revenue × operating margin × (1 − tax); FCFF = NOPAT × (1 − reinvestment). EV = Σ FCFFₜ/(1+WACC)ᵗ + [FCFF₅×(1+g)/(WACC−g)]/(1+WACC)⁵. Equity = EV − net debt. Constant margin, tax and reinvestment; five annual periods, no share count or peer figures. Terminal growth must remain below WACC.</p>${table(
          "Current assumptions / hypothetical consolidated business",
          ["Assumption", "Value"],
          [
            ["Base revenue", `₹ ${fmt(i.revenue)} cr`],
            ["Scenario annual growth", pct(i.growth)],
            ["Operating margin", pct(i.margin)],
            ["Tax", pct(i.tax)],
            ["Reinvestment / NOPAT", pct(i.reinvestment)],
            ["WACC", pct(i.wacc)],
            ["Terminal growth", pct(i.terminalGrowth)],
            ["Net debt", `₹ ${fmt(debt)} cr`],
          ],
        )}${table(
          "Five-year forecast / ₹ crore",
          ["Year", "Revenue", "NOPAT", "FCFF"],
          r.cashFlows.map((c, n) => {
            const revenue = i.revenue * (1 + i.growth) ** (n + 1);
            return [
              String(n + 1),
              fmt(revenue),
              fmt(revenue * i.margin * (1 - i.tax)),
              fmt(c),
            ];
          }),
        )}<p>Terminal-year reinvestment is held constant for teaching simplicity; no sustainable-growth ROIC assumption is inferred.</p></details>`
      );
    },
  );
  const candles = syntheticSeries();
  bind(
    "technical",
    select("strategy", "Rule variant", [
      ["trend", "EMA trend / long or cash"],
      ["rsi", "RSI threshold / long or cash"],
    ]) +
      range("period", "Indicator period", 3, 40, 1, 14, " sessions") +
      range("cost", "One-way costs + slippage", 0, 100, 1, 15, " bps") +
      '<p class="fine">No shorting or leverage. Synthetic session index, not calendar dates. Parameters are illustrative, never optimised.</p>',
    (v, form) => {
      const strategy = (
        form.elements.namedItem("strategy") as HTMLSelectElement
      ).value as "trend" | "rsi";
      const r = backtest(candles, {
        strategy,
        period: v("period"),
        costBps: v("cost"),
      });
      const start = 60,
        end = candles.length,
        visible = candles.slice(start, end),
        min = Math.min(...visible.map((c) => c.low)) * 0.98,
        max = Math.max(...visible.map((c) => c.high)) * 1.02;
      const x = (n: number) => 62 + (n / (visible.length - 1)) * 590,
        y = (p: number) => 195 - ((p - min) / (max - min)) * 170;
      let drawing = [min, (min + max) / 2, max]
        .map(
          (value) =>
            `<line class="gridline" x1="62" x2="652" y1="${y(value)}" y2="${y(value)}"/><text x="53" y="${y(value) + 4}" text-anchor="end">${fmt(value, 0)}</text>`,
        )
        .join("");
      const volumeMax = Math.max(...visible.map((c) => c.volume));
      drawing += visible
        .map((c, n) => {
          const color = c.close >= c.open ? "#e4dfd4" : "#a78665";
          return `<line x1="${x(n)}" x2="${x(n)}" y1="${y(c.high)}" y2="${y(c.low)}" stroke="${color}"/><rect x="${x(n) - 1.4}" y="${y(Math.max(c.open, c.close))}" width="2.8" height="${Math.max(1, Math.abs(y(c.open) - y(c.close)))}" fill="${color}"/><rect x="${x(n) - 1.4}" y="${240 - (c.volume / volumeMax) * 28}" width="2.8" height="${(c.volume / volumeMax) * 28}" fill="#817057" opacity=".6"/>`;
        })
        .join("");
      drawing += ["fast", "slow"]
        .map(
          (key, k) =>
            `<path class="${k ? "third" : "secondary"}" d="${r[
              key as "fast" | "slow"
            ]
              .slice(start)
              .map((p, n) => `${n ? "L" : "M"}${x(n)} ${y(p)}`)
              .join(" ")}"/>`,
        )
        .join("");
      drawing += r.trades
        .filter((t) => t.index >= start)
        .map(
          (t) =>
            `<circle cx="${x(t.index - start)}" cy="${y(t.price)}" r="3" fill="${t.side === "Entry" ? "#f1d0a6" : "#929b96"}"><title>${t.side} at session ${t.index + 1}, ${fmt(t.price, 2)}</title></circle>`,
        )
        .join("");
      drawing += `<text x="62" y="260">Session ${start + 1}</text><text x="652" y="260" text-anchor="end">Session 180</text><text x="53" y="234" text-anchor="end">Vol.</text>`;
      const maximumDrawdown = Math.min(...r.drawdown);
      return (
        metrics([
          ["Net strategy return", pct(r.equity.at(-1)! / 100 - 1)],
          ["Buy & hold / gross", pct(r.benchmark.at(-1)! / 100 - 1)],
          ["Maximum drawdown", pct(maximumDrawdown)],
          ["Executions", String(r.trades.length)],
        ]) +
        `<div class="legend"><span>OHLC candles / entry pale, exit grey dots</span><span>Fast EMA</span><span>Slow EMA</span></div>` +
        figure(
          "Synthetic price candles, volume, EMA and trade markers",
          drawing,
          "Display sessions 61–180; calculations use all 180 sessions. Upper: price in arbitrary units. Lower bars: synthetic volume units. Pale dots are entries; grey dots are exits. Both EMAs and execution markers are shown.",
        ) +
        chart(
          "RSI oscillator",
          [
            { name: "Wilder RSI", values: r.rsi.slice(start).map((n) => n!) },
            { name: "Upper / 65", values: visible.map(() => 65) },
            { name: "Lower / 35", values: visible.map(() => 35) },
          ],
          "RSI scale 0–100. Thresholds 35 and 65; session index on horizontal axis.",
          (n) => String(n + start + 1),
        ) +
        chart(
          "Strategy and buy-and-hold equity curves",
          [
            { name: "Strategy / net", values: r.equity },
            { name: "Buy & hold / gross", values: r.benchmark },
          ],
          "Starting wealth 100; strategy pays displayed one-way cost at every execution, including final liquidation. Benchmark is gross, before costs.",
          (n) => String(n + 1),
        ) +
        chart(
          "Strategy drawdown",
          [
            {
              name: "Peak-to-trough / %",
              values: r.drawdown.map((n) => n * 100),
            },
          ],
          "Drawdown from running peak, %. Synthetic path only, no historical drawdown or forecast.",
          (n) => String(n + 1),
        ) +
        `<p class="interpretation">${strategy === "trend" ? "EMA trend holds when yesterday’s fast EMA exceeds yesterday’s slow EMA." : "RSI threshold enters after yesterday’s RSI falls below 35, exits after it rises above 65, and otherwise holds."} Trades execute at the next open. Costs can erode an apparent edge; synthetic outcomes provide no evidence of real profitability.</p><details><summary>Rules, provenance, execution log & limitations</summary><p>Deterministic synthetic generator: closeᵢ = openᵢ × exp(0.0005 + 0.012 sin(0.31i) + 0.007 cos(0.79i)); each open equals the prior close. High/low envelopes and volume are deterministic teaching inputs. No source claims or real prices. EMA α = 2/(period+1); slow period = 2×fast period. RSI uses Wilder smoothing of positive/negative close changes. Flat RSI = 50; all gains = 100; all losses = 0.</p><p>Signals use only prior closes after a 2×period warm-up. Prior holdings earn overnight gaps; next-open position changes pay costs before intraday returns. Final holdings are liquidated at the last close and charged. The displayed sample is not out-of-sample validation; no optimisation, survivorship claim or annualised performance. Liquidity, taxes and market impact are not modelled beyond the combined cost input.</p>${table(
          "Execution log / synthetic price units",
          ["Session", "Action", "Execution price"],
          r.trades.map((t) => [String(t.index + 1), t.side, fmt(t.price, 2)]),
        )}</details>`
      );
    },
  );
  bind(
    "derivatives",
    select("payoff-strategy", "Position", [
      ["call", "Long call"],
      ["protective", "Stock + protective put"],
    ]) +
      number("spot", "Initial underlying / ₹ per share", 1, 10000, 1, 100) +
      number("strike", "Strike / ₹ per share", 1, 10000, 1, 100) +
      number("premium", "Option premium / ₹ per share", 0, 1000, 0.5, 5) +
      number("days", "Days to expiry", 1, 3650, 1, 30) +
      range("shock", "Expiry scenario / spot change", -100, 100, 5, 10, "%") +
      '<p class="fine">One share and one option unit. Premium is paid upfront. No quote feed or valuation model.</p>',
    (v, form) => {
      const strategy = (
        form.elements.namedItem("payoff-strategy") as HTMLSelectElement
      ).value as "call" | "protective";
      const i = {
        spot: v("spot"),
        strike: v("strike"),
        premium: v("premium"),
        days: v("days"),
      };
      const r = expiryPayoff(i, strategy),
        terminal = i.spot * (1 + v("shock") / 100);
      const upper = Math.max(
          i.spot * 2,
          i.strike * 1.4,
          (r.breakeven || 0) * 1.3,
        ),
        prices = Array.from({ length: 61 }, (_, n) => (n * upper) / 60);
      return (
        metrics([
          [
            "Breakeven / ₹",
            r.breakeven === null ? "No loss region" : fmt(r.breakeven, 2),
          ],
          ["Maximum loss / ₹", fmt(r.maxLoss, 2)],
          ["Scenario expiry / ₹", fmt(terminal, 2)],
          ["Scenario P&L / ₹", fmt(r.pnl(terminal), 2)],
        ]) +
        chart(
          "Expiry P&L versus underlying price",
          [
            {
              name:
                strategy === "call" ? "Long call P&L" : "Protective put P&L",
              values: prices.map(r.pnl),
            },
            { name: "Zero P&L", values: prices.map(() => 0) },
          ],
          `Horizontal: underlying price at expiry / ₹. Vertical: position P&L per share / ₹. ${i.days} days until settlement; expiry payoff does not depend on elapsed days.`,
          (n) => fmt(prices[n], 0),
          {
            fraction: terminal / upper,
            value: r.pnl(terminal),
            label: `Scenario ₹${fmt(terminal, 2)}, P&L ₹${fmt(r.pnl(terminal), 2)}`,
          },
        ) +
        `<p class="interpretation">${strategy === "call" ? "The premium is the maximum loss; upside is unbounded as the underlying rises." : "The put floors the stock-plus-option payoff below the strike. A higher strike provides protection but the assumed premium may be economically unrealistic."} At assumed expiry price ₹${fmt(terminal, 2)}, P&L is ₹${fmt(r.pnl(terminal), 2)} per share.</p><details><summary>Expiry formulas, scenario table & assumptions</summary><p>Call: max(Sₜ−K,0) − premium. Protective put: Sₜ−S₀ + max(K−Sₜ,0) − premium. Call breakeven K + premium. Protective put breakeven S₀ + premium when strike ≤ total initial cost; if strike exceeds total cost, every expiry outcome is profitable under these hypothetical inputs, with no crossing of zero.</p><p>European-style exercise at expiry; no dividends, interest on funding, taxes or transaction costs. American early exercise is not modelled. Premium is an input, not mathematical fair value. Expiry duration sets the horizon but cannot change an expiry-only P&L curve. Use the scenario control to change the expiry outcome. Maximum upside is unbounded; all values are per share, no exchange lot size assumed.</p>${table(
          "Hypothetical expiry scenarios / ₹ per share",
          ["Expiry price", "Position P&L"],
          [0, 0.5, 1, 1.5, 2].map((m) => [
            fmt(i.spot * m, 2),
            fmt(r.pnl(i.spot * m), 2),
          ]),
        )}</details>`
      );
    },
  );
  bind(
    "portfolio",
    range("weight", "Asset A weight", 0, 100, 1, 50, "%") +
      range("volA", "Asset A annual volatility", 0, 100, 1, 20, "%") +
      range("volB", "Asset B annual volatility", 0, 100, 1, 30, "%") +
      range("rho", "Correlation", -1, 1, 0.05, 0.25) +
      range("target", "Rebalance / target A", 0, 100, 1, 60, "%") +
      '<p class="fine">Asset B receives the remainder. No cash, leverage, historical returns or invented portfolio performance.</p>',
    (v) => {
      const i = {
          w1: v("weight") / 100,
          s1: v("volA") / 100,
          s2: v("volB") / 100,
          rho: v("rho"),
        },
        r = allocation(i),
        target = v("target") / 100,
        rebalance = allocation({ ...i, w1: target });
      const rows = [
        [
          "Asset A",
          pct(i.w1),
          pct(i.s1),
          `${fmt(r.contributions[0] * 100, 2)} pp`,
        ],
        [
          "Asset B",
          pct(1 - i.w1),
          pct(i.s2),
          `${fmt(r.contributions[1] * 100, 2)} pp`,
        ],
      ];
      const pie = figure(
        "Current two-asset allocation",
        `<circle cx="160" cy="135" r="85" fill="none" stroke="#7c6850" stroke-width="38"/><circle cx="160" cy="135" r="85" fill="none" stroke="#e8e2d7" stroke-width="38" pathLength="100" stroke-dasharray="${i.w1 * 100} ${100 - i.w1 * 100}" transform="rotate(-90 160 135)"/><text x="160" y="130" text-anchor="middle" style="font-size:24px;fill:#ebe7de">${fmt(i.w1 * 100, 0)} / ${fmt((1 - i.w1) * 100, 0)}</text><text x="160" y="151" text-anchor="middle">A / B weights %</text><text x="335" y="90">Current A: ${pct(i.w1)}</text><text x="335" y="120">Current B: ${pct(1 - i.w1)}</text><text x="335" y="160">Target A: ${pct(target)}</text><text x="335" y="190">Target B: ${pct(1 - target)}</text>`,
        "White: Asset A; espresso: Asset B. Weights total 100%, before and after rebalancing.",
      );
      const weights = Array.from({ length: 21 }, (_, n) => n / 20);
      return (
        metrics([
          ["Portfolio annual volatility", pct(r.vol)],
          ["Target annual volatility", pct(rebalance.vol)],
          ["Concentration / HHI", fmt(r.concentration, 2)],
          [
            "Minimum-risk A weight",
            r.minWeight === null ? "Undefined" : pct(r.minWeight),
          ],
        ]) +
        pie +
        chart(
          "Allocation versus annual volatility",
          [
            {
              name: "Portfolio volatility / %",
              values: weights.map((w1) => allocation({ ...i, w1 }).vol * 100),
            },
          ],
          "Horizontal: weight in Asset A. Vertical: annual portfolio volatility %. Assumed risk and correlation held fixed.",
          (n) => pct(weights[n]),
        ) +
        table(
          "Risk contribution / percentage points of annual volatility",
          ["Asset", "Weight", "Annual volatility", "Risk contribution"],
          rows,
        ) +
        `<p class="interpretation">Rebalancing to ${pct(target)} in Asset A changes annual volatility from ${pct(r.vol)} to ${pct(rebalance.vol)}. Current HHI is ${fmt(r.concentration, 2)} (0.50 = equal weights; 1.00 = one asset). ${r.vol < 1e-12 ? "Zero portfolio variance: relative risk contributions are undefined; absolute contributions are shown as zero." : "Contributions sum to total volatility; a hedging asset can have a negative contribution."}</p><details><summary>Covariance, risk formulas & rebalancing assumptions</summary><p>σₚ² = w²σₐ² + (1−w)²σᵦ² + 2w(1−w)ρσₐσᵦ. Asset A Euler contribution = w[wσₐ²+(1−w)ρσₐσᵦ]/σₚ; Asset B follows symmetrically. Contributions are absolute volatility percentage points, not capital weights or forecast losses. HHI = w²+(1−w)².</p><p>Two assets only: −1 ≤ correlation ≤ +1 ensures a positive-semidefinite covariance matrix. Zero variance gives zero absolute risk contribution, with undefined relative shares. Minimum-risk weight is constrained to [0,1]; equally risky perfectly correlated assets share the same risk at every weight (displayed endpoint is one solution). Both zero-volatility assets have no unique minimum-risk weight.</p><p>Rebalancing changes weights only; assumes no fees or taxes and constant risk inputs. No dated return data is approved, so no historical drawdown chart or expected return is fabricated. This sensitivity curve is not an efficient frontier or investment recommendation.</p></details>`
      );
    },
  );
}
