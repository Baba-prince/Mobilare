#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

echo "Logging into GitHub as Baba-prince (browser)..."
gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key

USER=$(gh api user -q .login)
echo "Logged in as: $USER"
if [[ "$USER" != "Baba-prince" ]]; then
  echo "ERROR: expected Baba-prince, got $USER"
  echo "Run: gh auth logout -h github.com && re-run this script"
  exit 1
fi

gh auth setup-git
git remote set-url origin https://github.com/Baba-prince/Mobilare.git
git push -u origin main
echo "Pushed to https://github.com/Baba-prince/Mobilare"
