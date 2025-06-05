# Cloud-Deployment Guide - DressForPleasure Backend

## 📋 Übersicht

Dieser Guide führt Sie durch das Deployment des DressForPleasure Backend auf verschiedenen Cloud-Plattformen. Das System ist optimiert für kostenloses Hosting mit automatischer Skalierung und Production-ready Konfiguration.

## 🚀 Unterstützte Cloud-Provider

### 1. Railway.app (Empfohlen)
- **Kostenlos**: $5 Startguthaben, dann Pay-as-you-use
- **PostgreSQL**: Kostenlose Database inklusive
- **Features**: Automatisches Deployment, Monitoring, Logs
- **Best für**: Einfaches Setup, entwicklerfreundlich

### 2. Render.com
- **Kostenlos**: 750 Stunden/Monat, Sleep nach Inaktivität
- **PostgreSQL**: 90 Tage kostenlos, dann $7/Monat
- **Features**: Auto-Deploy, SSL, Custom Domains
- **Best für**: Statische Websites + Backend Combo

### 3. Heroku (Optional)
- **Kostenlos**: Eingestellt, aber noch verfügbar für bestehende Apps
- **PostgreSQL**: Hobby Plan $5/Monat
- **Features**: Mature Platform, viele Add-ons
- **Best für**: Enterprise-Grade Applications

## 🛠️ Vorbereitung

### Basis-Anforderungen
```bash
# 1. Repository vorbereiten
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repository-url>
git push origin main

# 2. Environment Setup
chmod +x scripts/*.sh
./scripts/setup-env.sh production

# 3. Build testen
npm run build
npm run test:health
```

### Erforderliche Secrets
Generiere diese Werte vor Deployment:
```bash
# Session Secret (32 bytes)
openssl rand -hex 32

# JWT Secret (64 bytes)
openssl rand -hex 64

# PostgreSQL Password (16 bytes)
openssl rand -hex 16
```

## 🚂 Railway Deployment

### Automatisches Deployment
```bash
# 1. Railway CLI installieren
npm install -g @railway/cli

# 2. Login
railway login

# 3. Automatisches Deployment ausführen
./scripts/deploy-railway.sh production
```

### Manuelles Deployment
```bash
# 1. Project erstellen
railway init

# 2. PostgreSQL hinzufügen
railway add postgresql

# 3. Environment Variables setzen
railway variables set NODE_ENV=production
railway variables set TRUST_PROXY=true
railway variables set CORS_ORIGIN="https://dressforp.vercel.app"
railway variables set SESSION_SECRET="<generated-secret>"
railway variables set JWT_SECRET="<generated-secret>"

# 4. Deploy
railway up
```

### Railway Konfiguration
Die `railway.toml` Datei ist bereits konfiguriert:
- Build Command: `npm run build`
- Start Command: `npm start`
- Health Check: `/health`
- Auto-Restart bei Fehlern

### Nach dem Deployment
```bash
# Database Migration
railway run npm run migration:up

# Database Seeding (optional)
railway run npm run seed:complete

# Logs überwachen
railway logs --follow
```

## 🎨 Render Deployment

### Automatische Vorbereitung
```bash
# Deployment vorbereiten
./scripts/deploy-render.sh production
```

