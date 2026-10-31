# Krishiv.r | FINAL VERIFIED CODEX IMPLEMENTATION CONTRACT

**Date:** 31 October 2026 IST  
**Project:** Krishiv Ramchandani personal finance and research portfolio  
**Repository:** `1011K/1011K.github.io`  
**Source branch:** `brief/portfolio-v2-single-page-2026-10-31`  
**Status:** Build authorization, **NOT production deployment approval**

> Codex: This is the FINAL, controlling instruction. Implement the actual site on a new non-deploying branch based on the brief branch. This document supersedes older portfolio specs where they conflict, including earlier Claude handoffs, first Codex brief, and design images. Verify actual assets. Do not modify any ASTRA or FMB repository, branch, issue, code, model, dataset, or P0 workstream.

## 1. EXACT IDENTITY AND NON-NEGOTIABLE RULES

- **Wordmark must be exactly `Krishiv.r`** (capital K, lowercase rishiv, period, lowercase r). This is not `Krishev.R`, `Krishev`, `KRISHIV R.`, or `Krishiv R.`. Use exactly this text in navigation and the favicon's accessible label; use an explicit automated string test.
- **Full formal name: `Krishiv Ramchandani`** in hero, metadata, CV and alt text.
- This is a PERSON'S professional portfolio. Its purpose is applying for finance/investment internships and showing the development of a final-year student interested in equity research, private equity, hedge funds, valuation, asset management and buy-side finance. These are CAREER INTERESTS, not claims of past PE/HF employment.
- ASTRA is an important independently developed project, **not** the site identity. No public ASTRA architecture, prompts, formulas, implementation steps, internal status, P0 ledger, acceptance counts, performance claims, private source, API details or user-account data.
- **One continuous public page at root URL, not six HTML destinations.** Multiple modular TypeScript/CSS files are encouraged. Navigation links scroll within the one page through anchors, preserve history/hash, maintain keyboard focus and allow browser back navigation. Vite must output one main HTML page, not `/research/`, `/lab/`, `/astra/`, `/about/` or `/contact/` subpages.
- **Photo:** genuine professional photograph of the owner with owner-verified identity and approval. No AI-generated face, no stock model, no wrong person. No unapproved personal photos.
- **Video:** ONLY the exact existing ASTRA LinkedIn demonstration, unchanged, no re-record, cut, re-voiceover, transcoding, new captions burned into media or generated replacement. The previous proposal for a new 45–90 second video is REVOKED.
- **Fourth educational module:** standalone Portfolio Risk & Allocation, not Mosaic or Financial Statements. Other three: Financial Intelligence, Technical Intelligence, Derivatives & Quant. Four working graphical modules arranged one physically below another, not tab navigation to separate HTML pages.
- Do not deploy, enable Pages, push to gh-pages or merge changes until owner separately approves exact final SHA and reviewed assets. Current public deployment has maintenance HTML; source main remains separate.

## 2. SOURCE AND CONFLICT PRIORITY

1. Latest direct owner instructions > earlier conversation > visually inspected original design refs > old draft website content > AI-generated guesses.
2. Exact owner-supplied and reviewable personal CV/school records govern personal details. Public LinkedIn is useful supporting evidence, not permission to copy everything. If discrepancy, mark DISPUTED privately; do not silently choose one.
3. Actual obtained media bytes + visual inspection + owner sign-off > filename, search result, link thumbnail, or old assistant statement that an asset exists.
4. Actual research PDF/model/source filings + deterministic cross-check + independent methodology review + rights/owner approval > LinkedIn post claim or planned assignment.
5. Tests and actual browser screenshots > Code agent's narrative assurances.
6. For all items keep separate states: DISCOVERED SOURCE, BYTES RETRIEVED, INSPECTED, VERIFIED, OWNER APPROVED, DEPLOYED. Do not call one state another.

## 3. REFERENCE TEMPLATES: INSPECTED PIXELS, NOT PUBLIC CONTENT

Three actual PNG files remain in the main source under `public/media/`:

