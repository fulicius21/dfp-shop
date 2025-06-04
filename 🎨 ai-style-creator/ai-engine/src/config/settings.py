#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator - Configuration Settings
==========================================================

Zentrale Konfiguration für das AI Style Creator System.
Unterstützt Development, Testing und Production Environments.

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import os
from functools import lru_cache
from typing import List, Optional
from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    """
    Anwendungseinstellungen mit Environment Variables
    """
    
    # ================================================
    # Grundlegende Anwendungseinstellungen
    # ================================================
    
    APP_NAME: str = Field(default="DressForPleasure AI Style Creator", description="Anwendungsname")
    VERSION: str = Field(default="1.0.0", description="Anwendungsversion")
    DEBUG: bool = Field(default=False, description="Debug-Modus aktivieren")
    ENVIRONMENT: str = Field(default="production", description="Umgebung (development, testing, production)")
    
    # Server Konfiguration
    HOST: str = Field(default="0.0.0.0", description="Server Host")
    PORT: int = Field(default=8001, description="Server Port")
    WORKERS: int = Field(default=4, description="Anzahl Worker-Prozesse")
    
    # ================================================
    # Sicherheit & Authentifizierung
    # ================================================
    
    SECRET_KEY: str = Field(..., description="Secret Key für JWT Token")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT Algorithmus")
    JWT_EXPIRATION_HOURS: int = Field(default=24, description="JWT Token Gültigkeitsdauer in Stunden")
    
    API_KEY_HEADER: str = Field(default="X-API-Key", description="API Key Header Name")
    ADMIN_API_KEY: Optional[str] = Field(default=None, description="Admin API Key")
    
    # CORS & Security
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="Erlaubte CORS Origins"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "0.0.0.0"],
        description="Erlaubte Hosts"
    )
    
    # ================================================
    # Datenbankverbindungen
    # ================================================
    
    # PostgreSQL (für Metadaten und Job-Status)
    DATABASE_URL: str = Field(
        default="postgresql://postgres:password@localhost:5432/dressforp_ai",
        description="PostgreSQL Datenbankverbindung"
    )
    
    # Redis (für Caching und Job Queue)
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis-Verbindung für Caching und Jobs"
    )
    
    # ================================================
    # File Storage & Media
    # ================================================
    
    # Lokaler Dateispeicher
    UPLOAD_DIR: str = Field(default="./uploads", description="Upload-Verzeichnis")
    PROCESSED_DIR: str = Field(default="./processed", description="Verarbeitete Bilder")
    TEMP_DIR: str = Field(default="./temp", description="Temporäre Dateien")
    
    # Cloud Storage (Optional)
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, description="AWS Access Key")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, description="AWS Secret Key")
    AWS_BUCKET_NAME: Optional[str] = Field(default=None, description="AWS S3 Bucket")
    AWS_REGION: str = Field(default="eu-central-1", description="AWS Region")
    
    # Google Cloud Storage (Optional)
    GCP_PROJECT_ID: Optional[str] = Field(default=None, description="Google Cloud Project ID")
    GCP_BUCKET_NAME: Optional[str] = Field(default=None, description="Google Cloud Storage Bucket")
    GCP_CREDENTIALS_PATH: Optional[str] = Field(default=None, description="GCP Credentials JSON Pfad")
    
    # ================================================
    # KI-Modell Konfiguration
    # ================================================
    
    # Hugging Face
    HUGGINGFACE_TOKEN: Optional[str] = Field(default=None, description="Hugging Face API Token")
    HF_CACHE_DIR: str = Field(default="./models/huggingface", description="Hugging Face Model Cache")
    
    # Stable Diffusion Modelle
    SD_MODEL_NAME: str = Field(
        default="runwayml/stable-diffusion-v1-5",
        description="Stable Diffusion Modell"
    )
    SD_CONTROLNET_MODEL: str = Field(
        default="lllyasviel/sd-controlnet-canny",
        description="ControlNet Modell für präzise Kontrolle"
    )
    
    # Content-Generierung Modelle
    CONTENT_MODEL_NAME: str = Field(
        default="microsoft/DialoGPT-medium",
        description="Modell für Content-Generierung"
    )
    BLIP_MODEL_NAME: str = Field(
        default="Salesforce/blip-image-captioning-base",
        description="BLIP Modell für Bildanalyse"
    )
    
    # Modell-Einstellungen
    MAX_IMAGE_SIZE: int = Field(default=1024, description="Maximale Bildgröße für Processing")
    MODEL_DEVICE: str = Field(default="auto", description="Device für Modelle (auto, cpu, cuda)")
    USE_HALF_PRECISION: bool = Field(default=True, description="Half Precision für GPU-Optimierung")
    
    # ================================================
    # Processing Einstellungen
    # ================================================
    
    # Job Queue
    MAX_CONCURRENT_JOBS: int = Field(default=4, description="Maximale parallele Jobs")
    JOB_TIMEOUT_SECONDS: int = Field(default=600, description="Job Timeout in Sekunden")
    MAX_BATCH_SIZE: int = Field(default=10, description="Maximale Batch-Größe")
    
    # Bildverarbeitung
    SUPPORTED_FORMATS: List[str] = Field(
        default=["jpg", "jpeg", "png", "webp"],
        description="Unterstützte Bildformate"
    )
    MAX_FILE_SIZE_MB: int = Field(default=10, description="Maximale Dateigröße in MB")
    
    # Content-Generierung
    MAX_DESCRIPTION_LENGTH: int = Field(default=500, description="Maximale Beschreibungslänge")
    SUPPORTED_LANGUAGES: List[str] = Field(
        default=["de", "en"],
        description="Unterstützte Sprachen"
    )
    
    # ================================================
    # Integration APIs
    # ================================================
    
    # DressForPleasure Backend
    BACKEND_API_URL: str = Field(
        default="http://localhost:3000/api",
        description="Backend API URL"
    )
    BACKEND_API_KEY: Optional[str] = Field(default=None, description="Backend API Key")
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(default=None, description="Telegram Bot Token")
    TELEGRAM_ADMIN_CHAT_ID: Optional[str] = Field(default=None, description="Admin Chat ID")
    
    # n8n Webhook URLs
    N8N_WEBHOOK_BASE_URL: str = Field(
        default="http://localhost:5678/webhook",
        description="n8n Webhook Base URL"
    )
    
    # ================================================
    # Monitoring & Logging
    # ================================================
    
    # Prometheus Metrics
    ENABLE_METRICS: bool = Field(default=True, description="Prometheus Metrics aktivieren")
    METRICS_PORT: int = Field(default=8002, description="Metrics Server Port")
    
    # Sentry Error Tracking
    SENTRY_DSN: Optional[str] = Field(default=None, description="Sentry DSN für Error Tracking")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Log Level")
    LOG_FORMAT: str = Field(default="json", description="Log Format (json, text)")
    
    # ================================================
    # Performance Tuning
    # ================================================
    
    # Caching
    CACHE_TTL_SECONDS: int = Field(default=3600, description="Cache TTL in Sekunden")
    CACHE_MAX_SIZE: int = Field(default=1000, description="Maximale Cache-Einträge")
    
    # Processing Limits
    CPU_CORES: Optional[int] = Field(default=None, description="CPU Cores für Processing")
    MEMORY_LIMIT_GB: Optional[int] = Field(default=None, description="Memory Limit in GB")
    
    # ================================================
    # DSGVO & Compliance
    # ================================================
    
    # Datenaufbewahrung
    DATA_RETENTION_DAYS: int = Field(default=30, description="Datenaufbewahrung in Tagen")
    AUTO_DELETE_PROCESSED: bool = Field(
        default=True, 
        description="Automatisches Löschen verarbeiteter Dateien"
    )
    DELETE_AFTER_DAYS: int = Field(default=7, description="Löschung nach X Tagen")
    
    # Privacy
    ANONYMIZE_METADATA: bool = Field(default=True, description="Metadaten anonymisieren")
    LOG_RETENTION_DAYS: int = Field(default=30, description="Log-Aufbewahrung in Tagen")
    
    # ================================================
    # Feature Flags
    # ================================================
    
    ENABLE_BATCH_PROCESSING: bool = Field(default=True, description="Batch-Processing aktivieren")
    ENABLE_CONTENT_GENERATION: bool = Field(default=True, description="Content-Generierung aktivieren")
    ENABLE_STYLE_TRANSFER: bool = Field(default=True, description="Style Transfer aktivieren")
    ENABLE_BACKGROUND_REMOVAL: bool = Field(default=True, description="Background Removal aktivieren")
    ENABLE_TELEGRAM_BOT: bool = Field(default=True, description="Telegram Bot aktivieren")
    
    # Experimentelle Features
    ENABLE_EXPERIMENTAL_MODELS: bool = Field(default=False, description="Experimentelle Modelle")
    ENABLE_GPU_OPTIMIZATION: bool = Field(default=True, description="GPU-Optimierung")
    
    # ================================================
    # Validators
    # ================================================
    
    @validator('ENVIRONMENT')
    def validate_environment(cls, v):
        """Validiere Environment-Werte"""
        allowed = ['development', 'testing', 'production']
        if v not in allowed:
            raise ValueError(f'Environment muss einer von {allowed} sein')
        return v
    
    @validator('LOG_LEVEL')
    def validate_log_level(cls, v):
        """Validiere Log Level"""
        allowed = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in allowed:
            raise ValueError(f'Log Level muss einer von {allowed} sein')
        return v.upper()
    
    @validator('MODEL_DEVICE')
    def validate_model_device(cls, v):
        """Validiere Model Device"""
        allowed = ['auto', 'cpu', 'cuda', 'mps']
        if v not in allowed:
            raise ValueError(f'Model Device muss einer von {allowed} sein')
        return v
    
    @validator('ALLOWED_ORIGINS', pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS Origins aus String oder Liste"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @validator('ALLOWED_HOSTS', pre=True)
    def parse_allowed_hosts(cls, v):
        """Parse Allowed Hosts aus String oder Liste"""
        if isinstance(v, str):
            return [host.strip() for host in v.split(',')]
        return v
    
    # ================================================
    # Computed Properties
    # ================================================
    
    @property
    def is_development(self) -> bool:
        """Prüfe ob Development-Umgebung"""
        return self.ENVIRONMENT == 'development'
    
    @property
    def is_production(self) -> bool:
        """Prüfe ob Production-Umgebung"""
        return self.ENVIRONMENT == 'production'
    
    @property
    def database_config(self) -> dict:
        """Datenbankverbindungs-Konfiguration"""
        return {
            "url": self.DATABASE_URL,
            "echo": self.is_development,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 3600
        }
    
    @property
    def redis_config(self) -> dict:
        """Redis-Verbindungs-Konfiguration"""
        return {
            "url": self.REDIS_URL,
            "socket_connect_timeout": 5,
            "socket_timeout": 5,
            "retry_on_timeout": True,
            "health_check_interval": 30
        }
    
    @property
    def model_config(self) -> dict:
        """KI-Modell-Konfiguration"""
        return {
            "cache_dir": self.HF_CACHE_DIR,
            "device": self.MODEL_DEVICE,
            "use_half_precision": self.USE_HALF_PRECISION,
            "max_image_size": self.MAX_IMAGE_SIZE,
            "torch_dtype": "float16" if self.USE_HALF_PRECISION else "float32"
        }
    
    # ================================================
    # Environment Loading
    # ================================================
    
    class Config:
        """Pydantic Configuration"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
        # Environment Variable Prefix
        env_prefix = "AI_ENGINE_"
        
        # Beispiel-Werte für Dokumentation
        schema_extra = {
            "example": {
                "APP_NAME": "DressForPleasure AI Style Creator",
                "DEBUG": False,
                "SECRET_KEY": "your-super-secret-key-here",
                "DATABASE_URL": "postgresql://user:pass@localhost:5432/dressforp_ai",
                "REDIS_URL": "redis://localhost:6379/0",
                "HUGGINGFACE_TOKEN": "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "TELEGRAM_BOT_TOKEN": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
                "BACKEND_API_URL": "https://api.dressforp.com",
                "AWS_BUCKET_NAME": "dressforp-ai-storage"
            }
        }


@lru_cache()
def get_settings() -> Settings:
    """
    Singleton Settings Instance mit Caching
    """
    return Settings()


def get_test_settings() -> Settings:
    """
    Test-spezifische Settings
    """
    return Settings(
        DEBUG=True,
        ENVIRONMENT="testing",
        DATABASE_URL="sqlite:///./test.db",
        REDIS_URL="redis://localhost:6379/15",  # Separate Test-DB
        LOG_LEVEL="DEBUG",
        DATA_RETENTION_DAYS=1,
        AUTO_DELETE_PROCESSED=False  # Für Testing-Zwecke
    )


# Environment-spezifische Konfigurationen
def get_production_settings() -> Settings:
    """
    Production-optimierte Settings
    """
    settings = get_settings()
    
    # Production-spezifische Overrides
    if settings.is_production:
        # Sicherheits-Einstellungen verschärfen
        settings.DEBUG = False
        settings.LOG_LEVEL = "WARNING"
        
        # Performance-Optimierungen
        settings.USE_HALF_PRECISION = True
        settings.MAX_CONCURRENT_JOBS = 8
        
        # Caching optimieren
        settings.CACHE_TTL_SECONDS = 7200  # 2 Stunden
        
    return settings


# Utility Functions für Settings
def validate_required_settings():
    """
    Validiere kritische Settings beim Start
    """
    settings = get_settings()
    
    required_fields = [
        "SECRET_KEY",
        "DATABASE_URL",
        "REDIS_URL"
    ]
    
    missing_fields = []
    for field in required_fields:
        if not getattr(settings, field):
            missing_fields.append(field)
    
    if missing_fields:
        raise ValueError(f"Kritische Settings fehlen: {', '.join(missing_fields)}")
    
    return True


def print_settings_summary():
    """
    Ausgabe einer Settings-Zusammenfassung (ohne Secrets)
    """
    settings = get_settings()
    
    print(f"""
🎨 DressForPleasure AI Style Creator Configuration
==================================================

🏷️  Application: {settings.APP_NAME} v{settings.VERSION}
🌍 Environment: {settings.ENVIRONMENT}
🖥️  Server: {settings.HOST}:{settings.PORT}
🔧 Debug Mode: {settings.DEBUG}

🤖 AI Models:
   - Stable Diffusion: {settings.SD_MODEL_NAME}
   - Content Model: {settings.CONTENT_MODEL_NAME}
   - Device: {settings.MODEL_DEVICE}

📁 Storage:
   - Upload Dir: {settings.UPLOAD_DIR}
   - Cache Dir: {settings.HF_CACHE_DIR}
   - Auto Delete: {settings.AUTO_DELETE_PROCESSED}

🔗 Integrations:
   - Backend API: {settings.BACKEND_API_URL}
   - Telegram Bot: {'✅ Enabled' if settings.TELEGRAM_BOT_TOKEN else '❌ Disabled'}
   - Metrics: {'✅ Enabled' if settings.ENABLE_METRICS else '❌ Disabled'}

==================================================
    """)


if __name__ == "__main__":
    # Settings testen
    try:
        validate_required_settings()
        print_settings_summary()
        print("✅ Settings validation successful!")
    except Exception as e:
        print(f"❌ Settings validation failed: {e}")
