// Single source for public copy and demo contracts. Owner-reviewed copy only: no invented figures,
// no market data, no unapproved research conclusions.
export type Ticker = "HDFCBANK" | "DLF" | "BHARTIARTL" | "BAJFINANCE" | "HDFCLIFE";
export type Method = "FCFF_DCF" | "RESIDUAL_INCOME" | "PROJECT_NAV" | "EV_VNB";

export const AS_OF = "2026-10-13";
export const AS_OF_LABEL = "13 October 2026, 15:30 IST";
export const ASTRA_VIDEO =
  "https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_astra-equityresearch-finance-activity-7511489584879538176-ShWh";

export interface Peer {
  name: string;
  cls: "DIRECT" | "ADJACENT";
  note: string;
}
export interface Company {
  ticker: Ticker;
  name: string;
  archetype: string;
  method: Method;
  methodText: string;
  prohibitedText: string;
  question: string;
  engine: string;
  uncertainty: string;
  thesisChange: string;
  focus: string;
  peers: Peer[];
  peerNote: string;
  ratios: string[];
}

// Order is fixed and identical in navigation, case cards and every demo selector.
export const COMPANIES: Company[] = [
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    archetype: "Bank",
    method: "RESIDUAL_INCOME",
    methodText: "Residual income / justified price-to-book",
    prohibitedText: "FCFF and WACC: deposits are operating inputs for a bank, so enterprise cash-flow valuation does not apply.",
    question: "How do deposit growth, funding cost and capital quality translate into earnings power and a defensible price-to-book?",
    engine: "Net interest income on a growing, deposit-funded loan book, less credit cost and operating cost.",
    uncertainty: "How quickly funding costs and deposit mix normalise while loan growth continues.",
    thesisChange: "Sustained pressure on margin or asset quality that the return-on-equity assumption does not already allow for.",
    focus: "Accounting bridge, share-count restatement after the 2025 bonus issue, and a bank-specific template.",
    peers: [
      { name: "ICICI Bank", cls: "DIRECT", note: "Large Indian private-sector bank." },
      { name: "Axis Bank", cls: "DIRECT", note: "Large Indian private-sector bank." },
      { name: "Kotak Mahindra Bank", cls: "DIRECT", note: "Large Indian private-sector bank." },
    ],
    peerNote: "Proposed set. Rank by size is not independently verified.",
    ratios: ["P/B", "ROA", "ROE", "NIM", "CASA ratio", "Credit cost", "GNPA / NNPA", "CET1 / CRAR", "Deposit and loan growth"],
  },
  {
    ticker: "DLF",
    name: "DLF",
    archetype: "Real estate developer",
    method: "PROJECT_NAV",
    methodText: "Project-level net asset value / sum of the parts, where disclosed",
    prohibitedText: "Generic perpetuity FCFF: development cash flows are lumpy and tied to project timing.",
    question: "How do the project pipeline, launch timing and execution risk determine net asset value?",
    engine: "Land bank monetised through launches, collections and a rental annuity portfolio.",
    uncertainty: "Timing and realisation of launches against the disclosed pipeline.",
    thesisChange: "Slower launches or collections, or project economics that differ from the disclosed inputs.",
    focus: "Project-level NAV inputs and cash-roll consistency.",
    peers: [
      { name: "Godrej Properties", cls: "DIRECT", note: "Listed residential developer." },
      { name: "Prestige Estates Projects", cls: "DIRECT", note: "Listed developer, mixed portfolio." },
      { name: "Oberoi Realty", cls: "DIRECT", note: "Listed developer, Mumbai-weighted." },
    ],
    peerNote: "Proposed set. Compare presales, collections, net debt and NAV, not P/E alone.",
    ratios: ["NAV premium / discount", "Presales", "Collections", "Net debt", "Revenue-recognition quality", "Residential / office mix"],
  },
  {
    ticker: "BHARTIARTL",
    name: "Bharti Airtel",
    archetype: "Telecom",
    method: "FCFF_DCF",
    methodText: "FCFF discounted cash flow with telecom drivers",
    prohibitedText: "FCFF is the registered method here. Inputs must still pass source, funding and arithmetic checks before any model is shown.",
    question: "How do ARPU, capital expenditure and leverage shape free cash flow and value?",
    engine: "Subscriber base times average revenue per user, against heavy network and spectrum capital expenditure.",
    uncertainty: "Pace of ARPU growth relative to capital intensity and funding cost.",
    thesisChange: "ARPU growth or capital intensity moving materially away from the modelled drivers.",
    focus: "Source and beta consistency, funding, and an independent check of sensitivity and simulation outputs.",
    peers: [
      { name: "Vodafone Idea", cls: "DIRECT", note: "Closest listed mobile operator." },
      { name: "Tata Communications", cls: "ADJACENT", note: "Carrier and enterprise connectivity, not consumer mobile." },
      { name: "Indus Towers", cls: "ADJACENT", note: "Tower infrastructure, structurally different economics." },
    ],
    peerNote: "Few pure-play listed mobile peers exist. These are not three equivalent rivals; incomparable multiples are omitted.",
    ratios: ["EV/EBITDA (lease policy stated)", "ARPU", "Subscriber base", "Capex intensity", "Net debt / EBITDA", "Return on invested capital"],
  },
  {
    ticker: "BAJFINANCE",
    name: "Bajaj Finance",
    archetype: "NBFC",
    method: "RESIDUAL_INCOME",
    methodText: "Residual income / price-to-book",
    prohibitedText: "FCFF: borrowings fund the loan book, so debt is an operating input and not a financing bridge item.",
    question: "How do loan mix, credit cost and funding cost drive return on equity?",
    engine: "Spread between yield on a diversified loan book and cost of funds, after credit cost and operating cost.",
    uncertainty: "Credit cost through the cycle and the cost and availability of wholesale funding.",
    thesisChange: "Rising stage 3 assets or funding stress not reflected in the return-on-equity assumption.",
    focus: "Per-share adjustment for the 2025 split and bonus, earnings bridge and cost of equity.",
    peers: [
      { name: "Cholamandalam Investment", cls: "DIRECT", note: "Listed NBFC." },
      { name: "Shriram Finance", cls: "DIRECT", note: "Listed NBFC, vehicle-finance weighted." },
      { name: "Muthoot Finance", cls: "ADJACENT", note: "Gold-loan specialist, product-specific." },
    ],
    peerNote: "Proposed set. Product mix differs; differences are explained, not normalised away.",
    ratios: ["P/B", "ROE", "AUM growth", "NIM / spread", "Cost of funds", "Stage 3 / ECL", "Leverage"],
  },
  {
    ticker: "HDFCLIFE",
    name: "HDFC Life",
    archetype: "Life insurance",
    method: "EV_VNB",
    methodText: "Embedded value and value of new business, only where a supported engine and source exist",
    prohibitedText: "FCFF and generic debt metrics: not meaningful for a life insurer. Valuation is withheld until embedded value is supported.",
    question: "How do new-business economics, persistency and solvency build embedded value?",
    engine: "Annualised premium equivalent converted to value of new business, supported by persistency.",
    uncertainty: "Persistency and the assumptions behind embedded value.",
    thesisChange: "Persistency or new-business margin moving outside the disclosed assumptions.",
    focus: "Embedded-value vintage and whether the method is supported at all.",
    peers: [
      { name: "SBI Life Insurance", cls: "DIRECT", note: "Listed life insurer." },
      { name: "ICICI Prudential Life Insurance", cls: "DIRECT", note: "Listed life insurer." },
      { name: "Max Financial Services", cls: "ADJACENT", note: "Holding structure; compare the underlying insurer with adjustments." },
    ],
    peerNote: "Proposed set. Where data is absent the cell is withheld.",
    ratios: ["P/EV", "VNB margin", "APE", "Persistency", "Solvency ratio"],
  },
];

