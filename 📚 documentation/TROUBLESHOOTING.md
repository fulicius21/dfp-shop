# 🛠️ DressForP Troubleshooting Guide

> **Häufige Probleme schnell lösen - für absolute Anfänger**

## 📋 Inhaltsverzeichnis

1. [🚨 Notfall-Lösungen](#-notfall-lösungen)
2. [💻 Installation Probleme](#-installation-probleme)
3. [🚀 Start Probleme](#-start-probleme)
4. [🌐 Website Probleme](#-website-probleme)
5. [⚙️ Backend Probleme](#-backend-probleme)
6. [🤖 Automatisierung Probleme](#-automatisierung-probleme)
7. [💳 Stripe/Zahlungs-Probleme](#-stripezahlungs-probleme)
8. [📱 Telegram Bot Probleme](#-telegram-bot-probleme)
9. [🎨 KI Style Creator Probleme](#-ki-style-creator-probleme)
10. [🔧 System-Diagnose](#-system-diagnose)

---

## 🚨 Notfall-Lösungen

### "Nichts funktioniert!"

**Schritt 1: Komplett-Neustart**
```bash
# Windows
stop-system.bat
start-system.bat

# Mac/Linux
./stop-system.sh
./start-system.sh
```

**Schritt 2: System-Reset**
```bash
# Alle Container stoppen
docker stop $(docker ps -aq)

# Alle Container löschen
docker rm $(docker ps -aq)

# Neu starten
./start-system.sh
```

**Schritt 3: Kompletter Reset**
```bash
# ACHTUNG: Löscht alle Daten!
docker system prune -a --volumes
./setup.sh
```

### "Ich habe etwas kaputt gemacht!"

**Backup wiederherstellen:**
```bash
./🔧 scripts/backup.sh list
./🔧 scripts/backup.sh restore dressforp_backup_YYYYMMDD_HHMMSS.tar.gz
```

**Auf ursprünglichen Zustand zurücksetzen:**
```bash
git checkout .
./setup.sh
```

---

## 💻 Installation Probleme

### Problem: "Docker not found"

**Windows:**
1. Docker Desktop herunterladen: https://docker.com/products/docker-desktop
2. Installieren und neu starten
3. Docker Desktop starten
4. Setup erneut ausführen

**Mac:**
```bash
# Mit Homebrew
brew install --cask docker

# Oder manuell von docker.com
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# CentOS/RHEL
sudo yum install docker
sudo systemctl start docker
```

### Problem: "Permission denied"

**Windows:**
- Setup **als Administrator** ausführen
- Rechtsklick auf setup.bat → "Als Administrator ausführen"

**Mac/Linux:**
```bash
# Scripts ausführbar machen
chmod +x setup.sh start-system.sh stop-system.sh

# Mit sudo ausführen falls nötig
sudo ./setup.sh
```

### Problem: "Node.js not found"

**Automatische Installation:**
```bash
# Das Setup-Script installiert Node.js automatisch
# Falls nicht, manuell installieren:

# Windows: nodejs.org herunterladen
# Mac: brew install node
# Linux: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

### Problem: "npm install failed"

**Lösung:**
```bash
# npm Cache löschen
npm cache clean --force

# Node modules löschen und neu installieren
rm -rf node_modules package-lock.json
npm install

# Alternative: pnpm verwenden
npm install -g pnpm
pnpm install
```

---

## 🚀 Start Probleme

### Problem: "Port 3000 already in use"

**Windows:**
```cmd
# Port freigeben
netstat -ano | findstr :3000
taskkill /PID [PID_NUMMER] /F

# Oder alle Node.js Prozesse beenden
taskkill /f /im node.exe
```

**Mac/Linux:**
```bash
# Port freigeben
sudo lsof -i :3000
sudo kill -9 [PID_NUMMER]

# Oder alle Node Prozesse beenden
pkill -f node
```

### Problem: "Database connection failed"

**Lösung:**
```bash
# PostgreSQL Container neustarten
docker restart dressforp_postgres

# Oder komplett neu erstellen
docker-compose down
docker-compose up postgres -d

# Warten bis bereit
docker logs dressforp_postgres
```

### Problem: "Frontend won't start"

**Häufige Ursachen:**
1. **Node_modules fehlen:**
   ```bash
   cd "💻 frontend"
   npm install
   ```

2. **Build-Fehler:**
   ```bash
   cd "💻 frontend"
   rm -rf dist
   npm run build
   ```

3. **TypeScript-Fehler:**
   ```bash
   cd "💻 frontend"
   npm run type-check
   ```

---

## 🌐 Website Probleme

### Problem: "Website lädt nicht"

**Schritt 1: Browser-Cache leeren**
- Strg+F5 (Windows) oder Cmd+Shift+R (Mac)
- Oder: Browser-Einstellungen → Cache löschen

**Schritt 2: Andere URL versuchen**
- http://localhost:3000 (Frontend)
- http://127.0.0.1:3000 (Alternative)
- http://localhost:3001/api/health (Backend-Test)

**Schritt 3: Browser-Logs prüfen**
- F12 → Console-Tab
- Fehlermeldungen screenshot und Support senden

### Problem: "Weiße Seite / Blank Page"

**JavaScript-Fehler:**
1. F12 → Console öffnen
2. Rote Fehlermeldungen suchen
3. Seite neu laden (F5)

**Build-Problem:**
```bash
cd "💻 frontend"
rm -rf dist node_modules
npm install
npm run build
npm run dev
```

### Problem: "Produkte werden nicht angezeigt"

**Backend-Verbindung prüfen:**
```bash
# API testen
curl http://localhost:3001/api/products

# Oder im Browser:
# http://localhost:3001/api/products
```

**Datenbank prüfen:**
```bash
# In Admin-Panel schauen
# http://localhost:3000/admin
# Login: admin / admin
```

---

## ⚙️ Backend Probleme

### Problem: "API returns 500 error"

**Logs anschauen:**
```bash
# Backend-Logs
docker logs dressforp_backend

# Oder in Datei
cat logs/backend.log
```

**Datenbank-Verbindung testen:**
```bash
# Environment-Variablen prüfen
cat .env | grep DATABASE_URL

# Datenbank-Ping
docker exec dressforp_postgres pg_isready
```

### Problem: "Stripe payments not working"

**API-Keys prüfen:**
```bash
# In .env Datei schauen
cat .env | grep STRIPE

# Test-Keys verwenden für Entwicklung:
# pk_test_... und sk_test_...
```

**Webhook-URL konfigurieren:**
1. Stripe Dashboard → Webhooks
2. Endpoint hinzufügen: `https://deine-domain.com/api/stripe/webhook`
3. Events auswählen: `payment_intent.succeeded`, `checkout.session.completed`

### Problem: "Database schema outdated"

**Migration ausführen:**
```bash
cd "⚙️ backend"
npm run db:migrate

# Oder komplett neu aufsetzen
npm run db:reset
npm run db:seed
```

---

## 🤖 Automatisierung Probleme

### Problem: "n8n not accessible"

**Service-Status prüfen:**
```bash
# n8n Container prüfen
docker ps | grep n8n
docker logs dressforp_n8n

# n8n neu starten
docker restart dressforp_n8n
```

**Browser-Zugang testen:**
- URL: http://localhost:5678
- Login: admin / admin (Standard)

### Problem: "Workflows not executing"

**Workflow-Status prüfen:**
1. n8n öffnen (http://localhost:5678)
2. Workflow auswählen
3. "Aktiviert" Status prüfen
4. "Test-Ausführung" starten

**Webhook-URLs aktualisieren:**
1. Workflow öffnen
2. Webhook-Node anklicken
3. URL kopieren: `http://localhost:5678/webhook/...`
4. In externe Services eintragen

### Problem: "Email notifications not sent"

**SMTP-Einstellungen prüfen:**
```env
# In .env Datei
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=deine-email@gmail.com
MAIL_PASS=dein-app-passwort  # Nicht dein normales Passwort!
```

**Gmail App-Passwort erstellen:**
1. Google Account → Sicherheit
2. 2-Faktor-Authentifizierung aktivieren
3. App-Passwörter generieren
4. Passwort in .env eintragen

---

## 💳 Stripe/Zahlungs-Probleme

### Problem: "Test payments fail"

**Test-Kreditkarte verwenden:**
```
Kartennummer: 4242 4242 4242 4242
Ablaufdatum: 12/25 (beliebiges zukünftiges Datum)
CVC: 123
```

**Andere Test-Karten:**
- **Visa**: 4242 4242 4242 4242
- **MasterCard**: 5555 5555 5555 4444
- **Amex**: 3782 822463 10005
- **Declined**: 4000 0000 0000 0002

### Problem: "Webhook signature invalid"

**Webhook-Secret prüfen:**
1. Stripe Dashboard → Webhooks
2. Endpoint anklicken
3. "Signing secret" kopieren
4. In .env als `STRIPE_WEBHOOK_SECRET` eintragen

**Test-Webhook senden:**
1. Stripe Dashboard → Webhooks
2. "Send test webhook" klicken
3. Event-Type auswählen
4. Logs in n8n/Backend prüfen

### Problem: "Live payments not working"

**Live-Mode aktivieren:**
1. Stripe-Geschäft vollständig verifizieren
2. Live-API-Keys aktivieren
3. In .env ersetzen:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

**⚠️ Wichtig:** Test-Keys mit Live-Keys NICHT mischen!

---

## 📱 Telegram Bot Probleme

### Problem: "Bot responds not"

**Bot-Token prüfen:**
```bash
# Token in .env prüfen
cat .env | grep TELEGRAM_BOT_TOKEN

# Bot-Status testen
curl "https://api.telegram.org/bot[TOKEN]/getMe"
```

**Bot neu erstellen:**
1. Telegram öffnen
2. @BotFather suchen
3. `/newbot` senden
4. Namen vergeben
5. Token kopieren und in .env eintragen

### Problem: "Not authorized to use bot"

**Admin-IDs konfigurieren:**
1. Deine Telegram-ID herausfinden:
   - @userinfobot in Telegram starten
   - ID kopieren
2. In .env eintragen:
   ```env
   TELEGRAM_ADMIN_IDS=123456789,987654321
   ```

### Problem: "Commands not working"

**Bot-Commands registrieren:**
```bash
# Im Backend-Ordner
cd "⚙️ backend"
npm run telegram:setup-commands

# Oder manuell via BotFather
# /setcommands senden und Liste einfügen
```

---

## 🎨 KI Style Creator Probleme

### Problem: "AI service not starting"

**Resource-Requirements:**
- **Mindestens 4GB RAM** für KI-Container
- **10GB freier Speicher** für Modelle

**Container-Status prüfen:**
```bash
docker ps | grep ai-creator
docker logs dressforp_ai

# Mehr RAM zuweisen
docker-compose up ai-creator --scale ai-creator=1 --memory=4g
```

### Problem: "Image generation fails"

**API-Token prüfen:**
```env
# In .env Datei
HUGGINGFACE_API_TOKEN=hf_...
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...
```

**Hugging Face Token erstellen:**
1. https://huggingface.co anmelden
2. Settings → Access Tokens
3. "New token" erstellen
4. Token in .env eintragen

### Problem: "Generated images poor quality"

**Prompt-Optimierung:**
```
❌ Schlecht: "schönes kleid"
✅ Besser: "professional fashion photography of elegant red evening dress, studio lighting, white background, high quality, commercial photo"
```

**Modell-Parameter anpassen:**
- **Steps**: 50-100 (höher = besser)
- **Guidance Scale**: 7-15
- **Size**: 512x512 oder 768x768

---

## 🔧 System-Diagnose

### Automatische Diagnose

```bash
# System-Status prüfen
./🔧 scripts/system-check.sh

# Logs sammeln
./🔧 scripts/collect-logs.sh

# Performance-Test
./🔧 scripts/performance-test.sh
```

### Manuelle Diagnose

**Container-Status:**
```bash
# Alle Container anzeigen
docker ps -a

# Logs aller Services
docker-compose logs

# Resource-Verbrauch
docker stats
```

**Netzwerk-Tests:**
```bash
# Port-Tests
curl http://localhost:3000  # Frontend
curl http://localhost:3001/api/health  # Backend
curl http://localhost:5678/healthz  # n8n
curl http://localhost:7860/health  # AI Creator
```

**Disk-Space prüfen:**
```bash
# Verfügbarer Speicher
df -h

# Docker-Images Größe
docker images

# Logs-Größe
du -sh logs/
```

### System-Info sammeln

**Für Support-Anfragen:**
```bash
# System-Info exportieren
cat > support-info.txt << EOF
=== DRESSFORP SYSTEM INFO ===
Date: $(date)
OS: $(uname -a)
Node: $(node --version 2>/dev/null || echo "Not installed")
Docker: $(docker --version 2>/dev/null || echo "Not installed")
RAM: $(free -h 2>/dev/null || echo "Unknown")
Disk: $(df -h . | tail -1)

=== ENVIRONMENT ===
$(cat .env | grep -v SECRET | grep -v PASSWORD | grep -v TOKEN)

=== DOCKER STATUS ===
$(docker ps -a)

=== LOGS (last 50 lines) ===
$(tail -50 logs/backend.log 2>/dev/null || echo "No backend logs")
EOF

echo "System-Info gespeichert in: support-info.txt"
```

---

## 🆘 Hilfe anfordern

### Bevor du Support kontaktierst:

1. **Dieses Troubleshooting durchlesen**
2. **System-Diagnose ausführen**
3. **Screenshots von Fehlern machen**
4. **System-Info sammeln**

### Support-Kanäle:

**🆓 Community:**
- **Discord**: https://discord.gg/dressforp
- **GitHub Issues**: https://github.com/dressforp/issues
- **Telegram**: @dressforp_support

**💎 Premium Support:**
- **E-Mail**: support@dressforp.com
- **1:1 Video-Call**: Buchung über Website
- **Priority Support**: 4h Response-Zeit

### Support-Request Template:

```
🐛 PROBLEM BESCHREIBUNG
Was ist passiert? Was sollte passieren?

🖥️ SYSTEM-INFO
OS: Windows 11 / macOS Big Sur / Ubuntu 20.04
Browser: Chrome 91 / Firefox 89 / Safari 14
Node: v18.17.0
Docker: v20.10.7

📋 SCHRITTE ZUM REPRODUZIEREN
1. Gehe zu...
2. Klicke auf...
3. Fehler tritt auf bei...

💾 LOGS/FEHLERMELDUNGEN
[Logs hier einfügen oder als Datei anhängen]

📷 SCREENSHOTS
[Falls vorhanden]

✅ BEREITS VERSUCHT
- System neugestartet
- Cache geleert
- Logs geprüft
- [andere Schritte...]
```

---

**💡 Tipp: Die meisten Probleme lösen sich durch einen einfachen Neustart!**

*Dieses Troubleshooting-Guide wird regelmäßig mit neuen Lösungen aktualisiert.*