- `01_general_professional_portfolio.png`, Git blob SHA `61f7f28f45fb4665846cd1a76372533a15781b8e`: dark editorial personal homepage, serif name, right qualification rail and basic research cards. Use visual hierarchy only. It shows WRONG old wordmark `KRISHIV R.` and WRONG generic slogan; do not reuse text or publish image.
- `02_financial_research_lab.png`, Git blob SHA `84595ecd4e98f6b60b04e08c9b44b17f50e5d646`: lab layout with assumptions sliders left, valuation line chart middle, interpretation right. Use layout rhythm, upgrade to actual four separate research modules, not the old static low-value demonstrator. Do not publish image.
- `03_astra_project_case_study.png`, Git blob SHA `3dbe8bf17a8ecf986e592fbece4dddda28152d0a`: large ASTRA heading and SIX RECTANGULAR cards. **It does NOT contain the owner's requested central circular ASTRA diagram.** Do not claim it does; design and implement radial map per section 7. Do not publish image.

Past conversation referred to a V3.2 ZIP with original PNG/SVG visual references for general site, lab and ASTRA; original ZIP bytes and the user's specifically remembered *fourth circular* concept are NOT independently recovered in this audit. Search local authorised workspace for the real files if present; don't substitute unrelated assets and claim equivalence.

**Appearance:** professional finance editorial. Canvas deep black/charcoal, off-white typography, restrained neutral/espresso accents, thin dividers, strong serif headline and clean sans-serif body. Keep designs 2/3/4 individually identifiable (professional page, data lab, radial ASTRA). No finance stock people, coloured dashboards everywhere, web3 aesthetic, unapproved portraits, decorative buttons or public design-reference gallery. Site is professional, not a dating profile or a public ASTRA product sales page.

## 4. EXACT SECTION ORDER, LAYOUT AND ANCHORS

Sticky compact top nav: About -> `#about`; Research -> `#research`; Experience -> `#experience`; ASTRA -> `#astra`; Labs -> `#labs`; Contact -> `#contact`. Education and qualifications can be quick-linked from About. All targets are sections in one DOM. On mobile, compact usable menu, no horizontal overflow. Anchors must work in browser history and with JS disabled where possible.

**1. HERO + PROFESSIONAL SUMMARY / `#about`:** Wordmark top-left. Main full-name headline, professional photograph occupying visually balanced right-side slot, genuine professional summary, concise final-year identity, clear View Research and Explore ASTRA buttons, real LinkedIn/GitHub links. Education and CFA credential text should not clutter hero. User should understand student + finance + career aim in first 10 seconds.

Exact draft summary to display pending final editorial QA:
> I am a final-year BBA student at Jai Hind College, Mumbai, with a strong interest in equity research, private equity, hedge funds and buy-side investment analysis. Through investment research experience, independent company valuation and financial modelling, I focus on understanding businesses, challenging assumptions and evaluating risk. Alongside finance, I am developing ASTRA, an integrated equity research platform bringing financial, technical, event-driven, derivatives and portfolio perspectives into a connected research workflow.

Don't use “Finance, research and the technology behind decisions” or describe Krishiv as a financial product. This is aspirational student positioning, not a claim of buy-side employment or financial-advice licensure.

**2. EDUCATION / `#education`:** `Jai Hind College, Mumbai`; BBA final year; 2024–2027, **Expected graduation 2027**. Prior records disagree between April vs May graduation; DO NOT use a month until college/owner resolves. CFA Level II May 2027 is a different date. GPA S1 10.00, S2 10.00, S3 9.33, S4 9.73 (out of 10), XII 91%, X 97.2% may be shown tastefully if consistent with owner records. Do not calculate cumulative GPA from semester numbers or invent rank.

**3. QUALIFICATIONS / `#qualifications`:** distinct from education. Exact conservative phrasing: “Passed Level I of the CFA Program”; “CFA Level II registered candidate, May 2027”; “NISM Series XV Research Analyst, passed”; “NISM Series VIII Equity Derivatives, passed”; “NISM Series IX Merchant Banking, passed”; “CFA Financial Modeling Practical Skills Module completed” where useful. NEVER say CFA charterholder, NISM X-A passed, SEBI-registered analyst or Investment Adviser. LinkedIn currently indexes NISM VII whereas owner's record says VIII; do not overwrite VIII based on a web scrape. One concise learning-to-research link per qualification, not exaggerated claims that certification caused a software module.

