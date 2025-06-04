#!/bin/bash

# DressForP - Ein-Klick Online-Deployment Script
# Automatisches Deployment auf kostenlose Cloud-Plattformen

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
GEAR="⚙️"
CLOUD="☁️"
LINK="🔗"

clear

echo -e "${PURPLE}"
cat << "EOF"
☁️  DRESSFORP ONLINE-DEPLOYMENT
================================
Ein-Klick-Deployment auf kostenlose Cloud-Plattformen
EOF
echo -e "${NC}"

# Functions
print_status() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

print_error() {
    echo -e "${RED}${CROSS}${NC} $1"
}

print_info() {
    echo -e "${BLUE}${GEAR}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_link() {
    echo -e "${CYAN}${LINK}${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Überprüfe System-Voraussetzungen..."
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "Git ist nicht installiert!"
        print_info "Installiere Git: https://git-scm.com/"
        exit 1
    fi
    print_status "Git verfügbar"
    
    # Check node (optional for local testing)
    if command -v node &> /dev/null; then
        print_status "Node.js verfügbar: $(node --version)"
    else
        print_warning "Node.js nicht gefunden - nur für lokale Tests nötig"
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        print_error "curl ist nicht installiert!"
        exit 1
    fi
    print_status "curl verfügbar"
}

# GitHub setup
setup_github() {
    print_info "${CLOUD} GitHub Repository Setup..."
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_info "Initialisiere Git Repository..."
        git init
        git add .
        git commit -m "Initial DressForP commit"
        print_status "Git Repository initialisiert"
    else
        print_status "Git Repository bereits vorhanden"
    fi
    
    # Check for GitHub CLI
    if command -v gh &> /dev/null; then
        print_info "GitHub CLI gefunden - erstelle Repository automatisch..."
        
        # Create GitHub repository
        if ! gh repo view &>/dev/null; then
            gh repo create dressforp-shop --public --description "DressForP E-Commerce Shop" --confirm
            git remote add origin https://github.com/$(gh api user --jq .login)/dressforp-shop.git
            git push -u origin main
            print_status "GitHub Repository erstellt und gepusht"
        else
            print_status "GitHub Repository bereits vorhanden"
        fi
    else
        print_warning "GitHub CLI nicht gefunden"
        print_info "Bitte manuell Repository erstellen:"
        print_link "https://github.com/new"
        echo ""
        echo "Repository-Name: dressforp-shop"
        echo "Sichtbarkeit: Public (für kostenlose Features)"
        echo ""
        echo "Danach:"
        echo "git remote add origin https://github.com/DEIN-USERNAME/dressforp-shop.git"
        echo "git push -u origin main"
        echo ""
        read -p "Drücke Enter wenn Repository erstellt und Code gepusht wurde..."
    fi
}

# Vercel deployment
deploy_vercel() {
    print_info "${ROCKET} Vercel Frontend-Deployment..."
    
    # Check for Vercel CLI
    if command -v vercel &> /dev/null; then
        print_info "Vercel CLI gefunden - deploye automatisch..."
        
        cd "💻 frontend" || exit 1
        
        # Login if not already
        vercel login
        
        # Deploy
        vercel --prod
        
        cd ..
        print_status "Frontend auf Vercel deployed"
    else
        print_warning "Vercel CLI nicht gefunden"
        print_info "Manuelle Vercel-Deployment-Anleitung:"
        print_link "https://vercel.com/new"
        echo ""
        echo "1. Mit GitHub anmelden"
        echo "2. Repository 'dressforp-shop' auswählen"
        echo "3. Framework: React (Vite)"
        echo "4. Root Directory: frontend/"
        echo "5. Deploy klicken"
        echo ""
        read -p "Drücke Enter wenn Frontend deployed wurde..."
    fi
}

