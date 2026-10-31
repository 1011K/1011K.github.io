# PORTFOLIO V2 — LOCKED CODEX IMPLEMENTATION BRIEF
Version: 2026-10-31 | Status: APPROVED SCOPE, NOT APPROVED FOR PUBLIC DEPLOYMENT
Repository: 1011K/1011K.github.io
Target: single-page professional portfolio at https://1011k.github.io/
Owner: Krishiv Ramchandani

## 0. Non-negotiable identity and decisions
- Exact displayed wordmark: **Krishiv.r**. It is spelled K-r-i-s-h-i-v, followed by a period and lowercase r. NEVER write Krishev, Krishev.R, Krishiv R. or any alternate in published UI.
- Full name: **Krishiv Ramchandani**.
- The person, education, experience, independent research and buy-side career aspirations come first. ASTRA is a substantial project, not the person's entire identity.
- The fourth interactive demonstration is **standalone Portfolio Risk & Allocation**. Do not replace it with Mosaic or an accounting-card explainer.
- A genuine, approved professional portrait and a safely reviewed ASTRA demonstration video are required before final launch. No synthetic person, unrelated photo, fabricated footage, or unreviewed screens.
- EXACTLY ONE PUBLIC WEB PAGE: a single /index.html containing continuously stacked sections accessible by #anchors and smooth scroll; no internal /research/, /lab/, /astra/, /about/ or /contact/ page navigation. Multiple modular TypeScript/CSS files are fine. Do not equate single-page site with one source file.
- Keep the existing deployed site unpublished/under maintenance while building. NEVER push to gh-pages or trigger Pages release without the owner's separate explicit approval of the final reviewed commit. Source work stays on an isolated development branch/PR. Do not rewrite history.

## 1. Correct page information architecture and copy hierarchy
Navigation anchors and section order (desktop sticky top bar; compact accessible mobile):
1. #top — Hero: Krishiv.r wordmark, full name Krishiv Ramchandani, genuine portrait, concise professional summary, discreet location "Mumbai, India" if useful, CTA to Research, ASTRA and contact.
2. #education — Jai Hind College, Mumbai; ongoing final-year Bachelor of Business Administration, expected graduation **May 2027** (confirm exact degree designation against authoritative owner CV). Present available academically verified semester GPAs if retained; do not dump unrelated facts into the hero.
3. #qualifications — CFA Program Level I passed; Level II registered/candidate, scheduled May 2027. NISM Research Analyst, Equity Derivatives, Merchant Banking exams passed. Do not present as CFA charterholder or SEBI-registered RA. Put relevant training in an optional concise subsection.
4. #research — Published, independently checked sector/company studies with visual key takeaways; provision for 17 sector assignments, but only exhibit reports approved and actually shipped. The incomplete 17 are an editorial pipeline, NOT 17 completed downloadable research reports.
5. #experience — Investments internship at Ascendas Firstspace Development Management, Aug–Sep 2026, with two compact credible evidence-led points; independent work and selected simulations separately and honestly labelled. Preserve accurate employer and job descriptions.
6. #astra — ASTRA platform case study with central ASTRA circular interactive feature map, short plain-English explanations of Financial Intelligence, Technical Intelligence, Mosaic, Derivatives/Quant, Portfolio Intelligence and Market Scan/Research; approved real screenshots; prominent safe ASTRA video; a concise statement of the owner's contribution.
7. #labs — Four distinct, graphical, inspectable interactive modules displayed one below another. Use anchor subnav #lab-financial, #lab-technical, #lab-derivatives, #lab-portfolio. No replacing modules in one shared container by clicking tabs; tabs may change scenario inside a module.
8. #direction — Short career goals: investment research / valuation, interest in private equity, hedge funds and buy-side investment decision-making. Express as ambition and learning direction, not as attained professional experience. Brief skills contextualised with examples.
9. #contact — Professional email, correct LinkedIn and GitHub URLs. Public CV download only once a vetted phone-free PDF is explicitly approved; otherwise omit download CTA.

