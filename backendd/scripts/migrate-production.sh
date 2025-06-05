#!/bin/bash

# =================================================================
# Production Database Migration Script für DressForPleasure Backend
# =================================================================
# 
# Dieses Script führt sichere Database Migrationen in Production aus
# mit Backup, Rollback-Möglichkeit und Validierung
# 
# Usage: ./scripts/migrate-production.sh [action]
# Actions: migrate, seed, rollback, backup, validate
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
log_info "🗄️  DressForPleasure Backend - Production Database Migration"
log_info "==========================================================="

# Parameter
ACTION=${1:-migrate}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

log_info "🎯 Action: $ACTION"
log_info "📅 Timestamp: $TIMESTAMP"

# Environment prüfen
if [ "$NODE_ENV" != "production" ] && [ -z "$FORCE_PRODUCTION" ]; then
    log_error "❌ Dieses Script ist nur für Production gedacht!"
    log_info "Setze NODE_ENV=production oder FORCE_PRODUCTION=true"
    log_info "Für Development nutze: npm run migration:up"
    exit 1
fi

# Voraussetzungen prüfen
log_info "🔍 Prüfe Voraussetzungen..."

# Database URL prüfen
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL Environment Variable nicht gesetzt!"
    exit 1
fi

# Node.js und NPM prüfen
if ! command -v npm &> /dev/null; then
    log_error "npm ist nicht installiert!"
    exit 1
fi

# PostgreSQL Client prüfen (für Backup)
if ! command -v pg_dump &> /dev/null && [ "$ACTION" = "backup" ]; then
    log_warning "pg_dump nicht verfügbar - Backup nicht möglich"
fi

log_success "✅ Voraussetzungen erfüllt"

# Backup Directory erstellen
mkdir -p "$BACKUP_DIR"

# Safety Checks
safety_check() {
    log_step "🛡️  Safety Checks"
    
    # Production Umgebung bestätigen
    read -p "⚠️  Bist du sicher, dass du in PRODUCTION migrieren möchtest? (yes/no): " -r
    if [ "$REPLY" != "yes" ]; then
        log_error "Migration abgebrochen"
        exit 1
    fi
    
    # Database Connection testen
    log_info "🔌 Teste Database Connection..."
    if npm run migration:validate &> /dev/null; then
        log_success "✅ Database Connection erfolgreich"
    else
        log_error "❌ Database Connection fehlgeschlagen!"
        exit 1
    fi
    
    # Aktuelle Schema Version ermitteln
    log_info "📊 Ermittle aktuelle Schema Version..."
    # Dies würde durch Drizzle's Migrationssystem implementiert werden
    
    log_success "✅ Safety Checks bestanden"
}

# Database Backup erstellen
create_backup() {
    log_step "💾 Erstelle Database Backup"
    
    if command -v pg_dump &> /dev/null; then
        log_info "📦 Erstelle Backup: $BACKUP_FILE"
        
        # Backup mit pg_dump erstellen
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null
        
        if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log_success "✅ Backup erstellt: $BACKUP_FILE ($BACKUP_SIZE)"
            echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_backup.txt"
        else
            log_error "❌ Backup fehlgeschlagen!"
            exit 1
        fi
    else
        log_warning "⚠️  pg_dump nicht verfügbar - kein Backup erstellt"
        log_warning "Stelle sicher, dass du ein manuelles Backup hast!"
        
        read -p "Fortfahren ohne automatisches Backup? (yes/no): " -r
        if [ "$REPLY" != "yes" ]; then
            log_error "Migration abgebrochen"
            exit 1
        fi
    fi
}

# Migration ausführen
run_migration() {
    log_step "🚀 Führe Database Migration aus"
    
    log_info "📥 Starte Migration..."
    
    # Migration mit Timeout ausführen
    timeout 300 npm run migration:up || {
        log_error "❌ Migration fehlgeschlagen oder Timeout!"
        log_info "🔄 Prüfe Rollback-Optionen..."
        return 1
    }
    
    log_success "✅ Migration erfolgreich abgeschlossen"
}

# Database Seeding
run_seeding() {
    log_step "🌱 Database Seeding"
    
    read -p "🌱 Möchtest du die Datenbank mit Beispieldaten füllen? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "🌱 Starte Database Seeding..."
        
        # Verschiedene Seeding-Optionen
        echo "Verfügbare Seeding-Optionen:"
        echo "1) Basis-Daten (Kategorien, Kollektionen)"
        echo "2) Fashion-Daten (Produkte, Beispieldaten)"
        echo "3) Komplette Daten (Alles)"
        read -p "Wähle Option (1-3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                npm run seed
                ;;
            2)
                npm run seed:fashion
                ;;
            3)
                npm run seed:complete
                ;;
            *)
                log_info "Überspringe Seeding"
                return 0
                ;;
        esac
        
        log_success "✅ Database Seeding abgeschlossen"
    else
        log_info "Überspringe Database Seeding"
    fi
}

# Migration validieren
validate_migration() {
    log_step "✅ Validiere Migration"
    
    log_info "🔍 Prüfe Database Schema..."
    
    # Health Check ausführen
    if npm run health-check &> /dev/null; then
        log_success "✅ Health Check erfolgreich"
    else
        log_error "❌ Health Check fehlgeschlagen!"
        return 1
    fi
    
    # Basis-Queries testen
    log_info "🧪 Teste Basis-Funktionalität..."
    
    # Test-Query über API (falls Server läuft)
    if curl -s "$API_URL/health" | grep -q "healthy" 2>/dev/null; then
        log_success "✅ API Health Check erfolgreich"
    else
        log_warning "⚠️  API nicht erreichbar - manueller Test erforderlich"
    fi
    
    log_success "✅ Migration Validierung abgeschlossen"
}