# Railway deployment
deploy_railway() {
    print_info "${ROCKET} Railway Backend-Deployment..."
    
    # Check for Railway CLI
    if command -v railway &> /dev/null; then
        print_info "Railway CLI gefunden - deploye automatisch..."
        
        # Login if not already
        railway login
        
        # Create project
        railway init
        
        # Add PostgreSQL
        railway add postgresql
        
        # Deploy backend
        cd "⚙️ backend" || exit 1
        railway up
        cd ..
        
        print_status "Backend auf Railway deployed"
    else
        print_warning "Railway CLI nicht gefunden"
        print_info "Manuelle Railway-Deployment-Anleitung:"
        print_link "https://railway.app/new"
        echo ""
        echo "1. Mit GitHub anmelden"
        echo "2. 'Deploy from GitHub repo' auswählen"
        echo "3. Repository 'dressforp-shop' verbinden"
        echo "4. Service: backend/ Verzeichnis auswählen"
        echo "5. PostgreSQL-Plugin hinzufügen"
        echo "6. Environment Variables setzen"
        echo "7. Deploy klicken"
        echo ""
        read -p "Drücke Enter wenn Backend deployed wurde..."
    fi
}

# Supabase database setup
setup_supabase() {
    print_info "${CLOUD} Supabase Datenbank-Setup..."
    
    print_info "Manuelle Supabase-Setup-Anleitung:"
    print_link "https://supabase.com/dashboard"
    echo ""
    echo "1. Kostenloses Konto erstellen"
    echo "2. 'New project' klicken"
    echo "3. Projekt-Name: dressforp-db"
    echo "4. Region: Europe West (Ireland)"
    echo "5. Datenbank-Passwort generieren"
    echo "6. 'Create new project' klicken"
    echo ""
    echo "Nach Erstellung:"
    echo "1. Settings → Database"
    echo "2. Connection string kopieren"
    echo "3. In Railway Environment Variable eintragen:"
    echo "   DATABASE_URL=postgresql://..."
    echo ""
    read -p "Drücke Enter wenn Datenbank konfiguriert wurde..."
}

# Create deployment templates
create_templates() {
    print_info "Erstelle Deployment-Templates..."
    
    # Vercel configuration
    cat > vercel.json << 'EOF'
{
  "name": "dressforp-frontend",
  "version": 2,
  "builds": [
    {
      "src": "💻 frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/💻 frontend/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "@api_url",
    "VITE_STRIPE_PUBLISHABLE_KEY": "@stripe_key"
  }
}
EOF

    # Railway configuration
    cat > "⚙️ backend/railway.json" << 'EOF'
{
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "on-failure"
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF

    # GitHub Actions workflow
    mkdir -p .github/workflows
    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy DressForP

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: |
        cd "💻 frontend"
        npm ci
    - name: Build
      run: |
        cd "💻 frontend"
        npm run build
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./💻 frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Railway
      uses: bervProject/railway-deploy@v1.0.0
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: backend
EOF

    print_status "Deployment-Templates erstellt"
}

# Environment variables setup
setup_environment() {
    print_info "Konfiguriere Environment Variables..."
    
    # Create environment template
    cat > .env.production << 'EOF'
# ==============================================
# DRESSFORP PRODUCTION ENVIRONMENT VARIABLES
# ==============================================

# ⚙️ NODE ENVIRONMENT
NODE_ENV=production

# 🌐 URLS
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-backend.railway.app
API_BASE_URL=https://your-backend.railway.app/api

# 🗄️ DATABASE
DATABASE_URL=postgresql://postgres:password@host:5432/postgres

# 🔐 SECURITY
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key

# 💳 STRIPE (Live Keys für Produktion)
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 📱 TELEGRAM BOT
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ADMIN_IDS=123456789,987654321

# 📧 EMAIL
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# 🎨 AI SERVICES
HUGGINGFACE_API_TOKEN=hf_your_token_here
OPENAI_API_KEY=sk-your_openai_key_here

# 📊 ANALYTICS
GA_TRACKING_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your_sentry_dsn

# ☁️ CLOUD STORAGE
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EOF

    print_status "Environment-Template erstellt: .env.production"
    print_warning "WICHTIG: Trage echte Werte in die Environment Variables ein!"
}

# Setup monitoring
setup_monitoring() {
    print_info "Konfiguriere Monitoring..."
    
    # UptimeRobot setup instructions
    cat > monitoring-setup.md << 'EOF'
# 📊 Monitoring Setup

## UptimeRobot (kostenlos)
1. https://uptimerobot.com registrieren
2. "Add New Monitor" klicken
3. Monitor Type: HTTP(s)
4. URL: https://your-app.vercel.app
5. Monitoring Interval: 5 minutes
6. Alert Contacts: E-Mail hinzufügen

## Sentry Error Tracking
1. https://sentry.io registrieren
2. "Create Project" → React
3. DSN kopieren
4. In Environment Variables eintragen:
   SENTRY_DSN=https://...

## Google Analytics
1. https://analytics.google.com
2. Neue Property erstellen
3. Tracking-ID kopieren: G-XXXXXXXXXX
4. In Environment Variables eintragen:
   GA_TRACKING_ID=G-XXXXXXXXXX
EOF

    print_status "Monitoring-Anleitung erstellt: monitoring-setup.md"
}

# Main deployment function
main_deployment() {
    echo -e "${CYAN}🎯 Wähle Deployment-Option:${NC}"
    echo ""
    echo "1) 🚀 Vollständiges Auto-Deployment (empfohlen)"
    echo "2) 📱 Nur Frontend auf Vercel"
    echo "3) ⚙️  Nur Backend auf Railway"
    echo "4) 📋 Nur Templates erstellen"
    echo "5) 🔧 Environment Setup"
    echo ""
    read -p "Deine Wahl (1-5): " choice

    case $choice in
        1)
            print_info "Starte vollständiges Deployment..."
            setup_github
            create_templates
            setup_environment
            deploy_vercel
            deploy_railway
            setup_supabase
            setup_monitoring
            ;;
        2)
            print_info "Deploye nur Frontend..."
            setup_github
            deploy_vercel
            ;;
        3)
            print_info "Deploye nur Backend..."
            setup_github
            deploy_railway
            ;;
        4)
            print_info "Erstelle nur Templates..."
            create_templates
            setup_environment
            ;;
        5)
            print_info "Konfiguriere nur Environment..."
            setup_environment
            ;;
        *)
            print_error "Ungültige Auswahl!"
            exit 1
            ;;
    esac
}