Summary draft to tune with owner, not bland slogans:
"I am a final-year BBA student at Jai Hind College, Mumbai, with an interest in investment research, private equity, hedge funds and buy-side decision-making. Through investment research experience, independent company valuation and financial modelling, I focus on understanding business economics, assessing investment assumptions and evaluating risk. I also develop ASTRA, an integrated equity research platform bringing financial, technical, market-event, derivatives and portfolio perspectives into one analytical workflow."
Verify all specifics against owner's records; do not invent career achievements. Remove generic slogan "Finance, research and the technology behind decisions."

## 2. Visual specification
- Editorial, high-trust investment professional style. Deep charcoal / black background, off-white foreground, subtle warm taupe/brown accent. Restrained movement, generous whitespace, meaningful data visuals, readable contrast and polished typography.
- Professional hero should be the visual priority; preserve subject prominence and photo integrity. Never generate a substitute photograph, crop to alter identity, or use the earlier wrong-person concept.
- Supplied visual studies are PRIVATE DESIGN REFERENCES, not public content. Apply their hierarchy, typography and diagram treatment; delete any design-reference gallery from UI and never ship reference image files unless separately approved for publication.
- ASTRA must be represented as an intentional CENTER-RADIAL DIAGRAM, not a plain list of cards. Responsive mobile diagram must remain legible and operable with keyboard; offer accessible text equivalents.
- No placeholder graphics pretending to be actual ASTRA screenshots. No irrelevant finance stock illustrations as evidence. Keep visuals proportional; avoid dashboard clutter.
- Clear distinction between example data, actual sourced prices and hypothetical simulation outcomes.

## 3. Lab functional acceptance (all four live on the page at the same time)
A. Financial Intelligence:
- User-selectable illustrative issuer or one approved verified issuer, relevant real peer cohort only when dated source data is approved.
- Show financial/valuation comparables; interactive WACC x terminal growth heatmap, a transparent 5-year FCFF model or better verified model, base/bull/bear scenario charts, cash-flow and assumptions table, explicit model limits and units.
- Calculations must be deterministic. Reject g >= WACC and invalid units. Distinguish enterprise versus equity value; do not claim a real stock target price based on hypothetical numbers.
- Optional link via #research to a verified published company report; no dead links.

B. Technical Intelligence:
- ONE stock by default, optional second comparison stock; verified timestamped historical price dataset or explicitly synthetic illustrative sample. Show candlesticks, configurable EMA overlays, RSI, clear price/indicator axes, bullish/bearish/neutral context clearly defined.
- Two properly specified historical rule-based strategies with entry/exit markers and scenario controls; show returns, benchmark, max drawdown, turnover, assumptions on commissions/slippage, data horizon and out-of-sample limits.
- No fabricated live market prices; no look-ahead, leakage or use of unavailable future data. Do not label an educational strategy as proven profitable.

C. Derivatives & Quant:
- Stock-linked price scenario and option strategy payoff chart with break-even points, capped/uncapped exposure indication, spot/strike/expiry/volatility scenario changes. Real quotes require sourced, timestamped and rights-cleared data.
- Greeks can be supplementary outputs, not a standalone dead table. Show dynamic graphical payoff curves and meaningful risk explanation. State simplifying pricing assumptions (e.g. European exercise and dividends).
- Hypothetical premiums must be labelled hypothetical, not displayed as real listed option quotes.

D. Standalone Portfolio Risk & Allocation:
- Interactive weights for 2–4 educational assets, equity/sector allocations, concentration visualisation, correlation matrix or input, volatility and drawdown under clearly defined assumptions, rebalancing scenario and benchmark comparison where supported.
- Enforce weights summing to 100% (or explicitly model cash/leverage), no nonsensical matrices, PSD check for correlation or constrained two-asset case, no promises of future returns.
- Show dynamic allocation charts and risk contributors; display all formulas, units and caveats. Keep independent from ASTRA private Portfolio Fit engine.

Use existing tested logic where correct, not unverified formula rewrites. Every module needs interactive controls, graphical output, interpretation, transparent method, error/empty state and mobile test. Keep render + calculations modular and unit tested.

