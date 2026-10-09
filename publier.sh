#!/usr/bin/env bash
# Envoie le dossier sur GitHub et déclenche la compilation (.exe, .apk, .AppImage).
# Usage : ./publier.sh            → envoie les changements
#         ./publier.sh v1.1.0     → envoie et crée la version v1.1.0 (release compilée)
# Fonctionne aussi sur un nouveau PC : le dossier se rattache tout seul au dépôt GitHub.
set -e
cd "$(dirname "$0")"
REPO="${COLOSSE_REPO:-https://github.com/azertyuser09876-spec/colosse.git}"
if ! command -v git >/dev/null 2>&1; then
  echo "Git n'est pas installé : https://git-scm.com/downloads"; exit 1
fi
if [ ! -d .git ]; then
  echo "Premier envoi depuis ce dossier : rattachement au dépôt GitHub…"
  git init
  git branch -M main
  git remote add origin "$REPO"
  git fetch origin || true
  if git rev-parse --verify --quiet origin/main >/dev/null; then git reset origin/main; fi
fi
git config user.name >/dev/null || git config user.name "azertyuser09876-spec"
git config user.email >/dev/null || git config user.email "azertyuser09876-spec@users.noreply.github.com"
# index.html se reconstruit depuis src/ (Node.js), pour qu'il corresponde toujours aux sources
if command -v node >/dev/null 2>&1; then
  node outils/construire.js || { echo "Construction impossible : rien n'a été envoyé."; exit 1; }
else
  echo "Node.js absent : index.html est envoyé tel quel (https://nodejs.org pour le reconstruire)."
fi
git add -A
git commit -m "Colosse $(date +%Y-%m-%d\ %H:%M)" || echo "Rien de nouveau à enregistrer."
git push -u origin main
if [ -n "$1" ]; then
  git tag -a "$1" -m "Colosse $1"
  git push origin "$1"
  echo "Version $1 envoyée : suivez la compilation sur https://github.com/azertyuser09876-spec/colosse/actions"
fi
