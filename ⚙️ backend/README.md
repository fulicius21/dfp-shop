# DressForPleasure Backend API

Ein vollständiges Backend-System für die DressForPleasure Fashion E-Commerce Website mit Node.js, Express, TypeScript und PostgreSQL.

## 🚀 Features

- **REST API** mit TypeScript und Express.js
- **PostgreSQL Datenbank** mit Drizzle ORM
- **JWT Authentifizierung** für Admin-Funktionen
- **Rollen-basierte Autorisierung** (Admin, Manager, Editor)
- **DSGVO-konforme** Datenverarbeitung
- **Rate Limiting** und Sicherheitsmaßnahmen
- **Automatische API-Dokumentation**
- **Health Checks** für Monitoring
- **Webhook-Unterstützung** für Stripe und Automatisierung
- **Produktmanagement** mit Kategorien und Kollektionen
- **Inventar-Tracking** und Low-Stock-Alerts
- **Medien-Upload** mit Cloudinary-Integration
- **Audit-Logs** für DSGVO-Compliance

## 📋 Voraussetzungen

- Node.js (≥ 18.0.0)
- PostgreSQL (≥ 13)
- npm oder yarn

## 🛠️ Installation

### 1. Repository klonen und Dependencies installieren

```bash
cd backend
npm install
```

### 2. Environment Variables konfigurieren

```bash
cp .env.example .env
```

Bearbeiten Sie die `.env`-Datei mit Ihren Konfigurationsdaten:

```env
# Datenbank
DATABASE_URL=postgresql://username:password@localhost:5432/dressforp_db

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Admin-Benutzer
ADMIN_EMAIL=admin@dressforp.com
ADMIN_PASSWORD=your_secure_admin_password

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# CORS
CORS_ORIGIN=http://localhost:5173,https://kxlm6uopg4.space.minimax.io
```

### 3. Datenbank einrichten

```bash
# Migrationen ausführen
npm run migration:up

# Seed-Daten einfügen
npm run seed
```

### 4. Server starten

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🗄️ Datenbankschema

Das System verwendet folgende Haupttabellen:

- **Products** - Produktinformationen
- **ProductVariants** - Produktvarianten (Größe/Farbe)
- **Categories** - Produktkategorien (hierarchisch)
- **Collections** - Produktkollektionen
- **Orders** - Bestellungen
- **Customers** - Kundeninformationen (DSGVO-konform)
- **Users** - Admin-Benutzer
- **Media** - Produktbilder und -videos
- **Inventory** - Lagerbestand-Tracking
- **AuditLogs** - DSGVO-Audit-Trail

## 🔐 Authentifizierung

### Admin-Login

Standard-Admin-Benutzer nach dem Seeding:
- **E-Mail**: admin@dressforp.com
- **Passwort**: Ihr konfiguriertes ADMIN_PASSWORD

### JWT-Token verwenden

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dressforp.com","password":"your_password"}'

# API-Request mit Token
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 API-Endpunkte

### Authentifizierung
- `POST /api/auth/login` - Benutzer anmelden
- `POST /api/auth/refresh` - Token erneuern
- `GET /api/auth/profile` - Benutzerprofil abrufen

### Produkte
- `GET /api/products` - Alle Produkte (mit Filterung)
- `GET /api/products/:id` - Einzelnes Produkt
- `GET /api/products/slug/:slug` - Produkt nach Slug
- `POST /api/products` - Neues Produkt erstellen 🔒
- `PUT /api/products/:id` - Produkt aktualisieren 🔒
- `DELETE /api/products/:id` - Produkt löschen 🔒

### Kategorien
- `GET /api/categories` - Alle Kategorien (hierarchisch)
- `GET /api/categories/flat` - Kategorien als Liste
- `POST /api/categories` - Neue Kategorie erstellen 🔒

### Kollektionen
- `GET /api/collections` - Alle Kollektionen
- `GET /api/collections/featured` - Featured Kollektionen
- `GET /api/collections/:id/products` - Produkte einer Kollektion

