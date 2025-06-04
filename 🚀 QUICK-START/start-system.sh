#!/bin/bash

# DressForP E-Commerce System - System Starter
# Startet alle Services gleichzeitig

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
GEAR="⚙️"
ROBOT="🤖"
ART="🎨"
WEB="🌐"
STOP="🛑"

clear

echo -e "${CYAN}${ROCKET} DRESSFORP E-COMMERCE SYSTEM STARTER ${ROCKET}${NC}"
echo ""
echo -e "${YELLOW}⚡ Startet alle Services gleichzeitig:${NC}"
echo -e "   📊 Backend API Server"
echo -e "   🎨 Frontend Website"
echo -e "   🤖 Automatisierung (n8n)"
echo -e "   🎯 KI Style Creator"
echo -e "   📱 Telegram Admin Bot"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

print_error() {
    echo -e "${RED}${CROSS}${NC} $1"
}

print_info() {
    echo -e "${BLUE}${GEAR}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Check if system is already running
if lsof -i :3000 &> /dev/null; then
    print_warning "System läuft bereits! Services werden neugestartet..."
    echo ""
    
    print_info "Stoppe laufende Services..."
    # Kill existing processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "node" 2>/dev/null || true
    docker-compose down &>/dev/null || true
    sleep 3
fi

print_info "Überprüfe System-Status..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker ist nicht verfügbar! Bitte Docker installieren und starten."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker Daemon läuft nicht! Bitte Docker starten."
    exit 1
fi

# Check if .env exists
if [[ ! -f ".env" ]]; then
    print_error "Konfigurationsdatei .env nicht gefunden!"
    print_error "Bitte erst ./setup.sh ausführen."
    exit 1
fi

print_status "System bereit!"
echo ""

# Create logs directory
mkdir -p logs

echo -e "${BLUE}${ROCKET} STARTE ALLE SERVICES...${NC}"
echo ""

# Function to start service in background with logging
start_service() {
    local service_name="$1"
    local directory="$2"
    local command="$3"
    local log_file="$4"
    
    print_info "Starte $service_name..."
    cd "$directory" || exit 1
    eval "$command" > "../logs/$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "../logs/$service_name.pid"
    cd ..
    sleep 2
}

# Start Backend
start_service "Backend" "⚙️ backend" "npm run dev" "backend.log"

# Start Automation (n8n)
start_service "Automation" "🤖 automation" "docker-compose up" "automation.log"
sleep 5  # Give n8n more time to start

# Start AI Style Creator
start_service "AI-Creator" "🎨 ai-style-creator" "docker-compose up" "ai-creator.log"

# Start Frontend (in foreground so we can see output)
print_info "Starte Frontend Website..."
cd "💻 frontend" || exit 1

# Start frontend in background but keep this script running
npm run dev > "../logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "../logs/Frontend.pid"
cd ..

echo ""
echo -e "${GREEN}🎉 ALLE SERVICES GESTARTET!${NC}"
echo ""
echo -e "${WEB} VERFÜGBARE SERVICES:${NC}"
echo -e "   ├─ 🛍️  Hauptwebsite:       http://localhost:3000"
echo -e "   ├─ 📊 Admin-Panel:        http://localhost:3000/admin"
echo -e "   ├─ ⚙️  Backend API:        http://localhost:3001"
echo -e "   ├─ 🤖 n8n Automatisierung: http://localhost:5678"
echo -e "   ├─ 🎨 KI Style Creator:    http://localhost:7860"
echo -e "   └─ 📚 API Dokumentation:  http://localhost:3001/docs"
echo ""
echo -e "${BLUE}📱 TELEGRAM BOT:${NC}"
echo -e "   └─ Suche nach \"@YourDressFpBot\" in Telegram"
echo ""

# Wait for backend to be ready
print_info "Warte auf Backend-Start..."
while ! curl -s http://localhost:3001/api/health &>/dev/null; do
    sleep 2
done
print_status "Backend bereit!"

# Wait a bit more for frontend
print_info "Warte auf Frontend-Start..."
sleep 5

# Try to open browser (works on most systems)
print_info "Öffne Website im Browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 &>/dev/null || true
elif command -v open &> /dev/null; then
    open http://localhost:3000 &>/dev/null || true
elif command -v start &> /dev/null; then
    start http://localhost:3000 &>/dev/null || true
else
    print_info "Bitte öffne manuell: http://localhost:3000"
fi

echo ""
echo -e "${BLUE}📋 ERSTE SCHRITTE:${NC}"
echo -e "   1. 🛍️  Website testen (sollte automatisch öffnen)"
echo -e "   2. 📊 Admin-Panel besuchen: http://localhost:3000/admin"
echo -e "   3. 🤖 n8n Workflows konfigurieren: http://localhost:5678"
echo -e "   4. 💳 Stripe-Keys in .env hinzufügen (für echte Zahlungen)"
echo -e "   5. 📱 Telegram Bot-Token konfigurieren"
echo ""
echo -e "${BLUE}📚 HILFE:${NC}"
echo -e "   ├─ Dokumentation: 📚 documentation/BENUTZER-HANDBUCH.md"
echo -e "   ├─ Video-Anleitung: https://youtube.com/dressforp-guide"
echo -e "   └─ Support: https://discord.gg/dressforp"
echo ""
echo -e "${BLUE}📊 LOGS:${NC}"
echo -e "   ├─ Backend:       tail -f logs/backend.log"
echo -e "   ├─ Frontend:      tail -f logs/frontend.log"
echo -e "   ├─ Automatisierung: tail -f logs/automation.log"
echo -e "   └─ KI Creator:    tail -f logs/ai-creator.log"
echo ""
echo -e "${RED}${STOP} ZUM STOPPEN: ./stop-system.sh ausführen${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Stoppe Services..."
    
    # Kill all background processes
    if [[ -f "logs/Frontend.pid" ]]; then
        kill $(cat logs/Frontend.pid) 2>/dev/null || true
        rm logs/Frontend.pid
    fi
    if [[ -f "logs/Backend.pid" ]]; then
        kill $(cat logs/Backend.pid) 2>/dev/null || true
        rm logs/Backend.pid
    fi
    if [[ -f "logs/Automation.pid" ]]; then
        kill $(cat logs/Automation.pid) 2>/dev/null || true
        rm logs/Automation.pid
    fi
    if [[ -f "logs/AI-Creator.pid" ]]; then
        kill $(cat logs/AI-Creator.pid) 2>/dev/null || true
        rm logs/AI-Creator.pid
    fi
    
    # Stop docker services
    cd "🤖 automation" && docker-compose down &>/dev/null || true
    cd "../🎨 ai-style-creator" && docker-compose down &>/dev/null || true
    
    print_status "Alle Services gestoppt!"
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running and show real-time logs
print_info "System läuft! Zeige Frontend-Logs (Ctrl+C zum Stoppen):"
echo ""

# Follow frontend logs
tail -f logs/frontend.log
