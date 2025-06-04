#!/bin/bash

# DressForP - Prepare Online Deployment Script
# Bereitet das Repository für Online-Deployment vor

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Functions
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

clear

echo -e "${BLUE}"
cat << "EOF"
🚀 DRESSFORP ONLINE-DEPLOYMENT VORBEREITUNG
===========================================
Bereitet dein Repository für Ein-Klick-Deployment vor
EOF
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -d "📋 templates" ]; then
    print_error "Dieses Script muss im DressForP-Hauptverzeichnis ausgeführt werden!"
    print_info "Stelle sicher, dass du im Ordner 'dressforp-final-system' bist"
    exit 1
fi

print_info "Starte Deployment-Vorbereitung..."

# Create necessary directories
print_info "Erstelle Verzeichnisstruktur..."
mkdir -p .github/workflows
mkdir -p netlify/functions
mkdir -p scripts/deployment

# Copy deployment templates
print_info "Kopiere Deployment-Templates..."

# Vercel configuration
if [ -f "📋 templates/vercel.json" ]; then
    cp "📋 templates/vercel.json" ./vercel.json
    print_status "Vercel-Konfiguration kopiert"
fi

# Netlify configuration
if [ -f "📋 templates/netlify.toml" ]; then
    cp "📋 templates/netlify.toml" ./netlify.toml
    print_status "Netlify-Konfiguration kopiert"
fi

# Render configuration
if [ -f "📋 templates/render.yaml" ]; then
    cp "📋 templates/render.yaml" ./render.yaml
    print_status "Render-Konfiguration kopiert"
fi

# Railway configuration for backend
if [ -f "📋 templates/railway.json" ]; then
    cp "📋 templates/railway.json" "⚙️ backend/railway.json"
    print_status "Railway-Konfiguration kopiert"
fi

# GitHub Actions workflow
if [ -f "📋 templates/github-workflows/deploy.yml" ]; then
    cp "📋 templates/github-workflows/deploy.yml" ".github/workflows/deploy.yml"
    print_status "GitHub Actions Workflow kopiert"
fi

# Copy deployment README
if [ -f "📋 templates/DEPLOYMENT-README.md" ]; then
    cp "📋 templates/DEPLOYMENT-README.md" "./ONLINE-DEPLOYMENT.md"
    print_status "Deployment-README kopiert"
fi

# Create environment templates
print_info "Erstelle Environment-Templates..."

# Frontend environment template
cat > "💻 frontend/.env.example" << 'EOF'
# DressForP Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-sentry-dsn
EOF

# Backend environment template
cat > "⚙️ backend/.env.example" << 'EOF'
# DressForP Backend Environment Variables

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/dressforp

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ADMIN_IDS=123456789,987654321

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password_here

# AI Services
HUGGINGFACE_API_TOKEN=hf_your_token_here
OPENAI_API_KEY=sk-your_openai_key_here

# Analytics & Monitoring
GA_TRACKING_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your-sentry-dsn

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EOF

print_status "Environment-Templates erstellt"

# Create Dockerfiles if they don't exist
print_info "Überprüfe Docker-Konfiguration..."

# Frontend Dockerfile
if [ ! -f "💻 frontend/Dockerfile" ]; then
    cat > "💻 frontend/Dockerfile" << 'EOF'
# Multi-stage build for React app
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

    # Create nginx config for frontend
    cat > "💻 frontend/nginx.conf" << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass $BACKEND_URL;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    print_status "Frontend Dockerfile erstellt"
fi

# Backend Dockerfile
if [ ! -f "⚙️ backend/Dockerfile" ]; then
    cat > "⚙️ backend/Dockerfile" << 'EOF'
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "start"]
EOF
    print_status "Backend Dockerfile erstellt"
fi

# Create deployment scripts
print_info "Erstelle Deployment-Scripts..."

# Quick deployment script
cat > "./scripts/deployment/quick-deploy.sh" << 'EOF'
#!/bin/bash

# DressForP Quick Deployment Script
echo "🚀 Starting DressForP deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial DressForP deployment"
fi

# Check for GitHub CLI
if command -v gh &> /dev/null; then
    echo "📱 Creating GitHub repository..."
    gh repo create dressforp-shop --public --confirm
    git remote add origin https://github.com/$(gh api user --jq .login)/dressforp-shop.git
    git push -u origin main
    echo "✅ Repository created and pushed!"
