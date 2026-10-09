#!/usr/bin/env bash
# Create a Google Compute Engine VM for Mobilare (run on your laptop after gcloud auth).
# Usage:
#   export GCP_PROJECT=your-project-id
#   bash deploy/gcp/create-vm.sh
set -euo pipefail

PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null || true)}"
ZONE="${GCP_ZONE:-europe-west2-a}"
NAME="${GCP_VM_NAME:-mobilare-web}"
MACHINE="${GCP_MACHINE:-e2-small}"
DISK_GB="${GCP_DISK_GB:-20}"
IMAGE_FAMILY="${GCP_IMAGE_FAMILY:-ubuntu-2404-lts-amd64}"
IMAGE_PROJECT="${GCP_IMAGE_PROJECT:-ubuntu-os-cloud}"

if [[ -z "${PROJECT}" || "${PROJECT}" == "(unset)" ]]; then
  echo "Set GCP_PROJECT or run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Install Google Cloud SDK first: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

gcloud config set project "$PROJECT"

echo "==> Ensuring firewall rules (http/https)"
gcloud compute firewall-rules describe allow-http --project="$PROJECT" >/dev/null 2>&1 \
  || gcloud compute firewall-rules create allow-http --allow=tcp:80 --target-tags=http-server --description="HTTP"
gcloud compute firewall-rules describe allow-https --project="$PROJECT" >/dev/null 2>&1 \
  || gcloud compute firewall-rules create allow-https --allow=tcp:443 --target-tags=https-server --description="HTTPS"

echo "==> Creating VM ${NAME} in ${ZONE}"
gcloud compute instances create "$NAME" \
  --project="$PROJECT" \
  --zone="$ZONE" \
  --machine-type="$MACHINE" \
  --image-family="$IMAGE_FAMILY" \
  --image-project="$IMAGE_PROJECT" \
  --boot-disk-size="${DISK_GB}GB" \
  --tags=http-server,https-server \
  --metadata=enable-oslogin=TRUE

IP="$(gcloud compute instances describe "$NAME" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)')"
echo ""
echo "VM ready."
echo "  External IP: ${IP}"
echo "  SSH: gcloud compute ssh ${NAME} --zone=${ZONE}"
echo "  Then copy setup-vm.sh and run: sudo bash setup-vm.sh"
echo "  Point DNS A records mobilare.co.uk + www → ${IP}"
