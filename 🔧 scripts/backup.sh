#!/bin/bash

# DressForP - Backup Script
# Erstellt vollständige Backups aller wichtigen Daten

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="dressforp_backup_$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

clear

echo -e "${BLUE}"
cat << "EOF"
💾 DRESSFORP BACKUP SYSTEM
==========================
Erstellt vollständige Backups aller Daten
EOF
echo -e "${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

print_info "Backup-Verzeichnis: $BACKUP_DIR/$BACKUP_NAME"

# Load environment variables
if [ -f ".env" ]; then
    source .env
    print_status "Environment-Variablen geladen"
else
    print_error ".env Datei nicht gefunden!"
    exit 1
fi

# Function to backup database
backup_database() {
    print_info "Sichere Datenbank..."
    
    if [ -n "$DATABASE_URL" ]; then
        # PostgreSQL backup
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
        print_status "PostgreSQL Backup erstellt"
    else
        print_error "DATABASE_URL nicht gefunden!"
        return 1
    fi
}

# Function to backup uploaded files
backup_uploads() {
    print_info "Sichere Upload-Dateien..."
    
    local upload_dirs=(
        "./uploads"
        "./💻 frontend/public/images"
        "./images"
    )
    
    for dir in "${upload_dirs[@]}"; do
        if [ -d "$dir" ]; then
            cp -r "$dir" "$BACKUP_DIR/$BACKUP_NAME/$(basename $dir)"
            print_status "Backup von $dir erstellt"
        fi
    done
}

# Function to backup configuration
backup_config() {
    print_info "Sichere Konfigurationsdateien..."
    
    local config_files=(
        ".env"
        "docker-compose.yml"
        "./📋 templates/.env.template"
        "./⚙️ backend/package.json"
        "./💻 frontend/package.json"
    )
    
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/config"
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$BACKUP_DIR/$BACKUP_NAME/config/"
            print_status "Backup von $(basename $file) erstellt"
        fi
    done
}

# Function to backup n8n workflows
backup_workflows() {
    print_info "Sichere n8n Workflows..."
    
    if [ -d "./🤖 automation/workflows" ]; then
        cp -r "./🤖 automation/workflows" "$BACKUP_DIR/$BACKUP_NAME/"
        print_status "n8n Workflows gesichert"
    fi
    
    # Export n8n workflows via API if running
    if curl -s http://localhost:5678/healthz &>/dev/null; then
        print_info "Exportiere n8n Workflows via API..."
        curl -s "http://localhost:5678/api/v1/workflows" > "$BACKUP_DIR/$BACKUP_NAME/n8n_workflows.json"
        print_status "n8n API Export erstellt"
    fi
}

# Function to backup logs
backup_logs() {
    print_info "Sichere System-Logs..."
    
    if [ -d "./logs" ]; then
        cp -r "./logs" "$BACKUP_DIR/$BACKUP_NAME/"
        print_status "System-Logs gesichert"
    fi
}

