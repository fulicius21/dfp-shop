#!/bin/bash

# =================================================================
# Environment Setup Script für DressForPleasure Backend
# =================================================================
# 
# Dieses Script automatisiert die Erstellung von Environment-
# Konfigurationsdateien für verschiedene Deployment-Umgebungen
# 
# Usage: ./scripts/setup-env.sh [environment]
# Environments: development, staging, production
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
log_info "⚙️  DressForPleasure Backend - Environment Setup"
log_info "================================================"

# Environment Parameter
ENVIRONMENT=${1:-development}
ENV_FILE=".env.${ENVIRONMENT}"

log_info "🎯 Setup für Umgebung: $ENVIRONMENT"
log_info "📄 Datei: $ENV_FILE"

# Hilfsfunktionen
generate_secret() {
    local length=${1:-32}
    openssl rand -hex $length 2>/dev/null || head -c $length < /dev/urandom | xxd -p -c $length
}

prompt_user() {
    local prompt="$1"
    local default="$2"
    local secure="$3"
    
    if [ "$secure" = "true" ]; then
        read -s -p "$prompt: " value
        echo
    else
        if [ -n "$default" ]; then
            read -p "$prompt [$default]: " value
            value=${value:-$default}
        else
            read -p "$prompt: " value
        fi
    fi
    
    echo "$value"
}

# Interactive Setup
log_step "🔧 Interaktive Konfiguration"
log_info "Beantworte die folgenden Fragen oder drücke Enter für Standardwerte"
log_info ""

# Basis-Konfiguration
log_info "📊 BASIS-KONFIGURATION"
log_info "======================"

# Port
if [ "$ENVIRONMENT" = "development" ]; then
    PORT=$(prompt_user "Server Port" "3001")
else
    PORT="\${PORT:-3000}"
fi

# Database Konfiguration
log_info ""
log_info "🗄️  DATABASE-KONFIGURATION"
log_info "=========================="

if [ "$ENVIRONMENT" = "development" ]; then
    DB_HOST=$(prompt_user "Database Host" "localhost")
    DB_PORT=$(prompt_user "Database Port" "5432")
    DB_NAME=$(prompt_user "Database Name" "dressforp_dev")
    DB_USER=$(prompt_user "Database User" "dressforp")
    DB_PASSWORD=$(prompt_user "Database Password" "" "true")
    
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(generate_secret 16)
        log_info "📝 Generiert: DB_PASSWORD=$DB_PASSWORD"
    fi
    
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
    DATABASE_URL="\${DATABASE_URL}"
    log_info "📝 DATABASE_URL wird von Cloud-Provider gesetzt"
fi

# Security Secrets
log_info ""
log_info "🔐 SECURITY-KONFIGURATION"
log_info "========================="

SESSION_SECRET=$(generate_secret 32)
JWT_SECRET=$(generate_secret 64)

log_info "📝 Generiert: SESSION_SECRET (32 bytes)"
log_info "📝 Generiert: JWT_SECRET (64 bytes)"

# CORS Konfiguration
log_info ""
log_info "🌐 CORS-KONFIGURATION"
log_info "===================="

if [ "$ENVIRONMENT" = "development" ]; then
    CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
elif [ "$ENVIRONMENT" = "staging" ]; then
    CORS_ORIGIN="https://*.vercel.app,https://staging.dressforp.com"
else
    CORS_ORIGIN="https://dressforp.vercel.app,https://dressforp.com,https://www.dressforp.com"
fi

log_info "📝 CORS_ORIGIN: $CORS_ORIGIN"

# Optionale Services
log_info ""
log_info "🔌 OPTIONALE SERVICES"
log_info "===================="

# Email Service
read -p "📧 Email Service konfigurieren? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    EMAIL_PROVIDER=$(prompt_user "Email Provider (sendgrid/smtp)" "sendgrid")
    EMAIL_FROM=$(prompt_user "Absender-Email" "noreply@dressforp.com")
    
    if [ "$EMAIL_PROVIDER" = "sendgrid" ]; then
        SENDGRID_API_KEY=$(prompt_user "SendGrid API Key" "SG.XXXXXXXX")
    else
        SMTP_HOST=$(prompt_user "SMTP Host" "smtp.gmail.com")
        SMTP_PORT=$(prompt_user "SMTP Port" "587")
        SMTP_USER=$(prompt_user "SMTP User" "")
        SMTP_PASSWORD=$(prompt_user "SMTP Password" "" "true")
    fi
    
    SETUP_EMAIL=true
