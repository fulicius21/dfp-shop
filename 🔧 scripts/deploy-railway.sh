#!/bin/bash

# DressForP - Railway Deployment Script
# Automatisches Deployment auf Railway.app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

clear

echo -e "${BLUE}"
cat << "EOF"
🚀 DRESSFORP RAILWAY DEPLOYMENT
================================
Automatisches Deployment auf Railway.app
EOF
echo -e "${NC}"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI ist nicht installiert!"
    print_info "Installiere Railway CLI..."
    
    # Install Railway CLI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install railwayapp/railway/railway
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://railway.app/install.sh | sh
    else
        print_error "Unsupported OS. Bitte Railway CLI manuell installieren:"
        print_error "https://docs.railway.app/develop/cli"
        exit 1
    fi
fi

print_status "Railway CLI verfügbar"

# Check if user is logged in
if ! railway whoami &>/dev/null; then
    print_info "Bitte bei Railway anmelden..."
    railway login
fi

print_status "Bei Railway angemeldet"

# Check if this is a git repository
if [ ! -d ".git" ]; then
    print_info "Initialisiere Git Repository..."
    git init
    git add .
    git commit -m "Initial DressForP deployment"
fi

print_status "Git Repository bereit"

# Create Railway project
print_info "Erstelle Railway Projekt..."
railway init

# Deploy backend
print_info "Deploye Backend..."
cd "⚙️ backend"

# Create Dockerfile if not exists
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOL'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
EOL
fi

# Create railway.json for backend
cat > railway.json << 'EOL'
{
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOL

# Deploy backend service
railway up --service backend

cd ..

# Deploy frontend
print_info "Deploye Frontend..."
cd "💻 frontend"

# Create Dockerfile for frontend
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOL'
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOL
fi

# Create nginx.conf for frontend
if [ ! -f "nginx.conf" ]; then
    cat > nginx.conf << 'EOL'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass $BACKEND_URL;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOL
fi

# Deploy frontend service
railway up --service frontend

cd ..

# Setup databases
print_info "Konfiguriere Datenbanken..."

# Add PostgreSQL
railway add postgresql

# Add Redis (optional)
railway add redis

# Configure environment variables
print_info "Konfiguriere Environment-Variablen..."

# Backend environment variables
railway variables set NODE_ENV=production --service backend
railway variables set FRONTEND_URL=$(railway domain --service frontend) --service backend

# Frontend environment variables  
railway variables set VITE_API_URL=$(railway domain --service backend)/api --service frontend

# Deploy automation (n8n)
print_info "Deploye Automatisierung..."
cd "🤖 automation"

# Create n8n Dockerfile
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOL'
FROM n8nio/n8n:latest

USER root
RUN apk add --update --no-cache python3 py3-pip

USER node
WORKDIR /home/node

COPY credentials/ ./credentials/
COPY workflows/ ./workflows/

CMD ["n8n"]
EOL
fi

# Deploy n8n service
railway up --service n8n

cd ..

# Deploy AI Style Creator
print_info "Deploye KI Style Creator..."
cd "🎨 ai-style-creator"

# Deploy AI service (requires more resources)
railway up --service ai-creator

cd ..

print_status "Deployment abgeschlossen!"

echo ""
print_info "🌐 IHRE URLS:"

# Get deployment URLs
FRONTEND_URL=$(railway domain --service frontend 2>/dev/null || echo "URL wird generiert...")
BACKEND_URL=$(railway domain --service backend 2>/dev/null || echo "URL wird generiert...")
N8N_URL=$(railway domain --service n8n 2>/dev/null || echo "URL wird generiert...")
AI_URL=$(railway domain --service ai-creator 2>/dev/null || echo "URL wird generiert...")

echo "   🛍️  Website:      $FRONTEND_URL"
echo "   ⚙️  Backend-API:   $BACKEND_URL"
echo "   🤖 Automatisierung: $N8N_URL"
echo "   🎨 KI Creator:    $AI_URL"

echo ""
print_info "📋 NÄCHSTE SCHRITTE:"
echo "   1. Environment-Variablen prüfen: railway variables"
echo "   2. Logs überwachen: railway logs"
echo "   3. Domain konfigurieren: railway domain"
echo "   4. SSL-Zertifikat aktivieren (automatisch)"

echo ""
print_warning "⚠️  WICHTIG:"
echo "   • Stripe Live-Keys für Produktion setzen"
echo "   • Domain für bessere Performance verbinden"
echo "   • Monitoring und Alerts konfigurieren"

echo ""
print_info "📚 DOKUMENTATION:"
echo "   • Railway Docs: https://docs.railway.app"
echo "   • DressForP Docs: ./📚 documentation/"

echo ""
print_status "🎉 Deployment erfolgreich! Ihr Shop ist jetzt online!"
