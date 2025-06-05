#!/bin/bash

# ==============================================
# DressForPleasure Backend - Vollständiges Setup
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
echo "🛍️  DressForPleasure Backend - Vollständiges Setup"
echo "================================================"
echo ""

# ========================
# 1. UMGEBUNG PRÜFEN
# ========================

log_step "Schritt 1: Umgebung wird geprüft..."

# Node.js Version prüfen
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log_success "Node.js gefunden: $NODE_VERSION"
    
    # Mindestversion prüfen (Node 18+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        log_error "Node.js Version 18+ ist erforderlich (gefunden: $NODE_VERSION)"
        exit 1
    fi
else
    log_error "Node.js ist nicht installiert"
    exit 1
fi

# npm prüfen
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    log_success "npm gefunden: $NPM_VERSION"
else
    log_error "npm ist nicht installiert"
    exit 1
fi

# PostgreSQL prüfen (optional)
if command -v psql >/dev/null 2>&1; then
    PSQL_VERSION=$(psql --version)
    log_success "PostgreSQL gefunden: $PSQL_VERSION"
else
    log_warning "PostgreSQL nicht lokal installiert (Docker oder Cloud-DB wird verwendet)"
fi

# ========================
# 2. DEPENDENCIES INSTALLIEREN
# ========================

log_step "Schritt 2: Dependencies werden installiert..."

# Package.json prüfen
if [ ! -f "package.json" ]; then
    log_error "package.json nicht gefunden. Bitte im Backend-Verzeichnis ausführen."
    exit 1
fi

# Clean install
log_info "Führe npm clean install durch..."
npm ci

log_success "Dependencies installiert"

# ========================
# 3. UMGEBUNGSVARIABLEN KONFIGURIEREN
# ========================

log_step "Schritt 3: Umgebungsvariablen werden konfiguriert..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log_info "Erstelle .env aus .env.example..."
        cp .env.example .env
        log_warning "Bitte .env-Datei mit Ihren Konfigurationsdaten bearbeiten:"
        echo "  - Datenbank-Zugangsdaten"
        echo "  - JWT-Secrets"
        echo "  - Stripe-Keys (falls benötigt)"
        echo "  - E-Mail-Konfiguration"
        echo ""
        
        # Interaktive Konfiguration anbieten
        read -p "Möchten Sie die .env-Datei jetzt bearbeiten? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        log_error ".env.example nicht gefunden"
        exit 1
    fi
else
    log_success ".env-Datei bereits vorhanden"
fi

# ========================
# 4. TYPESCRIPT KOMPILIEREN
# ========================

log_step "Schritt 4: TypeScript wird kompiliert..."

log_info "TypeScript Build wird durchgeführt..."
npm run build

log_success "TypeScript erfolgreich kompiliert"

# ========================
# 5. DATENBANK SETUP
# ========================

log_step "Schritt 5: Datenbank wird eingerichtet..."

# .env laden für Datenbankverbindung
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Datenbankverbindung testen
log_info "Datenbankverbindung wird getestet..."

# Database Health Check (über Node.js)
node -e "
require('dotenv').config();
const { testConnection } = require('./dist/db/connection');

testConnection().then(success => {
  if (success) {
    console.log('✅ Datenbankverbindung erfolgreich');
    process.exit(0);
  } else {
    console.log('❌ Datenbankverbindung fehlgeschlagen');
    process.exit(1);
  }
}).catch(error => {
  console.log('❌ Datenbankfehler:', error.message);
  process.exit(1);
});
" || {
    log_error "Datenbankverbindung fehlgeschlagen"
    log_info "Bitte prüfen Sie Ihre Datenbank-Konfiguration in der .env-Datei"
    exit 1
}

# Migrationen ausführen
log_info "Datenbank-Migrationen werden ausgeführt..."
npm run migration:up || {
    log_error "Datenbank-Migrationen fehlgeschlagen"
    exit 1
}

log_success "Datenbank-Migrationen erfolgreich"

# Optionales Seeding
read -p "Möchten Sie die Datenbank mit Beispieldaten befüllen? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Datenbank wird mit Beispieldaten befüllt..."
    npm run seed || {
        log_warning "Seeding fehlgeschlagen - möglicherweise bereits vorhanden"
    }
fi

# ========================
# 6. VERZEICHNISSE ERSTELLEN
# ========================

log_step "Schritt 6: Upload-Verzeichnisse werden erstellt..."

# Upload-Verzeichnisse erstellen
UPLOAD_DIRS=("uploads/products" "uploads/collections" "uploads/avatars" "uploads/documents" "uploads/temp" "logs")

for dir in "${UPLOAD_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_info "Verzeichnis erstellt: $dir"
    fi
done

log_success "Verzeichnisse erstellt"

# ========================
# 7. SERVICES TESTEN
# ========================

log_step "Schritt 7: Services werden getestet..."

# Server im Hintergrund starten
log_info "Server wird für Tests gestartet..."
npm start &
SERVER_PID=$!

# Warten bis Server bereit ist
sleep 5

# Integration Tests ausführen
if [ -f "test-integration.js" ]; then
    log_info "Integration Tests werden ausgeführt..."
    
    # Node-fetch für Node.js < 18 installieren (falls benötigt)
    if ! node -e "require('fetch')" 2>/dev/null; then
        npm install --no-save node-fetch
    fi
    
    node test-integration.js || {
        log_warning "Einige Integration Tests sind fehlgeschlagen"
    }
else
    log_warning "Integration Tests nicht gefunden"