const METHOD_LABEL: Record<Method, string> = {
  FCFF_DCF: "FCFF DCF",
  RESIDUAL_INCOME: "Residual income / P/B",
  PROJECT_NAV: "Project NAV / SOTP",
  EV_VNB: "Embedded value / VNB",
};
export const methodLabel = (m: Method) => METHOD_LABEL[m];
export const METHODS = Object.keys(METHOD_LABEL) as Method[];

// Fail-closed routing: a method is allowed only when it is the company's registered method.
export function methodVerdict(ticker: Ticker, method: Method) {
  const c = COMPANIES.find((x) => x.ticker === ticker);
  if (!c) throw new Error(`Unknown company: ${ticker}`);
  if (c.method !== method)
    return { allowed: false, text: `${c.name} (${c.archetype}): ${methodLabel(method)} rejected. Registered method: ${methodLabel(c.method)}. ${c.prohibitedText}` };
  return {
    allowed: true,
    text:
      method === "EV_VNB"
        ? `${methodLabel(method)} is the registered method for ${c.name}, but no supported engine is verified. Valuation withheld.`
        : `${methodLabel(method)} is the registered method for ${c.name}. The engine is not yet verified, so no valuation is shown.`,
  };
}

export const ENGINE_REASON =
  "No owner engine is pinned, no licensed point-in-time data is loaded and no independent oracle has passed. Nothing here is an ASTRA engine output.";

