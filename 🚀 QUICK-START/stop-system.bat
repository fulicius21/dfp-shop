@echo off
chcp 65001 >nul
cls

echo.
echo 🛑 DRESSFORP SYSTEM STOPPER 🛑
echo.
echo Stoppe alle Services sicher...
echo.

REM Stop Node.js processes
echo 📊 Stoppe Backend und Frontend...
taskkill /f /im node.exe >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js Services gestoppt
) else (
    echo ⚠️  Keine Node.js Services gefunden
)

REM Stop Docker containers
echo 🤖 Stoppe Docker Services...
cd "🤖 automation"
docker-compose down >nul 2>&1
cd ..

cd "🎨 ai-style-creator"
docker-compose down >nul 2>&1
cd ..

echo ✅ Docker Services gestoppt

REM Clean up ports
echo 🧹 Bereinige Ports...
netstat -an | find "3000" >nul
if %errorLevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
)

netstat -an | find "3001" >nul
if %errorLevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
)

netstat -an | find "5678" >nul
if %errorLevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5678') do taskkill /f /pid %%a >nul 2>&1
)

netstat -an | find "7860" >nul
if %errorLevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7860') do taskkill /f /pid %%a >nul 2>&1
)

echo ✅ Ports bereinigt

REM Clean up log files
if exist "logs" (
    echo 🗂️  Bereinige Logs...
    del /q logs\*.pid 2>nul
    echo ✅ Logs bereinigt
)

echo.
echo 🎉 ALLE SERVICES ERFOLGREICH GESTOPPT!
echo.
echo 📋 SYSTEM STATUS:
echo    ├─ 📊 Backend:        Gestoppt
echo    ├─ 🎨 Frontend:       Gestoppt  
echo    ├─ 🤖 Automatisierung: Gestoppt
echo    ├─ 🎨 KI Creator:     Gestoppt
echo    └─ 📱 Telegram Bot:   Gestoppt
echo.
echo 💡 ZUM NEUSTARTEN: start-system.bat ausführen
echo.

pause
