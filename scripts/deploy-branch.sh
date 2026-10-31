#!/usr/bin/env bash
# Deliberately disabled. An implementation review never authorizes deployment.
set -euo pipefail
cat >&2 <<'MESSAGE'
Deployment is withheld. This script cannot push or force-push gh-pages.
After owner approval of an exact reviewed commit, dispatch the manual Pages
workflow for that commit with owner_approved=true. Protect the github-pages
production environment with required reviewers before enabling releases.
MESSAGE
exit 1
