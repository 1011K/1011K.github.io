# Krishiv.r

Single-page professional portfolio for Krishiv Ramchandani. Vite, TypeScript, local Inter/Fraunces fonts and independent deterministic educational models. No backend, remote market feed, analytics or ASTRA connection.

## Development and checks

Use Node 24+. Install locked dependencies with `npm ci --ignore-scripts`, then `npm run dev`.

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run audit:public`, `npm run test:audit` and `npm audit --omit=dev`. The build refuses unapproved public files before bundling, and audits the resulting single HTML with referenced assets.

## Publication

The manifest includes only the owner-supplied professional portrait, with exact SHA-256 approval and a lossless EXIF/IPTC removal receipt. Decoded pixels and full square framing are unchanged. No video, product screenshot, CV or research PDF is approved. Design reference files must never be publication assets. Research candidates are a source register, not published reports.

Every media release requires exact bytes, content/metadata inspection, rights/privacy review and owner approval of its SHA-256. Research also requires independent numerical/source review and full publication metadata. Historical files may remain accessible through Git history; deleting current copies does not erase past public exposure.

## Models

Financial: five-year constant-assumption FCFF with enterprise/equity bridge and WACC/g sensitivity. Technical: explicitly synthetic OHLCV, lagged EMA/RSI rules, next-open execution and costs. Derivatives: long call or protective put expiry P&L; no market quote or fair-value claim. Portfolio: two hypothetical long-only assets with valid correlation, Euler risk contributions and allocation sensitivity. No return forecasts.

## Release

Pages currently uses the legacy `gh-pages` branch. The manual Actions workflow is not proof of a live release. A release must use reviewed, audited output and verify the served HTTPS page. Never force-push or rewrite historical branches.