## 4. ASTRA video security / intellectual-property gate
- The video is a prominent and required deliverable, but must NOT be published automatically.
- Preferred: 45–90 second prerecorded MP4/WebM showing a dedicated public-safe, isolated showcase or reviewed real screen capture with public/illustrative data. Never give public site direct access to internal ASTRA APIs, runtime, source, keys, data stores or repository.
- Showcase flow: overview -> ASTRA radial disciplines -> a Financial Intelligence analysis -> Technical Intelligence -> Mosaic company events -> Derivatives or Portfolio -> concise end frame. The published page labels mock/illustrative footage as such. Do not imply mock footage is certified production functionality.
- Review the exact rendered frames AND audio, captions, thumbnail and media metadata for: internal routes/domains, localhost ports that reveal topology, credentials, keys, browser tabs, developer tools, source maps, file paths, private project status, API response payloads, unlicensed content, personal information, confidential datasets, unpublished model logic.
- Blur/covering live footage is not a guaranteed redaction; ideally capture only approved screens with a separate sanitized demo dataset. Transcode and inspect an exported clean file, then review exact binary before approval.
- A public video can be copied and visually analysed; it cannot guarantee protection against inference or REA-style reverse engineering. Protect by data minimization and separation, not security theatre.
- Until video file is supplied, inspected, rights-checked and owner approved, show an honest tasteful "Demonstration in preparation" editorial panel instead of an inoperative play button, fabricated video or live link.

## 4A. LinkedIn source discovery (2026-10-31, evidence and limits)
- Owner confirms the *genuine professional portrait* and *existing ASTRA demonstration video* are already posted on their LinkedIn profile: https://in.linkedin.com/in/krishiv-ramchandani-02543835b. Treat LinkedIn as the FIRST SOURCE LOCATION for the missing assets rather than asking for new media or inventing substitutions.
- Publicly indexed LinkedIn profile text (checked 31 Oct 2026) confirms a first-person ASTRA introduction post explicitly describing a demonstration video as a glimpse of ASTRA; this establishes that the video post exists, NOT that the actual playable MP4/post URL has been fetched, inspected or cleared for republishing. Do not assert media asset inspection.
- The profile also indexes follow-up posts describing TWO Reliance Industries demonstration reports, named an Excel report and an institutional report. The document attachments, exact versions, calculations, and rights were not retrievable in this inspection; keep research files WITHHELD for direct downloads until exact-file audits and owner approval.
- LinkedIn profile's public text includes Ascendas Firstspace experience, Jai Hind College education (2024–2027), CFA Level I pass, and several NISM / Forage entries. Some listed details differ from the portfolio's owner-provided records (e.g. LinkedIn NISM Series VII vs prior owner claim of Series VIII); reconcile against certificates/source CV, NEVER silently merge incompatible credential claims.
- Public scraping fetch of LinkedIn returned 999 bot-blocked. The installed LinkedIn connector can identify the user's profile but does not expose post video bytes or the profile photo file. Consequently the PHOTO IS OWNER-LOCATED, IMAGE BYTES NOT YET RETRIEVED/INSPECTED; VIDEO POST TEXT IS VERIFIED, VIDEO BYTES NOT YET RETRIEVED/INSPECTED.
- Codex must access the owner's own LinkedIn account through an authorised browser or owner-provided originals/downloads; follow access rules, no scraping bypass. Prefer actual original full-resolution photo/video from owner-operated media rather than compressed LinkedIn copies. The final assets still require media privacy/security/rights clearance and owner approval before shipping. Linking to the verified LinkedIn profile in the meantime is acceptable.
- Do not fabricate a direct ASTRA post URL or claim a LinkedIn video embed works. Resolve exact share URL from the actual post if accessible. For the public website, a reviewed locally hosted clean clip is preferable to an unverified LinkedIn player embed.

## 5. Portrait and CV asset gate
- Use actual owner-provided professional photo only, not stock/synthetic portrait; request the real original asset if inaccessible. Do not pull a stranger's face from web images. Remove unintended EXIF/location metadata and verify exact crop/resolution, rights and owner approval.
- CV: obtain owner-approved source without phone, address or other unapproved private details; make a fresh genuine, high-quality ATS-readable PDF, inspect extracted text, PDF metadata, embedded attachments/links, layers and hidden content. Never redact by only covering text with a rectangle. Keep CV link disabled until exact hash approved.
- No owner phone/residential address, personal credentials or other confidential media in build assets or public source commit history. Published static repo means source and files are publicly inspectable.

