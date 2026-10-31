// All public copy and the asset gate live here. Source of every fact: owner-supplied CV (Oct 2026) or the owner mandate.
// An asset is rendered only if public_approved === true AND asset_path is set. Nothing else ships.

export interface GatedAsset {
  id: string;
  title: string;
  status: 'missing' | 'available' | 'approved';
  public_approved: boolean;
  evidence: string; // where the owner approval / source lives
  sector?: string; as_of?: string; authorship?: string; synopsis?: string; limitations?: string;
  asset_path?: string; // file under public/ (must also pass scripts/audit-public.mjs)
}

export const gated: Record<'resume' | 'video' | 'screenshots' | 'reports', GatedAsset[]> = {
  resume: [{ id: 'cv', title: 'Résumé (PDF)', status: 'available', public_approved: false,
    evidence: 'KRISHIVRAMCHNDANI__CV.pdf contains a personal phone number; owner must supply a public-safe copy.' }],
  video: [{ id: 'astra-linkedin', title: 'ASTRA walkthrough (LinkedIn)', status: 'missing', public_approved: false,
    evidence: 'Exact published LinkedIn file/permalink not yet supplied.' }],
  screenshots: [],
  reports: [],
};

export const approved = (list: GatedAsset[]) => list.filter((a) => a.public_approved && a.asset_path);
export const releasedReports = (list: GatedAsset[]) => approved(list).filter((a) => a.sector && a.as_of && a.authorship && a.synopsis && a.limitations);

export const person = {
  name: 'Krishiv Ramchandani',
  tagline: 'Investment research, equity valuation and financial analysis.',
  lede: 'I combine company research, financial modelling and practical software development to investigate how businesses create value and how assumptions change an investment case.',
  email: 'krishivramchandani@gmail.com',
  linkedin: 'https://www.linkedin.com/in/krishiv-ramchandani-02543835b',
  github: 'https://github.com/1011K',
};

export const profile = {
  summary: [
    'I am a final-year BBA student at Jai Hind College, Mumbai, with investment research experience at Ascendas Firstspace and independent work in equity valuation. My focus is on understanding businesses through their financial statements, industry economics and the assumptions underlying valuation.',
    'During my investments internship, I examined industrial and logistics property markets, reconciled real-estate datasets and compared investment-market conditions across Mumbai, Pune and NCR. In independent research, I have worked on financial forecasting, DCF valuation, segment-based analysis and sensitivity testing.',
    'Alongside finance, I develop ASTRA, an equity research and market analysis platform. I am interested in investment research, valuation and corporate finance, with quantitative and software tools supporting the analysis rather than replacing the financial judgment.',
  ],
  focuses: [
    { heading: 'Research', description: 'Company and sector analysis, interpreting business drivers, financial statements and primary information.' },
    { heading: 'Valuation', description: 'FCFF forecasting, WACC, SOTP, trading comparables, reverse DCF and scenario sensitivity.' },
    { heading: 'Applied technology', description: 'Building usable research workflows and structuring data for more consistent financial investigation.' },
  ],
};

export const researchCase = {
  title: 'Reliance Industries | Independent valuation study',
  date: '2026',
  category: 'Company research · Segment valuation',
  question: 'How do Reliance Industries’ different businesses contribute to value, and how sensitive is the result to core assumptions?',
  approach: 'Built a ten-year FCFF model with a segment-based sum-of-the-parts perspective, peer multiples, reverse DCF and WACC / scenario sensitivities.',
  contribution: 'Independent financial modelling, research synthesis and sensitivity analysis.',
  status: 'Research work completed; full PDF not approved for public download.',
  limitations: 'Public release requires a dated financial snapshot, source reconciliation and review of the final report.',
  methods: ['10-year FCFF', 'Segment SOTP', 'Trading comparables', 'Reverse DCF', 'Sensitivity analysis'],
};

export const facts: [string, string][] = [
  ['Position', 'Final-year BBA student, Jai Hind College, Mumbai (graduating 2027)'],
  ['Focus', 'Equity research, valuation, financial modelling, corporate finance'],
  ['Credentials', 'CFA Program Level I passed · Level II registered (May 2027) · NISM XV, VIII, IX'],
  ['Experience', 'Investments Intern, Ascendas Firstspace Development Management, Aug–Sep 2026'],
  ['Builds', 'ASTRA, an equity research and market analysis platform (2026–present)'],
  ['Based in', 'Mumbai, India'],
];

export const education = {
  school: 'Jai Hind College, Mumbai',
  degree: 'Bachelor of Business Administration (Industry Integrated with Tata Consultancy Services)',
  when: '2024–2027 · Expected graduation 2027',
  gpas: [['S1', '10.00'], ['S2', '10.00'], ['S3', '9.33'], ['S4', '9.73']] as [string, string][],
  note: 'Semester GPAs out of 10. Class XII 91%; ICSE Class X 97.2%.',
};

export const qualifications: { name: string; detail: string }[] = [
  { name: 'CFA Program', detail: 'Passed Level I (2026). Registered for Level II, May 2027. Candidate, not a charterholder.' },
  { name: 'NISM Series XV', detail: 'Research Analyst: passed.' },
  { name: 'NISM Series VIII', detail: 'Equity Derivatives: passed.' },
  { name: 'NISM Series IX', detail: 'Merchant Banking: passed.' },
];

export const experience = [{
  role: 'Investments Intern',
  org: 'Ascendas Firstspace Development Management Pvt. Ltd., Mumbai',
  when: 'Aug–Sep 2026',
  bullets: [
    'Researched Grade-A industrial and logistics markets across the Mumbai region, Pune and NCR, comparing rents, supply and demand, transactions and developer activity.',
    'Reconciled location and property datasets, producing structured market mapping and Grade-A / Grade-B segmentation for consistent city-level comparisons.',
    'Examined Japan–India investment structures, GIFT City Category II AIF frameworks and Indian real-estate assets using company and regulatory documents.',
    'Prepared comparative investment research with attention to source traceability and differences between primary and secondary evidence.',
  ],
}];

export const projects = [
  {
    name: 'ASTRA',
    kind: 'Independent equity research and market analysis platform',
    when: '2026–present',
    body: 'ASTRA brings fundamental equity research, technical analysis, company developments, portfolio insights and related analytics into one platform. I am involved in developing financial research workflows and connecting analytical ideas with usable software. The platform is an evolving independent project, not a commercial investment recommendation service.',
    tags: ['Equity research', 'Market analysis', 'Finance + software'],
  },
];

export const simulations = {
  training: 'CFA Institute: Financial Modeling Practical Skills module (completed).',
  forage: 'Forage virtual job simulations (11 completed, 2025–2026): Goldman Sachs (3), Vista Equity Partners (3), Citi, Bank of America, Standard Chartered, Deloitte Australia, BCG X. These are self-paced simulations, not employment.',
  leadership: 'Organising Committee, TALAASH and Jai Hind Conclave (2024–present): event planning, logistics, stakeholder coordination and outreach.',
  skills: [
    ['Corporate finance', 'Financial statement analysis, three-statement forecasting, DCF, WACC, SOTP, comparable companies, sensitivity analysis'],
    ['Research & markets', 'Company and industry research, investment screening, real estate market research, risk and derivatives analytics'],
    ['Tools', 'Microsoft Excel, PowerPoint, Python (basic), JavaScript / TypeScript (AI-assisted), SQL (introductory), Git/GitHub'],
    ['Languages', 'English and Hindi (fluent); Sindhi (conversational); French (beginner)'],
  ] as [string, string][],
};