export const GATES = [
  "Owner engine commit pinned",
  "Point-in-time snapshot reproducible",
  "Licensed data and redistribution rights",
  "Independent oracle matches",
  "Fail-closed edge cases tested",
  "Owner review of each company output",
];

export interface Demo {
  id: string;
  n: number;
  title: string;
  lens: string;
  summary: string;
  authority: string;
  oracle: string;
  mode: string;
  panels: string[];
  lab?: string;
}
export const DEMOS: Demo[] = [
  {
    id: "valuation",
    mode: "HYPOTHETICAL inputs. Not the company's financials.",
    n: 1,
    title: "Institutional valuation",
    lens: "Financial Intelligence",
    summary: "Sector-aware valuation, planned: each company is routed to the method its economics allow, and disallowed methods are rejected with a reason.",
    authority: "Financial Intelligence methodology registry (owner engine)",
    oracle: "Hand-solved discounted cash flows and an independently recalculated workbook",
    lab: "lab-financial",
    panels: [
      "Issuer context and source",
      "Method router",
      "Historical income statement",
      "Balance sheet and cash-flow reconciliation",
      "Revenue forecast",
      "Margin and cost forecast",
      "Working capital",
      "Capital expenditure and D&A",
      "Financing and net debt",
      "Cost of equity",
      "WACC (where permitted)",
      "Forecast free cash flow",
      "Terminal value",
      "Enterprise-to-equity bridge",
      "Sensitivity and scenarios",
      "Monte Carlo (conditional)",
      "Quality checks and limitations",
    ],
  },
  {
    id: "technical",
    mode: "SYNTHETIC price series. Not the company's prices.",
    n: 2,
    title: "Technical intelligence",
    lens: "Technical Intelligence",
    summary: "Planned: three years of daily history, registered indicators and exactly three strategy families with next-session execution and costs.",
    authority: "Technicals indicator and strategy registry (owner engine)",
    oracle: "Independent indicator arrays reconciled for warm-up and EMA seeding",
    lab: "lab-technical",
    panels: [
      "Trend and moving averages",
      "Momentum",
      "Volatility",
      "Trend strength",
      "Volume",
      "Structure",
      "Three strategy families",
      "Backtest, costs and out-of-sample",
    ],
  },
  {
    id: "options",
    mode: "THEORETICAL ONLY. Hypothetical inputs, no market quotes.",
    n: 3,
    title: "Options and derivatives",
    lens: "Derivatives and Quant",
    summary: "European call and put theory with Greeks. Prices need strike, expiry, volatility, rate and dividend yield; the spot price alone never determines a premium.",
    authority: "Derivatives research modules (owner engine)",
    oracle: "Independent Black-Scholes-Merton maths and put-call parity",
    lab: "lab-derivatives",
    panels: ["Contract finder", "Theoretical price", "Greeks", "Implied volatility", "Payoff at expiry", "Futures fair value"],
  },
  {
    id: "peers",
    mode: "HYPOTHETICAL inputs you enter. Not company data.",
    n: 4,
    title: "Automatic peer comparison",
    lens: "Financial Intelligence and Market Scan",
    summary: "Planned: up to three comparable listed peers per company, classified direct or adjacent, with matched periods and sector-specific ratios.",
    authority: "Registered peer and sector logic (owner engine)",
    oracle: "Independently computed ratio numerators and denominators",
    panels: ["Peer selection", "Classification and rationale", "Matched-period ratios", "Exclusions"],
  },
  {
    id: "correlation",
    mode: "HYPOTHETICAL volatilities and correlations. Simulated returns are not market data.",
    n: 5,
    title: "Correlation and portfolio risk",
    lens: "Portfolio Intelligence",
    summary: "Planned: a five by five Pearson return-correlation matrix in red, with weights, portfolio volatility and risk contributions.",
    authority: "Portfolio risk and correlation module (owner engine)",
    oracle: "Independent NumPy covariance, positive semi-definite and variance identity checks",
    lab: "lab-portfolio",
    panels: ["Common dates", "Red heat map", "Weights", "Portfolio volatility and contributions", "Rolling correlation", "Drawdown", "Stress scenarios", "Source ledger"],
  },
];