**4. RESEARCH / `#research`:** one high-quality Reliance Industries case-study narrative with question, methods, main business drivers, risk/counter-thesis, date/status, personal contribution, and verified PDF only if owner-approved. LinkedIn contains a post mentioning an Excel report and institutional report; POST EXISTENCE IS NOT FILE ACCURACY. Research gallery displays only actual publishable full PDFs. Don't display 17 giant empty planned cards or fabricate PDFs, fair values, valuations, hit rates or forecasts. Make research gallery a credible long-term structure, not unfinished production fiction.

**5. EXPERIENCE / `#experience`:** investments internship at Ascendas Firstspace Development Management Pvt. Ltd., Mumbai, Aug–Sep 2026. Two or three concise grounded points: industrial/logistics markets (Mumbai, Pune, NCR), rent/supply/developer research and dataset reconciliation, plus researched Japan–India investment structures / GIFT City AIF concepts as actually supported. Earlier CapitaLand mentions can be the same corporate-group role; NEVER invent a second employment record. 11 Forage *Virtual Job Simulations* separate from employment, not fictitious paid roles. Leadership TALAASH / Jai Hind Conclave optional if supported.

**6. ASTRA / `#astra`:** short public platform summary; big radial feature map; exact owner LinkedIn video only after verification; 2–5 real ASTRA product screenshots only after authentication/rights/privacy checks; concise honest account of the owner's finance, AI-assisted coding and output-testing role. This is ONE project section, not an internal technical specification. DO NOT publicise internal engineering/release progress, repository topology, errors and remediation queue.

**7. INTERACTIVE RESEARCH / `#labs`:** all four deep modules stacked, always accessible via in-page #lab-financial, #lab-technical, #lab-derivatives, #lab-portfolio. Each must have chart + working controls + changed result + interpretation + formula/provenance + invalid-data state. They are stand-alone educational illustrations, not private ASTRA live engines.

**8. CAREER DIRECTION / `#direction`:** concise interest in equity research, valuation, asset management, private equity and hedge funds; relevant financial tools and practical analytical skills. Describe ambitions and skills, not already-secured jobs. Do not repeat the entire CV.

**9. CONTACT / `#contact`:** public email `krishivramchandani@gmail.com`; professional LinkedIn `https://in.linkedin.com/in/krishiv-ramchandani-02543835b`; GitHub `https://github.com/1011K`. Correct clickable targets, rel=noopener noreferrer. Download CV button ONLY if validated phone/address-free file has explicit version approval. No residential address, phone, personal social accounts, tracking forms or analytics by default.

## 5. PHOTO SOURCE, VALIDATION AND FAIL-CLOSED RULE

The owner says real photo exists on LinkedIn. The profile was identified, but its image bytes could not be fetched directly through public LinkedIn access. Earlier ChatGPT handoffs name `Professional Corporate Headshot.png`, `WhatsApp Image 2026-05-15 at 15.53.51.jpeg`, `IMG_7794.jpg`, `IMG_7795.jpg`, `IMG_7802.jpg`. These are *source leads*, not a fresh verified portrait asset. Prior handoff describes `Professional Corporate Headshot.png` as developed from owner photos, and the owner explicitly rejected a generated wrong person's image. Do not equate generated headshot or filename with genuine photograph.

First inspect exact owner's LinkedIn photo while authorised, or owner-held original in connected local workspace. Require actual image bytes, visually inspect for correct subject, owner confirmation, approved crop, EXIF removal and rights. Keep crop and background simple black/off-white, no AI face transformations. No substitute image, unknown stranger, synthetic corporate headshot or silently AI-enhanced face. Without suitable bytes, finish code with a **non-public review fallback** and record PHOTO BLOCKED; do not represent hero photo complete.

## 6. EXISTING LINKEDIN ASTRA VIDEO, EXACT UNCHANGED

