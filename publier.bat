@echo off
rem Envoie le dossier sur GitHub et declenche la compilation (.exe, .apk, .AppImage).
rem Usage : publier.bat           -> envoie les changements
rem         publier.bat v1.0.0    -> envoie et cree la version v1.0.0 (release compilee)
cd /d "%~dp0"
set REPO=https://github.com/azertyuser09876-spec/colosse.git
if not exist .git (
  git init
  git branch -M main
  git remote add origin %REPO%
)
git add -A
git commit -m "Colosse"
git push -u origin main
if not "%~1"=="" (
  git tag -a %1 -m "Colosse %1"
  git push origin %1
  echo Version %1 envoyee : https://github.com/azertyuser09876-spec/colosse/actions
)
