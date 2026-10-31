# Krishiv Ramchandani · personal portfolio

Static Vite + TypeScript site for `1011K/1011K.github.io`. No backend, runtime subscriptions, analytics, remote fonts, market feed or ASTRA connection. Extends the existing draft PR #1 branch.

## Local checks

Use Node 24. Dependencies remain unchanged.

```sh
npm ci --ignore-scripts
npm test
npm run typecheck
npm run build
npm run audit:public
npm run test:audit
npm audit
npm run dev
```

The dev and preview servers bind to loopback. Development HMR uses loopback; CORS is disabled. This is not a claim of a second-device LAN verification.

## Pages

- `/`: personal profile, selected planned subjects, research approach and internship.
- `/research/`: separate Reliance study summary; 17 proposed sector assignments with company/sector/method search. All 17 remain PLANNED, UNVERIFIED and publication WITHHELD.
- `/lab/`: independent hypothetical DCF, two-asset risk, European Black–Scholes and a conceptual statement map. Formulas, units and limitations are visible. No real issuer valuations.
- `/astra/`: high-level conceptual case study. Capability descriptions are owner-described, partial or experimental; no engine is publicly certified.
- `/about/`: CV-grounded education, qualifications, experience and explicitly labelled simulations. No CV download.
- `/contact/`: professional email, LinkedIn and GitHub. No phone or residential address.

Separate HTML entries make direct static Pages navigation work without an SPA rewrite. The source-supplied ticker references remain explicitly unverified; no live tickers or price targets are displayed.

## Publication controls

Public source code is public data too. Keep original CVs, private handoffs, photos, videos, research PDFs, workbooks, proprietary data and review working files outside this repository. Do not copy the execution package into Git.

`publication-manifest.json` is deliberately empty. No binary media or research assets are approved. `src/publication.ts` contains a shared fail-closed metadata and URL gate. Each future entry requires COMPLETE research progress, VERIFIED review status, explicit APPROVED publication status, owner name/date, review receipt, source/period/currency/scope/method/authorship/limitations metadata and true rights/privacy/legal/accuracy checks. Each file requires an exact safe relative path and SHA-256. Never set these fields automatically.

A future release requires manual inspection of the precise file, metadata, hidden sheets, notes, external links, image/video content and redistribution rights. A valid manifest is an auditable record, not proof that a human performed those checks. The owner must approve the exact bytes. Reports live only under `public/reports/`; approved media only under `public/media/`. Files are rejected if missing, changed, duplicated, unapproved or absent from the built output. Runtime links use the same metadata gate; the build audit verifies actual bytes.

The audit checks proposed tracked/untracked source paths, unknown files, symlinks, production file types, private path/contact/credential patterns and exact asset hashes. Synthetic integration checks prove unlinked PDF/XLSX files and an unapproved email in JS fail. Run Gitleaks over full Git history and the working tree separately. Scanners cannot guarantee absence of every sensitive datum.

The 17 assignments come from the owner-supplied V3.2 package. They are a research agenda, not verified company filings or completed reports. Reliance remains a separate owner-described study. HUL is withheld; no numerical outputs are exposed.

## Model scope

The DCF uses five forecast years, constant margin/tax/reinvestment, NOPAT × (1 − reinvestment rate) as FCFF and Gordon terminal value. WACC must exceed terminal growth. Outputs are hypothetical enterprise values in crore, never per-share targets. Inputs are bounded in the UI; non-finite and invalid domains are rejected by the model.

Black–Scholes assumes European exercise, no dividends, constant rates/volatility and frictionless markets. The normal CDF uses a rational tail approximation. Unit tests include known price/Greek fixtures, parity and finite differences. Vega/rho are per 1 percentage point; theta is per calendar day. Expiry and zero-volatility limits are outside the supported positive-input domain. Textbook model tests do not certify trading suitability.

The two-asset example preserves the original tested calculation. Its default 25% weighted average versus 20% portfolio volatility means 5 percentage points, or 20% relative reduction. No return projection is implied.

## Release withheld

No merge or deployment is authorized. The legacy branch deployment script now exits without pushing. The proposed workflow runs review checks and permits a Pages release only on manual dispatch with `owner_approved=true`; there is no push-to-main deployment trigger. Use an exact reviewed ref after the owner explicitly approves it.

At inspection, Pages uses the existing `gh-pages` branch and main has no branch protection. These remote settings are not changed by this implementation. Before release, configure required checks/reviewers and a protected `github-pages` environment, resolve any Actions account restriction, and deliberately choose the Pages publishing source. Do not force-push or erase published history. Local passing checks do not establish hosted CI or deployment success.

Bundled Fraunces and Inter fonts retain their upstream Fontsource package licenses. No stock media or external brand assets are included.
