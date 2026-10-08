# Push Mobilare as Baba-prince (not Beeplus7)

Beeplus7 credentials were removed from the macOS keychain. This repo must push only to `Baba-prince/Mobilare`.

## One command (recommended)

In **Terminal.app** (interactive browser login works there):

```bash
cd ~/Mobilare
./scripts/push-as-baba-prince.sh
```

When the browser opens, sign in as **Baba-prince** (not Beeplus7).

## Or paste a PAT

Create a classic token as Baba-prince with `repo` scope:  
https://github.com/settings/tokens

Then reply in chat with the token (or run locally):

```bash
cd ~/Mobilare
echo 'YOUR_TOKEN' | ~/.local/bin/gh auth login --hostname github.com --with-token
~/.local/bin/gh auth setup-git
git push -u origin main
```

## Or SSH

1. Add this machine’s public key to Baba-prince → Settings → SSH keys  
2. `git remote set-url origin git@github.com:Baba-prince/Mobilare.git`  
3. `git push -u origin main`