else
    echo "⚠️  GitHub CLI not found. Please create repository manually:"
    echo "   https://github.com/new"
    echo "   Repository name: dressforp-shop"
fi

echo ""
echo "🌐 Next steps:"
echo "1. Deploy Frontend: https://vercel.com/new"
echo "2. Deploy Backend: https://railway.app/new"
echo "3. Configure environment variables"
echo ""
echo "🎉 Your e-commerce system will be live in minutes!"
EOF

chmod +x "./scripts/deployment/quick-deploy.sh"
print_status "Quick-Deploy Script erstellt"

# Create platform-specific deployment guides
print_info "Erstelle Platform-spezifische Anleitungen..."

# Vercel deployment guide
cat > "./scripts/deployment/vercel-deploy.md" << 'EOF'
# 🌐 Vercel Frontend Deployment

## Ein-Klick-Deployment
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DEIN-USERNAME/dressforp-shop)

## Manuelle Schritte
1. Gehe zu https://vercel.com/new
2. Verbinde GitHub-Repository
3. Framework: React (Vite)
4. Root Directory: `💻 frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variables setzen:
   - `VITE_API_URL`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_GA_TRACKING_ID`
8. Deploy klicken

## Domain verbinden
1. Vercel Dashboard → Settings → Domains
2. Domain hinzufügen
3. DNS-Records konfigurieren
4. SSL automatisch aktiviert
EOF

# Railway deployment guide
cat > "./scripts/deployment/railway-deploy.md" << 'EOF'
# 🚂 Railway Backend Deployment

## Ein-Klick-Deployment
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/Abo1zu)

## Manuelle Schritte
1. Gehe zu https://railway.app/new
2. "Deploy from GitHub repo" auswählen
3. Repository verbinden
4. Service: `⚙️ backend` Verzeichnis
5. PostgreSQL-Plugin hinzufügen
6. Environment Variables setzen:
   - `DATABASE_URL` (automatisch von PostgreSQL)
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `TELEGRAM_BOT_TOKEN`
7. Deploy klicken

## Database Migration
1. Railway Dashboard → Backend Service
2. Variables → DATABASE_URL kopieren
3. Terminal: `npm run db:migrate`
4. Seed-Daten: `npm run db:seed`
EOF

print_status "Deployment-Anleitungen erstellt"

