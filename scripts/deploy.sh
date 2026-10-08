#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v supabase >/dev/null 2>&1; then
  echo "Install Supabase CLI first: https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "Applying migrations..."
supabase db push

echo "Setting secrets from .env (if present)..."
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
  supabase secrets set \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}" \
    SUCCESS_URL="${SUCCESS_URL:-https://mobilare.co.uk/booking-success}" \
    CANCEL_URL="${CANCEL_URL:-https://mobilare.co.uk/booking-cancel}" \
    CORS_ORIGIN="${CORS_ORIGIN:-https://mobilare.co.uk,https://www.mobilare.co.uk}"
fi

echo "Deploying functions..."
supabase functions deploy quote
supabase functions deploy checkout
supabase functions deploy webhook
supabase functions deploy track

echo "Done. Configure Stripe webhook → …/functions/v1/webhook"
echo "Open artifacts/phase-monitor.html to update readiness."