else
    SETUP_EMAIL=false
fi

# Stripe Payment
read -p "💳 Stripe Payment konfigurieren? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ "$ENVIRONMENT" = "production" ]; then
        STRIPE_SECRET_KEY=$(prompt_user "Stripe Secret Key (Live)" "sk_live_XXXXXXXX")
        STRIPE_PUBLISHABLE_KEY=$(prompt_user "Stripe Publishable Key (Live)" "pk_live_XXXXXXXX")
    else
        STRIPE_SECRET_KEY=$(prompt_user "Stripe Secret Key (Test)" "sk_test_XXXXXXXX")
        STRIPE_PUBLISHABLE_KEY=$(prompt_user "Stripe Publishable Key (Test)" "pk_test_XXXXXXXX")
    fi
    STRIPE_WEBHOOK_SECRET=$(prompt_user "Stripe Webhook Secret" "whsec_XXXXXXXX")
    SETUP_STRIPE=true
else
    SETUP_STRIPE=false
fi

# Cloudinary Media
read -p "📁 Cloudinary Media Service konfigurieren? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    CLOUDINARY_CLOUD_NAME=$(prompt_user "Cloudinary Cloud Name" "your-cloud-name")
    CLOUDINARY_API_KEY=$(prompt_user "Cloudinary API Key" "123456789012345")
    CLOUDINARY_API_SECRET=$(prompt_user "Cloudinary API Secret" "" "true")
    SETUP_CLOUDINARY=true
else
    SETUP_CLOUDINARY=false
fi

# Environment File erstellen
log_info ""
log_step "📝 Erstelle Environment File: $ENV_FILE"

cat > $ENV_FILE << EOF
# =================================================================
# ENVIRONMENT CONFIGURATION - ${ENVIRONMENT^^}
# DressForPleasure Backend API
# Generiert am: $(date)
# =================================================================

# =================================================================
# BASIS-KONFIGURATION
# =================================================================

NODE_ENV=$ENVIRONMENT
PORT=$PORT

# =================================================================
# DATABASE CONFIGURATION
# =================================================================

DATABASE_URL="$DATABASE_URL"
EOF

if [ "$ENVIRONMENT" = "development" ]; then
cat >> $ENV_FILE << EOF

# Alternative Database-Parameter
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF
fi

cat >> $ENV_FILE << EOF

# Database Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=20000

# =================================================================
# SECURITY & AUTHENTICATION
# =================================================================

SESSION_SECRET="$SESSION_SECRET"
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# =================================================================
# CORS & FRONTEND INTEGRATION
# =================================================================

CORS_ORIGIN="$CORS_ORIGIN"
CORS_CREDENTIALS=true

# =================================================================
# APPLICATION SETTINGS
# =================================================================

TRUST_PROXY=true
MAX_REQUEST_SIZE="10mb"

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL="debug"
LOG_FORMAT="dev"

# GDPR & Compliance
GDPR_ENABLED=true
HEALTH_CHECK_ENABLED=true

EOF

# Optionale Services hinzufügen
if [ "$SETUP_EMAIL" = true ]; then
cat >> $ENV_FILE << EOF
# =================================================================
# EMAIL SERVICE CONFIGURATION
# =================================================================

EMAIL_PROVIDER="$EMAIL_PROVIDER"
EMAIL_FROM="$EMAIL_FROM"
EMAIL_FROM_NAME="DressForPleasure"

EOF

if [ "$EMAIL_PROVIDER" = "sendgrid" ]; then
cat >> $ENV_FILE << EOF
# SendGrid Configuration
SENDGRID_API_KEY="$SENDGRID_API_KEY"

EOF
else
cat >> $ENV_FILE << EOF
# SMTP Configuration
SMTP_HOST="$SMTP_HOST"
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=false
SMTP_USER="$SMTP_USER"
SMTP_PASSWORD="$SMTP_PASSWORD"

EOF
fi
fi

if [ "$SETUP_STRIPE" = true ]; then
cat >> $ENV_FILE << EOF
# =================================================================
# PAYMENT PROCESSING (STRIPE)
# =================================================================

STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"

# Payment Settings
DEFAULT_CURRENCY="EUR"
PAYMENT_METHODS="card,sepa_debit,giropay"

EOF
fi

if [ "$SETUP_CLOUDINARY" = true ]; then
cat >> $ENV_FILE << EOF
# =================================================================
# MEDIA & FILE STORAGE
# =================================================================

CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"

# Upload Limits
MAX_FILE_SIZE="10mb"
ALLOWED_FILE_TYPES="jpg,jpeg,png,webp,gif"
MAX_FILES_PER_UPLOAD=10

EOF
fi

cat >> $ENV_FILE << EOF
# =================================================================
# FEATURE FLAGS
# =================================================================

FEATURE_USER_REGISTRATION=true
FEATURE_GUEST_CHECKOUT=true
FEATURE_WISHLIST=true
FEATURE_REVIEWS=true
FEATURE_NEWSLETTER=true
FEATURE_ANALYTICS=true

# =================================================================
# DEVELOPMENT/STAGING ONLY
# =================================================================
EOF

if [ "$ENVIRONMENT" != "production" ]; then
cat >> $ENV_FILE << EOF

# Debug Settings
DEBUG_SQL=false
DEBUG_ROUTES=false
DEBUG_MIDDLEWARE=false

# Development Tools
MOCK_STRIPE=false
MOCK_EMAIL=true
MOCK_SMS=true

EOF
fi

log_success "✅ Environment File erstellt: $ENV_FILE"

# .gitignore aktualisieren
if [ ! -f ".gitignore" ]; then
    touch .gitignore
fi

if ! grep -q "^\.env\." .gitignore; then
    echo "" >> .gitignore
    echo "# Environment Files" >> .gitignore
    echo ".env.*" >> .gitignore
    echo "!.env.example" >> .gitignore
    echo "!.env.production.example" >> .gitignore
    log_info "📝 .gitignore aktualisiert"
fi

# Setup-Anweisungen
log_info ""
log_step "📋 NÄCHSTE SCHRITTE"
log_info "=================="
log_info ""

log_info "1. 📄 Prüfe die generierte Konfiguration:"
log_info "   cat $ENV_FILE"
log_info ""

log_info "2. 🔧 Starte die Entwicklungsumgebung:"
if [ "$ENVIRONMENT" = "development" ]; then
    log_info "   npm run dev"
    log_info "   # oder"
    log_info "   docker-compose up -d"
else
    log_info "   npm run build && npm start"
fi
log_info ""

log_info "3. 🗄️  Setup Database (nur Development):"
if [ "$ENVIRONMENT" = "development" ]; then
    log_info "   npm run migration:up"
    log_info "   npm run seed:complete"
fi
log_info ""

log_info "4. 🧪 Teste die API:"
log_info "   curl http://localhost:$PORT/health"
log_info ""

if [ "$SETUP_EMAIL" = false ] || [ "$SETUP_STRIPE" = false ] || [ "$SETUP_CLOUDINARY" = false ]; then
    log_warning "⚠️  FEHLENDE KONFIGURATION:"
    if [ "$SETUP_EMAIL" = false ]; then
        log_warning "   📧 Email Service nicht konfiguriert"
    fi
    if [ "$SETUP_STRIPE" = false ]; then
        log_warning "   💳 Stripe Payment nicht konfiguriert"
    fi
    if [ "$SETUP_CLOUDINARY" = false ]; then
        log_warning "   📁 Cloudinary Media nicht konfiguriert"
    fi
    log_warning "   Diese können später in $ENV_FILE hinzugefügt werden"
    log_info ""
fi

# Environment-spezifische Hinweise
if [ "$ENVIRONMENT" = "production" ]; then
    log_warning "🔐 PRODUCTION SECURITY CHECKLIST:"
    log_warning "   ✓ Alle Secrets sind stark und einzigartig"
    log_warning "   ✓ Database SSL ist aktiviert"
    log_warning "   ✓ CORS ist auf Produktions-Domains beschränkt"
    log_warning "   ✓ Debug-Modi sind deaktiviert"
    log_warning "   ✓ Monitoring ist konfiguriert"
fi

log_info ""
log_success "🎉 Environment Setup abgeschlossen!"
log_success "Umgebung '$ENVIRONMENT' ist bereit für die Nutzung."
