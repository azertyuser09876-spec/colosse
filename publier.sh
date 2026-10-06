#!/usr/bin/env bash
# Envoie le dossier sur GitHub et déclenche la compilation (.exe, .apk, .AppImage).
# Usage : ./publier.sh            → envoie les changements
#         ./publier.sh v1.0.0     → envoie et crée la version v1.0.0 (release compilée)
set -e
cd "$(dirname "$0")"
REPO="https://github.com/azertyuser09876-spec/colosse.git"
if [ ! -d .git ]; then
  git init
  git branch -M main
  git remote add origin "$REPO"
fi
git add -A
git commit -m "Colosse $(date +%Y-%m-%d\ %H:%M)" || echo "Rien de nouveau à enregistrer."
git push -u origin main
if [ -n "$1" ]; then
  git tag -a "$1" -m "Colosse $1"
  git push origin "$1"
  echo "Version $1 envoyée : suivez la compilation sur https://github.com/azertyuser09876-spec/colosse/actions"
fi
