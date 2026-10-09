#!/usr/bin/env bash
# Build on your laptop, upload standalone bundle to the Google VPS (avoids npm on small VMs).
# Usage (from repo root on Mac):
#   bash deploy/gcp/deploy-standalone.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT="${GCP_PROJECT:-nifty-condition-511022-p2}"
ZONE="${GCP_ZONE:-europe-west2-c}"
VM="${GCP_VM_NAME:-mobilare}"
TGZ="/tmp/mobilare-standalone.tgz"

export PATH="${HOME}/google-cloud-sdk-install/google-cloud-sdk/bin:${HOME}/google-cloud-sdk/bin:${PATH}"

cd "$ROOT/web"
if [[ ! -f .env.local ]]; then
  echo "Missing web/.env.local"
  exit 1
fi

npm ci
npm run build

rm -rf /tmp/mobilare-standalone
mkdir -p /tmp/mobilare-standalone
cp -R .next/standalone/. /tmp/mobilare-standalone/
mkdir -p /tmp/mobilare-standalone/.next
cp -R .next/static /tmp/mobilare-standalone/.next/static
cp -R public /tmp/mobilare-standalone/public
cp .env.local /tmp/mobilare-standalone/.env.local
tar -czf "$TGZ" -C /tmp/mobilare-standalone .

gcloud compute scp --zone="$ZONE" --project="$PROJECT" "$TGZ" "${VM}:/tmp/mobilare-standalone.tgz"
gcloud compute ssh "$VM" --zone="$ZONE" --project="$PROJECT" --command='
set -euo pipefail
sudo mkdir -p /var/www/mobilare-app
sudo chown -R "$(whoami):$(whoami)" /var/www/mobilare-app
rm -rf /var/www/mobilare-app/*
tar -xzf /tmp/mobilare-standalone.tgz -C /var/www/mobilare-app
rm -f /tmp/mobilare-standalone.tgz
pm2 delete mobilare-web 2>/dev/null || true
cd /var/www/mobilare-app
PORT=3000 HOSTNAME=0.0.0.0 NODE_ENV=production pm2 start server.js --name mobilare-web
pm2 save
curl -sI http://127.0.0.1:3000 | head -5
'
echo "Deployed. Test: http://34.153.191.165/ (until DNS cuts over)"
