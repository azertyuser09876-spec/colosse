@echo off
setlocal
rem Envoie le dossier sur GitHub et declenche la compilation (.exe, .apk, .AppImage).
rem Usage : publier.bat           -> envoie les changements
rem         publier.bat v1.1.0    -> envoie et cree la version v1.1.0 (release compilee)
rem Fonctionne aussi sur un nouveau PC : le dossier se rattache tout seul au depot GitHub.
cd /d "%~dp0"
if "%COLOSSE_REPO%"=="" (set "REPO=https://github.com/azertyuser09876-spec/colosse.git") else (set "REPO=%COLOSSE_REPO%")

where git >nul 2>nul
if errorlevel 1 (
  echo.
  echo Git n'est pas installe sur ce PC.
  echo Installez-le depuis https://git-scm.com/download/win puis relancez publier.bat
  echo.
  pause
  exit /b 1
)

if not exist .git (
  echo Premier envoi depuis ce dossier : rattachement au depot GitHub...
  git init
  git branch -M main
  git remote add origin "%REPO%"
  git fetch origin
  git rev-parse --verify --quiet origin/main >nul 2>nul && git reset origin/main
)

git config user.name >nul 2>nul || git config user.name "azertyuser09876-spec"
git config user.email >nul 2>nul || git config user.email "azertyuser09876-spec@users.noreply.github.com"

git add -A
git commit -m "Colosse %date% %time%" || echo Rien de nouveau a enregistrer.
git push -u origin main
if errorlevel 1 (
  echo.
  echo L'envoi a echoue. Verifiez la connexion a GitHub puis relancez publier.bat
  pause
  exit /b 1
)
if not "%~1"=="" (
  git tag -a %1 -m "Colosse %1"
  git push origin %1
  echo.
  echo Version %1 envoyee. Suivez la compilation sur https://github.com/azertyuser09876-spec/colosse/actions
)
echo Termine.
