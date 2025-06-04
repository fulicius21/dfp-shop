# 🤖 DressForPleasure n8n Automation System

Ein vollständiges Automatisierungssystem für das DressForPleasure E-Commerce Business mit 10+ kritischen Workflows, die alle wichtigen Geschäftsprozesse automatisieren.

## 📋 Inhaltsverzeichnis

- [🎯 Überblick](#-überblick)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Installation](#️-installation)
- [📊 Workflows Übersicht](#-workflows-übersicht)
- [🔧 Konfiguration](#-konfiguration)
- [📚 Dokumentation](#-dokumentation)
- [🔍 Troubleshooting](#-troubleshooting)
- [📈 Monitoring](#-monitoring)

## 🎯 Überblick

Das DressForPleasure n8n Automation System automatisiert kritische E-Commerce-Prozesse:

### ✅ Was wird automatisiert?

| Kategorie | Anzahl Workflows | Beschreibung |
|-----------|------------------|--------------|
| **Bestellungsmanagement** | 3 | Neue Bestellungen, Stripe-Zahlungen, Status-Updates |
| **Produktverwaltung** | 2 | Produktfreigabe, Lagerbestand-Alerts |
| **Kundenservice** | 3 | Kontaktformular, Newsletter, Bewertungsanfragen |
| **Analytics** | 1 | Tägliche Sales Reports |
| **Administration** | 1 | System Health Monitoring |

### 🎯 Business Impact

- **99.9% Verfügbarkeit** durch automatisches Health Monitoring
- **Sofortige Benachrichtigungen** bei kritischen Events
- **Automatisierte Kundenbetreuung** für bessere Customer Experience
- **Datengetriebene Entscheidungen** durch tägliche Reports
- **Kosteneffizienz** durch Automatisierung manueller Prozesse

## 🚀 Quick Start

### 1. Schnelle Installation

```bash
# Repository klonen (oder Dateien kopieren)
cd /path/to/your/project
cp -r n8n-automation ./

# Setup-Script ausführen
cd n8n-automation
chmod +x setup.sh
./setup.sh
```

### 2. Basis-Konfiguration

```bash
# Environment-Datei anpassen
cp .env.example .env
nano .env  # Ihre Konfiguration eintragen
```

### 3. Services starten

```bash
# Docker Compose starten
docker-compose up -d

# Status prüfen
docker-compose ps
```

### 4. n8n öffnen

- **URL**: http://localhost:5678
- **Login**: admin / DressForPleasure2024!

## 🛠️ Installation

### Voraussetzungen

- **Docker & Docker Compose** (empfohlen)
- **Node.js 18+** (für lokale Installation)
- **PostgreSQL 15+** (für Datenbank)
- **2GB RAM** minimum (4GB empfohlen)

### Detaillierte Installation

#### Option 1: Docker Installation (Empfohlen)

```bash
# 1. Verzeichnisse erstellen
mkdir -p n8n-automation
cd n8n-automation

# 2. Dateien kopieren
# Kopieren Sie alle Dateien aus diesem Repository

# 3. Environment konfigurieren
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Konfigurationsdaten

# 4. Setup-Script ausführen
chmod +x setup.sh
./setup.sh

# 5. Services starten
docker-compose up -d

# 6. Logs prüfen
docker-compose logs -f n8n
```

#### Option 2: Lokale Installation

```bash
# 1. n8n global installieren
npm install -g n8n

# 2. PostgreSQL für n8n konfigurieren
# Siehe database/init.sql für Setup

# 3. Environment Variables setzen
export N8N_DATABASE_TYPE=postgresdb
export N8N_DATABASE_HOST=localhost
export N8N_DATABASE_PORT=5432
export N8N_DATABASE_NAME=n8n
export N8N_DATABASE_USER=n8n_user
export N8N_DATABASE_PASSWORD=your_password

# 4. n8n starten
n8n start

# 5. Workflows importieren
# Über n8n UI: Settings > Import > JSON Files
```

### Verzeichnisstruktur

```
n8n-automation/
├── docker-compose.yml          # Docker-Konfiguration
├── .env.example               # Environment-Template
├── setup.sh                   # Automatisches Setup
├── README.md                  # Diese Dokumentation
├── workflows/                 # n8n Workflow-Definitionen
│   ├── order-management/      # Bestellungsworkflows
│   ├── product-management/    # Produktworkflows
│   ├── customer-service/      # Kundenservice-Workflows
│   ├── analytics/            # Analytics-Workflows
│   └── admin/                # Administrative Workflows
├── credentials/              # Credential-Templates
├── scripts/                  # Custom Scripts
├── monitoring/              # Monitoring-Konfiguration
├── database/               # Database Setup
└── documentation/          # Zusätzliche Dokumentation
```

## 📊 Workflows Übersicht

### 🛒 Order Management Workflows

#### 01 - Neue Bestellung Benachrichtigung
- **Trigger**: Webhook vom Backend bei neuer Bestellung
- **Funktionen**:
  - Validierung der Bestelldaten
  - Telegram-Benachrichtigung an Admin
  - E-Mail-Benachrichtigung mit Bestelldetails
  - Audit-Log-Eintrag
- **Webhook URL**: `/webhook/new-order`

#### 02 - Stripe Zahlungsbestätigung
- **Trigger**: Stripe Webhook bei Zahlungsevents
- **Funktionen**:
  - Signaturverifikation für Sicherheit
  - Verarbeitung erfolgreicher Zahlungen
  - Behandlung fehlgeschlagener Zahlungen
  - Backend-Benachrichtigung über Zahlungsstatus
- **Webhook URL**: `/webhook/stripe-webhook`

#### 03 - Bestellstatus Update
- **Trigger**: Webhook bei Statusänderungen
- **Funktionen**:
  - Kundenbachrichten bei Status-Updates
  - Verschiedene E-Mail-Templates je Status
  - Telegram-Benachrichtigungen
  - Auslösung von Review-Requests bei Zustellung
- **Webhook URL**: `/webhook/order-status-update`

### 🏷️ Product Management Workflows

#### 04 - Produktfreigabe & Website-Sync
- **Trigger**: Webhook bei Produktfreigabe im Admin-Panel
- **Funktionen**:
  - Automatische Website-Synchronisation
  - Lagerbestand-Prüfung nach Freigabe
  - Telegram-Benachrichtigungen
  - Low-Stock Alerts
- **Webhook URL**: `/webhook/product-approval`

#### 05 - Lagerbestand-Alerts
- **Trigger**: Täglich um 9:00 Uhr
- **Funktionen**:
  - Überwachung aller Produktbestände
  - Kategorisierung (kritisch, niedrig, ausverkauft)
  - Automatische Deaktivierung ausverkaufter Produkte
  - Detaillierte E-Mail-Reports
- **Schedule**: `0 9 * * *`

### 👥 Customer Service Workflows

#### 06 - Kontaktformular Handler
- **Trigger**: Webhook von Kontaktformular
- **Funktionen**:
  - Ticket-System Integration
  - Automatische Kategorisierung und Prioritätssetzung
  - Sofortige Antwort-E-Mails an Kunden
  - Interne Benachrichtigungen je Priorität
- **Webhook URL**: `/webhook/contact-form`

#### 07 - Newsletter Management
- **Trigger**: Webhook bei Newsletter-Anmeldung
- **Funktionen**:
  - Double-Opt-In Verfahren
  - Bestätigungs-E-Mails mit Willkommensbonus
  - Telegram-Benachrichtigungen über neue Abonnenten
  - Automatische Segmentierung
- **Webhook URL**: `/webhook/newsletter-signup`

#### 09 - Bewertungsanfrage nach Zustellung
- **Trigger**: Von Order Status Update Workflow
- **Funktionen**:
  - 7-Tage Wartezeit nach Zustellung
  - Personalisierte Review-Anfrage E-Mails
  - 14-Tage Follow-up falls keine Bewertung
  - Anreize durch Rabatt-Gutscheine
- **Delay**: 7 Tage + 14 Tage Follow-up

### 📈 Analytics Workflows

#### 08 - Täglicher Sales Report
- **Trigger**: Täglich um 20:00 Uhr
- **Funktionen**:
  - Umfassende Verkaufsanalyse
  - Performance-Vergleiche (Tag/Woche/Monat)
  - Top-Produkte Analyse
  - Automatische Sales-Alerts bei niedrigen Verkäufen
- **Schedule**: `0 20 * * *`

### 🔧 Administrative Workflows

#### 10 - System Health Monitoring
- **Trigger**: Alle 15 Minuten
- **Funktionen**:
  - Überwachung aller kritischen Services
  - Performance-Metriken (Response Time, Uptime)
  - Sofortige Alerts bei Ausfällen
  - Tägliche Health Summary Reports
- **Schedule**: `*/15 * * * *`

## 🔧 Konfiguration

### Environment Variables

#### Erforderliche Variablen

```bash
# DressForPleasure Backend Integration
DRESSFORP_API_URL=http://localhost:3000/api
DRESSFORP_FRONTEND_URL=https://your-domain.com
DRESSFORP_API_TOKEN=your_backend_api_token

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# E-Mail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@dressforp.com
ADMIN_EMAIL=admin@dressforp.com

# Database Configuration
DRESSFORP_DB_HOST=localhost
DRESSFORP_DB_PORT=5432
DRESSFORP_DB_USER=dressforp_user
DRESSFORP_DB_PASSWORD=your_db_password
DRESSFORP_DB_NAME=dressforp_db
```

#### Optionale Variablen

```bash
# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Business Logic
LOW_STOCK_THRESHOLD=5
CRITICAL_STOCK_THRESHOLD=2
ORDER_TIMEOUT_HOURS=24

# Feature Flags
FEATURE_ANALYTICS_ENABLED=true
FEATURE_AUTO_BACKUPS=true
```

### Credentials Setup

#### 1. Telegram Bot

```bash
# 1. @BotFather auf Telegram kontaktieren
# 2. /newbot senden und Bot erstellen
# 3. Bot-Token kopieren
# 4. Chat-ID ermitteln:
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates"
```

#### 2. E-Mail (Gmail)

```bash
# 1. 2FA in Google Account aktivieren
# 2. App-Passwort für "Mail" erstellen
# 3. App-Passwort in SMTP_PASSWORD eintragen
```

#### 3. Stripe

```bash
# 1. Stripe Dashboard öffnen
# 2. API Keys kopieren (sk_test_ oder sk_live_)
# 3. Webhook-Endpoint erstellen:
#    URL: https://your-n8n-domain/webhook/stripe-webhook
#    Events: payment_intent.succeeded, payment_intent.payment_failed
```

### Workflow Import

#### Automatischer Import

```bash
# Alle Workflows auf einmal importieren
cd n8n-automation
node scripts/import-workflows.js
```

#### Manueller Import

1. n8n Interface öffnen: http://localhost:5678
2. Menu → Settings → Import
3. JSON-Dateien aus `workflows/` Ordner auswählen
4. Workflows importieren und aktivieren

## 📚 Dokumentation

### Workflow-Dokumentation

Jeder Workflow ist vollständig dokumentiert:

- **Zweck und Ziele**
- **Trigger-Bedingungen**
- **Verarbeitungsschritte**
- **Output und Benachrichtigungen**
- **Error-Handling**
- **Testing-Anleitung**

### API-Integration

#### Backend-Endpunkte

Die Workflows nutzen folgende Backend-Endpunkte:

```bash
# Health Checks
GET /api/health
GET /api/health/database
GET /api/health/email

# Orders
GET /api/orders/{id}
POST /api/orders/{id}/confirm
POST /api/orders/{id}/failed

# Products
GET /api/products/{id}
POST /api/products/{id}/approve
POST /api/products/{id}/reject

# Analytics
GET /api/analytics/sales/daily
GET /api/analytics/products/top-selling
GET /api/analytics/customers/new

# Automation Logs
POST /api/logs/automation
```

#### Webhook-Endpunkte

```bash
# n8n empfängt Webhooks auf:
POST /webhook/new-order
POST /webhook/stripe-webhook
POST /webhook/order-status-update
POST /webhook/product-approval
POST /webhook/contact-form
POST /webhook/newsletter-signup
POST /webhook/newsletter-confirm
POST /webhook/review-request
```

### E-Mail Templates

Alle E-Mail-Templates sind professionell gestaltet:

- **Responsive Design** für alle Geräte
- **Marken-konformes Styling**
- **Personalisierung** mit Kundendaten
- **Call-to-Action Buttons**
- **DSGVO-konforme Footer**

### Telegram-Integration

#### Standard-Benachrichtigungen

- 🛍️ Neue Bestellungen
- 💳 Zahlungsbestätigungen
- 📦 Lagerbestand-Alerts
- 🚨 System-Health Alerts
- 📊 Tägliche Reports

#### Administrative Kommandos

```bash
/status    # Systemstatus abrufen
/sales     # Verkaufsübersicht
/orders    # Heutige Bestellungen
/inventory # Lagerbestand-Status
/health    # Detaillierter Health Check
/help      # Verfügbare Kommandos
```

## 🔍 Troubleshooting

### Häufige Probleme

#### 1. Workflows werden nicht ausgelöst

**Symptome**:
- Webhooks funktionieren nicht
- Geplante Workflows starten nicht

**Lösungen**:
```bash
# n8n Logs prüfen
docker-compose logs -f n8n

# Webhook URLs testen
curl -X POST http://localhost:5678/webhook/test

# Workflow manuell ausführen
# Über n8n UI: Workflow öffnen → Test Workflow
```

#### 2. Telegram-Benachrichtigungen fehlgeschlagen

**Symptome**:
- Keine Telegram-Nachrichten
- Fehler in Workflow-Logs

**Lösungen**:
```bash
# Bot-Token testen
curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"

# Chat-ID validieren
curl "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates"

# Telegram-Credentials in n8n prüfen
```

#### 3. E-Mail-Versand schlägt fehl

**Symptome**:
- E-Mails kommen nicht an
- SMTP-Fehler in Logs

**Lösungen**:
```bash
# SMTP-Verbindung testen
telnet smtp.gmail.com 587

# App-Passwort für Gmail erstellen
# 2FA aktivieren → App-Passwort generieren

# SMTP-Credentials in n8n aktualisieren
```

#### 4. Database-Verbindung fehlgeschlagen

**Symptome**:
- n8n startet nicht
- Database-Fehler in Logs

**Lösungen**:
```bash
# PostgreSQL-Status prüfen
docker-compose exec n8n-postgres pg_isready

# Database-Credentials validieren
psql -h localhost -p 5433 -U n8n_user -d n8n

# n8n Database neu initialisieren
docker-compose down
docker volume rm n8n-automation_n8n_postgres_data
docker-compose up -d
```

### Debug-Modus aktivieren

```bash
# n8n mit Debug-Logs starten
docker-compose exec n8n n8n start --log-level debug

# Workflow-spezifische Logs
# Über n8n UI: Execution → Details → Logs
```

### Performance-Optimierung

```bash
# Memory-Usage prüfen
docker stats

# n8n Worker für bessere Performance
# Bereits in docker-compose.yml konfiguriert

# Database-Performance optimieren
# Siehe database/init.sql für Indizes
```

## 📈 Monitoring

### Health Dashboard

**URL**: http://localhost:3001 (Grafana)
- **Login**: admin / DressForPleasure2024!

#### Metriken

- **System Health**: API Response Times, Uptime
- **Workflow Performance**: Execution Times, Success Rates
- **Business Metrics**: Orders, Revenue, Customer Growth
- **Error Tracking**: Failed Workflows, System Errors

### Prometheus Metriken

**URL**: http://localhost:9090

```bash
# Beispiel-Queries
n8n_workflow_executions_total
n8n_workflow_execution_duration_seconds
http_requests_total{job="dressforp-api"}
postgres_up{instance="n8n-postgres:5432"}
```

### Automatische Alerts

#### Telegram-Alerts

- 🚨 **Kritische System-Fehler** (sofort)
- ⚠️ **Performance-Probleme** (nach 5min)
- 📊 **Tägliche Reports** (20:00 Uhr)
- 📦 **Lagerbestand-Alerts** (9:00 Uhr)

#### E-Mail-Alerts

- 🚨 **Kritische System-Ausfälle**
- 📈 **Wöchentliche Business Reports**
- 📊 **Monatliche Analytics**

### Log-Management

```bash
# n8n Logs
docker-compose logs n8n | tail -f

# PostgreSQL Logs
docker-compose logs n8n-postgres | tail -f

# Alle Services
docker-compose logs -f

# Log-Rotation ist automatisch konfiguriert
```

## 🔄 Wartung & Updates

### Regelmäßige Wartung

#### Wöchentlich

```bash
# System-Status prüfen
docker-compose ps

# Logs auf Fehler prüfen
docker-compose logs --since 7d | grep -i error

# Backup erstellen
./scripts/backup.sh

# Performance-Metriken prüfen
# Über Grafana Dashboard
```

#### Monatlich

```bash
# Updates installieren
docker-compose pull
docker-compose up -d

# Credentials rotieren
# Neue API-Tokens generieren
# Passwörter aktualisieren

# Workflow-Performance analysieren
# Optimierungsmöglichkeiten identifizieren
```

### Backup & Recovery

#### Automatische Backups

```yaml
# Bereits in docker-compose.yml konfiguriert
# Läuft täglich um 2:00 Uhr
volumes:
  - ./backup:/home/node/.n8n/backup
```

#### Manuelles Backup

```bash
# n8n Workflows exportieren
docker-compose exec n8n n8n export:workflow --all --output=/tmp/workflows.json

# PostgreSQL Backup
docker-compose exec n8n-postgres pg_dump -U n8n_user n8n > backup/n8n_$(date +%Y%m%d).sql

# Vollständiges System-Backup
tar -czf backup/full_backup_$(date +%Y%m%d).tar.gz \
  docker-compose.yml .env workflows/ credentials/ logs/
```

#### Recovery

```bash
# Workflows wiederherstellen
docker-compose exec n8n n8n import:workflow --input=/tmp/workflows.json

# Database wiederherstellen
docker-compose exec -T n8n-postgres psql -U n8n_user n8n < backup/n8n_20241201.sql

# Vollständige Wiederherstellung
tar -xzf backup/full_backup_20241201.tar.gz
docker-compose up -d
```

## 🚀 Deployment

### Produktions-Deployment

#### 1. Server-Vorbereitung

```bash
# Ubuntu Server 22.04 LTS empfohlen
# Minimum: 2 vCPU, 4GB RAM, 20GB SSD

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. SSL/TLS Setup

```bash
# Certbot für Let's Encrypt
sudo apt update
sudo apt install certbot

# SSL-Zertifikat erstellen
sudo certbot certonly --standalone -d your-n8n-domain.com

# Nginx Reverse Proxy konfigurieren
# Siehe deployment/nginx.conf
```

#### 3. Produktions-Konfiguration

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    environment:
      - N8N_HOST=your-n8n-domain.com
      - N8N_PROTOCOL=https
      - N8N_PORT=443
      - WEBHOOK_URL=https://your-n8n-domain.com/
    volumes:
      - /etc/ssl/certs:/etc/ssl/certs:ro
```

#### 4. Monitoring Setup

```bash
# Externe Monitoring (optional)
# UptimeRobot: https://uptimerobot.com
# StatusCake: https://www.statuscake.com

# Log-Aggregation
# ELK Stack oder ähnlich für Production
```

### Railway Deployment

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Projekt deployen
railway login
railway init
railway up

# Environment Variables setzen
railway variables set N8N_HOST=your-app.railway.app
railway variables set WEBHOOK_URL=https://your-app.railway.app/
```

### Vercel Deployment (für n8n API)

```javascript
// api/webhook/[...webhook].js
export default async function handler(req, res) {
  // n8n Webhook Proxy
  const response = await fetch(`${process.env.N8N_URL}/webhook/${req.query.webhook.join('/')}`, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  
  return res.status(response.status).json(await response.json());
}
```

## 🤝 Support & Community

### Support-Kanäle

- **GitHub Issues**: Für Bugs und Feature-Requests
- **Discord Community**: Für Diskussionen und Hilfe
- **E-Mail Support**: support@dressforp.com

### Beitragen

```bash
# Fork das Repository
git clone https://github.com/your-username/dressforp-n8n-automation

# Feature Branch erstellen
git checkout -b feature/new-workflow

# Änderungen committen
git commit -m "Add: New workflow for XYZ"

# Pull Request erstellen
```

### Lizenz

MIT License - siehe LICENSE.md für Details.

---

## 📞 Kontakt

**DressForPleasure Development Team**
- E-Mail: dev@dressforp.com
- Website: https://dressforp.com
- GitHub: https://github.com/dressforp

**Erstellt mit ❤️ für die Fashion E-Commerce Community**

---

*Letzte Aktualisierung: 04. Juni 2025*