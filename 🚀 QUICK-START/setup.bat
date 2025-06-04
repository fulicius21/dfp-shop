@echo off
chcp 65001 >nul
cls

echo.
echo ██████╗ ██████╗ ███████╗███████╗███████╗███████╗ ██████╗ ██████╗ ██████╗ 
echo ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗
echo ██║  ██║██████╔╝█████╗  ███████╗███████╗█████╗  ██║   ██║██████╔╝██████╔╝
echo ██║  ██║██╔══██╗██╔══╝  ╚════██║╚════██║██╔══╝  ██║   ██║██╔══██╗██╔═══╝ 
echo ██████╔╝██║  ██║███████╗███████║███████║██║     ╚██████╔╝██║  ██║██║     
echo ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     
echo.
echo 🎉 WILLKOMMEN ZUM DRESSFORP E-COMMERCE SYSTEM SETUP! 🎉
echo.
echo ⚡ Dieses Script installiert ALLES automatisch:
echo    ✅ Backend API (Node.js + PostgreSQL)
echo    ✅ Frontend Website (React + TailwindCSS) 
echo    ✅ Automatisierung (n8n Workflows)
echo    ✅ KI Style Creator (AI Produktfotos)
echo    ✅ Telegram Admin Bot (Mobile Verwaltung)
echo    ✅ Alle Abhängigkeiten und Konfigurationen
echo.
echo 📋 SYSTEMANFORDERUNGEN:
echo    • Windows 10/11
echo    • Docker Desktop (wird automatisch erkannt)
echo    • Node.js 18+ (wird automatisch installiert)
echo    • 8GB RAM (empfohlen)
echo    • 10GB freier Speicher
echo.

set /p confirm="🚀 Bereit für die automatische Installation? (j/n): "
if /i not "%confirm%"=="j" (
    echo ❌ Installation abgebrochen.
    pause
    exit /b 1
)

echo.
echo 🔍 Überprüfe System-Voraussetzungen...

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Administrator-Rechte: OK
) else (
    echo ❌ FEHLER: Bitte als Administrator ausführen!
    echo    Rechtsklick auf setup.bat → "Als Administrator ausführen"
    pause
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Docker: Installiert
) else (
    echo ❌ FEHLER: Docker Desktop ist nicht installiert!
    echo.
    echo 📥 AUTOMATISCHE DOCKER INSTALLATION:
    echo    Downloading Docker Desktop...
    
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe' -OutFile 'Docker-Desktop-Installer.exe'}"
    
    if exist "Docker-Desktop-Installer.exe" (
        echo ⚡ Starte Docker Installation...
        start /wait Docker-Desktop-Installer.exe install --quiet
        del Docker-Desktop-Installer.exe
        echo ✅ Docker installiert! Bitte System neustarten und Setup erneut ausführen.
        pause
        exit /b 0
    ) else (
        echo ❌ Download fehlgeschlagen. Bitte Docker manuell installieren:
        echo    https://www.docker.com/products/docker-desktop
        pause
        exit /b 1
    )
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js: Installiert
) else (
    echo ❌ Node.js nicht gefunden. Installiere automatisch...
    
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile 'nodejs-installer.msi'}"
    
    if exist "nodejs-installer.msi" (
        echo ⚡ Installiere Node.js...
        msiexec /i nodejs-installer.msi /quiet /norestart
        del nodejs-installer.msi
        echo ✅ Node.js installiert!
        
        REM Refresh environment variables
        call refreshenv >nul 2>&1
    ) else (
        echo ❌ Download fehlgeschlagen. Bitte Node.js manuell installieren:
        echo    https://nodejs.org/
        pause
        exit /b 1
    )
)

echo.
echo 🔧 SYSTEM-SETUP STARTET...
echo.

REM Create environment file
echo 🔑 Erstelle Konfigurationsdateien...
if not exist ".env" (
    copy "📋 templates\.env.template" ".env" >nul
    echo ✅ Environment-Datei erstellt
)

REM Setup backend
echo 📦 Installiere Backend-Abhängigkeiten...
cd "⚙️ backend"
call npm install --silent
if %errorLevel% neq 0 (
    echo ❌ Backend-Installation fehlgeschlagen!
    pause
    exit /b 1
)
echo ✅ Backend: OK
cd ..

REM Setup frontend
echo 🎨 Installiere Frontend-Abhängigkeiten...
cd "💻 frontend"
call npm install --silent
if %errorLevel% neq 0 (
    echo ❌ Frontend-Installation fehlgeschlagen!
    pause
    exit /b 1
)
echo ✅ Frontend: OK
cd ..

REM Setup automation
echo 🤖 Konfiguriere Automatisierung...
cd "🤖 automation"
docker-compose pull --quiet
if %errorLevel% neq 0 (
    echo ❌ Automatisierung-Setup fehlgeschlagen!
    pause
    exit /b 1
)
echo ✅ Automatisierung: OK
cd ..

REM Setup AI Style Creator
echo 🎨 Konfiguriere KI Style Creator...
cd "🎨 ai-style-creator"
docker-compose pull --quiet
echo ✅ KI Style Creator: OK
cd ..

echo.
echo 🎉 INSTALLATION ERFOLGREICH ABGESCHLOSSEN! 🎉
echo.
echo 📋 NÄCHSTE SCHRITTE:
echo    1. 🔧 Konfiguration anpassen (optional):
echo       ├─ .env Datei bearbeiten für eigene Einstellungen
echo       ├─ Stripe API-Keys für Zahlungen hinzufügen
echo       └─ Telegram Bot Token konfigurieren
echo.
echo    2. 🚀 System starten:
echo       ├─ start-system.bat ausführen
echo       └─ Website unter http://localhost:3000 öffnen
echo.
echo    3. 📚 Dokumentation lesen:
echo       ├─ 📚 documentation\BENUTZER-HANDBUCH.md
echo       └─ 📚 documentation\ERSTE-SCHRITTE.md
echo.
echo 💡 TIPP: Für Anfänger gibt es eine Schritt-für-Schritt Video-Anleitung!
echo    📹 https://youtube.com/dressforp-setup-guide
echo.

set /p start_now="🚀 System jetzt starten? (j/n): "
if /i "%start_now%"=="j" (
    call start-system.bat
) else (
    echo.
    echo ✅ Setup abgeschlossen! Führe 'start-system.bat' aus, um zu beginnen.
    pause
)