# Function to create backup metadata
create_metadata() {
    print_info "Erstelle Backup-Metadaten..."
    
    cat > "$BACKUP_DIR/$BACKUP_NAME/backup_info.txt" << EOL
DressForP Backup Information
============================

Backup Date: $(date)
Backup Name: $BACKUP_NAME
System Info: $(uname -a)
Node Version: $(node --version 2>/dev/null || echo "Not available")
Docker Version: $(docker --version 2>/dev/null || echo "Not available")

Components Backed Up:
- Database (PostgreSQL)
- Upload Files
- Configuration Files
- n8n Workflows
- System Logs

Environment Variables:
NODE_ENV=${NODE_ENV:-"not set"}
FRONTEND_PORT=${FRONTEND_PORT:-"not set"}
BACKEND_PORT=${BACKEND_PORT:-"not set"}

Database:
DATABASE_URL=${DATABASE_URL:-"not set"}

Backup Size: $(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
EOL

    print_status "Backup-Metadaten erstellt"
}

# Function to compress backup
compress_backup() {
    print_info "Komprimiere Backup..."
    
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    
    # Remove uncompressed backup
    rm -rf "$BACKUP_NAME"
    
    print_status "Backup komprimiert: ${BACKUP_NAME}.tar.gz"
    print_info "Backup-Größe: $(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_info "Bereinige alte Backups..."
    
    # Keep last 7 backups
    cd "$BACKUP_DIR"
    ls -t dressforp_backup_*.tar.gz | tail -n +8 | xargs -r rm
    
    print_status "Alte Backups bereinigt (behalte letzte 7)"
}

# Function to upload to cloud (optional)
upload_to_cloud() {
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        print_info "Lade Backup zu AWS S3 hoch..."
        aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "s3://$AWS_S3_BUCKET/backups/"
        print_status "Backup zu S3 hochgeladen"
    fi
    
    if [ -n "$GOOGLE_STORAGE_BUCKET" ] && command -v gsutil &> /dev/null; then
        print_info "Lade Backup zu Google Cloud Storage hoch..."
        gsutil cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "gs://$GOOGLE_STORAGE_BUCKET/backups/"
        print_status "Backup zu Google Cloud hochgeladen"
    fi
}

# Function to verify backup
verify_backup() {
    print_info "Verifiziere Backup..."
    
    if [ -f "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" ]; then
        # Test if archive is valid
        if tar -tzf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" &>/dev/null; then
            print_status "Backup-Archiv ist gültig"
            return 0
        else
            print_error "Backup-Archiv ist beschädigt!"
            return 1
        fi
    else
        print_error "Backup-Datei nicht gefunden!"
        return 1
    fi
}

# Main backup process
main() {
    print_info "Starte Backup-Prozess..."
    
    # Check if system is running
    if ! curl -s http://localhost:3001/api/health &>/dev/null; then
        print_warning "Backend läuft nicht - erstelle Offline-Backup"
    fi
    
    # Perform backups
    backup_database || print_error "Datenbank-Backup fehlgeschlagen"
    backup_uploads
    backup_config
    backup_workflows
    backup_logs
    create_metadata
    compress_backup
    
    # Verify backup
    if verify_backup; then
        print_status "Backup erfolgreich erstellt und verifiziert"
        
        # Optional cloud upload
        upload_to_cloud
        
        # Cleanup old backups
        cleanup_old_backups
        
        echo ""
        print_info "📁 Backup-Datei: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
        print_info "📊 Backup-Größe: $(du -sh "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)"
        
    else
        print_error "Backup-Verifikation fehlgeschlagen!"
        exit 1
    fi
}

# Restore function
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        print_error "Bitte Backup-Datei angeben: ./backup.sh restore backup_file.tar.gz"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup-Datei nicht gefunden: $backup_file"
        exit 1
    fi
    
    print_warning "⚠️  ACHTUNG: Restore überschreibt aktuelle Daten!"
    echo -n "Fortfahren? (j/N): "
    read -r confirm
    
    if [[ ! $confirm =~ ^[JjYy]$ ]]; then
        print_info "Restore abgebrochen"
        exit 0
    fi
    
    print_info "Starte Restore von $backup_file..."
    
    # Extract backup
    tar -xzf "$backup_file" -C "$BACKUP_DIR/"
    local restore_dir=$(basename "$backup_file" .tar.gz)
    
    # Restore database
    if [ -f "$BACKUP_DIR/$restore_dir/database.sql" ]; then
        print_info "Restore Datenbank..."
        psql "$DATABASE_URL" < "$BACKUP_DIR/$restore_dir/database.sql"
        print_status "Datenbank wiederhergestellt"
    fi
    
    # Restore files
    if [ -d "$BACKUP_DIR/$restore_dir/uploads" ]; then
        print_info "Restore Upload-Dateien..."
        cp -r "$BACKUP_DIR/$restore_dir/uploads" ./
        print_status "Upload-Dateien wiederhergestellt"
    fi
    
    # Restore workflows
    if [ -d "$BACKUP_DIR/$restore_dir/workflows" ]; then
        print_info "Restore n8n Workflows..."
        cp -r "$BACKUP_DIR/$restore_dir/workflows" "./🤖 automation/"
        print_status "n8n Workflows wiederhergestellt"
    fi
    
    print_status "🎉 Restore erfolgreich abgeschlossen!"
    print_info "Bitte System neustarten: ./start-system.sh"
}

# Handle command line arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        print_info "Verfügbare Backups:"
        ls -la "$BACKUP_DIR"/dressforp_backup_*.tar.gz 2>/dev/null || print_info "Keine Backups gefunden"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 [backup|restore|list|cleanup]"
        echo ""
        echo "Befehle:"
        echo "  backup          - Erstellt vollständiges Backup (Standard)"
        echo "  restore <file>  - Stellt Backup wieder her"
        echo "  list           - Zeigt verfügbare Backups"
        echo "  cleanup        - Löscht alte Backups"
        exit 1
        ;;
esac
