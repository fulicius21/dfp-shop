@echo off
chcp 65001 >nul
cls

echo.
echo 🚀 DressForP - EINFACHES SETUP 🚀
echo.
echo Das ist die vereinfachte Version für Windows!
echo.

echo 📋 SCHRITT 1: Ordner prüfen...
if not exist "..\⚙️ backend" (
    echo ❌ Backend-Ordner nicht gefunden!
    echo Bist du im richtigen Verzeichnis?
    echo Du solltest in: dressforp-final-system\🚀 QUICK-START\ sein
    pause
    exit /b 1
)
echo ✅ Backend-Ordner gefunden!

echo.
echo 📋 SCHRITT 2: Node.js prüfen...
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js ist installiert!
    node --version
) else (
    echo ❌ Node.js nicht gefunden!
    echo.
    echo BITTE INSTALLIERE NODE.JS:
    echo 1. Gehe zu: https://nodejs.org/
    echo 2. Lade "LTS" Version herunter
    echo 3. Installiere mit Standard-Einstellungen
    echo 4. Computer neustarten
    echo 5. Dieses Script erneut ausführen
    pause
    exit /b 1
)

echo.
echo 📋 SCHRITT 3: Basis-Setup vom bestehenden System...
echo.
echo Starte das System aus deinen vorhandenen Dateien:

cd ..
if exist "existing_projects\dfp-frontend-backend\launch-complete-system.sh" (
    echo ✅ Gefunden: Vollständiges System in dfp-frontend-backend
    cd existing_projects\dfp-frontend-backend
    
    echo.
    echo 🔧 Starte Backend...
    cd backend
    start /b npm install
    timeout /t 10 /nobreak >nul
    start /b npm run dev
    
    cd ..
    echo 🎨 Starte Frontend...
    
    echo ✅ System wird gestartet...
    echo.
    echo 🌐 Deine Website sollte sich in Kürze öffnen:
    echo    👉 http://localhost:3000
    echo.
    echo 📱 Für den Telegram Bot siehe die Dokumentation!
    echo.
    
) else (
    echo ❌ Vollständiges System nicht gefunden
    echo.
    echo Verwende Plan B - Schneller direkter Start:
    cd existing_projects\dfp-final
    
    echo 🔧 Installiere Abhängigkeiten...
    cd backend
    call npm install
    if %errorLevel% neq 0 (
        echo ❌ Backend Installation fehlgeschlagen!
        echo Prüfe deine Internetverbindung und versuche es erneut.
        pause
        exit /b 1
    )
    
    cd ..\frontend
    call npm install
    if %errorLevel% neq 0 (
        echo ❌ Frontend Installation fehlgeschlagen!
        echo Prüfe deine Internetverbindung und versuche es erneut.
        pause
        exit /b 1
    )
    
    echo ✅ Installation erfolgreich!
    echo.
    echo 🚀 Starte System...
    cd ..
    call start-system.bat
)

echo.
echo 🎉 SETUP ABGESCHLOSSEN!
echo.
echo 📋 WAS JETZT:
echo 1. 🌐 Website öffnet sich automatisch: http://localhost:3000
echo 2. 🛠️ Admin-Bereich: http://localhost:3000/admin
echo 3. 📚 Anleitung: Lies ERSTE-SCHRITTE.md
echo.

set /p open_browser="🌐 Website jetzt öffnen? (j/n): "
if /i "%open_browser%"=="j" (
    start http://localhost:3000
)

echo.
echo ✅ Fertig! Das Fenster bleibt offen für weitere Informationen.
echo.
echo 🔧 ZUM STOPPEN: Drücke Ctrl+C in diesem Fenster
echo 📞 BEI PROBLEMEN: Lies TROUBLESHOOTING.md
echo.

pause