LinkedIn public profile text explicitly includes owner's ASTRA introductory post: “This video is a short glimpse of what ASTRA can currently do.” It also includes a follow-up mentioning “ASTRA Reliance EXCEL Report” and “ASTRA Reliance Institutional Report.” This verifies the posts' text, **NOT the video byte stream, exact share permalink, reported filename, frame safety, asset rights or report arithmetic**. LinkedIn has blocked direct media extraction; no circumventing permissions or scraping controls.

Older handoff mentions a *possible* local `astra-linkedin-final-v2.mp4` (~74.5 sec). **NOT VERIFIED AS THE LIVE POSTED VIDEO**. Codex must locate the actual approved final original via owner's authorised local Mac files or LinkedIn account, compare against posted version where practical, and inspect every visual/audio component for confidential information, licensing and approval. Owner explicitly said same existing video unchanged. Do not remake, trim, filter, transcode, create synthetic clips, change audio, subtitles or script. An adjacent written transcript outside the file is permissible.

Publishing options only after evidence: (a) owner-approved original local clip unchanged; (b) actual verified original LinkedIn post official supported embed, if works, or plain external direct-post link. The profile link is not a video permalink. If exact media unsafe to host, withhold local embed rather than edit contrary to owner's decision; if exact link still unverified, do not create play button or claim video embedded. No LinkedIn login cookies or automated scraping logic committed. No private ASTRA code, browser tabs, paths, API keys, unpublished numbers or licensed data visible in any hostable media.

Screenshots: 2–5 genuine dated real ASTRA interface captures, not generated simulations or UI fake screenshots; add captions explaining customer-facing actions, mark prototype where appropriate, redact secrets and private values without changing the truth. If none cleared, no screenshot carousel with stock images. The old ASTRA concept dashboard PNGs are NOT evidence of actual implementation.

## 7. ASTRA RADIAL VISUAL: IMPLEMENT EXACT STRUCTURE

One CENTRAL prominent black/charcoal circle with typographic ASTRA wordmark. Six evenly distributed peripheral nodes/spokes with readable outer labels:
1 Financial Intelligence — statements, valuations, peer comparisons.
2 Technical Intelligence — trends, historical chart context.
3 Mosaic Intelligence — announcements and company events.
4 Derivatives & Quant — payoff and risk context.
5 Portfolio Intelligence — allocation and risk studies.
6 Market Scan — screening and discovery.

This is a PUBLIC PURPOSE MAP, NOT THE PRIVATE ENGINE ARCHITECTURE. Nodes illuminate on focus/hover/tap and show one sentence without opening a new page. Accessible keyboard navigation; mobile fallback to compact ring or vertically connected readable list. No P0 statuses, architecture arrows, exact algorithms, API paths, data vendors, model confidence scores, live buy/sell signals. Most important: the existing third repository PNG has rectangular cards and must NOT be pasted as this radial graphic. Build the actual circle diagram as specified.

## 8. THE FOUR GRAPHICAL INTERACTIVE LABS (NOT ASTRA ENGINES)

Module 1, `#lab-financial`, Financial Intelligence: one issuer-themed education case, or one approved dated issuer dataset. Clear revenue, margins, cash flow, relevant peer comparisons only when truly sourced, a WACC x terminal-growth sensitivity HEATMAP, interactive scenarios, valuation chart, assumptions/units table and warnings. Pure deterministic FCFF / DCF math. Enforce WACC > terminal growth, periods/units/scope, EV vs equity value; no fabricated stock targets. Inputs change chart immediately.

Module 2, `#lab-technical`, Technical Intelligence: ONE selected stock by default and OPTIONAL second; historical price/volume candlesticks, EMA and RSI overlays, two specified rule-based strategy variants, entry/exit markers, benchmark and drawdown chart. Real prices only if timestamped and rights-cleared; otherwise conspicuous `SYNTHETIC EDUCATIONAL SERIES`, not invented historical share prices. No look-ahead/leakage or applying current data to previous signals. Realistic transaction costs/slippage, out-of-sample caveats, no spurious profitability claims. A changing strategy parameter must visibly recompute signals and statistics.

