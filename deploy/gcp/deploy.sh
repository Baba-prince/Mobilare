#!/usr/bin/env bash
# Deploy / update Mobilare Next.js on the Google VPS.
# Run from the repo root on the VM (as the app user).
# Usage: bash deploy/gcp/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f web/.env.local ]]; then
  echo "Missing web/.env.local — copy from deploy/gcp/env.web.example and fill keys."
  exit 1
fi

echo "==> Pull latest (if git remote present)"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git pull --ff-only || true
fi

echo "==> Install + build web"
cd web
npm ci
npm run build
cd "$ROOT"

echo "==> Restart PM2"
mkdir -p "$ROOT/deploy/gcp"
cp -f "$ROOT/deploy/gcp/ecosystem.config.cjs" "$ROOT/ecosystem.config.cjs" 2>/dev/null || true
pm2 startOrReload "$ROOT/deploy/gcp/ecosystem.config.cjs" --update-env
pm2 save

echo "==> Done. Check: curl -sI http://127.0.0.1:3000 | head"
