#!/usr/bin/env bash
# Run once on a fresh Ubuntu 22.04/24.04 Google Compute Engine VM (as root or sudo).
# Usage: sudo bash setup-vm.sh
set -euo pipefail

APP_USER="${APP_USER:-mobilare}"
APP_DIR="${APP_DIR:-/var/www/mobilare}"
DOMAIN="${DOMAIN:-mobilare.co.uk}"
NODE_MAJOR="${NODE_MAJOR:-22}"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg ufw nginx git

# Node.js
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

# App user + dirs
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --shell /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR" /var/www/certbot
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Firewall: SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable || true

# Nginx site (HTTP first; TLS via certbot after DNS points here)
cat >/etc/nginx/sites-available/mobilare <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sfn /etc/nginx/sites-available/mobilare /etc/nginx/sites-enabled/mobilare
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Certbot (run AFTER A/AAAA records point at this VM)
apt-get install -y certbot python3-certbot-nginx

echo ""
echo "VM base setup complete."
echo "Next:"
echo "  1) Point DNS A records for ${DOMAIN} + www to this VM's external IP"
echo "  2) As ${APP_USER}: clone repo into ${APP_DIR} and run deploy/gcp/deploy.sh"
echo "  3) sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "  4) pm2 startup + pm2 save (as ${APP_USER})"