### Dashboard Setup
1. **Service erstellen**:
   - Gehe zu [Render Dashboard](https://dashboard.render.com/)
   - New + → Blueprint
   - Repository verbinden
   - `render.yaml` wird automatisch erkannt

2. **Environment Variables**:
   ```
   NODE_ENV=production
   TRUST_PROXY=true
   CORS_ORIGIN=https://dressforp.vercel.app
   SESSION_SECRET=<generated-secret>
   JWT_SECRET=<generated-secret>
   ```

3. **PostgreSQL Service**:
   - Automatisch durch `render.yaml` erstellt
   - DATABASE_URL wird automatisch gesetzt

### Render Konfiguration
Die `render.yaml` Datei definiert:
- Web Service (Backend API)
- PostgreSQL Database
- Environment Variables
- Health Checks
- Auto-Deploy Settings

### Nach dem Deployment
```bash
# Shell im Render Dashboard öffnen
# Service → Shell → Connect

# Database Migration
npm run migration:up

# Database Seeding (optional)
npm run seed:complete
```

## 🐳 Docker Deployment

### Lokales Testing
```bash
# Production Build testen
docker build -t dressforp-backend .

# Container starten
docker run -p 3000:3000 \
  -e DATABASE_URL="<your-db-url>" \
  -e NODE_ENV=production \
  dressforp-backend

# Cloud-Simulation mit docker-compose
npm run docker:cloud
```

### Cloud-Provider mit Docker
- **Railway**: Dockerfile wird automatisch erkannt
- **Render**: Dockerfile wird automatisch verwendet
- **Google Cloud Run**: Dockerfile-kompatibel
- **AWS ECS**: Multi-stage Build optimiert

## ⚙️ Environment-Konfiguration

### Production Environment Variables

#### Basis-Konfiguration
```env
NODE_ENV=production
PORT=${PORT}
TRUST_PROXY=true
MAX_REQUEST_SIZE=5mb
```

#### Database
```env
DATABASE_URL=<cloud-provider-url>
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
```

#### Security
```env
SESSION_SECRET=<32-byte-hex>
JWT_SECRET=<64-byte-hex>
CORS_ORIGIN=https://dressforp.vercel.app,https://dressforp.com
```

#### Features (Optional)
```env
# Email Service
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.XXXXXXXX
EMAIL_FROM=noreply@dressforp.com

# Payment
STRIPE_SECRET_KEY=sk_live_XXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXX

# Media Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=XXXXXXXX
```

## 🔧 Database Management

### Migration in Production
```bash
# Automatisches Migration Script
./scripts/migrate-production.sh migrate

# Oder manuell in Cloud Shell:
npm run migration:up
```

### Backup & Restore
```bash
# Backup erstellen
./scripts/migrate-production.sh backup

# Rollback ausführen
./scripts/migrate-production.sh rollback
```

### Database Seeding
```bash
# Basis-Daten (Kategorien, etc.)
npm run seed

# Fashion-Beispieldaten
npm run seed:fashion

# Komplette Beispieldaten
npm run seed:complete
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **Basic**: `GET /health`
- **Detailed**: `GET /health/detailed`
- **Readiness**: `GET /health/ready`
- **Liveness**: `GET /health/live`
- **Dependencies**: `GET /health/dependencies`

### Monitoring Setup
```bash
# Health Check testen
curl https://your-app.onrender.com/health

# API testen
curl https://your-app.onrender.com/api/v1/products
```

### Logs überwachen
```bash
# Railway
railway logs --follow

# Render
# Dashboard → Service → Logs

# Docker
docker logs -f container_name
```

## 🔗 Frontend-Integration

### CORS-Konfiguration
```env
# Development
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Staging
CORS_ORIGIN="https://*.vercel.app,https://staging.dressforp.com"

# Production
CORS_ORIGIN="https://dressforp.vercel.app,https://dressforp.com,https://www.dressforp.com"
```

### API Base URL
Das Frontend muss die Backend-URL konfigurieren:
```env
# Frontend .env
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

## 🚨 Troubleshooting

### Häufige Probleme

#### Build Fehler
```bash
# Node.js Version prüfen
node --version  # Sollte 18.x sein

# Dependencies prüfen
npm ci

# Build lokal testen
npm run build
```

#### Database Connection
```bash
# Connection String prüfen
echo $DATABASE_URL

# SSL-Konfiguration prüfen
# Railway/Render: SSL automatisch aktiviert
# Lokale DB: SSL deaktiviert
```

#### CORS Fehler
```bash
# CORS_ORIGIN prüfen
echo $CORS_ORIGIN

# Frontend Domain enthalten?
# Protokoll (https://) korrekt?
# Keine Trailing Slashes?
```

#### Memory/Performance
```bash
# Kostenlose Tier Limits:
# Railway: 512MB RAM
# Render: 512MB RAM, Sleep nach 15min Inaktivität
# Heroku: 512MB RAM

# Optimierungen:
# - DB Connection Pool reduzieren
# - Image Uploads extern (Cloudinary)
# - Caching implementieren
```

### Log-Analyse
```bash
# Typische Fehlerquellen:
# 1. Environment Variables fehlen
# 2. Database Migration nicht ausgeführt
# 3. CORS falsch konfiguriert
# 4. Port-Binding Probleme
# 5. Memory Overflow
```

## 📈 Performance-Optimierung

### Database Optimierung
```env
# Connection Pool für kostenloses Tier
DB_POOL_MIN=2
DB_POOL_MAX=5
DB_IDLE_TIMEOUT=30000
```

### Memory Optimierung
```dockerfile
# Node.js Memory Limit
ENV NODE_OPTIONS="--max-old-space-size=512"
```

### Caching Strategy
```env
# Redis für Session Storage (optional)
REDIS_URL=<redis-provider-url>

# HTTP Caching Headers
CACHE_TTL=300
STATIC_CACHE_MAX_AGE=86400
```

## 🔒 Security Checklist

### Production Security
- [ ] Alle Secrets sind stark und einzigartig
- [ ] Database SSL ist aktiviert
- [ ] CORS ist auf Produktions-Domains beschränkt
- [ ] Rate Limiting ist konfiguriert
- [ ] HTTPS ist erzwungen
- [ ] Error Messages enthalten keine sensiblen Daten
- [ ] Logging ist auf "info" oder höher gesetzt
- [ ] Database Backups sind eingerichtet

### Environment Variables
- [ ] SESSION_SECRET: 32+ zufällige Zeichen
- [ ] JWT_SECRET: 64+ zufällige Zeichen
- [ ] Database Passwörter sind stark
- [ ] API Keys sind Live-Keys (nicht Test)
- [ ] Keine Secrets in Code oder Git

## 📚 Weiterführende Ressourcen

### Cloud-Provider Dokumentation
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Heroku Docs](https://devcenter.heroku.com/)

### Monitoring & Analytics
- [Sentry Error Tracking](https://sentry.io/)
- [New Relic Performance](https://newrelic.com/)
- [Prometheus Metrics](https://prometheus.io/)

### Database Management
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/)

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Code ist committed und gepusht
- [ ] Environment Variables sind generiert
- [ ] Build läuft lokal erfolgreich
- [ ] Tests bestehen
- [ ] Health Checks funktionieren

### Cloud-Provider Setup
- [ ] Service ist erstellt
- [ ] Environment Variables sind gesetzt
- [ ] Database Service ist konfiguriert
- [ ] Custom Domain ist verbunden (optional)

### Post-Deployment
- [ ] Health Check ist erreichbar
- [ ] Database Migration ist ausgeführt
- [ ] API Endpoints funktionieren
- [ ] Frontend kann Backend erreichen
- [ ] Monitoring ist eingerichtet
- [ ] Backup-Strategie ist implementiert

---

## 🎉 Erfolgreiches Deployment

Nach erfolgreichem Deployment sollten folgende URLs verfügbar sein:

- **Health Check**: `https://your-app.onrender.com/health`
- **API Dokumentation**: `https://your-app.onrender.com/api`
- **Produktliste**: `https://your-app.onrender.com/api/v1/products`
- **Metriken**: `https://your-app.onrender.com/metrics`

Das DressForPleasure Backend ist nun produktionsbereit und skaliert automatisch basierend auf der Last!