fi

# Server stoppen
kill $SERVER_PID 2>/dev/null || true
sleep 2

log_success "Service-Tests abgeschlossen"

# ========================
# 8. FRONTEND-INTEGRATION VORBEREITEN
# ========================

log_step "Schritt 8: Frontend-Integration wird vorbereitet..."

# API-Dokumentation generieren
log_info "API-Dokumentation wird erstellt..."

# Frontend-kompatible API-Endpunkte dokumentieren
cat > api-endpoints.md << 'EOF'
# DressForPleasure API - Frontend Integration

## Öffentliche Endpunkte (für Frontend)

### Produkte
- `GET /api/products` - Alle Produkte mit Filterung
- `GET /api/products/:id` - Einzelprodukt
- `GET /api/products/slug/:slug` - Produkt nach Slug

### Kategorien
- `GET /api/categories` - Alle Kategorien (hierarchisch)

### Kollektionen
- `GET /api/collections` - Alle Kollektionen
- `GET /api/collections/featured` - Featured Kollektionen

### Bestellungen
- `POST /api/orders` - Neue Bestellung erstellen (Checkout)

### System
- `GET /health` - Health Check
- `GET /api/docs` - API-Dokumentation

## Frontend Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=10000
```

## Integration Beispiel

```javascript
// Produkte laden
const products = await fetch('/api/products?status=active')
  .then(res => res.json())
  .then(data => data.data.products);

// Bestellung erstellen
const order = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
}).then(res => res.json());
```
EOF

log_success "API-Dokumentation erstellt: api-endpoints.md"

# Beispiel-Requests erstellen
log_info "Beispiel-Requests werden erstellt..."

cat > example-requests.json << 'EOF'
{
  "products": {
    "url": "/api/products?status=active&limit=10",
    "method": "GET"
  },
  "single_product": {
    "url": "/api/products/1",
    "method": "GET"
  },
  "categories": {
    "url": "/api/categories",
    "method": "GET"
  },
  "collections": {
    "url": "/api/collections",
    "method": "GET"
  },
  "create_order": {
    "url": "/api/orders",
    "method": "POST",
    "body": {
      "customerEmail": "customer@example.com",
      "items": [
        {
          "productId": 1,
          "variantId": 1,
          "quantity": 1
        }
      ],
      "billingAddress": {
        "firstName": "Max",
        "lastName": "Mustermann",
        "streetAddress": "Musterstraße 1",
        "city": "Berlin",
        "postalCode": "10115",
        "country": "DE"
      },
      "shippingAddress": {
        "firstName": "Max",
        "lastName": "Mustermann",
        "streetAddress": "Musterstraße 1",
        "city": "Berlin",
        "postalCode": "10115",
        "country": "DE"
      }
    }
  }
}
EOF

log_success "Beispiel-Requests erstellt: example-requests.json"

# ========================
# 9. DEPLOYMENT VORBEREITEN
# ========================

log_step "Schritt 9: Deployment wird vorbereitet..."

# Deployment-spezifische Dateien prüfen
DEPLOYMENT_FILES=("Dockerfile" "docker-compose.yml" "deploy.sh")

for file in "${DEPLOYMENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file gefunden"
    else
        log_warning "$file nicht gefunden"
    fi
done

# Deploy-Script ausführbar machen
if [ -f "deploy.sh" ]; then
    chmod +x deploy.sh 2>/dev/null || true
fi

log_info "Deployment-Optionen:"
echo "  - Lokal: docker-compose up -d"
echo "  - Railway: ./deploy.sh production --platform railway"
echo "  - Heroku: ./deploy.sh production --platform heroku"
echo "  - Vercel: ./deploy.sh production --platform vercel"

# ========================
# 10. FINALE ÜBERPRÜFUNG
# ========================

log_step "Schritt 10: Finale Überprüfung..."

# Konfiguration prüfen
REQUIRED_ENV_VARS=("DATABASE_URL" "JWT_SECRET" "CORS_ORIGIN")
MISSING_VARS=()

for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_warning "Fehlende Umgebungsvariablen:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    log_info "Bitte .env-Datei vervollständigen"
fi

# ========================
# SETUP ABGESCHLOSSEN
# ========================

echo ""
echo "================================================"
echo "🎉 DressForPleasure Backend Setup abgeschlossen!"
echo "================================================"
echo ""

log_success "Backend ist bereit für die Verwendung"
echo ""
echo "📝 Nächste Schritte:"
echo "  1. .env-Datei vervollständigen (falls noch nicht geschehen)"
echo "  2. Server starten: npm run dev (Development) oder npm start (Production)"
echo "  3. API testen: http://localhost:3000/health"
echo "  4. Frontend mit Backend verbinden"
echo "  5. Bei Bedarf deployen: ./deploy.sh local"
echo ""
echo "📚 Wichtige URLs:"
echo "  - API-Basis: http://localhost:3000/api"
echo "  - Health Check: http://localhost:3000/health"
echo "  - Dokumentation: http://localhost:3000/api/docs"
echo "  - Admin-Login: POST /api/auth/login"
echo ""
echo "🔧 Support:"
echo "  - README.md für detaillierte Dokumentation"
echo "  - BACKEND_OVERVIEW.md für technische Details"
echo "  - api-endpoints.md für Frontend-Integration"
echo ""

# Optional: Server starten
read -p "Möchten Sie den Development-Server jetzt starten? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Development-Server wird gestartet..."
    npm run dev
fi

log_success "Setup abgeschlossen!"
