#!/bin/bash

# ==============================================
# DressForPleasure n8n Automation Setup Script
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Script header
echo "================================================"
echo "🤖 DressForPleasure n8n Automation Setup"
echo "================================================"
echo ""

# ========================
# 1. UMGEBUNG PRÜFEN
# ========================

log_step "Schritt 1: Umgebung wird geprüft..."

# Docker prüfen
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker gefunden: $DOCKER_VERSION"
else
    log_error "Docker ist nicht installiert. Bitte Docker installieren."
    exit 1
fi

# Docker Compose prüfen
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version)
    log_success "Docker Compose gefunden: $COMPOSE_VERSION"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version)
    log_success "Docker Compose gefunden: $COMPOSE_VERSION"
    COMPOSE_CMD="docker compose"
else
    log_error "Docker Compose ist nicht installiert"
    exit 1
fi

# Set compose command
COMPOSE_CMD=${COMPOSE_CMD:-"docker-compose"}

# ========================
# 2. VERZEICHNISSE ERSTELLEN
# ========================

log_step "Schritt 2: Verzeichnisstruktur wird erstellt..."

# Basis-Verzeichnisse
DIRECTORIES=(
    "workflows"
    "workflows/order-management"
    "workflows/product-management" 
    "workflows/customer-service"
    "workflows/analytics"
    "workflows/admin"
    "credentials"
    "custom-nodes"
    "logs"
    "backup"
    "database"
    "monitoring"
    "monitoring/grafana/dashboards"
    "monitoring/grafana/datasources"
    "scripts"
    "templates"
    "documentation"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_info "Verzeichnis erstellt: $dir"
    fi
done

log_success "Verzeichnisstruktur erstellt"

# ========================
# 3. KONFIGURATIONSDATEIEN ERSTELLEN
# ========================

log_step "Schritt 3: Konfigurationsdateien werden erstellt..."

# Environment-Datei
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info ".env aus .env.example erstellt"
        log_warning "Bitte .env-Datei mit Ihren Konfigurationsdaten bearbeiten"
    else
        log_error ".env.example nicht gefunden"
        exit 1
    fi
else
    log_success ".env-Datei bereits vorhanden"
fi

# Database Init Script
cat > database/init.sql << 'EOF'
-- n8n Database Initialization
-- Erstellt zusätzliche Erweiterungen und Funktionen

-- UUID-Erweiterung aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Zusätzliche Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_execution_data_execution_id ON execution_entity(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_entity_active ON workflow_entity(active);

-- Funktion für automatische Timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Logging-Tabelle für DressForPleasure-spezifische Events
CREATE TABLE IF NOT EXISTS dressforp_automation_logs (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dressforp_logs_workflow ON dressforp_automation_logs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_dressforp_logs_created ON dressforp_automation_logs(created_at);

-- Trigger für Timestamps
CREATE TRIGGER set_timestamp_dressforp_logs
    BEFORE UPDATE ON dressforp_automation_logs
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

-- Workflow-Statistiken View
CREATE OR REPLACE VIEW workflow_stats AS
SELECT 
    workflow_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
    AVG(CASE WHEN status = 'success' THEN 1.0 ELSE 0.0 END) as success_rate,
    MAX(created_at) as last_execution
FROM dressforp_automation_logs 
GROUP BY workflow_name;

COMMIT;
EOF

log_success "Database Init-Script erstellt"

# Prometheus Configuration
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'n8n'
    static_configs:
      - targets: ['n8n:5678']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['n8n-postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['n8n-redis:6379']
    scrape_interval: 30s
EOF

# Grafana Datasource
cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

log_success "Monitoring-Konfiguration erstellt"

# ========================
# 4. DOCKER SERVICES STARTEN
# ========================

log_step "Schritt 4: Docker Services werden gestartet..."

# Stoppe existierende Services
log_info "Stoppe existierende Services..."
$COMPOSE_CMD down 2>/dev/null || true

# Starte Services
log_info "Starte n8n Automation Stack..."
$COMPOSE_CMD up -d

# Warte auf Services
log_info "Warte auf Services..."
sleep 30

# Health Check
log_info "Führe Health Checks durch..."

# n8n Health Check
if curl -f http://localhost:5678/healthz >/dev/null 2>&1; then
    log_success "n8n ist erreichbar"
else
    log_warning "n8n möglicherweise noch nicht bereit"
fi

# Database Health Check
if $COMPOSE_CMD exec -T n8n-postgres pg_isready -U n8n_user >/dev/null 2>&1; then
    log_success "PostgreSQL ist bereit"
else
    log_warning "PostgreSQL möglicherweise noch nicht bereit"
fi

log_success "Docker Services gestartet"

# ========================
# 5. TELEGRAM BOT SETUP (Optional)
# ========================

log_step "Schritt 5: Telegram Bot Setup (Optional)..."

read -p "Möchten Sie einen Telegram Bot für Benachrichtigungen einrichten? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📱 Telegram Bot Setup:"
    echo "1. Gehen Sie zu @BotFather auf Telegram"
    echo "2. Senden Sie /newbot und folgen Sie den Anweisungen"
    echo "3. Kopieren Sie den Bot-Token"
    echo "4. Senden Sie eine Nachricht an Ihren Bot"
    echo "5. Gehen Sie zu https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
    echo "6. Kopieren Sie Ihre Chat-ID aus der Antwort"
    echo ""
    echo "Tragen Sie dann Bot-Token und Chat-ID in die .env-Datei ein:"
    echo "TELEGRAM_BOT_TOKEN=your_bot_token"
    echo "TELEGRAM_CHAT_ID=your_chat_id"
    echo ""
    
    read -p "Drücken Sie Enter, um fortzufahren..."
fi

# ========================
# 6. INITIAL WORKFLOWS IMPORTIEREN
# ========================

log_step "Schritt 6: Initial Workflows werden erstellt..."

# Erstelle Basic Workflow Templates
cat > workflows/01_new_order_notification.json << 'EOF'
{
  "name": "01 - Neue Bestellung Benachrichtigung",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "new-order",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-new-order",
      "name": "Webhook - Neue Bestellung",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300],
      "webhookId": "new-order-webhook"
    },
    {
      "parameters": {
        "chatId": "={{ $env.TELEGRAM_CHAT_ID }}",
        "text": "🛍️ **Neue Bestellung eingegangen!**\n\n📋 **Bestellnummer:** {{ $json.orderNumber }}\n💰 **Betrag:** {{ $json.totalAmount }}€\n👤 **Kunde:** {{ $json.customerEmail }}\n🎯 **Status:** {{ $json.status }}\n⏰ **Zeit:** {{ $json.orderDate }}\n\n🔗 [Bestellung ansehen]({{ $env.DRESSFORP_FRONTEND_URL }}/admin/orders/{{ $json.id }})"
      },
      "id": "telegram-notification",
      "name": "Telegram Benachrichtigung",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [460, 300],
      "credentials": {
        "telegramApi": {
          "id": "telegram-bot-credentials",
          "name": "DressForPleasure Telegram Bot"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={ \"status\": \"success\", \"message\": \"Notification sent\" }"
      },
      "id": "response-success",
      "name": "Response Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Webhook - Neue Bestellung": {
      "main": [
        [
          {
            "node": "Telegram Benachrichtigung",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Telegram Benachrichtigung": {
      "main": [
        [
          {
            "node": "Response Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {},
  "versionId": "1",
  "id": "1"
}
EOF

log_success "Basis-Workflow-Template erstellt"

# ========================
# 7. ABSCHLUSS & INFORMATION
# ========================

log_step "Schritt 7: Setup wird abgeschlossen..."

echo ""
echo "================================================"
echo "🎉 n8n Automation Setup abgeschlossen!"
echo "================================================"
echo ""

log_success "n8n Automation Stack ist bereit"
echo ""
echo "📝 Wichtige URLs:"
echo "  - n8n Interface: http://localhost:5678"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001"
echo ""
echo "🔐 Standard-Zugangsdaten:"
echo "  - n8n: admin / DressForPleasure2024!"
echo "  - Grafana: admin / DressForPleasure2024!"
echo ""
echo "📁 Wichtige Verzeichnisse:"
echo "  - Workflows: ./workflows/"
echo "  - Credentials: ./credentials/"
echo "  - Logs: ./logs/"
echo "  - Backup: ./backup/"
echo ""
echo "🔧 Nächste Schritte:"
echo "  1. .env-Datei vervollständigen"
echo "  2. Telegram Bot konfigurieren (optional)"
echo "  3. n8n öffnen und Credentials einrichten"
echo "  4. Workflows importieren und aktivieren"
echo "  5. Backend-Integration testen"
echo ""
echo "📚 Dokumentation:"
echo "  - Workflow-Dokumentation: ./documentation/"
echo "  - Setup-Anleitung: ./README.md"
echo ""

# Optional: n8n öffnen
read -p "Möchten Sie n8n jetzt im Browser öffnen? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open http://localhost:5678
    elif command -v open >/dev/null 2>&1; then
        open http://localhost:5678
    else
        log_info "Bitte öffnen Sie http://localhost:5678 in Ihrem Browser"
    fi
fi

log_success "Setup erfolgreich abgeschlossen!"

echo ""
echo "🚀 DressForPleasure n8n Automation ist bereit für die Konfiguration!"