Module 3, `#lab-derivatives`, Derivatives & Quant: underlying stock case and options expiry P&L payoff graph; spot/strike/premium/expiry controls; e.g. long call vs protective put / defined-risk spread. Show breakeven, maximum risk, payoffs and scenario sensitivity graph. Greeks may supplement but NOT replace graphical result. Differentiate expiry payoff from mathematical fair-value model; don't pretend input premium is a real market quote. Reject nonsensical inputs and clarify assumptions about European/American option and dividends.

Module 4, `#lab-portfolio`, Standalone Portfolio Risk & Allocation: 2–4 hypothetical assets with weights and allocations chart, volatility and contribution-to-risk, concentration, correlations, rebalancing scenario and historical-drawdown chart only if true dated data available. Weights must total 100% or explicit cash/leverage. For >2 assets covariance/correlation must be positive-semidefinite or parameters constrained to valid structures. No portfolio-account integration, imaginary returns or forward promises. Tests cover +/-1 correlation, zero variance, 0/100 weights and numerical rounding.

Every one of the four MUST be visible sequentially down the one page. Shared styling is acceptable; same chart pasted four times is not. All must display methods, input limits, hypothetical/verified data label, calculations in pure testable functions, keyboard-accessible sliders/inputs, responsive chart and sensible empty/error behaviour. Never copy private ASTRA formulas or backend.

## 9. REPORTS: 17 SOURCE REGISTER VS PUBLIC RELEASE

The actual repo `src/assignments.json` (blob SHA `1ac3f5275a81af55a5fc3639ea477ce38c19549b`) contains exactly these 17 planned distinct assignments. These are **candidate topics**, NOT verified publications:

| ID | Company | Sector / focus |
|---|---|---|
| 01 | HDFC Bank | Banking; NIM, asset quality, capital, residual income |
| 02 | Bajaj Finance | NBFC; AUM, credit losses, funding |
| 03 | HDFC Life | Life insurance; embedded value, VNB, persistency |
| 04 | TCS | IT services; revenue and FCFF |
| 05 | Sun Pharma | Pharmaceuticals; specialty / R&D / regulatory |
| 06 | Nestlé India | FMCG; volume, price, mix |
| 07 | Maruti Suzuki | Auto; volumes, ASP, EV capex |
| 08 | Tata Steel | Metals; cycle, spreads, capacity |
| 09 | ONGC | Oil & Gas; reserves, production, capex |
| 10 | NTPC | Power and utilities; capacity and regulatory returns |
| 11 | Larsen & Toubro | Industrials / capital goods; orders, execution, cash flows |
| 12 | DLF | Real estate; presales, project cash flow, NAV |
| 13 | Bharti Airtel | Telecom; ARPU, subscribers, capex |
| 14 | Ambuja Cements | Cement; EBITDA per tonne, utilisation |
| 15 | SRF | Chemicals; segments, capex, cycle |
| 16 | Titan Company | Consumer discretionary; stores, mix, inventory |
| 17 | Container Corporation of India | Logistics; container volume, modal mix, unit economics |

Previous portfolio goal: 10 full reports across 10 genuinely distinct sectors; later expanded register: 17 subjects. Keep 17 candidates internally; publish only actual verified and approved reports. Do NOT equate 17 planned subjects, 10 targeted reports, historical 266 valuation outputs or LinkedIn sample attachments with 17 published institutional-grade PDFs. Do not turn homepage into fake planned-report tiles.

Reliance: owner material and Indexed LinkedIn post support that an ASTRA Excel and institutional report were publicly discussed; also independent owner CV describes 10-year FCFF, SOTP, reverse DCF, peer comparisons and WACC sensitivities. Actual final downloadable files were NOT acquired in this audit. Publication requires per-file source + numerical + attribution/rights approval. HUL valuation draft in an older forensic audit had reported arithmetic inconsistencies and is WITHHELD until independent current-file validation.

Publication checklist PER FILE: issuer, ticker, sector, report as-of date, fiscal periods, currency/scale, standalone/consolidated scope, data source citations, author(s) and Krishiv's actual contribution, methodology, forecasts, base/bull/bear, assumptions, caveats/counter-thesis, reconciliation tests, privacy/IP review, exact SHA-256, explicit owner permission and working full-PDF link. Do not fabricate metrics, estimates, prices, sources, hash values or valid links. Disputed/WITHHELD files do not enter public build. Public investment recommendations/targets require applicable legal/regulatory review; simple “not investment advice” label is insufficient legal clearance.

