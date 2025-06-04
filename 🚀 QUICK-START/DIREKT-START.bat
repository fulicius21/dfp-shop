@echo off
chcp 65001 >nul
cls

echo.
echo 🚀 DressForP - DIREKT START (Keine Installation nötig!)
echo.

echo 📍 Nutze dein bereits funktionierendes System!
echo.
echo Du hast bereits ein LIVE-SYSTEM unter:
echo 👉 https://kxlm6uopg4.space.minimax.io
echo.

set /p choice="Was möchtest du machen? (1=Live System testen / 2=Lokales Setup / 3=Anleitung lesen): "

if "%choice%"=="1" (
    echo.
    echo 🌐 Öffne dein LIVE-System...
    start https://kxlm6uopg4.space.minimax.io
    echo.
    echo 🎉 Das ist DEIN Shop! Bereits funktionsfähig!
    echo.
    echo 📋 Du kannst:
    echo ✅ Produkte ansehen
    echo ✅ In den Warenkorb legen  
    echo ✅ Test-Bestellung aufgeben
    echo ✅ Admin-Bereich testen
    echo.
    goto ende
)

if "%choice%"=="2" (
    echo.
    echo 🔧 Lokales System starten...
    
    REM Prüfe Node.js
    node --version >nul 2>&1
    if %errorLevel% neq 0 (
        echo ❌ Node.js nicht installiert!
        echo.
        echo SCHNELLE LÖSUNG:
        echo 1. Gehe zu: https://nodejs.org/
        echo 2. Lade herunter und installiere
        echo 3. Computer neustarten
        echo 4. Dieses Script erneut ausführen
        echo.
        goto ende
    )
    
    echo ✅ Node.js gefunden!
    
    REM Gehe zum funktionsfähigen Projekt
    cd ..\existing_projects\dfp-final
    
    echo 🎨 Starte Frontend...
    cd frontend
    start /b cmd /c "npm install & npm run dev"
    
    echo 🔧 Starte Backend...
    cd ..\backend  
    start /b cmd /c "npm install & npm run dev"
    
    echo.
    echo ⏳ System startet... (dauert 30-60 Sekunden)
    timeout /t 30 /nobreak >nul
    
    echo 🌐 Öffne lokale Website...
    start http://localhost:5173
    
    echo.
    echo 🎉 FERTIG! Dein lokaler Shop läuft jetzt!
    goto ende
)

if "%choice%"=="3" (
    echo.
    echo 📚 Öffne Dokumentation...
    
    if exist "..\📚 documentation\ERSTE-SCHRITTE.md" (
        notepad "..\📚 documentation\ERSTE-SCHRITTE.md"
    ) else (
        echo ❌ Dokumentation nicht gefunden
        echo Prüfe den Ordner: 📚 documentation\
    )
    goto ende
)

echo ❌ Ungültige Auswahl!

:ende
echo.
echo 📋 NÜTZLICHE LINKS:
echo 🌐 Dein LIVE-Shop: https://kxlm6uopg4.space.minimax.io
echo 🖥️ Lokaler Shop: http://localhost:5173 (wenn gestartet)
echo 🛠️ Admin-Bereich: /admin (mit Login: admin/admin)
echo.
echo 💡 TIPP: Das Live-System kannst du SOFORT nutzen!
echo    Du brauchst gar nichts lokal zu installieren!
echo.

pause