## 6. Research publishing gates
- Maintain a fail-closed publication manifest for research/PDF/media by exact SHA-256 and explicit owner approval; only allowlist actual reviewed files.
- A published study must show issuer/sector, research question, dated sources, fiscal periods, numerical method/assumptions, one visual finding, thesis/counter-thesis, scenario risks, authorship/contribution, meaningful caveats and verifiable download URL.
- Keep an unpublished register of planned 17 assignments if needed, but public page must not claim the reports exist. Do not create fictional report contents/downloads, fake market values or false "verified" badges.
- Preserve separation between private ASTRA and public conceptual website. No internal audit ledgers, branch refs, tests, P0 tracking, coverage statistics, security architecture or unapproved screenshots in public prose.

## 7. Repo-specific implementation notes (verified 2026-10-31)
- Existing stack: Vite 8, TypeScript, Vitest; no backend; modular CSS and script files. Retain and improve rather than adding heavy frameworks or paid services without justification.
- Current vite.config.ts explicitly configures 6 Rollup HTML inputs (profile/research/lab/astra/about/contact); replace with single index.html input.
- Current src/main.ts dispatches by body.dataset.page, uses page links and renders designGallery(). Replace with section components/id anchors and one coherent page render.
- Existing src/content.ts has the generic tagline, summary and education data; restructure copy and identity without inflating factual credentials.
- Existing src/lab.ts switches between DCF, portfolio, options and statements using a single #module host; replace with four always-mounted, individually interactive research modules.
- Existing publication-manifest.json lists the former CV and design images as public-approved; DO NOT blindly republish them. The deployed gh-pages versions were taken offline/removed during the 31-Oct maintenance intervention. Introduce new evidence-based publication approval gates for new photo, new CV and video.
- Keep safe static hosting, no external data connection unless separately authorised. No interactive real-market API credentials in browser. No secret build-time values that become client assets.
- Avoid changing ASTRA repository or FMB/ASTRA P0 workstreams; these are separate projects.
- Make accessible navigation, focus management, reduced-motion preference, responsive charts and keyboard controls first-class.

## 8. Engineering workflow and verification
1. Inspect existing source, asset manifest, scripts and deploy settings. Document the problems and a file-by-file migration plan.
2. Create V2 worktree/branch independent of gh-pages and ASTRA work. Do not deploy.
3. Build shell and hero/summary/education/qualifications, then research, experience, ASTRA, labs, direction and contact.
4. Ensure 4 lab modules are all physically in the DOM. Test each in desktop and mobile; no routes between sections.
5. Add robust unit tests for valuation/technical strategy/derivatives/portfolio numerical methods and error states. Validate no fake performance, unit conversion errors or data leakage.
6. Add Playwright or equivalent browser checks if available without damaging test stack: desktop 1440, mobile 390; anchor navigation, portrait fallback, video fallback, research gates, links, CV gating, responsiveness, color contrast, keyboard and prefers-reduced-motion.
7. Run existing commands (based on package.json): npm ci --ignore-scripts; npm test; npm run typecheck; npm run build; npm run audit:public; npm run test:audit; npm audit. Investigate failures, do not hide them.
8. Scan all emitted files and source for secrets/private routes/phone/address, unexpected PDFs/images/videos, production source maps, references to design-gallery files and duplicate HTML entry pages. Review manual browser screenshots.
9. Deliver review evidence: changed-file list, test results with actual counts, annotated screenshots for desktop/mobile, asset-approval manifest status, four lab interaction recordings/test notes, exact commit SHA, known limitations and a plain statement that deployment has NOT occurred.
10. Ask owner for explicit approval of the exact release artifacts, then and only then perform a separate reviewed publication step.

## 9. Stop-ship rules
REJECT if any of: misspelt wordmark, multi-page site, missing prominent personal summary/education, unavailable photo passed off as a portrait, missing or fabricated ASTRA video, no radial ASTRA visual, static/decorative labs, false research downloads, leaked internal ASTRA information, old design references published as a gallery, bad CV/redaction, inaccurate qualifications, failed deterministic tests, or deployment before approval.

## 10. Codex start instruction
Implement this brief on a NEW non-deploying branch. First respond with a short source-grounded architecture plan and a traceability checklist mapping each requirement to specific source files and tests. Then code and verify. Do not improvise identity, publish unapproved assets, change portfolio scope, or release to GitHub Pages. Treat this brief as the contract.
