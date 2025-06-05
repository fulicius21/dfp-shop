#!/bin/bash

# =================================================================
# Render Deployment Script für DressForPleasure Backend
# =================================================================
# 
# Dieses Script bereitet das Deployment auf Render.com vor
# und gibt Anweisungen für manuelles Setup
# 
# Voraussetzungen:
# - Git Repository mit Remote (GitHub/GitLab)
# - render.yaml Konfigurationsdatei
# - Render Account
# 
# Usage: ./scripts/deploy-render.sh [environment]
# =================================================================

set -e  # Exit bei Fehlern

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging-Funktionen
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Script-Start
log_info "🚀 DressForPleasure Backend - Render Deployment Vorbereitung"
log_info "============================================================="

# Environment Parameter
ENVIRONMENT=${1:-production}
log_info "🎯 Deployment-Umgebung: $ENVIRONMENT"

# Voraussetzungen prüfen
log_info "🔍 Prüfe Voraussetzungen..."

# Git Repository prüfen
if [ ! -d ".git" ]; then
    log_error "Kein Git Repository gefunden!"
    log_info "Initialisiere mit: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Git Remote prüfen
if ! git remote -v | grep -q "origin"; then
    log_error "Kein Git Remote 'origin' gefunden!"
    log_info "Füge Remote hinzu mit: git remote add origin <repository-url>"
    exit 1
fi

# render.yaml prüfen
if [ ! -f "render.yaml" ]; then
    log_error "render.yaml Konfigurationsdatei nicht gefunden!"
    log_info "Diese sollte im Root-Verzeichnis vorhanden sein"
    exit 1
fi

log_success "✅ Alle Voraussetzungen erfüllt"

# Code vorbereiten
log_info "📝 Bereite Code für Deployment vor..."

# Aktuelle Änderungen committen
if [ -n "$(git status --porcelain)" ]; then
    log_info "📝 Committe aktuelle Änderungen..."
    git add .
    git commit -m "Prepare for Render deployment - $(date)"
fi

# Push zu Remote Repository
log_info "📤 Pushe Code zu Remote Repository..."
git push origin main || git push origin master

log_success "✅ Code erfolgreich gepusht"

# Environment Variables generieren
log_info "🔑 Generiere Environment Variables..."

# Session Secret generieren
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)

# .env.render Datei erstellen
log_info "📄 Erstelle .env.render mit generierten Secrets..."

cat > .env.render << EOF
# =================================================================
# RENDER ENVIRONMENT VARIABLES
# DressForPleasure Backend - Generiert am $(date)
# =================================================================
# 
# WICHTIG: Diese Werte müssen manuell im Render Dashboard gesetzt werden!
# Dashboard -> Service -> Environment -> Add Environment Variable
# =================================================================

# Basis-Konfiguration
NODE_ENV=$ENVIRONMENT
TRUST_PROXY=true
MAX_REQUEST_SIZE=5mb

# Database (wird automatisch von Render PostgreSQL Service gesetzt)
# DATABASE_URL wird automatisch von Render gesetzt

# Database Pool Settings für kostenloses Tier
DB_POOL_MIN=1
DB_POOL_MAX=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=20000

# Security Secrets (WICHTIG: Verwende diese generierten Werte!)
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET

# CORS für Frontend
EOF

if [ "$ENVIRONMENT" = "production" ]; then
    echo "CORS_ORIGIN=https://dressforp.vercel.app,https://dressforp.com,https://www.dressforp.com" >> .env.render
else
    echo "CORS_ORIGIN=https://*.vercel.app,http://localhost:3000,http://localhost:5173" >> .env.render
fi

cat >> .env.render << EOF

# Features
GDPR_ENABLED=true
HEALTH_CHECK_ENABLED=true
ANALYTICS_ENABLED=true

# Email Service (Optional)
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@dressforp.com
# SENDGRID_API_KEY=SG.XXXXXXXX (manuell setzen)

# Payment (Optional)
# STRIPE_SECRET_KEY=sk_live_XXXXXXXX (manuell setzen)
# STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXX (manuell setzen)
# STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX (manuell setzen)

# Media Upload (Optional)
# CLOUDINARY_CLOUD_NAME=your-cloud-name (manuell setzen)
# CLOUDINARY_API_KEY=123456789012345 (manuell setzen)
# CLOUDINARY_API_SECRET=CLOUDINARY_SECRET_HERE (manuell setzen)

EOF

log_success "✅ .env.render Datei erstellt mit generierten Secrets"

# Render Blueprint Datei validieren
log_info "🔍 Validiere render.yaml Konfiguration..."

if ! grep -q "services:" render.yaml; then
    log_error "render.yaml scheint ungültig zu sein (keine services: gefunden)"
    exit 1
fi

if ! grep -q "databases:" render.yaml; then
    log_warning "Keine Database-Konfiguration in render.yaml gefunden"
fi

log_success "✅ render.yaml Validierung erfolgreich"

# Manual Setup Instructions
log_info ""
log_step "📋 RENDER SETUP ANWEISUNGEN"
log_info "============================"
log_info ""

log_step "1. RENDER DASHBOARD ÖFFNEN"
log_info "   🌐 Gehe zu: https://dashboard.render.com/"
log_info "   📝 Logge dich ein oder erstelle einen Account"
log_info ""

