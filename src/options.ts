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

/** No-arbitrage bounds for a European premium: max(0, discounted intrinsic) <= premium <= S·e^(-qT) (call) or K·e^(-rT) (put). */
export function premiumBounds(i: Omit<BSMInput, "vol">, right: Right) {
  const T = Math.max(0, i.days) / YEAR,
    dq = Math.exp(-i.yield * T),
    dr = Math.exp(-i.rate * T);
  return {
    lower: Math.max(0, right === "call" ? i.spot * dq - i.strike * dr : i.strike * dr - i.spot * dq),
    upper: right === "call" ? i.spot * dq : i.strike * dr,
  };
}
// Implied volatility from an observed premium by bisection. Fails closed outside no-arbitrage bounds.
export function impliedVol(i: Omit<BSMInput, "vol">, right: Right, premium: number) {
  if (!Number.isFinite(premium) || premium <= 0) throw new Error("Observed premium must be positive.");
  const { lower, upper } = premiumBounds(i, right);
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

// ---- Extensions: intrinsic value, explicit limit branches, straddle, futures fair value. ----
export type Position = Right | "straddle";
export const legs = (p: Position): Right[] => (p === "straddle" ? ["call", "put"] : [p]);
export const intrinsic = (right: Right, spot: number, strike: number) =>
  right === "call" ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
/** Converts an expiry entered on a stated basis to calendar days (the 365-day year used by bsm). Trading basis: 252 days per year. */
export const toCalendarDays = (n: number, basis: "calendar" | "trading" | "years") =>
  basis === "calendar" ? n : basis === "trading" ? (n * YEAR) / 252 : n * YEAR;
/** Theoretical value with explicit limits: expired or T=0 -> intrinsic only; sigma=0 -> discounted deterministic forward intrinsic. */
export function theoryPrice(i: BSMInput, right: Right) {
  if (!Object.values(i).every(Number.isFinite)) throw new Error("Every input is required and must be a finite number.");
  if (i.spot <= 0 || i.strike <= 0) throw new Error("Spot and strike must be positive.");
  if (i.vol < 0) throw new Error("Volatility cannot be negative.");
  if (i.days <= 0) return intrinsic(right, i.spot, i.strike);
  if (i.vol === 0) {
    const { lower } = premiumBounds(i, right);
    return lower;
  }
  return bsm(i)[right].price;
}
export const positionValue = (i: BSMInput, p: Position) => legs(p).reduce((a, r) => a + theoryPrice(i, r), 0);
/** Greeks of a long position (sum of legs), same per-share conventions as bsm. */
export function positionGreeks(r: ReturnType<typeof bsm>, p: Position) {
  const l = legs(p), sum = (k: "price" | "delta" | "theta" | "rho") => l.reduce((a, x) => a + r[x][k], 0);
  return { price: sum("price"), delta: sum("delta"), theta: sum("theta"), rho: sum("rho"), gamma: r.gamma * l.length, vega: r.vega * l.length };
}
/** Net P&L per share at expiry for a long position, `premium` being the total premium paid per share (both legs for a straddle). */
export const positionPayoff = (p: Position, strike: number, premium: number, expiry: number) =>
  legs(p).reduce((a, r) => a + intrinsic(r, expiry, strike), 0) - premium;
/** Break-even underlying prices at expiry (a put break-even at or below zero is unreachable and dropped). */
export const breakevens = (p: Position, strike: number, premium: number) =>
  (p === "call" ? [strike + premium] : p === "put" ? [strike - premium] : [strike - premium, strike + premium]).filter((x) => x > 0);
/** Cost-of-carry futures fair value F = S·exp((r−q)T), continuous compounding; not an observed futures price. */
export function futuresFair(spot: number, rate: number, yld: number, days: number) {
  if (![spot, rate, yld, days].every(Number.isFinite)) throw new Error("Every input is required and must be a finite number.");
  if (spot <= 0) throw new Error("Spot must be positive.");
  if (days < 0) throw new Error("Days to expiry cannot be negative.");
  return spot * Math.exp((rate - yld) * (days / YEAR));
}