### Health Checks
- `GET /health` - Basis Health Check
- `GET /health/detailed` - Detaillierte System-Informationen
- `GET /metrics` - System-Metriken

🔒 = Authentifizierung erforderlich

## 🔍 API-Filterung und Suche

### Produktsuche mit Filtern

```bash
# Suche nach "Berlin" in Kategorien "kleider"
GET /api/products?q=berlin&category=kleider&page=1&limit=20

# Featured Produkte im Preisbereich 50-200€
GET /api/products?featured=true&minPrice=50&maxPrice=200

# Neue Ankünfte, sortiert nach Preis
GET /api/products?newArrival=true&sortBy=basePrice&sortOrder=asc
```

### Verfügbare Filter

- `q` - Textsuche in Name, Beschreibung, Tags
- `category` - Kategorie-Slug
- `collection` - Kollektion-Slug
- `featured` - Nur Featured-Produkte
- `status` - Produktstatus (draft, active, archived)
- `minPrice` / `maxPrice` - Preisbereich
- `page` / `limit` - Pagination
- `sortBy` / `sortOrder` - Sortierung

## 🛡️ Sicherheit

### DSGVO-Compliance

- Automatische Datenaufbewahrungszeiten
- Audit-Logs für alle Datenänderungen
- Anonymisierungsfunktionen
- Cookie-Consent-Management

### Rate Limiting

- Standard: 100 Requests/15min
- Auth: 5 Requests/15min
- Public: 1000 Requests/15min

### Weitere Sicherheitsfeatures

- Helmet.js für Security Headers
- CORS-Konfiguration
- Input-Sanitization
- SQL-Injection-Schutz durch Drizzle ORM

## 🚀 Deployment

### Mit Docker

```dockerfile
# Dockerfile bereits vorbereitet
docker build -t dressforp-backend .
docker run -p 3000:3000 dressforp-backend
```

### Mit Railway/Vercel

1. Repository verbinden
2. Environment Variables setzen
3. Automatisches Deployment

### Mit Heroku

```bash
# Heroku CLI verwenden
heroku create dressforp-backend
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
git push heroku main
```

## 📊 Monitoring

### Health Checks

```bash
# Basic Health Check
curl http://localhost:3000/health

# Detailed System Info
curl http://localhost:3000/health/detailed

# Database Check
curl http://localhost:3000/health/dependencies
```

### Logs

```bash
# Development Logs
npm run dev

# Production Logs (mit PM2)
pm2 logs dressforp-backend
```

## 🧪 Testing

```bash
# Unit Tests
npm test

# Integration Tests
npm run test:integration

# API Tests
npm run test:api
```

## 📈 Performance

- **Drizzle ORM** für optimierte Datenbankqueries
- **Connection Pooling** für PostgreSQL
- **Compression** für API-Responses
- **Rate Limiting** für Lastverteilung
- **Indexierung** für Suchperformance

## 🔧 Wartung

### Datenbankmigrationen

```bash
# Neue Migration erstellen
npm run migration:generate

# Migrationen ausführen
npm run migration:up
```

### Logs bereinigen

```bash
# Alte Audit-Logs entfernen (DSGVO-konform)
npm run cleanup:logs
```

## 🆘 Troubleshooting

### Häufige Probleme

1. **Datenbankverbindung fehlgeschlagen**
   ```bash
   # Verbindung testen
   npm run db:test
   ```

2. **JWT Token ungültig**
   - Prüfen Sie JWT_SECRET in .env
   - Token-Ablaufzeit überprüfen

3. **CORS-Fehler**
   - CORS_ORIGIN in .env konfigurieren
   - Frontend-URL überprüfen

### Logs analysieren

```bash
# Fehler-Logs anzeigen
tail -f logs/application.log

# Database Logs
tail -f logs/database.log
```

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

## 📄 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 📞 Support

- **Dokumentation**: http://localhost:3000/api/docs
- **Issues**: GitHub Issues
- **E-Mail**: admin@dressforp.com

---

**DressForPleasure Backend** - Entwickelt für moderne E-Commerce-Anforderungen mit Fokus auf Sicherheit, Performance und DSGVO-Compliance.