## 10. CV, SECURITY, ASSET GATES

Existing `main` includes `public/media/krishiv-ramchandani-cv.pdf` and three public design reference PNGs; `publication-manifest.json` STILL labels them as approved in old source. Previous assistant removed copies from deployed `gh-pages` but they remain in public repo/history. **Do not blindly republish from main**. Revoke approval for new release, remove old public files from new dist, and rebuild allowlist. Do not assume deletions remove historical publicly accessible versions. Do not rewrite git history without explicit owner authorization.

CV: create from original approved source with phone and address ABSENT IN SOURCE before export, not a black overlay in PDF. Verify extracted PDF text, metadata, layers/annotations, embedded files, external links and accessibility. Exact final version/hash needs owner approval. Until then, hide CV button. Do not modify ATS master CV files. No home address or private phone anywhere on website, source, dist, image metadata or CV.

Website: static, no backend, no account login, no analytics by default, no remote ASTRA connection, no client-side secrets. Sanitise untrusted data and HTML; avoid unsafe arbitrary innerHTML. CSP where compatible, lock dependencies, scan software supply chain, avoid production source maps and unnecessary external scripts. Check all outbound links. Protect confidentiality through never publishing secrets, not through claims website cannot be reverse-engineered. Security scanner cannot guarantee “unhackable.”

Media gate for any image/video/pdf: exact bytes obtained, inspect content/metadata, rights, owner-approved hash, privacy scan, validate no strange hidden data. Fail-closed static build when unapproved binary is present. No false badges or unapproved upload. Existing reference images are INTERNAL design inputs, not production.

## 11. VERIFIED CURRENT SOURCE AND REQUIRED MIGRATION

GitHub source inspected:
- `package.json`: Vite 8 + TypeScript, Vitest; commands `npm ci --ignore-scripts`, `npm test`, `npm run typecheck`, `npm run build`, `npm run audit:public`, `npm run test:audit`, `npm audit --omit=dev`.
- `vite.config.ts`: currently hardcodes SIX HTML input entries. Replace with a single root input.
- `src/main.ts`: currently switches by `body.dataset.page`, renders separate page views and explicit `designGallery()`. Replace with one page render with anchor sections; eliminate gallery entirely.
- `src/content.ts`: includes real professional education/credentials and WRONG generic tagline. Keep source-backed facts, restructure all presentation.
- `src/lab.ts`: uses a single module switch among DCF, portfolio volatility, Black-Scholes table and conceptual statements. Replace with four always-mounted rich modules and tests; do not claim present version already meets new spec.
- `src/models.ts`, `src/portfolio.ts`: inspect and rerun deterministic tests before reuse; check boundaries, periods and units.
- `publication-manifest.json`: old CV and visual references marked approved; must be corrected, reviewed by owner per actual file. Do not weaken fail-closed gates.
- `scripts/audit-public.mjs`: hardcodes six HTML pages and source allowlist; update for one HTML and the actual source modules and new exact assets. Audit built output and source, including secret/PII patterns.
- `.github/workflows/deploy.yml`: manual release path and testing described. Verify deployed Pages source before any future release, because current legacy `gh-pages` is manually maintained. No production deployment in this task.

Implement modular pure computation separate from rendering. No unnecessary heavy framework or paid service. Production must contain just one HTML entry, referenced JS/CSS/fonts and individually approved assets; no accidental ZIP, old PDFs, giant project docs, private path names or source maps.

## 12. EXACT ORDER OF IMPLEMENTATION

