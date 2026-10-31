// Standalone textbook illustrations. No market feed or private platform code.
import { portfolioVol, minVarWeight, type TwoAsset } from "./portfolio";
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
const finite = (...xs: number[]) => {
  if (!xs.every(Number.isFinite)) throw Error("Use finite inputs.");
};
export function syntheticSeries(): Candle[] {
  let previous = 100;
  return Array.from({ length: 180 }, (_, i) => {
    const open = previous;
    const close =
      open *
      Math.exp(
        0.0005 + 0.012 * Math.sin(i * 0.31) + 0.007 * Math.cos(i * 0.79),
      );
    previous = close;
    return {
      open,
      close,
      high: Math.max(open, close) * (1.005 + 0.003 * Math.abs(Math.sin(i))),
      low: Math.min(open, close) * (1 - 0.005 - 0.003 * Math.abs(Math.cos(i))),
      volume: Math.round(80000 + 50000 * (1 + Math.sin(i * 0.47))),
    };
  });
}
export function ema(values: number[], period: number): number[] {
  finite(period, ...values);
  if (!values.length || !Number.isInteger(period) || period < 2 || period > 120)
    throw Error("EMA period must be 2–120; series must not be empty.");
  const alpha = 2 / (period + 1);
  let prior = values[0];
  return values.map(
    (value, i) => (prior = i ? value * alpha + prior * (1 - alpha) : value),
  );
}
export function rsi(values: number[], period: number): (number | null)[] {
  finite(period, ...values);
  if (
    !Number.isInteger(period) ||
    period < 2 ||
    period > 100 ||
    values.length <= period
  )
    throw Error("RSI needs more observations than its 2–100 period.");
  let gain = 0,
    loss = 0;
  return values.map((value, i) => {
    if (!i) return null;
    const delta = value - values[i - 1];
    if (i <= period) {
      gain += Math.max(0, delta) / period;
      loss += Math.max(0, -delta) / period;
    } else {
      gain = (gain * (period - 1) + Math.max(0, delta)) / period;
      loss = (loss * (period - 1) + Math.max(0, -delta)) / period;
    }
    if (i < period) return null;
    return loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  });
}
export function backtest(
  candles: Candle[],
  options: { period: number; strategy: "trend" | "rsi"; costBps: number },
) {
  const { period, strategy, costBps } = options;
  finite(period, costBps);
  if (
    candles.length < period * 2 + 2 ||
    period < 2 ||
    period > 60 ||
    !Number.isInteger(period) ||
    costBps < 0 ||
    costBps > 100 ||
    !["trend", "rsi"].includes(strategy)
  )
    throw Error("Use period 2–60, costs 0–100 bps and a valid series.");
  for (const c of candles) {
    finite(...Object.values(c));
    if (
      c.low <= 0 ||
      c.volume < 0 ||
      c.high < Math.max(c.open, c.close) ||
      c.low > Math.min(c.open, c.close)
    )
      throw Error("Invalid candle data.");
  }
  const closes = candles.map((c) => c.close),
    fast = ema(closes, period),
    slow = ema(closes, period * 2),
    oscillator = rsi(closes, period);
  const positions: number[] = [],
    equity: number[] = [],
    benchmark: number[] = [],
    drawdown: number[] = [],
    trades: { index: number; side: "Entry" | "Exit"; price: number }[] = [];
  let held = 0,
    wealth = 100,
    peak = 100;
  candles.forEach((c, i) => {
    if (i) wealth *= 1 + held * (c.open / candles[i - 1].close - 1); // Gap belongs to prior holding.
    // Decide using previous close only; execute at this candle's open.
    let next = held;
    if (i > period * 2) {
      if (strategy === "trend") next = fast[i - 1] > slow[i - 1] ? 1 : 0;
      else if (oscillator[i - 1] !== null) {
        if (oscillator[i - 1]! < 35) next = 1;
        else if (oscillator[i - 1]! > 65) next = 0;
      }
    }
    if (next !== held) {
      wealth *= 1 - costBps / 10000;
      trades.push({ index: i, side: next ? "Entry" : "Exit", price: c.open });
    }
    held = next;
    wealth *= 1 + held * (c.close / c.open - 1);
    // Liquidate at final close, paying the same exit cost.
    if (i === candles.length - 1 && held) {
      wealth *= 1 - costBps / 10000;
      trades.push({ index: i, side: "Exit", price: c.close });
    }
    positions.push(held);
    equity.push(wealth);
    benchmark.push((100 * c.close) / candles[0].open);
    peak = Math.max(peak, wealth);
    drawdown.push(wealth / peak - 1);
  });
  return {
    fast,
    slow,
    rsi: oscillator,
    positions,
    equity,
    benchmark,
    drawdown,
    trades,
  };
}
export function expiryPayoff(
  i: { spot: number; strike: number; premium: number; days: number },
  strategy: "call" | "protective",
) {
  finite(...Object.values(i));
  if (
    i.spot <= 0 ||
    i.strike <= 0 ||
    i.premium < 0 ||
    i.days <= 0 ||
    i.days > 3650 ||
    !["call", "protective"].includes(strategy)
  )
    throw Error(
      "Positive spot, strike and expiry required; premium cannot be negative.",
    );
  const pnl = (terminal: number) => {
    finite(terminal);
    if (terminal < 0) throw Error("Expiry price cannot be negative.");
    return strategy === "call"
      ? Math.max(0, terminal - i.strike) - i.premium
      : terminal - i.spot + Math.max(0, i.strike - terminal) - i.premium;
  };
  const floor = i.strike - i.spot - i.premium;
  return {
    pnl,
    maxLoss: strategy === "call" ? i.premium : Math.max(0, -floor),
    breakeven:
      strategy === "call"
        ? i.strike + i.premium
        : floor > 0
          ? null
          : i.spot + i.premium,
  };
}
export function allocation(i: TwoAsset) {
  finite(...Object.values(i));
  if (
    i.w1 < 0 ||
    i.w1 > 1 ||
    i.s1 < 0 ||
    i.s1 > 2 ||
    i.s2 < 0 ||
    i.s2 > 2 ||
    i.rho < -1 ||
    i.rho > 1
  )
    throw Error("Weights 0–100%, volatility 0–200%, correlation −1 to +1.");
  const vol = portfolioVol(i),
    w2 = 1 - i.w1,
    cov = i.rho * i.s1 * i.s2;
  const contributions =
    vol > 1e-12
      ? [
          (i.w1 * (i.w1 * i.s1 ** 2 + w2 * cov)) / vol,
          (w2 * (w2 * i.s2 ** 2 + i.w1 * cov)) / vol,
        ]
      : [0, 0];
  return {
    vol,
    contributions,
    concentration: i.w1 ** 2 + w2 ** 2,
    minWeight: minVarWeight(i),
  };
}
