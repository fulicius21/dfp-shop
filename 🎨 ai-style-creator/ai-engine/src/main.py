#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator Engine
========================================

Hauptanwendung für KI-basierte Produktfoto-Verbesserung und Content-Generierung.
Nutzt Hugging Face Transformers für professionelle Fashion-Bildbearbeitung.

Features:
- Stable Diffusion für Bildverbesserung
- BLIP für Bildanalyse und Beschreibung
- Fashion-spezifische Style Transfer
- RESTful API mit FastAPI
- Asynchrone Verarbeitung mit Celery
- DSGVO-konforme Datenverarbeitung

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import os
import logging
import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import structlog

# Lokale Imports
from config.settings import get_settings
from models.ai_processor import AIStyleProcessor
from models.content_generator import ContentGenerator
from utils.auth import verify_api_token
from utils.file_handler import FileHandler
from utils.job_queue import JobQueue
from utils.monitoring import PrometheusMetrics

# Logging Setup
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Globale Instanzen
settings = get_settings()
ai_processor: Optional[AIStyleProcessor] = None
content_generator: Optional[ContentGenerator] = None
file_handler: Optional[FileHandler] = None
job_queue: Optional[JobQueue] = None
metrics: Optional[PrometheusMetrics] = None


# Pydantic Models für API
class ImageProcessingRequest(BaseModel):
    """Request-Model für Bildverarbeitung"""
    style: str = Field(..., description="Gewünschter Verarbeitungsstil")
    quality: str = Field(default="high", description="Qualitätsstufe")
    background: Optional[str] = Field(None, description="Background-Typ")
    enhance_colors: bool = Field(default=True, description="Farbverbesserung aktivieren")
    generate_variants: bool = Field(default=True, description="Multiple Varianten erstellen")


class ContentGenerationRequest(BaseModel):
    """Request-Model für Content-Generierung"""
    product_type: str = Field(..., description="Produkttyp")
    target_audience: str = Field(default="general", description="Zielgruppe")
    language: str = Field(default="de", description="Sprache")
    include_seo: bool = Field(default=True, description="SEO-Optimierung")
    include_styling_tips: bool = Field(default=True, description="Styling-Tipps")


class ProcessingResponse(BaseModel):
    """Response-Model für Processing-Anfragen"""
    job_id: str = Field(..., description="Job-ID für Status-Tracking")
    status: str = Field(..., description="Aktueller Status")
    estimated_time: int = Field(..., description="Geschätzte Verarbeitungszeit in Sekunden")
    message: str = Field(..., description="Status-Nachricht")


class JobStatusResponse(BaseModel):
    """Response-Model für Job-Status"""
    job_id: str
    status: str
    progress: int
    result_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str


# Lifecycle Management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application Lifecycle Manager - Initialisierung und Cleanup"""
    global ai_processor, content_generator, file_handler, job_queue, metrics
    
    logger.info("🚀 Starting DressForPleasure AI Style Creator Engine...")
    
    try:
        # Initialisierung der Kernkomponenten
        logger.info("Initializing core components...")
        
        # Metriken-System starten
        metrics = PrometheusMetrics()
        await metrics.start()
        
        # File Handler initialisieren
        file_handler = FileHandler(settings)
        await file_handler.initialize()
        
        # Job Queue initialisieren
        job_queue = JobQueue(settings)
        await job_queue.initialize()
        
        # AI Modelle laden (kann etwas dauern)
        logger.info("Loading AI models... This may take a few minutes on first run.")
        ai_processor = AIStyleProcessor(settings)
        await ai_processor.initialize()
        
        content_generator = ContentGenerator(settings)
        await content_generator.initialize()
        
        logger.info("✅ All components initialized successfully!")
        
        yield  # App läuft
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize application: {e}")
        raise
    
    finally:
        # Cleanup
        logger.info("🔄 Shutting down AI Style Creator Engine...")
        
        if ai_processor:
            await ai_processor.cleanup()
        if content_generator:
            await content_generator.cleanup()
        if job_queue:
            await job_queue.cleanup()
        if file_handler:
            await file_handler.cleanup()
        if metrics:
            await metrics.cleanup()
            
        logger.info("👋 AI Style Creator Engine shut down complete.")


# FastAPI App erstellen
app = FastAPI(
    title="DressForPleasure AI Style Creator Engine",
    description="KI-basierte Produktfoto-Verbesserung und Content-Generierung für Fashion E-Commerce",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Security
security = HTTPBearer()


# Dependency für Authentifizierung
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Authentifizierung über API Token"""
    try:
        payload = verify_api_token(credentials.credentials, settings.SECRET_KEY)
        return payload
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


# Health Check Endpoint
@app.get("/health")
async def health_check():
    """System Health Check"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": asyncio.get_event_loop().time(),
            "components": {
                "ai_processor": ai_processor.is_ready() if ai_processor else False,
                "content_generator": content_generator.is_ready() if content_generator else False,
                "file_handler": file_handler.is_ready() if file_handler else False,
                "job_queue": job_queue.is_ready() if job_queue else False,
            }
        }
        
        # Überprüfe, ob alle Komponenten bereit sind
        all_ready = all(health_status["components"].values())
        if not all_ready:
            health_status["status"] = "degraded"
            
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


