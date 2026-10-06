#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages source).
set -euo pipefail
node build.mjs
cd dist
git init -q -b gh-pages
git add -A
git -c user.name="RAED Technologies" -c user.email="official.raedtechnologies@gmail.com" commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -fq "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
echo "Deployed to gh-pages"
