// All public copy and the asset gate live here. Source of every fact: owner-supplied CV (Oct 2026) or the owner mandate.
// An asset is rendered only if public_approved === true AND asset_path is set. Nothing else ships.

export interface GatedAsset {
  id: string;
  title: string;
  status: 'missing' | 'available' | 'approved';
  public_approved: boolean;
  evidence: string; // where the owner approval / source lives
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

export const person = {
  name: 'Krishiv Ramchandani',
  tagline: 'Finance researcher and builder of analytical tools.',
  lede: 'I study businesses, valuation and market risk, and build practical software to make research more structured and transparent.',
  email: 'krishivramchandani@gmail.com',
  linkedin: 'https://www.linkedin.com/in/krishiv-ramchandani-02543835b',
  github: 'https://github.com/1011K',
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
  when: 'Expected 2027',
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
    'Compared industrial and logistics rents, Grade-A supply and developer activity across Mumbai, Pune and NCR to support real estate investment research.',
    'Reconciled property datasets and classified Grade-A and Grade-B assets for consistent market comparisons.',
    'Reviewed Japan–India investment structures and GIFT City Category II AIF rules using regulatory and company documents.',
  ],
}];

export const projects = [
  {
    name: 'ASTRA',
    kind: 'Equity research and market analysis platform',
    when: '2026–present',
    body: 'ASTRA brings fundamental research, technical analysis, company developments, portfolio insights and related analytical tools into one interface. I have been involved in building and developing the platform as a practical application of my finance and software interests. It remains an evolving project.',
    tags: ['Financial research', 'Technical analysis', 'Portfolio analysis'],
  },
  {
    name: 'Reliance Industries valuation study',
    kind: 'Independent research',
    when: '2026',
    body: 'A ten-year FCFF valuation of Reliance Industries with reverse DCF, sum-of-the-parts, peer multiples and WACC sensitivities. The full report is not published; it will be posted only after content and release review.',
    tags: ['FCFF DCF', 'SOTP', 'Peer multiples'],
  },
];

export const simulations = {
  training: 'CFA Institute: Financial Modeling Practical Skills module (completed).',
  forage: 'Forage virtual job simulations (11 completed, 2025–2026): Goldman Sachs (3), Vista Equity Partners (3), Citi, Bank of America, Standard Chartered, Deloitte Australia, BCG X. These are self-paced simulations, not employment.',
  leadership: 'Organising Committee, TALAASH and Jai Hind Conclave (2024–present): event planning, logistics, stakeholder coordination and outreach.',
  skills: [
    ['Corporate finance', 'Financial statement analysis, three-statement forecasting, DCF, WACC, SOTP, comparable companies, sensitivity analysis'],
    ['Research & markets', 'Company and industry research, investment screening, real estate market research, risk and derivatives analytics'],
    ['Tools', 'Microsoft Excel, PowerPoint, Python (basic), SQL (introductory), Git/GitHub'],
    ['Languages', 'English and Hindi (fluent); Sindhi (conversational); French (beginner)'],
  ] as [string, string][],
};
