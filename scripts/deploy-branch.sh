#!/usr/bin/env bash
# Manual deploy to the gh-pages branch (GitHub Actions is billing-locked on this account).
set -euo pipefail
npm test && npm run build && npm run audit:public
T=$(mktemp -d); cp -R dist/. "$T"/; touch "$T/.nojekyll"
git -C "$T" init -q -b gh-pages; git -C "$T" add -A; git -C "$T" commit -q -m "Deploy built site"
git -C "$T" push -f "$(git remote get-url origin)" gh-pages
rm -rf "$T"
