#!/bin/bash

# =================================================================
# Railway Deployment Script für DressForPleasure Backend
# =================================================================
# 
# Dieses Script automatisiert das Deployment auf Railway.app
# Voraussetzungen:
# - Railway CLI installiert (https://docs.railway.app/develop/cli)
# - Railway Account und eingeloggt
# - Git Repository initialisiert
# 
# Usage: ./scripts/deploy-railway.sh [environment]
# =================================================================

set -e  # Exit bei Fehlern

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Script-Start
log_info "🚀 DressForPleasure Backend - Railway Deployment"
log_info "================================================="

# Environment Parameter
ENVIRONMENT=${1:-production}
log_info "🎯 Deployment-Umgebung: $ENVIRONMENT"

# Voraussetzungen prüfen
log_info "🔍 Prüfe Voraussetzungen..."

# Railway CLI prüfen
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI ist nicht installiert!"
    log_info "Installiere mit: npm install -g @railway/cli"
    log_info "Oder siehe: https://docs.railway.app/develop/cli"
    exit 1
fi

# Railway Login prüfen
if ! railway whoami &> /dev/null; then
    log_error "Nicht bei Railway eingeloggt!"
    log_info "Logge dich ein mit: railway login"
    exit 1
fi

# Git Repository prüfen
if [ ! -d ".git" ]; then
    log_error "Kein Git Repository gefunden!"
    log_info "Initialisiere mit: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

log_success "✅ Alle Voraussetzungen erfüllt"

# Project Setup
log_info "📁 Railway Project Setup..."

# Prüfe ob Project existiert
if ! railway status &> /dev/null; then
    log_info "🆕 Erstelle neues Railway Project..."
    railway login
    railway init --name "dressforp-backend"
fi

# Environment Variables setzen
log_info "⚙️  Setze Environment Variables..."

# Basis-Konfiguration
railway variables set NODE_ENV=$ENVIRONMENT
railway variables set TRUST_PROXY=true
railway variables set MAX_REQUEST_SIZE="5mb"

# Database Pool Settings
railway variables set DB_POOL_MIN=2
railway variables set DB_POOL_MAX=10
railway variables set DB_IDLE_TIMEOUT=30000

# CORS für Frontend
if [ "$ENVIRONMENT" = "production" ]; then
    railway variables set CORS_ORIGIN="https://dressforp.vercel.app,https://dressforp.com,https://www.dressforp.com"
else
    railway variables set CORS_ORIGIN="https://*.vercel.app,http://localhost:3000,http://localhost:5173"
fi

# Security Secrets (müssen manuell gesetzt werden)
log_warning "🔐 WICHTIG: Setze folgende Secrets manuell im Railway Dashboard:"
log_warning "   - SESSION_SECRET (generiere mit: openssl rand -hex 32)"
log_warning "   - JWT_SECRET (generiere mit: openssl rand -hex 64)"
log_warning "   - STRIPE_SECRET_KEY (falls Stripe verwendet wird)"
log_warning "   - SENDGRID_API_KEY (falls Email verwendet wird)"
log_warning "   - CLOUDINARY_* (falls Media-Upload verwendet wird)"

# PostgreSQL Service hinzufügen
log_info "🗄️  Füge PostgreSQL Service hinzu..."
if ! railway add postgresql &> /dev/null; then
    log_warning "PostgreSQL Service konnte nicht automatisch hinzugefügt werden"
    log_info "Füge manuell im Railway Dashboard hinzu: Add Service -> PostgreSQL"
else
    log_success "✅ PostgreSQL Service hinzugefügt"
fi

# Build und Deploy
log_info "🔨 Starte Build und Deployment..."

# Code committen falls Änderungen vorhanden
if [ -n "$(git status --porcelain)" ]; then
    log_info "📝 Committe aktuelle Änderungen..."
    git add .
    git commit -m "Deploy to Railway - $(date)"
fi

# Deploy ausführen
log_info "🚀 Deploye zu Railway..."
railway up --detach

# Warte auf Deployment
log_info "⏳ Warte auf Deployment-Abschluss..."
sleep 30

# Deployment Status prüfen
log_info "📊 Prüfe Deployment Status..."
if railway status | grep -q "deployed"; then
    log_success "✅ Deployment erfolgreich!"
    
    # Service URL abrufen
    SERVICE_URL=$(railway domain | head -n 1 | awk '{print $1}' || echo "Unbekannt")
    log_success "🌐 Service verfügbar unter: https://$SERVICE_URL"
    log_success "💚 Health Check: https://$SERVICE_URL/health"
    log_success "📚 API Docs: https://$SERVICE_URL/api"
    
else
    log_error "❌ Deployment fehlgeschlagen!"
    log_info "🔍 Prüfe Logs mit: railway logs"
    exit 1
fi

# Database Migration und Seeding
log_info "🗃️  Führe Database Setup aus..."

# Migration ausführen
log_info "📥 Führe Database Migration aus..."
if railway run npm run migration:up; then
    log_success "✅ Database Migration erfolgreich"
else
    log_warning "⚠️  Database Migration fehlgeschlagen - prüfe manuell"
fi

# Seeding (optional)
read -p "🌱 Möchtest du die Datenbank mit Beispieldaten füllen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "🌱 Fülle Datenbank mit Beispieldaten..."
    if railway run npm run seed:complete; then
        log_success "✅ Database Seeding erfolgreich"
    else
        log_warning "⚠️  Database Seeding fehlgeschlagen - prüfe manuell"
    fi
fi

# Final Health Check
log_info "🏥 Führe abschließenden Health Check aus..."
sleep 10

SERVICE_URL=$(railway domain | head -n 1 | awk '{print $1}' || echo "localhost")
if curl -s "https://$SERVICE_URL/health" | grep -q "healthy"; then
    log_success "✅ Health Check erfolgreich - Service ist online!"
else
    log_warning "⚠️  Health Check fehlgeschlagen - prüfe Service manuell"
fi

# Deployment-Zusammenfassung
log_info ""
log_info "🎉 DEPLOYMENT ABGESCHLOSSEN"
log_info "=============================="
log_success "✅ Backend deployed auf Railway"
log_success "🌐 URL: https://$SERVICE_URL"
log_success "💚 Health: https://$SERVICE_URL/health"
log_success "📚 API: https://$SERVICE_URL/api"
log_success "🗄️  Database: PostgreSQL Service aktiv"

log_info ""
log_info "📋 NÄCHSTE SCHRITTE:"
log_info "1. Prüfe Service im Railway Dashboard"
log_info "2. Setze fehlende Environment Variables manuell"
log_info "3. Teste alle API-Endpunkte"
log_info "4. Konfiguriere Frontend mit neuer Backend-URL"
log_info "5. Überwache Logs mit: railway logs --follow"

log_info ""
log_info "🔗 NÜTZLICHE LINKS:"
log_info "- Railway Dashboard: https://railway.app/dashboard"
log_info "- Service Logs: railway logs"
log_info "- Service Shell: railway shell"
log_info "- Environment Variables: railway variables"

log_success "🚀 Deployment erfolgreich abgeschlossen!"