# Show final instructions
show_final_instructions() {
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT ABGESCHLOSSEN!${NC}"
    echo ""
    echo -e "${BLUE}📋 NÄCHSTE SCHRITTE:${NC}"
    echo ""
    echo "1. 🔑 Environment Variables konfigurieren:"
    echo "   - Railway Dashboard → Variables"
    echo "   - Vercel Dashboard → Settings → Environment Variables"
    echo ""
    echo "2. 💳 Stripe Live-Keys aktivieren:"
    echo "   - Stripe Dashboard → API Keys"
    echo "   - Live-Keys kopieren und in Environment Variables eintragen"
    echo ""
    echo "3. 📱 Telegram Bot konfigurieren:"
    echo "   - @BotFather → /newbot"
    echo "   - Token in TELEGRAM_BOT_TOKEN eintragen"
    echo ""
    echo "4. 🌍 Domain verbinden (optional):"
    echo "   - Vercel: Settings → Domains"
    echo "   - Railway: Settings → Domains"
    echo ""
    echo "5. 📊 Monitoring aktivieren:"
    echo "   - monitoring-setup.md befolgen"
    echo ""
    echo -e "${PURPLE}🔗 WICHTIGE LINKS:${NC}"
    print_link "Vercel Dashboard: https://vercel.com/dashboard"
    print_link "Railway Dashboard: https://railway.app/dashboard"
    print_link "Supabase Dashboard: https://supabase.com/dashboard"
    print_link "GitHub Repository: https://github.com/$(git config user.name)/dressforp-shop"
    echo ""
    echo -e "${YELLOW}⚠️  WICHTIGE SICHERHEITSHINWEISE:${NC}"
    echo "   • Niemals API-Keys in Git committen"
    echo "   • Nur HTTPS verwenden (automatisch durch Vercel/Railway)"
    echo "   • Regelmäßige Backups der Datenbank"
    echo "   • Strong Passwords für alle Accounts verwenden"
    echo ""
    echo -e "${GREEN}✅ Dein E-Commerce-System ist jetzt live!${NC}"
}

# Main execution
main() {
    check_prerequisites
    main_deployment
    show_final_instructions
}

# Run main function
main "$@"
