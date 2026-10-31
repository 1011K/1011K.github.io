# Krishiv Ramchandani: personal portfolio

Static site. Vite + TypeScript, no framework, no runtime network requests (fonts are bundled).

```bash
npm install
npm run dev            # local dev server
npm test               # unit tests for the two-asset volatility demo
npm run build          # typecheck + production build to dist/
npm run audit:public   # scan dist/ for private strings and unexpected files
```

## Content and the publication gate
All copy lives in `src/content.ts`. Résumé, video, screenshots and research reports are rendered
only when an entry has `public_approved: true` **and** an `asset_path`. To publish an asset: put the
file in `public/`, add it to the matching list in `gated`, set `public_approved: true`, rebuild.
Anything not approved never reaches `dist/`.

## Deploy
Target: `1011K/1011K.github.io` (repo does not exist yet; not created). Push `main`; set Pages source to
"GitHub Actions". `.github/workflows/deploy.yml` runs tests, build and audit, then deploys.

## Independence
No ASTRA code, data or API is used. The demo is an independent textbook calculation.