# Create lighthouse configuration
print_info "Konfiguriere Performance-Testing..."
cat > "./lighthouse.json" << 'EOF'
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/products",
        "http://localhost:3000/admin"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.8}],
        "categories:seo": ["error", {"minScore": 0.8}],
        "categories:pwa": ["warn", {"minScore": 0.6}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
EOF

# Create package.json scripts for deployment
print_info "Aktualisiere package.json Scripts..."

# Add deployment scripts to root package.json if it exists
if [ -f "package.json" ]; then
    # Backup original
    cp package.json package.json.backup
    
    # Use node to update package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json'));
    
    if (!pkg.scripts) pkg.scripts = {};
    
    pkg.scripts['deploy:vercel'] = 'cd \"💻 frontend\" && vercel --prod';
    pkg.scripts['deploy:railway'] = 'cd \"⚙️ backend\" && railway up';
    pkg.scripts['deploy:full'] = 'npm run deploy:railway && npm run deploy:vercel';
    pkg.scripts['setup:env'] = './🔧 scripts/prepare-online-deployment.sh';
    pkg.scripts['test:lighthouse'] = 'lighthouse-ci autorun';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    " 2>/dev/null || true
fi

# Create gitignore entries
print_info "Aktualisiere .gitignore..."
cat >> .gitignore << 'EOF'

# Deployment
.vercel
.railway
.netlify
render.yaml.temp

# Environment files
.env
.env.local
.env.production
.env.staging

# Logs
logs/
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
node_modules/

# Build outputs
dist/
build/
.next/

# Cache
.cache/
.parcel-cache/

# Temporary files
.tmp/
temp/

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/settings.json
.idea/
*.swp
*.swo

# Backup files
*.backup
EOF

# Create deployment checklist
print_info "Erstelle Deployment-Checkliste..."
cat > "./DEPLOYMENT-CHECKLIST.md" << 'EOF'
# ✅ DressForP Deployment Checklist

## Pre-Deployment
- [ ] Repository auf GitHub erstellt
- [ ] Alle Deployment-Templates kopiert
- [ ] Environment-Variablen vorbereitet
- [ ] Stripe-Account erstellt (Test-Modus)
- [ ] Telegram-Bot erstellt
- [ ] Gmail App-Passwort erstellt

## Frontend Deployment (Vercel)
- [ ] Vercel-Account mit GitHub verbunden
- [ ] Repository deployed
- [ ] Environment-Variablen gesetzt
- [ ] Custom Domain verbunden (optional)
- [ ] SSL-Zertifikat aktiv

## Backend Deployment (Railway)
- [ ] Railway-Account erstellt
- [ ] Repository deployed
- [ ] PostgreSQL-Plugin hinzugefügt
- [ ] Environment-Variablen konfiguriert
- [ ] Database migriert
- [ ] Health-Check funktioniert

## Integration Testing
- [ ] Frontend lädt korrekt
- [ ] API-Endpunkte erreichbar
- [ ] Database-Verbindung funktioniert
- [ ] Stripe Test-Zahlung erfolgreich
- [ ] Admin-Login funktioniert
- [ ] Telegram-Bot antwortet

## Production Setup
- [ ] Stripe auf Live-Modus umgestellt
- [ ] Echte Test-Bestellung durchgeführt
- [ ] Monitoring aktiviert (UptimeRobot)
- [ ] Analytics eingerichtet (Google Analytics)
- [ ] Backup-System läuft
- [ ] Performance-Test bestanden (Lighthouse)

## Post-Launch
- [ ] First real customer order
- [ ] All email workflows tested
- [ ] Social media connected
- [ ] SEO optimized
- [ ] Marketing campaigns ready
EOF

print_status "Deployment-Checkliste erstellt"

# Update main README with deployment buttons
print_info "Aktualisiere Haupt-README..."
if [ -f "README.md" ]; then
    # Backup original README
    cp README.md README.md.backup
    
    # Add deployment section to README
    cat >> README.md << 'EOF'

---

## 🚀 Ein-Klick Online-Deployment

### Frontend (kostenlos)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DEIN-USERNAME/dressforp-shop)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/DEIN-USERNAME/dressforp-shop)

### Backend (kostenlos)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/Abo1zu)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/DEIN-USERNAME/dressforp-shop)

**📋 Komplette Anleitung:** [ONLINE-DEPLOYMENT.md](./ONLINE-DEPLOYMENT.md)

---
EOF
    print_status "README mit Deployment-Buttons aktualisiert"
fi

# Final summary
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT-VORBEREITUNG ABGESCHLOSSEN!${NC}"
echo ""
echo -e "${BLUE}📋 Was wurde erstellt:${NC}"
echo "   ✅ Vercel-Konfiguration (vercel.json)"
echo "   ✅ Netlify-Konfiguration (netlify.toml)"
echo "   ✅ Railway-Konfiguration (railway.json)"
echo "   ✅ Render-Konfiguration (render.yaml)"
echo "   ✅ GitHub Actions Workflow"
echo "   ✅ Docker-Konfigurationen"
echo "   ✅ Environment-Templates"
echo "   ✅ Deployment-Scripts"
echo "   ✅ Performance-Testing (Lighthouse)"
echo "   ✅ Deployment-Checkliste"
echo ""
echo -e "${BLUE}📂 Wichtige Dateien:${NC}"
echo "   📄 ONLINE-DEPLOYMENT.md - Komplette Anleitung"
echo "   📄 DEPLOYMENT-CHECKLIST.md - Schritt-für-Schritt Checkliste"
echo "   🔧 scripts/deployment/quick-deploy.sh - Schnelles Setup"
echo ""
echo -e "${YELLOW}⚡ NÄCHSTE SCHRITTE:${NC}"
echo ""
echo "1. 📱 GitHub Repository erstellen:"
echo "   ./scripts/deployment/quick-deploy.sh"
echo ""
echo "2. 🌐 Frontend deployen:"
echo "   https://vercel.com/new (Ein-Klick-Button in README.md)"
echo ""
echo "3. ⚙️ Backend deployen:"
echo "   https://railway.app/new (Ein-Klick-Button in README.md)"
echo ""
echo "4. 🔧 Environment-Variablen konfigurieren"
echo ""
echo "5. 💳 Stripe & Telegram einrichten"
echo ""
echo -e "${GREEN}🚀 In 10 Minuten ist dein Shop online!${NC}"