1. Read THIS document, existing repo code, earlier templates and current asset manifest. Inventory current Git status/branch/commit and CI. Build traceability map from this document to files/tests.
2. Create a NEW feature branch from the source brief branch, leaving deployment untouched. Do not reset existing unrelated work.
3. Rebuild single-page shell, exact Krishiv.r identity, hero with genuine-photo gate, summary, education, qualifications. Run string tests immediately.
4. Build research, experience, ASTRA radial section, direction and contact using correct source-based copy and no private engineering detail. Remove design gallery.
5. Build/verify all FOUR full graphical educational labs stacked. Check independent numerical formulas and fast responsive controls.
6. Find original photo and ASTRA unchanged video from authorised owner sources. Review specific exact files; withhold if missing/unverified. Collect only genuinely safe ASTRA screenshots. Do not hold a fake image/video in preview.
7. Inventory 17 report candidates privately; validate only actual files, withhold unreviewed findings. Add approved full research PDFs only after separate owner agreement.
8. Replace old CV with verified safe version and rebuild asset allowlist. Remove former references and unsafe CV from *new* production dist, test automatic publication refusal.
9. Run all package checks plus actual browser QA at 320, 390, 768 and 1440 widths: no overflow; anchor/back; keyboard/focus; reduced-motion; picture fallback; video fallback; all four lab controls change charts; every download URL works if rendered; privacy scan checks source/output.
10. Deliver screenshots from the ACTUAL locally rendered website, complete test logs with commands and real counts, exact changed-file list, exact commit SHA, unresolved media/report blockers and side-by-side design conformance review. Do not merely claim “premium” or “complete.”
11. STOP before merge/deploy. Get separate explicit owner approval on exact reviewed preview and asset hashes. Only then do a new release action and verify HTTPS.

## 13. STOP-SHIP CHECKLIST: G01–G18

G01 wordmark exactly Krishiv.r and full name Krishiv Ramchandani throughout.  
G02 single root HTML and working hash anchors; four modules physically on same page.  
G03 real, owner-approved photograph; never wrong/generated person.  
G04 person-first professional summary and educational/career direction above research.  
G05 education and qualifications distinct, May 2027 is CFA exam not assumed graduation month.  
G06 no false CFA charterholder, NISM X-A passed, registered advisory or employment claims.  
G07 source-verified real research presentations only; no fake reports/links/results.  
G08 internship not double-counted as CapitaLand + Ascendas; Forage labelled simulations.  
G09 six-node centered RADIAL ASTRA map, not six rectangular cards, no private architecture.  
G10 original LinkedIn ASTRA video unchanged and verified, or honestly blocked; never a replacement.  
G11 no synthetic ASTRA screenshots represented as real.  
G12 four distinct interactive financial/technical/derivatives/portfolio modules, deterministic with graph updates.  
G13 reference graphics never appear as public gallery, public photo or product evidence.  
G14 CV exact approved phone-free bytes or absent download CTA.  
G15 safe build without private addresses, source, keys, unapproved data/media, source maps.  
G16 mobile/desktop keyboard/focus/contrast and performance QA actually performed.  
G17 test outputs and browser screenshots supplied, no unverified “all passed” statement.  
G18 no new public deployment or merge until explicit separate owner approval.

## 14. MANDATORY CODEX FINAL RESPONSE FORMAT

1. DELIVERED: commit SHA / branch / exact files and features.  
2. REQUIREMENTS: G01–G18 PASS, FAIL or BLOCKED, each with test/screenshot evidence.  
3. ASSET REGISTER: portrait, video, ASTRA screenshots, CV, research PDFs; source, bytes inspected, rights, privacy, exact SHA, approval, release state.  
4. 17 REPORTS: candidate inventory, verified vs disputed/withheld/released counts; actual non-fabricated sources.  
5. LABS: mathematical unit tests, invalid-input guards, interaction checks, verified/synthetic data labels.  
6. VISUAL QA: actual 320/390/768/1440 screenshots and original-reference differences.  
7. SECURITY: provenance, build allowlist, scan output, outstanding historical-public exposure caveat.  
8. BLOCKERS: missing assets explicitly and only if retrieval genuinely failed.  
9. DEPLOYMENT: state **NOT DEPLOYED — OWNER APPROVAL REQUIRED**.

**Final directive:** Do not produce another vague design brief. Implement and independently test the full single-page personal site. No fake media, no unpublished finance figures, no exposing ASTRA internals, and no deployment without review.
