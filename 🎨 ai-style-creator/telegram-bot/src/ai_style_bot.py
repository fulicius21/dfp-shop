#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator - Telegram Bot
===============================================

Telegram Bot für mobile Verwaltung des AI Style Creator Systems:
- Upload und Review von Bildern direkt über Telegram
- Schnelle Genehmigung und Ablehnung von AI-generierten Inhalten
- Status-Updates und Benachrichtigungen
- Admin-Kommandos für Systemverwaltung

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import os
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import requests
from io import BytesIO

import telegram
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaPhoto
from telegram.ext import (
    Application, 
    CommandHandler, 
    MessageHandler, 
    CallbackQueryHandler,
    ContextTypes,
    filters
)

# Configuration
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
ADMIN_CHAT_IDS = os.getenv('TELEGRAM_ADMIN_CHAT_IDS', '').split(',')
AI_ENGINE_URL = os.getenv('AI_ENGINE_URL', 'http://localhost:8001')
AI_ENGINE_API_KEY = os.getenv('AI_ENGINE_API_KEY')
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:3000/api')
BACKEND_API_TOKEN = os.getenv('BACKEND_API_TOKEN')
DASHBOARD_URL = os.getenv('DASHBOARD_URL', 'http://localhost:3001')

# Logging Setup
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class AIStyleBot:
    """
    Hauptklasse für den AI Style Creator Telegram Bot
    """
    
    def __init__(self):
        """Initialisierung des Bots"""
        self.application = None
        self.api_session = requests.Session()
        self.api_session.headers.update({
            'Authorization': f'Bearer {BACKEND_API_TOKEN}',
            'X-API-Key': AI_ENGINE_API_KEY,
            'Content-Type': 'application/json'
        })
        
        # Bot-Status
        self.active_uploads: Dict[str, Dict] = {}
        self.review_sessions: Dict[str, Dict] = {}
        
        logger.info("AI Style Creator Bot initialized")

    async def initialize(self):
        """Asynchrone Initialisierung"""
        try:
            # Telegram Application erstellen
            self.application = Application.builder().token(BOT_TOKEN).build()
            
            # Handler registrieren
            self._register_handlers()
            
            logger.info("✅ Bot successfully initialized")
            return True
            
        except Exception as e:
            logger.error(f"❌ Bot initialization failed: {e}")
            return False

    def _register_handlers(self):
        """Registriere alle Command und Message Handler"""
        
        # Command Handlers
        self.application.add_handler(CommandHandler("start", self.cmd_start))
        self.application.add_handler(CommandHandler("help", self.cmd_help))
        self.application.add_handler(CommandHandler("status", self.cmd_status))
        self.application.add_handler(CommandHandler("queue", self.cmd_queue))
        self.application.add_handler(CommandHandler("stats", self.cmd_stats))
        self.application.add_handler(CommandHandler("upload", self.cmd_upload))
        self.application.add_handler(CommandHandler("review", self.cmd_review))
        self.application.add_handler(CommandHandler("approve", self.cmd_approve))
        self.application.add_handler(CommandHandler("reject", self.cmd_reject))
        self.application.add_handler(CommandHandler("settings", self.cmd_settings))
        
        # Message Handlers
        self.application.add_handler(MessageHandler(filters.PHOTO, self.handle_photo))
        self.application.add_handler(MessageHandler(filters.Document.IMAGE, self.handle_document))
        
        # Callback Query Handler für Inline Keyboards
        self.application.add_handler(CallbackQueryHandler(self.handle_callback))
        
        logger.info("All handlers registered")

    def _check_admin_access(self, user_id: str) -> bool:
        """Prüfe Admin-Berechtigung"""
        return str(user_id) in ADMIN_CHAT_IDS

    async def _get_ai_status(self) -> Dict[str, Any]:
        """Hole AI Engine Status"""
        try:
            response = self.api_session.get(f'{AI_ENGINE_URL}/health')
            if response.status_code == 200:
                return response.json()
            return {"status": "unhealthy", "error": "API not responding"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    async def _get_queue_status(self) -> Dict[str, Any]:
        """Hole Processing Queue Status"""
        try:
            response = self.api_session.get(f'{BACKEND_API_URL}/queue/status')
            if response.status_code == 200:
                return response.json()
            return {"pending": 0, "processing": 0, "completed": 0}
        except Exception as e:
            logger.error(f"Failed to get queue status: {e}")
            return {"pending": 0, "processing": 0, "completed": 0}

    async def _get_pending_reviews(self) -> List[Dict[str, Any]]:
        """Hole ausstehende Reviews"""
        try:
            response = self.api_session.get(f'{BACKEND_API_URL}/reviews/pending')
            if response.status_code == 200:
                return response.json().get('items', [])
            return []
        except Exception as e:
            logger.error(f"Failed to get pending reviews: {e}")
            return []

    # ============================================================================
    # Command Handlers
    # ============================================================================

    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Start-Kommando"""
        user_id = update.effective_user.id
        
        if not self._check_admin_access(user_id):
            await update.message.reply_text(
                "❌ Dieser Bot ist nur für autorisierte Administratoren zugänglich."
            )
            return
        
        welcome_message = f"""
🎨 **DressForPleasure AI Style Creator Bot**

Willkommen beim AI Style Creator Bot! Mit diesem Bot können Sie:

📸 **Upload & Processing**
• Produktbilder direkt über Telegram hochladen
• KI-Verarbeitung mit verschiedenen Stilen starten
• Status der Verarbeitung verfolgen

✅ **Review & Approval**
• Ausstehende Reviews anzeigen
• Bilder direkt genehmigen oder ablehnen
• Qualitätsbewertungen abgeben

📊 **Monitoring**
• System-Status überprüfen
• Warteschlange einsehen
• Performance-Statistiken

**Verfügbare Kommandos:**
/help - Alle Kommandos anzeigen
/status - System-Status prüfen
/queue - Warteschlange anzeigen
/review - Ausstehende Reviews
/upload - Bild hochladen
/stats - Statistiken anzeigen

Senden Sie einfach ein Bild, um mit der KI-Verarbeitung zu beginnen! 🚀
        """
        
        await update.message.reply_text(
            welcome_message,
            parse_mode='Markdown',
            disable_web_page_preview=True
        )

    async def cmd_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Hilfe-Kommando"""
        help_text = """
🔧 **AI Style Creator Bot - Kommandos**

**📱 Basis-Kommandos:**
/start - Bot starten und Begrüßung
/help - Diese Hilfe anzeigen
/status - System-Status prüfen

**📸 Upload & Processing:**
/upload - Bild-Upload starten
/queue - Verarbeitungs-Warteschlange
/stats - Performance-Statistiken

**✅ Review & Approval:**
/review - Ausstehende Reviews anzeigen
/approve <id> - Element genehmigen
/reject <id> - Element ablehnen

**⚙️ Administration:**
/settings - Bot-Einstellungen

**📱 Interaktive Nutzung:**
• Senden Sie ein Bild → Automatische KI-Verarbeitung
• Tippen Sie auf Inline-Buttons für schnelle Aktionen
• Nutzen Sie Callback-Kommandos für erweiterte Funktionen

**🔗 Links:**
• [Dashboard öffnen]({DASHBOARD_URL})
• [Review Center]({DASHBOARD_URL}/review)
• [Analytics]({DASHBOARD_URL}/analytics)
        """
        
        await update.message.reply_text(
            help_text,
            parse_mode='Markdown',
            disable_web_page_preview=True
        )

    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """System-Status anzeigen"""
        if not self._check_admin_access(update.effective_user.id):
            await update.message.reply_text("❌ Keine Berechtigung.")
            return
        
        # AI Engine Status
        ai_status = await self._get_ai_status()
        queue_status = await self._get_queue_status()
        
        # Status-Emojis
        ai_emoji = "✅" if ai_status.get("status") == "healthy" else "❌"
        
        status_message = f"""
🖥️ **System Status - {datetime.now().strftime('%H:%M:%S')}**

**🤖 AI Engine:** {ai_emoji} {ai_status.get('status', 'unknown').title()}
• Verarbeitungsmodelle: {'✅ Geladen' if ai_status.get('components', {}).get('ai_processor') else '❌ Fehler'}
• Content Generator: {'✅ Bereit' if ai_status.get('components', {}).get('content_generator') else '❌ Fehler'}

**📋 Verarbeitungs-Queue:**
• Wartend: {queue_status.get('pending', 0)} Jobs
• Aktiv: {queue_status.get('processing', 0)} Jobs
• Abgeschlossen: {queue_status.get('completed', 0)} Jobs heute

**⚡ Performance:**
• Ø Verarbeitungszeit: {queue_status.get('avg_processing_time', 'N/A')}
• Erfolgsrate: {queue_status.get('success_rate', 'N/A')}%
• Letzte Aktivität: {queue_status.get('last_activity', 'N/A')}
        """
        
        # Inline Buttons für Aktionen
        keyboard = [
            [
                InlineKeyboardButton("🔄 Aktualisieren", callback_data="refresh_status"),
                InlineKeyboardButton("📊 Details", url=f"{DASHBOARD_URL}/analytics")
            ],
            [
                InlineKeyboardButton("📋 Queue anzeigen", callback_data="show_queue"),
                InlineKeyboardButton("✅ Reviews", callback_data="show_reviews")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            status_message,
            parse_mode='Markdown',
            reply_markup=reply_markup,
            disable_web_page_preview=True
        )

    async def cmd_queue(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Warteschlange anzeigen"""
        if not self._check_admin_access(update.effective_user.id):
            await update.message.reply_text("❌ Keine Berechtigung.")
            return
        
        try:
            # Aktuelle Jobs abrufen
            response = self.api_session.get(f'{BACKEND_API_URL}/queue/jobs')
            
            if response.status_code != 200:
                await update.message.reply_text("❌ Fehler beim Abrufen der Warteschlange.")
                return
            
            jobs_data = response.json()
            pending_jobs = jobs_data.get('pending', [])
            active_jobs = jobs_data.get('active', [])
            
            if not pending_jobs and not active_jobs:
                await update.message.reply_text(
                    "📭 **Warteschlange ist leer**\n\nKeine Jobs in Bearbeitung oder wartend."
                )
                return
            
            queue_message = "📋 **Verarbeitungs-Warteschlange**\n\n"
            
            # Aktive Jobs
            if active_jobs:
                queue_message += "⚡ **Aktiv in Bearbeitung:**\n"
                for job in active_jobs[:5]:  # Maximal 5 anzeigen
                    progress = job.get('progress', 0)
                    filename = job.get('filename', 'Unknown')[:20]
                    style = job.get('style', 'default')
                    
                    progress_bar = "█" * (progress // 10) + "░" * (10 - progress // 10)
                    queue_message += f"• {filename} ({style})\n  {progress_bar} {progress}%\n"
                
                if len(active_jobs) > 5:
                    queue_message += f"... und {len(active_jobs) - 5} weitere\n"
                queue_message += "\n"
            
            # Wartende Jobs
            if pending_jobs:
                queue_message += "⏳ **Wartend:**\n"
                for i, job in enumerate(pending_jobs[:10], 1):  # Maximal 10 anzeigen
                    filename = job.get('filename', 'Unknown')[:20]
                    style = job.get('style', 'default')
                    created_at = job.get('created_at', '')
                    
                    queue_message += f"{i}. {filename} ({style})\n   📅 {created_at}\n"
                
                if len(pending_jobs) > 10:
                    queue_message += f"... und {len(pending_jobs) - 10} weitere\n"
            
            # Aktions-Buttons
            keyboard = [
                [
                    InlineKeyboardButton("🔄 Aktualisieren", callback_data="refresh_queue"),
                    InlineKeyboardButton("📊 Dashboard", url=f"{DASHBOARD_URL}/queue")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                queue_message,
                parse_mode='Markdown',
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )
            
        except Exception as e:
            logger.error(f"Error in cmd_queue: {e}")
            await update.message.reply_text("❌ Fehler beim Abrufen der Warteschlange.")

    async def cmd_review(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Ausstehende Reviews anzeigen"""
        if not self._check_admin_access(update.effective_user.id):
            await update.message.reply_text("❌ Keine Berechtigung.")
            return
        
        try:
            pending_reviews = await self._get_pending_reviews()
            
            if not pending_reviews:
                await update.message.reply_text(
                    "✅ **Keine ausstehenden Reviews**\n\nAlle Elemente sind bereits überprüft!"
                )
                return
            
            review_message = f"✅ **Ausstehende Reviews ({len(pending_reviews)})**\n\n"
            
            for i, review in enumerate(pending_reviews[:5], 1):
                filename = review.get('filename', 'Unknown')[:20]
                style = review.get('style', 'default')
                quality_score = review.get('ai_quality_score', 0)
                created_at = review.get('processed_at', '')
                
                quality_emoji = "🌟" if quality_score >= 90 else "⭐" if quality_score >= 75 else "📝"
                
                review_message += f"{i}. {quality_emoji} **{filename}**\n"
                review_message += f"   🎨 Stil: {style}\n"
                review_message += f"   📊 Qualität: {quality_score}/100\n"
                review_message += f"   📅 {created_at}\n\n"
            
            if len(pending_reviews) > 5:
                review_message += f"... und {len(pending_reviews) - 5} weitere\n\n"
            
            # Quick-Action Buttons für die ersten Reviews
            keyboard = []
            
            # Erste 3 Reviews für Quick Actions
            for i, review in enumerate(pending_reviews[:3]):
                review_id = review.get('id')
                filename = review.get('filename', 'Unknown')[:15]
                
                keyboard.append([
                    InlineKeyboardButton(
                        f"✅ {filename}", 
                        callback_data=f"approve_{review_id}"
                    ),
                    InlineKeyboardButton(
                        f"❌ {filename}", 
                        callback_data=f"reject_{review_id}"
                    )
                ])
            
            # Navigation Buttons
            keyboard.append([
                InlineKeyboardButton("🔄 Aktualisieren", callback_data="refresh_reviews"),
                InlineKeyboardButton("📱 Review Center", url=f"{DASHBOARD_URL}/review")
            ])
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                review_message,
                parse_mode='Markdown',
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )
            
        except Exception as e:
            logger.error(f"Error in cmd_review: {e}")
            await update.message.reply_text("❌ Fehler beim Abrufen der Reviews.")

    async def cmd_stats(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Statistiken anzeigen"""
        if not self._check_admin_access(update.effective_user.id):
            await update.message.reply_text("❌ Keine Berechtigung.")
            return
        
        try:
            # Stats vom Backend abrufen
            response = self.api_session.get(f'{BACKEND_API_URL}/stats/dashboard')
            
            if response.status_code != 200:
                await update.message.reply_text("❌ Fehler beim Abrufen der Statistiken.")
                return
            
            stats = response.json()
            
            stats_message = f"""
📊 **AI Style Creator Statistiken**

**📸 Heute:**
• Verarbeitet: {stats.get('today_processed', 0)} Bilder
• Genehmigt: {stats.get('today_approved', 0)} Elemente
• Durchschnittliche Qualität: {stats.get('avg_quality', 0)}/100

**📈 Diese Woche:**
• Gesamt verarbeitet: {stats.get('week_processed', 0)}
• Erfolgsrate: {stats.get('success_rate', 0)}%
• Ø Verarbeitungszeit: {stats.get('avg_processing_time', 0)} Min

**🎨 Beliebteste Stile:**
• Studio: {stats.get('style_stats', {}).get('studio', 0)}x
• Street: {stats.get('style_stats', {}).get('street', 0)}x
• Luxury: {stats.get('style_stats', {}).get('luxury', 0)}x

**⚡ Performance:**
• Uptime: {stats.get('uptime_percent', 0)}%
• Letzte 24h Fehler: {stats.get('error_count_24h', 0)}
            """
            
            keyboard = [
                [
                    InlineKeyboardButton("📊 Detaillierte Analytics", url=f"{DASHBOARD_URL}/analytics"),
                    InlineKeyboardButton("🔄 Aktualisieren", callback_data="refresh_stats")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                stats_message,
                parse_mode='Markdown',
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )
            
        except Exception as e:
            logger.error(f"Error in cmd_stats: {e}")
            await update.message.reply_text("❌ Fehler beim Abrufen der Statistiken.")

    # ============================================================================
    # Image Handling
    # ============================================================================

    async def handle_photo(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle hochgeladene Fotos"""
        if not self._check_admin_access(update.effective_user.id):
            await update.message.reply_text("❌ Keine Berechtigung.")
            return
        
        try:
            # Foto-Info abrufen
            photo = update.message.photo[-1]  # Höchste Auflösung
            file_id = photo.file_id
            file_size = photo.file_size
            
            # Datei vom Telegram Server holen
            file = await context.bot.get_file(file_id)
            
            # Datei-Name generieren
            filename = f"telegram_upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            
            # Style-Auswahl anbieten
            keyboard = [
                [
                    InlineKeyboardButton("🏢 Studio", callback_data=f"process_studio_{file_id}"),
                    InlineKeyboardButton("🌆 Street", callback_data=f"process_street_{file_id}")
                ],
                [
                    InlineKeyboardButton("✨ Luxury", callback_data=f"process_luxury_{file_id}"),
                    InlineKeyboardButton("🎨 Artistic", callback_data=f"process_artistic_{file_id}")
                ],
                [
                    InlineKeyboardButton("📱 Quick Process", callback_data=f"process_quick_{file_id}")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            upload_message = f"""
📸 **Bild erhalten!**

📄 **Details:**
• Größe: {file_size / 1024:.1f} KB
• Format: JPEG
• Dateiname: {filename}

🎨 **Wählen Sie einen Verarbeitungsstil:**
            """
            
            # Upload-Info für spätere Verarbeitung speichern
            self.active_uploads[file_id] = {
                'file': file,
                'filename': filename,
                'file_size': file_size,
                'user_id': update.effective_user.id,
                'uploaded_at': datetime.now().isoformat()
            }
            
            await update.message.reply_text(
                upload_message,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
            
        except Exception as e:
            logger.error(f"Error handling photo: {e}")
            await update.message.reply_text("❌ Fehler beim Verarbeiten des Bildes.")

    async def handle_document(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle Dokument-Uploads (Bilder)"""
        if not self._check_admin_access(update.effective_user.id):
            await update.message.reply_text("❌ Keine Berechtigung.")
            return
        
        document = update.message.document
        
        # Prüfe ob es ein Bild ist
        if not document.mime_type.startswith('image/'):
            await update.message.reply_text("❌ Bitte senden Sie nur Bilddateien.")
            return
        
        # Verwende gleiche Logik wie für Fotos
        await self.handle_photo(update, context)

    # ============================================================================
    # Callback Handlers
    # ============================================================================

    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle Inline Keyboard Callbacks"""
        query = update.callback_query
        await query.answer()
        
        callback_data = query.data
        
        try:
            # Style-Processing Callbacks
            if callback_data.startswith('process_'):
                await self._handle_processing_callback(query, callback_data)
            
            # Review Callbacks
            elif callback_data.startswith('approve_'):
                await self._handle_approve_callback(query, callback_data)
            elif callback_data.startswith('reject_'):
                await self._handle_reject_callback(query, callback_data)
            
            # Refresh Callbacks
            elif callback_data == 'refresh_status':
                await self._handle_refresh_status(query)
            elif callback_data == 'refresh_queue':
                await self._handle_refresh_queue(query)
            elif callback_data == 'refresh_reviews':
                await self._handle_refresh_reviews(query)
            elif callback_data == 'refresh_stats':
                await self._handle_refresh_stats(query)
            
            # Navigation Callbacks
            elif callback_data == 'show_queue':
                await self._handle_show_queue(query)
            elif callback_data == 'show_reviews':
                await self._handle_show_reviews(query)
            
            else:
                await query.edit_message_text("❌ Unbekannte Aktion.")
                
        except Exception as e:
            logger.error(f"Error in callback handler: {e}")
            await query.edit_message_text("❌ Fehler bei der Verarbeitung.")

    async def _handle_processing_callback(self, query, callback_data: str):
        """Handle Style Processing Callback"""
        try:
            # Parse callback data
            parts = callback_data.split('_')
            style = parts[1]
            file_id = '_'.join(parts[2:])
            
            # Upload-Info abrufen
            upload_info = self.active_uploads.get(file_id)
            if not upload_info:
                await query.edit_message_text("❌ Upload-Information nicht gefunden.")
                return
            
            # Processing starten
            await query.edit_message_text(
                f"⚡ **Processing gestartet**\n\n🎨 Stil: {style.title()}\n📄 Datei: {upload_info['filename']}\n\n⏳ Geschätzte Zeit: 2-3 Minuten...",
                parse_mode='Markdown'
            )
            
            # Datei herunterladen
            file_bytes = BytesIO()
            await upload_info['file'].download_to_memory(file_bytes)
            file_bytes.seek(0)
            
            # AI Processing API aufrufen
            files = {
                'file': (upload_info['filename'], file_bytes, 'image/jpeg')
            }
            
            data = {
                'style': style,
                'quality': 'high',
                'enhance_colors': 'true',
                'generate_variants': 'true'
            }
            
            headers = {
                'X-API-Key': AI_ENGINE_API_KEY
            }
            
            response = requests.post(
                f'{AI_ENGINE_URL}/api/v1/process/image',
                files=files,
                data=data,
                headers=headers,
                timeout=300
            )
            
            if response.status_code == 200:
                result = response.json()
                job_id = result.get('job_id')
                
                # Job-Status Message mit Tracking
                keyboard = [
                    [InlineKeyboardButton("📊 Status prüfen", callback_data=f"check_job_{job_id}")]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await query.edit_message_text(
                    f"✅ **Processing gestartet**\n\n🆔 Job-ID: {job_id}\n🎨 Stil: {style.title()}\n⏱️ Geschätzte Zeit: {result.get('estimated_time', 120)} Sekunden\n\n💡 Sie erhalten eine Benachrichtigung wenn die Verarbeitung abgeschlossen ist.",
                    parse_mode='Markdown',
                    reply_markup=reply_markup
                )
                
                # Upload-Info aufräumen
                del self.active_uploads[file_id]
                
            else:
                await query.edit_message_text(
                    f"❌ **Processing fehlgeschlagen**\n\nFehler: {response.status_code}\nBitte versuchen Sie es erneut oder kontaktieren Sie den Support."
                )
                
        except Exception as e:
            logger.error(f"Error in processing callback: {e}")
            await query.edit_message_text("❌ Fehler beim Starten der Verarbeitung.")

    async def _handle_approve_callback(self, query, callback_data: str):
        """Handle Approve Callback"""
        try:
            review_id = callback_data.split('_')[1]
            
            # Approval API aufrufen
            response = self.api_session.post(
                f'{BACKEND_API_URL}/reviews/{review_id}/approve',
                json={'quality_rating': 5, 'review_notes': 'Approved via Telegram Bot'}
            )
            
            if response.status_code == 200:
                await query.edit_message_text(
                    f"✅ **Element genehmigt**\n\nReview-ID: {review_id}\nStatus: Zur Veröffentlichung freigegeben"
                )
            else:
                await query.edit_message_text("❌ Genehmigung fehlgeschlagen.")
                
        except Exception as e:
            logger.error(f"Error in approve callback: {e}")
            await query.edit_message_text("❌ Fehler bei der Genehmigung.")

    async def _handle_reject_callback(self, query, callback_data: str):
        """Handle Reject Callback"""
        try:
            review_id = callback_data.split('_')[1]
            
            # Rejection API aufrufen
            response = self.api_session.post(
                f'{BACKEND_API_URL}/reviews/{review_id}/reject',
                json={'reason': 'Rejected via Telegram Bot', 'suggestions': 'Please review and reprocess'}
            )
            
            if response.status_code == 200:
                await query.edit_message_text(
                    f"❌ **Element abgelehnt**\n\nReview-ID: {review_id}\nStatus: Zur Überarbeitung markiert"
                )
            else:
                await query.edit_message_text("❌ Ablehnung fehlgeschlagen.")
                
        except Exception as e:
            logger.error(f"Error in reject callback: {e}")
            await query.edit_message_text("❌ Fehler bei der Ablehnung.")

    # ============================================================================
    # Refresh Handlers
    # ============================================================================

    async def _handle_refresh_status(self, query):
        """Refresh System Status"""
        # Implementierung ähnlich wie cmd_status, aber als Edit
        ai_status = await self._get_ai_status()
        queue_status = await self._get_queue_status()
        
        ai_emoji = "✅" if ai_status.get("status") == "healthy" else "❌"
        
        status_message = f"""
🖥️ **System Status - {datetime.now().strftime('%H:%M:%S')}** *(aktualisiert)*

**🤖 AI Engine:** {ai_emoji} {ai_status.get('status', 'unknown').title()}
• Verarbeitungsmodelle: {'✅ Geladen' if ai_status.get('components', {}).get('ai_processor') else '❌ Fehler'}
• Content Generator: {'✅ Bereit' if ai_status.get('components', {}).get('content_generator') else '❌ Fehler'}

**📋 Verarbeitungs-Queue:**
• Wartend: {queue_status.get('pending', 0)} Jobs
• Aktiv: {queue_status.get('processing', 0)} Jobs
• Abgeschlossen: {queue_status.get('completed', 0)} Jobs heute
        """
        
        keyboard = [
            [
                InlineKeyboardButton("🔄 Aktualisieren", callback_data="refresh_status"),
                InlineKeyboardButton("📊 Details", url=f"{DASHBOARD_URL}/analytics")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            status_message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )

    async def run(self):
        """Bot starten"""
        try:
            logger.info("🚀 Starting AI Style Creator Telegram Bot...")
            
            # Initialisierung
            success = await self.initialize()
            if not success:
                logger.error("❌ Bot initialization failed")
                return
            
            # Bot starten
            await self.application.run_polling(
                stop_signals=None,
                close_loop=False
            )
            
        except Exception as e:
            logger.error(f"❌ Bot run failed: {e}")
        finally:
            logger.info("👋 Bot stopped")


# ============================================================================
# Main Entry Point
# ============================================================================

async def main():
    """Hauptfunktion"""
    # Validiere Konfiguration
    if not BOT_TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN not set")
        return
    
    if not ADMIN_CHAT_IDS or ADMIN_CHAT_IDS == ['']:
        logger.error("❌ TELEGRAM_ADMIN_CHAT_IDS not set")
        return
    
    # Bot erstellen und starten
    bot = AIStyleBot()
    await bot.run()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Bot stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