export const INDICATORS: [string, string][] = [
  ["Trend", "SMA(12), EMA(12), EMA(26), slope and cross markers"],
  ["Momentum", "RSI(14), MACD(12, 26, 9), stochastic, rate of change"],
  ["Volatility", "Bollinger bands (20, 2σ), ATR(14), realised volatility"],
  ["Trend strength", "ADX with +DI and −DI"],
  ["Volume", "Relative volume, on-balance volume"],
  ["Structure", "Pivots and confirmed support and resistance"],
];
export const STRATEGIES: [string, string][] = [
  ["TREND_MOMENTUM", "Trend with momentum confirmation. Signals on one session execute on the next."],
  ["BREAKOUT_CONFIRM", "Breakout from a prior window with registered volume confirmation. Never trades today's open on today's close."],
  ["MEAN_REVERSION", "Deviation and reversion triggers with stated regime, stop and signal expiry."],
];

export interface Area {
  id: string;
  name: string;
  covers: string;
  useful: string;
}
export const ASTRA_AREAS: Area[] = [
  {
    id: "financial",
    name: "Financial Intelligence",
    covers: "Fundamental equity research: reading statements, choosing a valuation method suited to the business and testing assumptions.",
    useful: "Shows how a valuation follows from its inputs and where it would break.",
  },
  {
    id: "technical",
    name: "Technical Intelligence",
    covers: "Price and volume indicators and rule-based strategies.",
    useful: "Designed to help separate a rule that looks good on a chart from one that survives realistic testing.",
  },
  {
    id: "mosaic",
    name: "Mosaic",
    covers: "Dated company developments and events kept alongside the fundamental and technical evidence.",
    useful: "Designed to put news and filings alongside the other evidence.",
  },
  {
    id: "derivatives",
    name: "Derivatives and Quant",
    covers: "Option and futures analytics: theoretical pricing, Greeks and payoffs.",
    useful: "Makes the assumptions behind a premium explicit and shows the risk of a position.",
  },
  {
    id: "portfolio",
    name: "Portfolio Intelligence",
    covers: "Correlation, weights, volatility and risk contributions across holdings.",
    useful: "Shows how an attractive isolated idea changes the risk of a whole portfolio.",
  },
  {
    id: "scan",
    name: "Market Scan",
    covers: "Screening of listed equities with transparent filters.",
    useful: "Turns a rule into a research shortlist that can be inspected.",
  },
];

export interface Credential {
  id: string;
  title: string;
  status: string;
  studied: string;
  applied: string;
  caution?: string;
}
export const CREDENTIALS: Credential[] = [
  {
    id: "bba",
    title: "BBA, Jai Hind College, Mumbai",
    status: "Final year. Industry integrated with Tata Consultancy Services. Expected April 2027.",
    studied: "Business, finance, accounting and management.",
    applied: "Reading financial statements, building forecasts and valuation models, and market research.",
  },
  {
    id: "cfa",
    title: "CFA Program",
    status: "Level I passed. Level II candidate, May 2027.",
    studied: "Valuation, capital markets, risk and research methodology.",
    applied: "The same topics behind the demonstrations below.",
    caution: "Not a CFA charterholder. Passing an exam does not certify any model on this page.",
  },
  {
    id: "nism-ra",
    title: "NISM Research Analyst (Series XV)",
    status: "Passed.",
    studied: "Research conventions, reading issuer statements, evidence and investment-analysis questions.",
    applied: "Structuring company research around sources and stated limitations.",
    caution: "Not a SEBI research analyst registration.",
  },
  {
    id: "nism-ed",
    title: "NISM Equity Derivatives (Series VIII)",
    status: "Passed.",
    studied: "Option contracts, payoff algebra, Greeks, hedging risk and pricing assumptions.",
    applied: "The options calculator below and the payoff reasoning behind it.",
    caution: "An exam is not a substitute for licensed historical options data.",
  },
  {
    id: "nism-mb",
    title: "NISM Merchant Banking (Series IX)",
    status: "Passed.",
    studied: "Capital-markets issuance, disclosure and corporate actions.",
    applied: "Reading corporate-action histories such as splits and bonus issues.",
    caution: "Not a merchant banking licence.",
  },
];

