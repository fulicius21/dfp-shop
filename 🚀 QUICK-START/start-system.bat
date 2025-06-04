@echo off
chcp 65001 >nul
cls

echo.
echo 🚀 DRESSFORP E-COMMERCE SYSTEM STARTER 🚀
echo.
echo ⚡ Startet alle Services gleichzeitig:
echo    📊 Backend API Server
echo    🎨 Frontend Website
echo    🤖 Automatisierung (n8n)
echo    🎯 KI Style Creator
echo    📱 Telegram Admin Bot
echo.

REM Check if system is already running
netstat -an | find "3000" >nul
if %errorLevel% == 0 (
    echo ⚠️  System läuft bereits! Services werden neugestartet...
    echo.
    
    REM Stop existing services
    echo 🛑 Stoppe laufende Services...
    taskkill /f /im node.exe >nul 2>&1
    docker-compose down >nul 2>&1
    timeout /t 3 >nul
)

echo 🔧 Überprüfe System-Status...

REM Check Docker
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Docker ist nicht verfügbar! Bitte Docker Desktop starten.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo ❌ Konfigurationsdatei .env nicht gefunden!
    echo    Bitte erst setup.bat ausführen.
    pause
    exit /b 1
)

echo ✅ System bereit!
echo.

REM Create logs directory
if not exist "logs" mkdir logs

echo 🚀 STARTE ALLE SERVICES...
echo.

REM Start Backend
echo 📊 Starte Backend Server...
cd "⚙️ backend"
start "DressForP Backend" cmd /k "echo 📊 BACKEND SERVER && echo ================== && npm run dev"
cd ..
timeout /t 3 >nul

REM Start Automation (n8n)
echo 🤖 Starte Automatisierung...
cd "🤖 automation"
start "DressForP Automation" cmd /k "echo 🤖 AUTOMATISIERUNG && echo =================== && docker-compose up"
cd ..
timeout /t 5 >nul

REM Start AI Style Creator
echo 🎨 Starte KI Style Creator...
cd "🎨 ai-style-creator"
start "DressForP AI" cmd /k "echo 🎨 KI STYLE CREATOR && echo ==================== && docker-compose up"
cd ..
timeout /t 3 >nul

REM Start Frontend (last, as it will open browser)
echo 🎨 Starte Frontend Website...
cd "💻 frontend"
start "DressForP Frontend" cmd /k "echo 🎨 FRONTEND WEBSITE && echo ===================== && echo. && echo 🌐 Website: http://localhost:3000 && echo 📊 Admin:   http://localhost:3000/admin && echo. && npm run dev"
cd ..

echo.
echo 🎉 ALLE SERVICES GESTARTET!
echo.
echo 🌐 VERFÜGBARE SERVICES:
echo    ├─ 🛍️  Hauptwebsite:      http://localhost:3000
echo    ├─ 📊 Admin-Panel:       http://localhost:3000/admin
echo    ├─ ⚙️  Backend API:       http://localhost:3001
echo    ├─ 🤖 n8n Automatisierung: http://localhost:5678
echo    ├─ 🎨 KI Style Creator:   http://localhost:7860
echo    └─ 📚 API Dokumentation: http://localhost:3001/docs
echo.
echo 📱 TELEGRAM BOT:
echo    └─ Suche nach "@YourDressFpBot" in Telegram
echo.

REM Wait for backend to be ready
echo ⏳ Warte auf Backend-Start...
:wait_backend
timeout /t 2 >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorLevel% neq 0 goto wait_backend

echo ✅ Backend bereit!

REM Wait for frontend to be ready
echo ⏳ Warte auf Frontend-Start...
timeout /t 5 >nul

REM Open browser
echo 🌐 Öffne Website im Browser...
start http://localhost:3000

echo.
echo 📋 ERSTE SCHRITTE:
echo    1. 🛍️  Website testen (öffnet automatisch)
echo    2. 📊 Admin-Panel besuchen: http://localhost:3000/admin
echo    3. 🤖 n8n Workflows konfigurieren: http://localhost:5678
echo    4. 💳 Stripe-Keys in .env hinzufügen (für echte Zahlungen)
echo    5. 📱 Telegram Bot-Token konfigurieren
echo.
echo 📚 HILFE:
echo    ├─ Dokumentation: 📚 documentation\BENUTZER-HANDBUCH.md
echo    ├─ Video-Anleitung: https://youtube.com/dressforp-guide
echo    └─ Support: https://discord.gg/dressforp
echo.
echo 🛑 ZUM STOPPEN: stop-system.bat ausführen
echo.

REM Keep console open
echo Drücke eine beliebige Taste zum Schließen...
pause >nul