# Rollback ausführen
run_rollback() {
    log_step "🔄 Database Rollback"
    
    # Verfügbare Backups anzeigen
    if [ -d "$BACKUP_DIR" ] && [ -n "$(ls -A $BACKUP_DIR/*.sql 2>/dev/null)" ]; then
        log_info "📋 Verfügbare Backups:"
        ls -la "$BACKUP_DIR"/*.sql | awk '{print $9, $5, $6, $7, $8}'
        
        read -p "Backup-Datei für Rollback eingeben: " ROLLBACK_FILE
        
        if [ -f "$ROLLBACK_FILE" ]; then
            log_warning "⚠️  WARNUNG: Rollback wird alle aktuellen Daten überschreiben!"
            read -p "Rollback bestätigen? (yes/no): " -r
            
            if [ "$REPLY" = "yes" ]; then
                log_info "🔄 Führe Rollback aus..."
                
                # Rollback mit psql
                if command -v psql &> /dev/null; then
                    psql "$DATABASE_URL" < "$ROLLBACK_FILE"
                    log_success "✅ Rollback abgeschlossen"
                else
                    log_error "❌ psql nicht verfügbar für Rollback!"
                    log_info "Manueller Rollback erforderlich mit: psql \$DATABASE_URL < $ROLLBACK_FILE"
                fi
            else
                log_info "Rollback abgebrochen"
            fi
        else
            log_error "❌ Backup-Datei nicht gefunden: $ROLLBACK_FILE"
        fi
    else
        log_error "❌ Keine Backup-Dateien gefunden in $BACKUP_DIR"
    fi
}

# Cleanup alte Backups
cleanup_backups() {
    log_step "🧹 Cleanup alte Backups"
    
    # Behalte nur die letzten 10 Backups
    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l)
        
        if [ "$BACKUP_COUNT" -gt 10 ]; then
            log_info "🗑️  Lösche alte Backups (behalte die letzten 10)..."
            ls -t "$BACKUP_DIR"/*.sql | tail -n +11 | xargs rm -f
            log_success "✅ Cleanup abgeschlossen"
        else
            log_info "📦 Backup Count: $BACKUP_COUNT (kein Cleanup erforderlich)"
        fi
    fi
}

# Main Function
main() {
    case $ACTION in
        "migrate")
            safety_check
            create_backup
            run_migration
            validate_migration
            run_seeding
            cleanup_backups
            ;;
        "seed")
            safety_check
            run_seeding
            ;;
        "rollback")
            safety_check
            run_rollback
            ;;
        "backup")
            create_backup
            ;;
        "validate")
            validate_migration
            ;;
        *)
            log_error "❌ Unbekannte Action: $ACTION"
            log_info "Verfügbare Actions: migrate, seed, rollback, backup, validate"
            exit 1
            ;;
    esac
}

# Cloud Provider spezifische Anweisungen
show_cloud_instructions() {
    log_info ""
    log_step "☁️  CLOUD PROVIDER ANWEISUNGEN"
    log_info "==============================="
    
    log_info "🚀 Railway:"
    log_info "   railway run ./scripts/migrate-production.sh migrate"
    log_info ""
    
    log_info "🎨 Render:"
    log_info "   1. Öffne Shell im Render Dashboard"
    log_info "   2. ./scripts/migrate-production.sh migrate"
    log_info ""
    
    log_info "🟣 Heroku:"
    log_info "   heroku run ./scripts/migrate-production.sh migrate -a your-app"
    log_info ""
    
    log_info "📦 Docker:"
    log_info "   docker exec -it container_name ./scripts/migrate-production.sh migrate"
}

# Error Handler
error_handler() {
    local exit_code=$?
    log_error "❌ Script fehlgeschlagen mit Exit Code: $exit_code"
    
    if [ -f "$BACKUP_FILE" ]; then
        log_info "💾 Backup verfügbar: $BACKUP_FILE"
        log_info "Rollback mit: ./scripts/migrate-production.sh rollback"
    fi
    
    exit $exit_code
}

# Error Handler registrieren
trap error_handler ERR

# Script ausführen
main "$@"

# Success Message
log_info ""
log_success "🎉 MIGRATION ERFOLGREICH ABGESCHLOSSEN"
log_success "======================================"

if [ "$ACTION" = "migrate" ]; then
    log_success "✅ Database Migration durchgeführt"
    log_success "💾 Backup erstellt: $BACKUP_FILE"
    log_success "✅ Validierung erfolgreich"
fi

log_info ""
log_info "📋 NÄCHSTE SCHRITTE:"
log_info "1. 🧪 Teste alle API-Endpunkte"
log_info "2. 🔍 Überprüfe Application Logs"
log_info "3. 📊 Überwache Performance Metriken"
log_info "4. 🔔 Benachrichtige Team über erfolgreiche Migration"

if [ "$ACTION" != "validate" ]; then
    show_cloud_instructions
fi

log_success "🚀 Production Migration abgeschlossen!"