export interface Simulation {
  org: string;
  title: string;
  learned: string;
  connection: string;
}
// Exactly eleven programmes. Completion is confirmed; task-level activity is not claimed.
export const SIMULATIONS: Simulation[] = [
  { org: "Goldman Sachs", title: "Controllers Job Simulation", learned: "Financial reporting and controls context.", connection: "Statement reconciliation in financial research." },
  { org: "Goldman Sachs", title: "Internal Audit Job Simulation", learned: "Internal controls, risk identification and independent review.", connection: "Validation gates before a number is shown." },
  { org: "Goldman Sachs", title: "Risk Job Simulation", learned: "Risk measurement and communication.", connection: "Market and portfolio risk analysis." },
  { org: "Vista Equity Partners", title: "AI in Action Job Simulation", learned: "Using AI in business processes.", connection: "Responsible AI-assisted project development." },
  { org: "Vista Equity Partners", title: "Understanding the Deal Lifecycle Job Simulation", learned: "Deal process and diligence workflow.", connection: "Corporate finance career interests." },
  { org: "Vista Equity Partners", title: "Demystifying Private Equity Job Simulation", learned: "Private equity investment process, business understanding and value creation.", connection: "Direct alignment with private equity interest." },
  { org: "Citi", title: "Investment Banking Job Simulation", learned: "Corporate finance and capital-markets analytical workflow.", connection: "Investment banking interest." },
  { org: "Bank of America", title: "Investment Banking Job Simulation", learned: "Transaction analysis and financial presentation.", connection: "Investment banking interest." },
  { org: "Standard Chartered", title: "Credit Analyst Job Simulation", learned: "Borrower credit analysis, debt and financing risk.", connection: "Bank and NBFC research." },
  { org: "Deloitte Australia", title: "Data Analytics Job Simulation", learned: "Organising, interpreting and communicating analytical findings.", connection: "Auditability and clear reporting." },
  { org: "BCG", title: "GenAI Job Simulation", learned: "Practical generative AI and business problem solving.", connection: "ASTRA's AI-assisted development approach." },
];

// ---------------------------------------------------------------------------------------------
// Profile content. Taken from the owner's approved standard CV. No semester or cumulative GPA, no
// report counts, no phone number or address. Reliance Industries appears only in STUDY below.
// ---------------------------------------------------------------------------------------------
export const LINKS = {
  email: "krishivramchandani@gmail.com",
  linkedin: "https://in.linkedin.com/in/krishiv-ramchandani-02543835b",
  github: "https://github.com/1011K",
  cv: "/media/krishiv-ramchandani-cv.pdf",
};

export const FACTS: [string, string][] = [
  ["Based in", "Mumbai, India"],
  ["Education", "BBA (Industry Integrated with Tata Consultancy Services), Jai Hind College. Expected April 2027."],
  ["CFA Program", "Level I passed, 2026. Level II candidate, May 2027."],
  ["NISM", "Research Analyst (XV), Equity Derivatives (VIII), Merchant Banking (IX)."],
  ["Experience", "Investments Intern, Ascendas Firstspace, Aug–Sep 2026."],
  ["Leadership", "Organising Committee, TALAASH & Jai Hind Conclave, 2024–present."],
  ["Languages", "English, Hindi."],
  ["Career interests", "Private equity and hedge funds first, then investment banking and wealth management."],
];

export const ACADEMIC_RECORD: { level: string; detail: string; result: string }[] = [
  { level: "Bachelor of Business Administration", detail: "Jai Hind College, Mumbai. Industry Integrated with Tata Consultancy Services.", result: "Final year. Expected April 2027" },
];

export interface Role {
  dates: string;
  role: string;
  org: string;
  points: string[];
}
export const EXPERIENCE: Role[] = [
  {
    dates: "Aug – Sep 2026",
    role: "Investments Intern",
    org: "Ascendas Firstspace Development Management Pvt. Ltd.",
    points: [
      "Researched industrial and logistics real estate in Mumbai, Pune and NCR, focusing on rents, Grade-A supply and developer activity.",
      "Worked with property and market data and gained an understanding of warehouse leasing, logistics assets and investment research.",
    ],
  },
];
export const LEADERSHIP: Role[] = [
  {
    dates: "2024 – present",
    role: "Organising Committee",
    org: "TALAASH & Jai Hind Conclave",
    points: ["Event planning, logistics, coordination and outreach."],
  },
];