# Bildverarbeitung Endpoints
@app.post("/api/v1/process/image", response_model=ProcessingResponse)
async def process_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    request: ImageProcessingRequest = None,
    current_user = Depends(get_current_user)
):
    """
    Produktfoto mit KI verarbeiten und verbessern
    
    - **file**: Original-Produktfoto (JPG, PNG, WEBP)
    - **style**: Verarbeitungsstil (studio, street, lifestyle, luxury, artistic)
    - **quality**: Qualitätsstufe (standard, high, ultra)
    - **enhance_colors**: Automatische Farbverbesserung
    - **generate_variants**: Multiple Stil-Varianten erstellen
    """
    try:
        # Validierung der Datei
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # File handling
        uploaded_file = await file_handler.save_upload(file)
        
        # Job in Queue einreihen
        job_id = await job_queue.enqueue_image_processing(
            file_path=uploaded_file.path,
            processing_options=request.dict() if request else {},
            user_id=current_user.get("user_id")
        )
        
        # Metrics tracken
        metrics.increment_counter("images_submitted")
        
        # Background processing starten
        background_tasks.add_task(
            ai_processor.process_image_async,
            job_id,
            uploaded_file.path,
            request.dict() if request else {}
        )
        
        logger.info(f"Image processing job {job_id} queued for user {current_user.get('user_id')}")
        
        return ProcessingResponse(
            job_id=job_id,
            status="queued",
            estimated_time=120,  # 2 Minuten geschätzt
            message="Bildverarbeitung wurde gestartet. Sie erhalten eine Benachrichtigung, wenn der Prozess abgeschlossen ist."
        )
        
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        metrics.increment_counter("processing_errors")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.post("/api/v1/generate/content", response_model=ProcessingResponse)
async def generate_content(
    background_tasks: BackgroundTasks,
    image_url: str,
    request: ContentGenerationRequest,
    current_user = Depends(get_current_user)
):
    """
    Automatische Content-Generierung für Produktbild
    
    - **image_url**: URL zum verarbeiteten Produktbild
    - **product_type**: Produktkategorie (dress, shirt, jacket, etc.)
    - **target_audience**: Zielgruppe (young, professional, luxury, etc.)
    - **language**: Sprache für Content (de, en)
    - **include_seo**: SEO-optimierte Texte generieren
    - **include_styling_tips**: Styling-Tipps hinzufügen
    """
    try:
        # Job in Queue einreihen
        job_id = await job_queue.enqueue_content_generation(
            image_url=image_url,
            generation_options=request.dict(),
            user_id=current_user.get("user_id")
        )
        
        # Background processing starten
        background_tasks.add_task(
            content_generator.generate_content_async,
            job_id,
            image_url,
            request.dict()
        )
        
        metrics.increment_counter("content_requests")
        
        logger.info(f"Content generation job {job_id} queued for user {current_user.get('user_id')}")
        
        return ProcessingResponse(
            job_id=job_id,
            status="queued",
            estimated_time=60,  # 1 Minute geschätzt
            message="Content-Generierung wurde gestartet. Die Texte werden automatisch erstellt."
        )
        
    except Exception as e:
        logger.error(f"Content generation failed: {e}")
        metrics.increment_counter("generation_errors")
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")


@app.get("/api/v1/job/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user = Depends(get_current_user)
):
    """Job-Status abrufen"""
    try:
        status = await job_queue.get_job_status(job_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return JobStatusResponse(**status)
        
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@app.get("/api/v1/job/{job_id}/result")
async def get_job_result(
    job_id: str,
    current_user = Depends(get_current_user)
):
    """Job-Ergebnis abrufen"""
    try:
        result = await job_queue.get_job_result(job_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Job result not found")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get job result: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get job result: {str(e)}")


# Batch Processing Endpoints
@app.post("/api/v1/process/batch")
async def process_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    processing_options: Optional[dict] = None,
    current_user = Depends(get_current_user)
):
    """Batch-Verarbeitung mehrerer Bilder"""
    try:
        if len(files) > settings.MAX_BATCH_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"Batch size exceeded. Maximum {settings.MAX_BATCH_SIZE} files allowed."
            )
        
        batch_id = await job_queue.create_batch_job()
        job_ids = []
        
        for file in files:
            if not file.content_type.startswith("image/"):
                continue  # Skip non-image files
                
            uploaded_file = await file_handler.save_upload(file)
            
            job_id = await job_queue.enqueue_image_processing(
                file_path=uploaded_file.path,
                processing_options=processing_options or {},
                user_id=current_user.get("user_id"),
                batch_id=batch_id
            )
            
            job_ids.append(job_id)
            
            # Background processing für jedes Bild starten
            background_tasks.add_task(
                ai_processor.process_image_async,
                job_id,
                uploaded_file.path,
                processing_options or {}
            )
        
        metrics.increment_counter("batch_jobs", len(job_ids))
        
        logger.info(f"Batch processing {batch_id} with {len(job_ids)} jobs queued")
        
        return {
            "batch_id": batch_id,
            "job_ids": job_ids,
            "total_jobs": len(job_ids),
            "status": "queued",
            "estimated_time": len(job_ids) * 120  # 2 Min pro Bild
        }
        
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


# Admin & Monitoring Endpoints
@app.get("/api/v1/admin/stats")
async def get_admin_stats(current_user = Depends(get_current_user)):
    """Admin-Statistiken für Dashboard"""
    try:
        # Nur für Admin-User
        if not current_user.get("is_admin", False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        stats = await job_queue.get_queue_stats()
        system_stats = await metrics.get_system_stats()
        
        return {
            "queue_stats": stats,
            "system_stats": system_stats,
            "ai_models": {
                "image_processor": ai_processor.get_model_info() if ai_processor else None,
                "content_generator": content_generator.get_model_info() if content_generator else None
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get admin stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.get("/metrics")
async def get_metrics():
    """Prometheus Metrics Endpoint"""
    try:
        return metrics.generate_metrics()
    except Exception as e:
        logger.error(f"Failed to generate metrics: {e}")
        return {"error": "Failed to generate metrics"}


# Error Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global Exception Handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    metrics.increment_counter("unhandled_errors")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": getattr(request.state, "request_id", "unknown")
        }
    )


# Main Entry Point
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
        access_log=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )
