#!/bin/bash

# DressForP E-Commerce System - Ein-Klick Setup Script für Linux/macOS
# Autor: DressForP Team
# Version: 1.0.0

set -e  # Exit on any error

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
ARROW="➡️"
ROCKET="🚀"
GEAR="⚙️"
ROBOT="🤖"
ART="🎨"
BOOK="📚"

clear

echo -e "${PURPLE}"
cat << "EOF"
██████╗ ██████╗ ███████╗███████╗███████╗███████╗ ██████╗ ██████╗ ██████╗ 
██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗
██║  ██║██████╔╝█████╗  ███████╗███████╗█████╗  ██║   ██║██████╔╝██████╔╝
██║  ██║██╔══██╗██╔══╝  ╚════██║╚════██║██╔══╝  ██║   ██║██╔══██╗██╔═══╝ 
██████╔╝██║  ██║███████╗███████║███████║██║     ╚██████╔╝██║  ██║██║     
╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     
EOF
echo -e "${NC}"

echo -e "${CYAN}🎉 WILLKOMMEN ZUM DRESSFORP E-COMMERCE SYSTEM SETUP! 🎉${NC}"
echo ""
echo -e "${YELLOW}⚡ Dieses Script installiert ALLES automatisch:${NC}"
echo -e "   ${CHECK} Backend API (Node.js + PostgreSQL)"
echo -e "   ${CHECK} Frontend Website (React + TailwindCSS)"
echo -e "   ${CHECK} Automatisierung (n8n Workflows)"
echo -e "   ${CHECK} KI Style Creator (AI Produktfotos)"
echo -e "   ${CHECK} Telegram Admin Bot (Mobile Verwaltung)"
echo -e "   ${CHECK} Alle Abhängigkeiten und Konfigurationen"
echo ""
echo -e "${BLUE}📋 SYSTEMANFORDERUNGEN:${NC}"
echo -e "   • Linux/macOS/WSL"
echo -e "   • Docker & Docker Compose"
echo -e "   • Node.js 18+"
echo -e "   • 8GB RAM (empfohlen)"
echo -e "   • 10GB freier Speicher"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

print_error() {
    echo -e "${RED}${CROSS}${NC} $1"
}

print_info() {
    echo -e "${BLUE}${ARROW}${NC} $1"
}

# Check if running as root (not recommended)
if [[ $EUID -eq 0 ]]; then
    print_error "Bitte nicht als root ausführen! Verwende einen normalen Benutzer."
    exit 1
fi

# Ask for confirmation
echo -e "${YELLOW}${ROCKET} Bereit für die automatische Installation? (j/n):${NC} "
read -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
    echo -e "${RED}Installation abgebrochen.${NC}"
    exit 1
fi

echo ""
print_info "Überprüfe System-Voraussetzungen..."

# Detect OS
OS="Unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
    DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
fi

print_status "Betriebssystem: $OS"

# Check and install Docker
if command -v docker &> /dev/null; then
    print_status "Docker: Installiert"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker Daemon läuft nicht. Starte Docker..."
        if [[ "$OS" == "macOS" ]]; then
            open -a Docker
            echo "Warte auf Docker Start..."
            sleep 10
        elif [[ "$OS" == "Linux" ]]; then
            sudo systemctl start docker
            sudo systemctl enable docker
        fi
    fi
else
    print_error "Docker ist nicht installiert!"
    print_info "Installiere Docker automatisch..."
    
    if [[ "$OS" == "Linux" ]]; then
        # Install Docker on Linux
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        print_status "Docker installiert! Bitte neu anmelden und Script erneut ausführen."
        exit 0
    elif [[ "$OS" == "macOS" ]]; then
        print_error "Bitte Docker Desktop für macOS manuell installieren:"
        print_error "https://www.docker.com/products/docker-desktop"
        exit 1
    fi
fi

# Check and install Docker Compose
if command -v docker-compose &> /dev/null; then
    print_status "Docker Compose: Installiert"
else
    print_info "Installiere Docker Compose..."
    
    if [[ "$OS" == "Linux" ]]; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_status "Docker Compose installiert!"
    elif [[ "$OS" == "macOS" ]]; then
        # Docker Compose is included with Docker Desktop on macOS
        print_status "Docker Compose ist mit Docker Desktop verfügbar"
    fi
fi

# Check and install Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -ge 18 ]]; then
        print_status "Node.js: v$(node -v)"
    else
        print_error "Node.js Version zu alt ($(node -v)). Benötigt: v18+"
        exit 1
    fi
else
    print_info "Installiere Node.js..."
    
    if [[ "$OS" == "Linux" ]]; then
        # Install Node.js using NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "macOS" ]]; then
        # Check if Homebrew is installed
        if command -v brew &> /dev/null; then
            brew install node
        else
            print_error "Homebrew nicht gefunden. Bitte Node.js manuell installieren:"
            print_error "https://nodejs.org/"
            exit 1
        fi
    fi
    
    print_status "Node.js installiert: v$(node -v)"
fi

# Check npm
if command -v npm &> /dev/null; then
    print_status "npm: v$(npm -v)"
else
    print_error "npm nicht gefunden!"
    exit 1
fi

echo ""
print_info "${GEAR} SYSTEM-SETUP STARTET..."
echo ""

# Create environment file
print_info "Erstelle Konfigurationsdateien..."
if [[ ! -f ".env" ]]; then
    cp "📋 templates/.env.template" ".env" 2>/dev/null || {
        print_error "Template .env.template nicht gefunden!"
        exit 1
    }
    print_status "Environment-Datei erstellt"
else
    print_status "Environment-Datei bereits vorhanden"
fi

# Setup backend
print_info "Installiere Backend-Abhängigkeiten..."
cd "⚙️ backend" || exit 1
npm install --silent --no-progress || {
    print_error "Backend-Installation fehlgeschlagen!"
    exit 1
}
print_status "Backend: OK"
cd ..

# Setup frontend
print_info "Installiere Frontend-Abhängigkeiten..."
cd "💻 frontend" || exit 1
npm install --silent --no-progress || {
    print_error "Frontend-Installation fehlgeschlagen!"
    exit 1
}
print_status "Frontend: OK"
cd ..

# Setup automation
print_info "${ROBOT} Konfiguriere Automatisierung..."
cd "🤖 automation" || exit 1
docker-compose pull --quiet || {
    print_error "Automatisierung-Setup fehlgeschlagen!"
    exit 1
}
print_status "Automatisierung: OK"
cd ..

# Setup AI Style Creator
print_info "${ART} Konfiguriere KI Style Creator..."
cd "🎨 ai-style-creator" || exit 1
docker-compose pull --quiet || print_info "Einige AI-Images werden beim ersten Start heruntergeladen"
print_status "KI Style Creator: OK"
cd ..

echo ""
echo -e "${GREEN}🎉 INSTALLATION ERFOLGREICH ABGESCHLOSSEN! 🎉${NC}"
echo ""
echo -e "${BLUE}📋 NÄCHSTE SCHRITTE:${NC}"
echo -e "   1. ${GEAR} Konfiguration anpassen (optional):"
echo -e "      ├─ .env Datei bearbeiten für eigene Einstellungen"
echo -e "      ├─ Stripe API-Keys für Zahlungen hinzufügen"
echo -e "      └─ Telegram Bot Token konfigurieren"
echo ""
echo -e "   2. ${ROCKET} System starten:"
echo -e "      ├─ ./start-system.sh ausführen"
echo -e "      └─ Website unter http://localhost:3000 öffnen"
echo ""
echo -e "   3. ${BOOK} Dokumentation lesen:"
echo -e "      ├─ 📚 documentation/BENUTZER-HANDBUCH.md"
echo -e "      └─ 📚 documentation/ERSTE-SCHRITTE.md"
echo ""
echo -e "${YELLOW}💡 TIPP: Für Anfänger gibt es eine Schritt-für-Schritt Video-Anleitung!${NC}"
echo -e "   📹 https://youtube.com/dressforp-setup-guide"
echo ""

echo -e "${YELLOW}${ROCKET} System jetzt starten? (j/n):${NC} "
read -n 1 -r
echo ""
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    ./start-system.sh
else
    echo ""
    print_status "Setup abgeschlossen! Führe './start-system.sh' aus, um zu beginnen."
fi
