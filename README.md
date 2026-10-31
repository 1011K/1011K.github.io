# Krishiv Ramchandani

Single-page professional portfolio for Krishiv Ramchandani. Vite, TypeScript, local Inter/Fraunces fonts, a global light/dark switch and a research-led editorial layout. No backend, remote market feed, analytics or ASTRA connection.

Public copy and demo contracts live in `src/content.ts`. `src/render.ts` turns them into HTML at build time (a Vite transform fills the `<!--@name-->` placeholders in `index.html`), so every section except the interactive widgets works without JavaScript.

## Development and checks

Use Node 24+. Install locked dependencies with `npm ci --ignore-scripts`, then `npm run dev`.

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run audit:public`, `npm run test:audit` and `npm audit --omit=dev`. The build refuses unapproved public files before bundling, and audits the resulting single HTML with referenced assets.

## Publication

The manifest includes the owner-supplied professional portrait and the explicitly approved phone-removed standard CV, each pinned by exact SHA-256 and a privacy review receipt. Decoded pixels and full square framing are unchanged. No standalone video, product screenshot or research PDF is approved. Design reference files must never be publication assets. Research candidates are a source register, not published reports.

Every media release requires exact bytes, content/metadata inspection, rights/privacy review and owner approval of its SHA-256. Research also requires independent numerical/source review and full publication metadata. Historical files may remain accessible through Git history; deleting current copies does not erase past public exposure.

## Demonstrations and labs

Five demonstrations (valuation, technical, options, peers, red correlation) are all **WITHHELD** as engine-backed demos: no owner engine is pinned, no licensed point-in-time data is loaded and no oracle has passed. What is interactive is labelled: the valuation method router fails closed by sector, the options calculator is a THEORETICAL ONLY Black-Scholes-Merton model on hypothetical inputs (`src/options.ts`), and the correlation weights are validated while the red 5x5 heat map shows only the palette with withheld cells.

Four independent educational labs (financial, technical on a synthetic series, expiry payoff, two-asset risk) are mounted below the demonstrations as hypothetical illustrations, not ASTRA output. Financial: five-year constant-assumption FCFF with bridge and WACC/g sensitivity. Technical: explicitly synthetic OHLCV with lagged EMA/RSI rules, next-open execution and costs. Derivatives: long call or protective put expiry P&L. Portfolio: two hypothetical long-only assets with Euler risk contributions. No return forecasts.

## Release

Pages currently uses the legacy `gh-pages` branch. The manual Actions workflow is not proof of a live release. A release must use reviewed, audited output and verify the served HTTPS page. Never force-push or rewrite historical branches.