log_step "2. NEUES SERVICE ERSTELLEN"
log_info "   ➕ Klicke auf 'New +' -> 'Blueprint'"
log_info "   🔗 Verbinde dein GitHub/GitLab Repository"
log_info "   📁 Wähle dieses Repository aus"
log_info "   ✅ Render erkennt automatisch die render.yaml Datei"
log_info ""

log_step "3. ENVIRONMENT VARIABLES SETZEN"
log_info "   ⚙️  Gehe zu deinem Service -> Environment"
log_info "   📝 Füge folgende Variables aus .env.render hinzu:"
log_info ""

# Environment Variables anzeigen
while IFS= read -r line; do
    if [[ $line =~ ^[A-Z_]+=.*$ && ! $line =~ ^#.*$ ]]; then
        echo -e "   ${GREEN}✓${NC} $line"
    fi
done < .env.render

log_info ""
log_step "4. OPTIONALE SERVICES KONFIGURIEREN"
log_info "   📧 Email Service (SendGrid):"
log_info "      - Registriere bei SendGrid: https://sendgrid.com/"
log_info "      - Erstelle API Key und setze SENDGRID_API_KEY"
log_info ""
log_info "   💳 Payment Service (Stripe):"
log_info "      - Registriere bei Stripe: https://stripe.com/"
log_info "      - Hole Live API Keys und setze STRIPE_* Variables"
log_info ""
log_info "   📁 Media Service (Cloudinary):"
log_info "      - Registriere bei Cloudinary: https://cloudinary.com/"
log_info "      - Setze CLOUDINARY_* Variables"
log_info ""

log_step "5. DEPLOYMENT STARTEN"
log_info "   🚀 Klicke auf 'Create Blueprint'"
log_info "   ⏳ Warte auf automatisches Deployment"
log_info "   🔍 Überwache Logs im Dashboard"
log_info ""

log_step "6. NACH DEM DEPLOYMENT"
log_info "   🏥 Teste Health Check: https://your-service.onrender.com/health"
log_info "   📚 Teste API: https://your-service.onrender.com/api"
log_info "   🗄️  Führe Database Migration aus (siehe unten)"
log_info ""

log_step "7. DATABASE MIGRATION"
log_info "   🖥️  Öffne Shell im Render Dashboard:"
log_info "      Service -> Shell -> Connect"
log_info "   📥 Führe Migration aus:"
log_info "      npm run migration:up"
log_info "   🌱 Optional - Beispieldaten laden:"
log_info "      npm run seed:complete"
log_info ""

# Troubleshooting
log_step "🔧 TROUBLESHOOTING"
log_info "==================="
log_info ""
log_info "❌ Build Fehler:"
log_info "   - Prüfe Node.js Version in package.json engines"
log_info "   - Stelle sicher dass alle Dependencies in package.json sind"
log_info "   - Prüfe Build Logs im Render Dashboard"
log_info ""
log_info "❌ Database Connection Fehler:"
log_info "   - Stelle sicher dass PostgreSQL Service läuft"
log_info "   - Prüfe DATABASE_URL Environment Variable"
log_info "   - Aktiviere Database Logs im Dashboard"
log_info ""
log_info "❌ CORS Fehler:"
log_info "   - Prüfe CORS_ORIGIN Environment Variable"
log_info "   - Stelle sicher dass Frontend-Domain enthalten ist"
log_info ""
log_info "❌ Service startet nicht:"
log_info "   - Prüfe Health Check Path (/health)"
log_info "   - Überprüfe PORT Environment Variable"
log_info "   - Prüfe Startup Logs"
log_info ""

# Monitoring Setup
log_step "📊 MONITORING SETUP"
log_info "==================="
log_info ""
log_info "🔔 Notifications einrichten:"
log_info "   - Service -> Settings -> Notifications"
log_info "   - Aktiviere Deploy-Benachrichtigungen"
log_info ""
log_info "📈 Metriken überwachen:"
log_info "   - Service -> Metrics"
log_info "   - Überwache CPU/Memory Usage"
log_info "   - Prüfe Response Times"
log_info ""

# Zusammenfassung
log_info ""
log_success "🎉 VORBEREITUNG ABGESCHLOSSEN"
log_success "============================="
log_success "✅ Code gepusht zu Repository"
log_success "✅ render.yaml Konfiguration validiert"
log_success "✅ Environment Variables generiert (.env.render)"
log_success "✅ Setup-Anweisungen bereitgestellt"
log_info ""

log_info "📋 DATEIEN ERSTELLT:"
log_info "   📄 .env.render - Environment Variables für Render"
log_info "   📄 render.yaml - Service-Konfiguration (bereits vorhanden)"
log_info ""

log_info "🔗 NÜTZLICHE LINKS:"
log_info "   - Render Dashboard: https://dashboard.render.com/"
log_info "   - Render Docs: https://render.com/docs"
log_info "   - PostgreSQL Setup: https://render.com/docs/databases"
log_info "   - Blueprint Guide: https://render.com/docs/blueprint-spec"
log_info ""

log_warning "⚠️  WICHTIGER HINWEIS:"
log_warning "Die Datei .env.render enthält sensitive Daten!"
log_warning "Füge sie nicht zu Git hinzu: echo '.env.render' >> .gitignore"

# .gitignore aktualisieren
if ! grep -q ".env.render" .gitignore 2>/dev/null; then
    echo ".env.render" >> .gitignore
    log_info "✅ .env.render zu .gitignore hinzugefügt"
fi

log_info ""
log_success "🚀 Bereit für Render Deployment!"
log_info "Folge den obigen Anweisungen im Render Dashboard."
