#!/usr/bin/env bash
# Sync non-empty API secrets from .env → Supabase Edge Function secrets.
# Usage: bash scripts/sync-production-secrets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="${SUPABASE_PROJECT_REF:-opvpkxvbvhltchxwlinr}"

if [[ ! -f .env ]]; then
  echo "Missing .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

args=()
add() {
  local name="$1" val="${2:-}"
  if [[ -n "$val" ]]; then
    args+=("${name}=${val}")
    echo "  + $name"
  else
    echo "  · $name (skipped — empty)"
  fi
}

echo "Preparing secrets for $PROJECT_REF"
add STRIPE_SECRET_KEY "${STRIPE_SECRET_KEY:-}"
add STRIPE_WEBHOOK_SECRET "${STRIPE_WEBHOOK_SECRET:-}"
add SUCCESS_URL "${SUCCESS_URL:-https://mobilare.co.uk/booking-success}"
add CANCEL_URL "${CANCEL_URL:-https://mobilare.co.uk/booking-cancel}"
add CORS_ORIGIN "${CORS_ORIGIN:-https://mobilare.co.uk,https://www.mobilare.co.uk}"
add GOOGLE_MAPS_API_KEY "${GOOGLE_MAPS_API_KEY:-}"
add TWILIO_ACCOUNT_SID "${TWILIO_ACCOUNT_SID:-}"
add TWILIO_AUTH_TOKEN "${TWILIO_AUTH_TOKEN:-}"
add TWILIO_FROM "${TWILIO_FROM:-}"
add RESEND_KEY "${RESEND_KEY:-${RESEND_API_KEY:-}}"
add RESEND_FROM "${RESEND_FROM:-}"
add OPENAI_API_KEY "${OPENAI_API_KEY:-}"
add OPENAI_MODEL "${OPENAI_MODEL:-}"
# Note: SUPABASE_SERVICE_ROLE_KEY is injected by the platform; do not set SUPABASE_* via CLI.

if [[ ${#args[@]} -eq 0 ]]; then
  echo "Nothing to set"
  exit 0
fi

supabase secrets set --project-ref "$PROJECT_REF" "${args[@]}"
echo "Done."
