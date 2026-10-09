#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="${SUPABASE_PROJECT_REF:-opvpkxvbvhltchxwlinr}"

echo "Applying migrations..."
supabase db push --project-ref "$PROJECT_REF"

echo "Syncing secrets..."
bash scripts/sync-production-secrets.sh

echo "Deploying functions..."
for fn in quote checkout webhook track addresses maps mcl_bot process_queue import_customers; do
  echo "==> $fn"
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF"
done

echo "Done."
