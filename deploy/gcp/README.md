# Deploy Mobilare on Google VPS (Compute Engine)

Replaces Vercel/Squarespace as the public host. App: Next.js in `web/`, reverse-proxied by Nginx, process-managed by PM2.

## What I need from you

1. **GCP project ID** (or owner invite to the project)
2. Billing enabled on that project
3. Permission to create a Compute Engine VM **or** SSH access to an existing Ubuntu VM
4. Ability to change **DNS** for `mobilare.co.uk` / `www` (A records → VM IP)

No Squarespace credentials required for this path.

## Laptop setup (once)

```bash
# Install: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## 1) Create VM

```bash
export GCP_PROJECT=YOUR_PROJECT_ID
export GCP_ZONE=europe-west2-a   # London
bash deploy/gcp/create-vm.sh
```

Note the **external IP**.

## 2) Point DNS

At your domain registrar / DNS host:

| Type | Name | Value        |
|------|------|--------------|
| A    | `@`  | VM external IP |
| A    | `www`| VM external IP |

Remove / pause Vercel DNS while cutting over.

## 3) Bootstrap the VM

```bash
gcloud compute ssh mobilare-web --zone=europe-west2-a
# on VM:
sudo bash -s < <(curl -fsSL raw… )   # or scp setup-vm.sh
```

Preferred:

```bash
gcloud compute scp deploy/gcp/setup-vm.sh mobilare-web:~/ --zone=europe-west2-a
gcloud compute ssh mobilare-web --zone=europe-west2-a --command='sudo bash ~/setup-vm.sh'
```

## 4) App code + env + deploy

```bash
gcloud compute ssh mobilare-web --zone=europe-west2-a
sudo mkdir -p /var/www/mobilare && sudo chown "$USER" /var/www/mobilare
git clone https://github.com/Baba-prince/Mobilare.git /var/www/mobilare
cd /var/www/mobilare
cp deploy/gcp/env.web.example web/.env.local
nano web/.env.local   # paste Supabase anon key
bash deploy/gcp/deploy.sh
```

## 5) TLS

After DNS propagates:

```bash
sudo certbot --nginx -d mobilare.co.uk -d www.mobilare.co.uk
```

## Updates later

```bash
cd /var/www/mobilare && bash deploy/gcp/deploy.sh
```

Or push to `main` and pull on the VM (same script).
