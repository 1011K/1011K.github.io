import { cdf } from "./models.ts";
// Hypothetical European Black-Scholes-Merton with continuous dividend yield. Theory only:
// never a quote, never derived from a spot price alone, never an ASTRA engine output.
export interface BSMInput {
  spot: number;
  strike: number;
  days: number;
  vol: number;
  rate: number;
  yield: number;
}
export type Right = "call" | "put";
const YEAR = 365;
const clean = (i: BSMInput) => {
  const v = Object.values(i);
  if (!v.every(Number.isFinite)) throw new Error("Every input is required and must be a finite number.");
  if (i.spot <= 0 || i.strike <= 0) throw new Error("Spot and strike must be positive.");
  if (i.days <= 0) throw new Error("Days to expiry must be positive; at expiry only intrinsic value remains.");
  if (i.vol <= 0) throw new Error("Volatility must be positive. It is an assumption, not something the spot price implies.");
};
export function bsm(i: BSMInput) {
  clean(i);
  const { spot: S, strike: K, vol: v, rate: r, yield: q } = i,
    T = i.days / YEAR,
    sq = Math.sqrt(T),
    d1 = (Math.log(S / K) + (r - q + (v * v) / 2) * T) / (v * sq),
    d2 = d1 - v * sq,
    n = Math.exp((-d1 * d1) / 2) / Math.sqrt(2 * Math.PI),
    dq = Math.exp(-q * T),
    dr = Math.exp(-r * T);
  const call = Math.max(0, S * dq * cdf(d1) - K * dr * cdf(d2)),
    put = Math.max(0, K * dr * cdf(-d2) - S * dq * cdf(-d1));
  const out = {
    d1,
    d2,
    call: {
      price: call,
      delta: dq * cdf(d1),
      theta: ((-S * dq * n * v) / (2 * sq) - r * K * dr * cdf(d2) + q * S * dq * cdf(d1)) / YEAR,
      rho: (K * T * dr * cdf(d2)) / 100,
    },
    put: {
      price: put,
      delta: -dq * cdf(-d1),
      theta: ((-S * dq * n * v) / (2 * sq) + r * K * dr * cdf(-d2) - q * S * dq * cdf(-d1)) / YEAR,
      rho: (-K * T * dr * cdf(-d2)) / 100,
    },
    gamma: (dq * n) / (S * v * sq),
    vega: (S * dq * n * sq) / 100,
    // Put-call parity residual: C − P − (S·e^(−qT) − K·e^(−rT)); should be ~0.
    parity: call - put - (S * dq - K * dr),
    forward: S * Math.exp((r - q) * T),
  };
  const all = [call, put, out.gamma, out.vega, out.forward, ...Object.values(out.call), ...Object.values(out.put)];
  if (!all.every(Number.isFinite)) throw new Error("Inputs exceed numerical range.");
  return out;
}
export const payoff = (right: Right, strike: number, premium: number, expiry: number) =>
  (right === "call" ? Math.max(0, expiry - strike) : Math.max(0, strike - expiry)) - premium;
export const breakeven = (right: Right, strike: number, premium: number) =>
  right === "call" ? strike + premium : strike - premium;

// Implied volatility from an observed premium by bisection. Fails closed outside no-arbitrage bounds.
export function impliedVol(i: Omit<BSMInput, "vol">, right: Right, premium: number) {
  if (!Number.isFinite(premium) || premium <= 0) throw new Error("Observed premium must be positive.");
  const T = i.days / YEAR,
    dq = Math.exp(-i.yield * T),
    dr = Math.exp(-i.rate * T),
    lower = Math.max(0, right === "call" ? i.spot * dq - i.strike * dr : i.strike * dr - i.spot * dq),
    upper = right === "call" ? i.spot * dq : i.strike * dr;
  const price = (vol: number) => bsm({ ...i, vol })[right].price;
  if (premium <= lower + 1e-9 || premium >= upper - 1e-9)
    throw new Error(`No implied volatility: premium must lie strictly between ${lower.toFixed(4)} and ${upper.toFixed(4)}.`);
  let lo = 1e-4,
    hi = 5;
  if (price(lo) > premium || price(hi) < premium) throw new Error("No implied volatility in the 0.01% to 500% range.");
  for (let n = 0; n < 200; n++) {
    const mid = (lo + hi) / 2;
    if (price(mid) < premium) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
