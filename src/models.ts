// Independent textbook teaching models. No issuer data or ASTRA implementation.
export interface DCFInput {
  revenue: number;
  growth: number;
  margin: number;
  tax: number;
  reinvestment: number;
  wacc: number;
  terminalGrowth: number;
}
export function dcf(i: DCFInput) {
  if (
    !Object.values(i).every(Number.isFinite) ||
    i.revenue <= 0 ||
    i.growth <= -1 ||
    i.margin < 0 ||
    i.margin > 1 ||
    i.tax < 0 ||
    i.tax > 1 ||
    i.reinvestment < 0 ||
    i.reinvestment > 1 ||
    i.wacc <= 0 ||
    i.wacc <= i.terminalGrowth ||
    i.terminalGrowth <= -1
  )
    throw new Error(
      "Use finite inputs, valid proportions and WACC above terminal growth.",
    );
  const cashFlows = Array.from(
    { length: 5 },
    (_, t) =>
      i.revenue *
      (1 + i.growth) ** (t + 1) *
      i.margin *
      (1 - i.tax) *
      (1 - i.reinvestment),
  );
  const explicitPV = cashFlows.reduce(
    (s, c, t) => s + c / (1 + i.wacc) ** (t + 1),
    0,
  );
  const terminalPV =
    (cashFlows[4] * (1 + i.terminalGrowth)) /
    (i.wacc - i.terminalGrowth) /
    (1 + i.wacc) ** 5;
  const value = explicitPV + terminalPV;
  if (!Number.isFinite(value))
    throw new Error("Inputs exceed numerical range.");
  return { cashFlows, explicitPV, terminalPV, value, terminalShare: value > 0 ? terminalPV / value : null };
}
export interface OptionInput {
  spot: number;
  strike: number;
  rate: number;
  vol: number;
  time: number;
}
// Rational normal-tail approximation, with a continued fraction in the far tail.
const cdf = (x: number) => {
  const z = Math.abs(x);
  if (z > 37) return x > 0 ? 1 : 0;
  const e = Math.exp((-z * z) / 2);
  const tail =
    z < 7.07106781186547
      ? (e *
          ((((((0.0352624965998911 * z + 0.700383064443688) * z +
            6.37396220353165) *
            z +
            33.912866078383) *
            z +
            112.079291497871) *
            z +
            221.213596169931) *
            z +
            220.206867912376)) /
        (((((((0.0883883476483184 * z + 1.75566716318264) * z +
          16.064177579207) *
          z +
          86.7807322029461) *
          z +
          296.564248779674) *
          z +
          637.333633378831) *
          z +
          793.826512519948) *
          z +
          440.413735824752)
      : e /
        Math.sqrt(2 * Math.PI) /
        (z + 1 / (z + 2 / (z + 3 / (z + 4 / (z + 0.65)))));
  return x >= 0 ? 1 - tail : tail;
};
export function blackScholes(i: OptionInput) {
  const { spot: S, strike: K, rate: r, vol: v, time: T } = i;
  if (
    !Object.values(i).every(Number.isFinite) ||
    S <= 0 ||
    K <= 0 ||
    v <= 0 ||
    T <= 0
  )
    throw new Error(
      "Spot, strike, time and volatility must be positive and finite. Rate must be finite.",
    );
  const sqrtT = Math.sqrt(T),
    d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * sqrtT),
    d2 = d1 - v * sqrtT;
  const n = Math.exp((-d1 * d1) / 2) / Math.sqrt(2 * Math.PI),
    disc = K * Math.exp(-r * T);
  const result = {
    call: {
      price: Math.max(0, S * cdf(d1) - disc * cdf(d2)),
      delta: cdf(d1),
      theta: ((-S * n * v) / (2 * sqrtT) - r * disc * cdf(d2)) / 365,
      rho: (disc * T * cdf(d2)) / 100,
    },
    put: {
      price: Math.max(0, disc * cdf(-d2) - S * cdf(-d1)),
      delta: cdf(d1) - 1,
      theta: ((-S * n * v) / (2 * sqrtT) + r * disc * cdf(-d2)) / 365,
      rho: (-disc * T * cdf(-d2)) / 100,
    },
    gamma: n / (S * v * sqrtT),
    vega: (S * n * sqrtT) / 100,
  };
  if (
    ![
      ...Object.values(result.call),
      ...Object.values(result.put),
      result.gamma,
      result.vega,
    ].every(Number.isFinite)
  )
    throw new Error("Inputs exceed numerical range.");
  return result;
}