export const SKILLS: { group: string; items: string[] }[] = [
  { group: "Finance", items: ["Excel financial modelling", "Financial statement analysis", "Equity research", "DCF", "WACC", "SOTP", "Residual income", "Comparables", "Forecasting", "Sensitivity analysis"] },
  { group: "Markets", items: ["Equity screening", "Technical analysis", "Derivatives", "Portfolio risk", "Enterprise risk management fundamentals"] },
  { group: "Tools", items: ["Microsoft Excel", "PowerPoint", "Python (basic)", "SQL (introductory)", "Git/GitHub", "AI-assisted development"] },
  { group: "Languages", items: ["English", "Hindi"] },
];
export const INTERESTS = ["Private equity and hedge funds", "Investment banking", "Wealth management"];

// Case-card structure. Open questions only: no conclusions, ratings or targets.
export const CASE_DETAIL: Record<Ticker, { hypotheses: [string, string]; risks: [string, string, string] }> = {
  HDFCBANK: {
    hypotheses: [
      "Can deposit growth and a stable deposit mix keep funding cost and margin in line with loan growth?",
      "Or does funding-cost pressure and slower deposit growth lower the return on equity the book can sustain?",
    ],
    risks: [
      "Margin compression if funding costs stay high or the deposit mix worsens.",
      "Asset quality weakening beyond the credit cost assumed.",
      "Per-share inputs misstated if share counts are not restated consistently after the 2025 bonus issue.",
    ],
  },
  DLF: {
    hypotheses: [
      "Do launches and collections follow the disclosed pipeline closely enough for project-level NAV inputs to hold?",
      "Or do launch delays, pricing or execution gaps move project cash flows enough to change net asset value?",
    ],
    risks: [
      "Launch timing and execution slippage against the disclosed pipeline.",
      "Project economics (price, cost, timing) differing from disclosed inputs.",
      "Inconsistent cash roll between project disclosures and the group balance sheet.",
    ],
  },
  BHARTIARTL: {
    hypotheses: [
      "Does ARPU growth outpace capital intensity enough to lift free cash flow?",
      "Or do network, spectrum and funding costs absorb the benefit of higher ARPU?",
    ],
    risks: [
      "ARPU growing more slowly than the modelled drivers.",
      "Capital and spectrum spending above modelled levels.",
      "Leverage and funding cost, plus source and beta inconsistency in the cost of capital.",
    ],
  },
  BAJFINANCE: {
    hypotheses: [
      "Does the loan mix keep credit cost within what a stable return on equity requires?",
      "Or do rising stage 3 assets or dearer wholesale funding compress the spread and the return on equity?",
    ],
    risks: [
      "Credit cost through the cycle.",
      "Cost and availability of wholesale funding.",
      "Per-share figures not adjusted consistently for the 2025 split and bonus.",
    ],
  },
  HDFCLIFE: {
    hypotheses: [
      "Do persistency and new-business margin stay inside the disclosed embedded-value assumptions?",
      "Or is embedded value too assumption-dependent to support a defensible valuation from public disclosures?",
    ],
    risks: [
      "Persistency below the assumptions behind embedded value.",
      "Embedded-value vintage and changes in assumptions.",
      "No supported embedded-value engine or source, so valuation stays withheld.",
    ],
  },
};
export const CASE_DATA_STATUS: [string, string][] = [
  ["Filings and annual reports", "Not loaded"],
  ["Market data", "Not loaded"],
  ["Valuation output", "None"],
];

// Separate, non-core project. Shared on LinkedIn only; no PDF is published here.
export const STUDY = {
  title: "Independent valuation study: Reliance Industries",
  period: "2026",
  summary:
    "A separate independent valuation study of Reliance Industries, prepared in 2026. It is not part of the five research cases or the demonstrations on this page, and it is not an ASTRA output.",
  methods: ["10-year FCFF", "WACC", "Reverse DCF", "Segment SOTP", "Comparable companies", "Sensitivity scenarios"],
  note: "Shared on LinkedIn. No PDF or workbook is published here. LinkedIn may require sign-in.",
  links: [
    { label: "Valuation report post", href: "https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_reliance-report-activity-7511490572344512512-99Oc" },
    { label: "Excel workbook post", href: "https://www.linkedin.com/posts/krishiv-ramchandani-02543835b_astra-reliance-excel-report-activity-7511495036921073664-tM6T" },
  ],
};

export const ASTRA_WORKSTREAMS = [
  "Three-statement forecasting and FCFF, residual-income and sum-of-the-parts valuation workflows, with peer comparison and sensitivity analysis.",
  "Filing-based data checks and Excel and PDF reporting.",
  "Equity screeners, technical indicators and backtesting with transaction-cost and look-ahead controls.",
  "Research-stage options analytics, Greeks and portfolio risk tools.",
];
