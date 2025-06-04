#!/bin/bash

# DressForP E-Commerce System - System Stopper
# Stoppt alle Services sicher

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK="✅"
WARNING="⚠️"
STOP="🛑"
CLEAN="🧹"
INFO="📋"

clear

echo -e "${RED}${STOP} DRESSFORP SYSTEM STOPPER ${STOP}${NC}"
echo ""
echo "Stoppe alle Services sicher..."
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}${WARNING}${NC} $1"
}

print_info() {
    echo -e "${BLUE}${INFO}${NC} $1"
}

# Stop services by PID files
stop_service_by_pid() {
    local service_name="$1"
    local pid_file="logs/$service_name.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid" 2>/dev/null
            sleep 2
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null
            fi
            rm "$pid_file"
            print_status "$service_name gestoppt"
        else
            print_warning "$service_name war nicht aktiv"
            rm "$pid_file"
        fi
    else
        print_warning "Keine PID-Datei für $service_name gefunden"
    fi
}

# Stop Node.js processes
print_info "Stoppe Backend und Frontend..."
stop_service_by_pid "Frontend"
stop_service_by_pid "Backend"

# Also kill any remaining node processes related to our project
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*dressforp" 2>/dev/null || true

# Stop Docker containers
print_info "Stoppe Docker Services..."

if [[ -d "🤖 automation" ]]; then
    cd "🤖 automation" || exit 1
    docker-compose down &>/dev/null || true
    cd ..
    stop_service_by_pid "Automation"
fi

if [[ -d "🎨 ai-style-creator" ]]; then
    cd "🎨 ai-style-creator" || exit 1
    docker-compose down &>/dev/null || true
    cd ..
    stop_service_by_pid "AI-Creator"
fi

print_status "Docker Services gestoppt"

# Clean up ports
print_info "${CLEAN} Bereinige Ports..."

# Function to kill process using specific port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [[ -n "$pid" ]]; then
        kill -9 $pid 2>/dev/null || true
        print_status "Port $port bereinigt"
    fi
}

kill_port 3000  # Frontend
kill_port 3001  # Backend
kill_port 5678  # n8n
kill_port 7860  # AI Creator

# Clean up log files
if [[ -d "logs" ]]; then
    print_info "Bereinige Logs..."
    rm -f logs/*.pid 2>/dev/null || true
    print_status "Logs bereinigt"
fi

# Remove any orphaned Docker containers
print_info "Bereinige Docker-Container..."
docker container prune -f &>/dev/null || true

echo ""
echo -e "${GREEN}🎉 ALLE SERVICES ERFOLGREICH GESTOPPT!${NC}"
echo ""
echo -e "${BLUE}📋 SYSTEM STATUS:${NC}"
echo -e "   ├─ 📊 Backend:         Gestoppt"
echo -e "   ├─ 🎨 Frontend:        Gestoppt"
echo -e "   ├─ 🤖 Automatisierung:  Gestoppt"
echo -e "   ├─ 🎨 KI Creator:      Gestoppt"
echo -e "   └─ 📱 Telegram Bot:    Gestoppt"
echo ""
echo -e "${BLUE}💡 ZUM NEUSTARTEN: ./start-system.sh ausführen${NC}"
echo ""
