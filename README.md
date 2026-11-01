# Krishiv Ramchandani

Single-page professional portfolio for Krishiv Ramchandani. Vite, TypeScript, local Inter/Fraunces fonts, a global light/dark switch and a research-led editorial layout. No backend, remote market feed, analytics or ASTRA connection.

Page order: short profile and demo shortcuts; five interactive educational workstations; three selected projects; expandable research cases; education and qualifications; experience; Forage simulations; and contact. Each of the five research cases opens as its own dropdown, as do the valuation method and evidence blocks. Every section except the profile, qualifications and contact opens as a dropdown, closed by default, so the page stays short; ASTRA and the independent study also open on demand, and in-page links open their target. The demo screenshot gallery and extra educational labs are collapsed by default. The separate Reliance Industries study is linked on LinkedIn only. Profile facts come from the approved standard CV; no GPA, report counts, phone or address are published.

Public copy and demo contracts live in `src/content.ts`. Profile styles live in `src/profile.css`, base and shell styles in `src/style.css`. `src/render.ts` turns them into HTML at build time (a Vite transform fills the `<!--@name-->` placeholders in `index.html`), so every section except the interactive widgets works without JavaScript.

## Development and checks

Use Node 24+. Install locked dependencies with `npm ci --ignore-scripts`, then `npm run dev`.

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run audit:public`, `npm run test:audit` and `npm audit --omit=dev`. The build refuses unapproved public files before bundling, and audits the resulting single HTML with referenced assets.

## Publication

The portrait is the owner photo with mild global levels, colour and sharpening only (no retouching). The CV is the owner-supplied 2026-11-01 version with the phone number removed from the page text and a neutral document title. The manifest includes the approved portrait, phone-removed CV, and five approved screenshots of the site's hypothetical calculators, all pinned by SHA-256 with owner-review receipts. There is no approved original ASTRA product screenshot, locally hosted ASTRA video or five-company research PDF. Design reference files must never be publication assets. Research candidates are a source register, not published reports.

Every media release requires exact bytes, content/metadata inspection, rights/privacy review and owner approval of its SHA-256. Research also requires independent numerical/source review and full publication metadata. Historical files may remain accessible through Git history; deleting current copies does not erase past public exposure.

## Demonstrations and labs

Five demonstrations (valuation, technical, options, peers, red correlation) are all **WITHHELD** as engine-backed demos: no owner engine is pinned, no licensed point-in-time data is loaded and no oracle has passed. What is interactive is labelled: the valuation method router fails closed by sector, the options calculator is a THEORETICAL ONLY Black-Scholes-Merton model on hypothetical inputs (`src/options.ts`), and the correlation weights are validated and the red 5x5 heat map uses explicitly hypothetical inputs, with simulated results separately labelled.

Four independent educational labs (financial, technical on a synthetic series, expiry payoff, two-asset risk) are mounted below the demonstrations as hypothetical illustrations, not ASTRA output. Financial: five-year constant-assumption FCFF with bridge and WACC/g sensitivity. Technical: explicitly synthetic OHLCV with lagged EMA/RSI rules, next-open execution and costs. Derivatives: long call or protective put expiry P&L. Portfolio: two hypothetical long-only assets with Euler risk contributions. No return forecasts.

## Release

Pages currently uses the legacy `gh-pages` branch. The manual Actions workflow is not proof of a live release. A release must use reviewed, audited output and verify the served HTTPS page. Never force-push or rewrite historical branches.
