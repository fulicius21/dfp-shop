#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator - AI Image Processor
======================================================

Kernkomponente für KI-basierte Bildverbesserung mit Stable Diffusion.
Verwandelt einfache Produktfotos in professionelle Fashion-Aufnahmen.

Features:
- Stable Diffusion für Bildverbesserung
- ControlNet für präzise Kontrolle
- Fashion-spezifische Style Transfer
- Batch-Processing
- GPU/CPU-optimierte Inferenz

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import os
import asyncio
import torch
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import structlog

# Hugging Face Transformers
from transformers import pipeline, BlipProcessor, BlipForConditionalGeneration
from diffusers import (
    StableDiffusionPipeline,
    StableDiffusionImg2ImgPipeline,
    StableDiffusionControlNetPipeline,
    ControlNetModel,
    DDIMScheduler,
    UniPCMultistepScheduler
)
from controlnet_aux import CannyDetector, OpenposeDetector
from compel import Compel

# Lokale Imports
from config.settings import Settings
from utils.image_utils import ImageProcessor
from utils.model_cache import ModelCache
from utils.device_manager import DeviceManager

logger = structlog.get_logger()


class FashionStylePresets:
    """
    Vordefinierte Fashion-Style-Prompts für verschiedene Ästhetiken
    """
    
    STUDIO_PROFESSIONAL = {
        "positive": "professional studio lighting, white background, clean minimal composition, high fashion photography, commercial product shot, soft directional lighting, no shadows, perfect exposure, crisp details, professional fashion catalog style",
        "negative": "cluttered background, harsh shadows, overexposed, underexposed, blurry, low quality, amateur photography, busy background, distracting elements",
        "style_strength": 0.75,
        "guidance_scale": 8.5
    }
    
    URBAN_STREET = {
        "positive": "urban street style photography, contemporary fashion, natural outdoor lighting, trendy modern aesthetic, lifestyle photography, authentic street fashion, urban backdrop, natural poses",
        "negative": "studio lighting, formal poses, white background, commercial look, artificial lighting, stiff composition",
        "style_strength": 0.8,
        "guidance_scale": 9.0
    }
    
    LUXURY_PREMIUM = {
        "positive": "luxury fashion photography, high-end editorial style, dramatic lighting, sophisticated composition, premium brand aesthetic, glossy magazine quality, elegant styling, fine art fashion",
        "negative": "cheap appearance, low-end fashion, poor lighting, amateur composition, budget photography",
        "style_strength": 0.85,
        "guidance_scale": 10.0
    }
    
    LIFESTYLE_CASUAL = {
        "positive": "natural lifestyle photography, casual fashion, soft natural lighting, relatable everyday style, comfortable authentic look, organic composition, natural environment",
        "negative": "overly formal, artificial poses, studio setup, commercial advertising look, stiff professional styling",
        "style_strength": 0.7,
        "guidance_scale": 7.5
    }
    
    ARTISTIC_CREATIVE = {
        "positive": "artistic fashion photography, creative composition, unique perspective, innovative styling, artistic lighting, conceptual fashion, avant-garde aesthetic, creative direction",
        "negative": "conventional photography, basic composition, standard lighting, boring conventional style",
        "style_strength": 0.9,
        "guidance_scale": 11.0
    }

    @classmethod
    def get_style_preset(cls, style_name: str) -> Dict[str, Any]:
        """Style-Preset basierend auf Namen abrufen"""
        style_map = {
            "studio": cls.STUDIO_PROFESSIONAL,
            "street": cls.URBAN_STREET, 
            "luxury": cls.LUXURY_PREMIUM,
            "lifestyle": cls.LIFESTYLE_CASUAL,
            "artistic": cls.ARTISTIC_CREATIVE
        }
        return style_map.get(style_name.lower(), cls.STUDIO_PROFESSIONAL)


class AIStyleProcessor:
    """
    Hauptklasse für KI-basierte Bildverbesserung und Style Transfer
    """
    
    def __init__(self, settings: Settings):
        """
        Initialisierung des AI Style Processors
        
        Args:
            settings: Anwendungseinstellungen
        """
        self.settings = settings
        self.device_manager = DeviceManager(settings)
        self.model_cache = ModelCache(settings)
        self.image_processor = ImageProcessor()
        
        # Model instances
        self.sd_pipeline: Optional[StableDiffusionImg2ImgPipeline] = None
        self.controlnet_pipeline: Optional[StableDiffusionControlNetPipeline] = None
        self.blip_processor: Optional[BlipProcessor] = None
        self.blip_model: Optional[BlipForConditionalGeneration] = None
        
        # Processing utilities
        self.canny_detector: Optional[CannyDetector] = None
        self.pose_detector: Optional[OpenposeDetector] = None
        self.compel: Optional[Compel] = None
        
        # Status tracking
        self._is_ready = False
        self._initialization_error: Optional[str] = None
        
        logger.info("AIStyleProcessor initialized")

    async def initialize(self) -> bool:
        """
        Asynchrone Initialisierung aller KI-Modelle
        
        Returns:
            bool: True wenn erfolgreich initialisiert
        """
        try:
            logger.info("🤖 Initializing AI Style Processor...")
            
            # Device Setup
            device = await self.device_manager.setup_device()
            logger.info(f"Using device: {device}")
            
            # Modelle laden
            await self._load_stable_diffusion_models()
            await self._load_image_analysis_models()
            await self._load_controlnet_models()
            await self._setup_processing_utilities()
            
            self._is_ready = True
            logger.info("✅ AI Style Processor initialization complete!")
            return True
            
        except Exception as e:
            self._initialization_error = str(e)
            logger.error(f"❌ Failed to initialize AI Style Processor: {e}")
            return False

    async def _load_stable_diffusion_models(self):
        """Lade Stable Diffusion Modelle"""
        logger.info("Loading Stable Diffusion models...")
        
        try:
            # Base Stable Diffusion Model
            self.sd_pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                self.settings.SD_MODEL_NAME,
                torch_dtype=torch.float16 if self.settings.USE_HALF_PRECISION else torch.float32,
                safety_checker=None,  # Deaktiviert für Fashion-Bilder
                requires_safety_checker=False,
                cache_dir=self.settings.HF_CACHE_DIR,
                use_auth_token=self.settings.HUGGINGFACE_TOKEN
            )
            
            # Scheduler optimieren für bessere Qualität
            self.sd_pipeline.scheduler = UniPCMultistepScheduler.from_config(
                self.sd_pipeline.scheduler.config
            )
            
            # Device setup
            device = self.device_manager.get_device()
            self.sd_pipeline = self.sd_pipeline.to(device)
            
            # Memory optimization
            if self.settings.USE_HALF_PRECISION and device != "cpu":
                self.sd_pipeline.enable_attention_slicing()
                self.sd_pipeline.enable_model_cpu_offload()
            
            # Prompt-Verbesserung mit Compel
            self.compel = Compel(
                tokenizer=self.sd_pipeline.tokenizer,
                text_encoder=self.sd_pipeline.text_encoder
            )
            
            logger.info("✅ Stable Diffusion models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load Stable Diffusion models: {e}")
            raise

    async def _load_image_analysis_models(self):
        """Lade Bildanalyse-Modelle (BLIP für Beschreibungen)"""
        logger.info("Loading image analysis models...")
        
        try:
            # BLIP für Bildanalyse und Beschreibung
            self.blip_processor = BlipProcessor.from_pretrained(
                self.settings.BLIP_MODEL_NAME,
                cache_dir=self.settings.HF_CACHE_DIR
            )
            
            self.blip_model = BlipForConditionalGeneration.from_pretrained(
                self.settings.BLIP_MODEL_NAME,
                torch_dtype=torch.float16 if self.settings.USE_HALF_PRECISION else torch.float32,
                cache_dir=self.settings.HF_CACHE_DIR
            )
            
            device = self.device_manager.get_device()
            self.blip_model = self.blip_model.to(device)
            
            logger.info("✅ Image analysis models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load image analysis models: {e}")
            raise

    async def _load_controlnet_models(self):
        """Lade ControlNet für präzise Kontrolle"""
        logger.info("Loading ControlNet models...")
        
        try:
            # ControlNet für strukturelle Kontrolle
            controlnet = ControlNetModel.from_pretrained(
                self.settings.SD_CONTROLNET_MODEL,
                torch_dtype=torch.float16 if self.settings.USE_HALF_PRECISION else torch.float32,
                cache_dir=self.settings.HF_CACHE_DIR
            )
            
            self.controlnet_pipeline = StableDiffusionControlNetPipeline.from_pretrained(
                self.settings.SD_MODEL_NAME,
                controlnet=controlnet,
                torch_dtype=torch.float16 if self.settings.USE_HALF_PRECISION else torch.float32,
                safety_checker=None,
                requires_safety_checker=False,
                cache_dir=self.settings.HF_CACHE_DIR
            )
            
            device = self.device_manager.get_device()
            self.controlnet_pipeline = self.controlnet_pipeline.to(device)
            
            logger.info("✅ ControlNet models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load ControlNet models: {e}")
            raise

    async def _setup_processing_utilities(self):
        """Setup für Bildverarbeitungs-Utilities"""
        logger.info("Setting up processing utilities...")
        
        try:
            # ControlNet Preprocessors
            self.canny_detector = CannyDetector()
            self.pose_detector = OpenposeDetector.from_pretrained("lllyasviel/Annotators")
            
            logger.info("✅ Processing utilities setup complete")
            
        except Exception as e:
            logger.error(f"Failed to setup processing utilities: {e}")
            raise

    async def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analysiere Produktbild und extrahiere Informationen
        
        Args:
            image_path: Pfad zum Eingabebild
            
        Returns:
            Dict mit Analyse-Ergebnissen
        """
        try:
            # Bild laden und vorbereiten
            image = Image.open(image_path).convert("RGB")
            image = self.image_processor.resize_image(image, self.settings.MAX_IMAGE_SIZE)
            
            # BLIP Analyse für Beschreibung
            inputs = self.blip_processor(image, return_tensors="pt")
            inputs = {k: v.to(self.device_manager.get_device()) for k, v in inputs.items()}
            
            with torch.no_grad():
                generated_ids = self.blip_model.generate(**inputs, max_length=50)
                description = self.blip_processor.decode(generated_ids[0], skip_special_tokens=True)
            
            # Bild-Eigenschaften analysieren
            image_stats = self.image_processor.analyze_image_properties(image)
            
            # Fashion-spezifische Analyse
            fashion_analysis = await self._analyze_fashion_elements(image)
            
            analysis_result = {
                "description": description,
                "dimensions": image.size,
                "format": image.format,
                "mode": image.mode,
                "stats": image_stats,
                "fashion_elements": fashion_analysis,
                "recommended_styles": self._recommend_styles(fashion_analysis),
                "processing_suggestions": self._get_processing_suggestions(image_stats)
            }
            
            logger.info(f"Image analysis complete for {image_path}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            raise

    async def _analyze_fashion_elements(self, image: Image.Image) -> Dict[str, Any]:
        """Analysiere Fashion-spezifische Elemente"""
        try:
            # Verwende Bildverarbeitungsalgorithmen für Fashion-Analyse
            image_np = np.array(image)
            
            # Farbanalyse
            colors = self.image_processor.extract_dominant_colors(image, num_colors=5)
            
            # Textur-Analyse (vereinfacht)
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
            texture_variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Kantenerkennung für Strukturanalyse
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            
            return {
                "dominant_colors": colors,
                "texture_complexity": float(texture_variance),
                "edge_density": float(edge_density),
                "brightness": float(np.mean(gray)),
                "contrast": float(np.std(gray))
            }
            
        except Exception as e:
            logger.error(f"Fashion element analysis failed: {e}")
            return {}

    def _recommend_styles(self, fashion_analysis: Dict[str, Any]) -> List[str]:
        """Empfehle geeignete Styles basierend auf Fashion-Analyse"""
        recommendations = []
        
        # Einfache Regel-basierte Empfehlungen
        edge_density = fashion_analysis.get("edge_density", 0)
        brightness = fashion_analysis.get("brightness", 0)
        contrast = fashion_analysis.get("contrast", 0)
        
        # Studio-Style für klare, einfache Produkte
        if edge_density < 0.1 and brightness > 150:
            recommendations.append("studio")
        
        # Lifestyle für komplexere Texturen
        if edge_density > 0.15:
            recommendations.append("lifestyle")
        
        # Luxury für hohen Kontrast
        if contrast > 50:
            recommendations.append("luxury")
        
        # Street-Style als Alternative
        recommendations.append("street")
        
        return recommendations

    def _get_processing_suggestions(self, image_stats: Dict[str, Any]) -> Dict[str, bool]:
        """Verarbeitungsvorschläge basierend auf Bildstatistiken"""
        return {
            "enhance_colors": image_stats.get("saturation", 0) < 100,
            "improve_lighting": image_stats.get("brightness", 0) < 120,
            "increase_contrast": image_stats.get("contrast", 0) < 40,
            "remove_noise": image_stats.get("noise_level", 0) > 0.1,
            "sharpen_details": image_stats.get("sharpness", 0) < 50
        }

    async def process_image_async(
        self, 
        job_id: str, 
        image_path: str, 
        processing_options: Dict[str, Any]
    ):
        """
        Asynchrone Bildverarbeitung für Background Tasks
        
        Args:
            job_id: Job-ID für Tracking
            image_path: Pfad zum Eingabebild
            processing_options: Verarbeitungsoptionen
        """
        try:
            logger.info(f"Starting async image processing for job {job_id}")
            
            # Analysiere Bild
            analysis = await self.analyze_image(image_path)
            
            # Verarbeite mit gewähltem Style
            style = processing_options.get("style", "studio")
            results = await self.enhance_image(image_path, style, processing_options)
            
            # Speichere Ergebnisse
            await self._save_processing_results(job_id, results, analysis)
            
            # Job als abgeschlossen markieren
            await self._update_job_status(job_id, "completed", results)
            
            logger.info(f"Image processing completed for job {job_id}")
            
        except Exception as e:
            logger.error(f"Image processing failed for job {job_id}: {e}")
            await self._update_job_status(job_id, "failed", {"error": str(e)})

    async def enhance_image(
        self, 
        image_path: str, 
        style: str = "studio", 
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Verbessere Produktbild mit KI-Modellen
        
        Args:
            image_path: Pfad zum Eingabebild
            style: Gewünschter Style (studio, street, luxury, lifestyle, artistic)
            options: Zusätzliche Verarbeitungsoptionen
            
        Returns:
            Dict mit verarbeiteten Bildern und Metadaten
        """
        try:
            options = options or {}
            
            # Bild laden und vorbereiten
            original_image = Image.open(image_path).convert("RGB")
            processed_image = self.image_processor.prepare_for_processing(
                original_image, 
                self.settings.MAX_IMAGE_SIZE
            )
            
            # Style-Preset abrufen
            style_preset = FashionStylePresets.get_style_preset(style)
            
            # Prompt für Fashion-Verbesserung erstellen
            base_prompt = self._create_fashion_prompt(style_preset, options)
            
            # Verschiedene Verarbeitungsansätze
            results = {}
            
            # 1. Standard Img2Img mit Style Transfer
            enhanced_image = await self._enhance_with_img2img(
                processed_image, 
                base_prompt, 
                style_preset
            )
            results["enhanced"] = enhanced_image
            
            # 2. ControlNet für strukturelle Erhaltung (optional)
            if options.get("preserve_structure", True):
                controlled_image = await self._enhance_with_controlnet(
                    processed_image, 
                    base_prompt, 
                    style_preset
                )
                results["controlled"] = controlled_image
            
            # 3. Multiple Varianten (wenn gewünscht)
            if options.get("generate_variants", False):
                variants = await self._generate_style_variants(
                    processed_image, 
                    style, 
                    num_variants=3
                )
                results["variants"] = variants
            
            # 4. Post-Processing-Verbesserungen
            for key, image in results.items():
                if isinstance(image, Image.Image):
                    results[key] = self.image_processor.post_process_image(
                        image, 
                        options
                    )
            
            # Metadaten hinzufügen
            results["metadata"] = {
                "original_size": original_image.size,
                "processed_size": processed_image.size,
                "style": style,
                "style_preset": style_preset,
                "processing_options": options,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            logger.info(f"Image enhancement completed with style: {style}")
            return results
            
        except Exception as e:
            logger.error(f"Image enhancement failed: {e}")
            raise

    def _create_fashion_prompt(
        self, 
        style_preset: Dict[str, Any], 
        options: Dict[str, Any]
    ) -> str:
        """Erstelle Fashion-spezifischen Prompt"""
        
        base_prompt = style_preset["positive"]
        
        # Zusätzliche Prompt-Elemente basierend auf Optionen
        if options.get("enhance_colors", True):
            base_prompt += ", vibrant colors, color enhanced"
        
        if options.get("improve_lighting", True):
            base_prompt += ", perfect lighting, well lit"
        
        if options.get("high_quality", True):
            base_prompt += ", high resolution, sharp details, professional quality"
        
        # Fashion-spezifische Verbesserungen
        base_prompt += ", fashion photography, product photography, commercial quality"
        
        return base_prompt

    async def _enhance_with_img2img(
        self, 
        image: Image.Image, 
        prompt: str, 
        style_preset: Dict[str, Any]
    ) -> Image.Image:
        """Verbessere Bild mit Stable Diffusion Img2Img"""
        try:
            # Prompt durch Compel verarbeiten für bessere Qualität
            conditioning = self.compel.build_conditioning_tensor(prompt)
            negative_conditioning = self.compel.build_conditioning_tensor(
                style_preset["negative"]
            )
            
            # Generierung mit optimierten Parametern
            with torch.no_grad():
                result = self.sd_pipeline(
                    prompt_embeds=conditioning,
                    negative_prompt_embeds=negative_conditioning,
                    image=image,
                    strength=style_preset["style_strength"],
                    guidance_scale=style_preset["guidance_scale"],
                    num_inference_steps=30,  # Kompromiss zwischen Qualität und Geschwindigkeit
                    generator=torch.manual_seed(42)  # Konsistente Ergebnisse
                )
            
            return result.images[0]
            
        except Exception as e:
            logger.error(f"Img2Img enhancement failed: {e}")
            raise

    async def _enhance_with_controlnet(
        self, 
        image: Image.Image, 
        prompt: str, 
        style_preset: Dict[str, Any]
    ) -> Image.Image:
        """Verbessere Bild mit ControlNet für strukturelle Kontrolle"""
        try:
            # Canny-Edges für strukturelle Kontrolle erstellen
            canny_image = self.canny_detector(image)
            
            # ControlNet-Pipeline verwenden
            with torch.no_grad():
                result = self.controlnet_pipeline(
                    prompt=prompt,
                    negative_prompt=style_preset["negative"],
                    image=canny_image,
                    num_inference_steps=25,
                    guidance_scale=style_preset["guidance_scale"],
                    controlnet_conditioning_scale=0.8,  # Strukturelle Kontrolle
                    generator=torch.manual_seed(42)
                )
            
            return result.images[0]
            
        except Exception as e:
            logger.error(f"ControlNet enhancement failed: {e}")
            raise

    async def _generate_style_variants(
        self, 
        image: Image.Image, 
        base_style: str, 
        num_variants: int = 3
    ) -> List[Image.Image]:
        """Generiere multiple Style-Varianten"""
        variants = []
        
        try:
            # Verschiedene Styles ausprobieren
            available_styles = ["studio", "street", "luxury", "lifestyle", "artistic"]
            
            # Base-Style ausschließen und zufällige Auswahl
            other_styles = [s for s in available_styles if s != base_style]
            selected_styles = other_styles[:num_variants]
            
            for style in selected_styles:
                style_preset = FashionStylePresets.get_style_preset(style)
                prompt = self._create_fashion_prompt(style_preset, {})
                
                variant = await self._enhance_with_img2img(image, prompt, style_preset)
                variants.append(variant)
            
            return variants
            
        except Exception as e:
            logger.error(f"Style variant generation failed: {e}")
            return []

    async def _save_processing_results(
        self, 
        job_id: str, 
        results: Dict[str, Any], 
        analysis: Dict[str, Any]
    ):
        """Speichere Verarbeitungsergebnisse"""
        try:
            # Erstelle Ausgabeverzeichnis
            output_dir = Path(self.settings.PROCESSED_DIR) / job_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Speichere alle verarbeiteten Bilder
            saved_files = {}
            for key, image in results.items():
                if isinstance(image, Image.Image):
                    filename = f"{key}.jpg"
                    filepath = output_dir / filename
                    image.save(filepath, "JPEG", quality=95, optimize=True)
                    saved_files[key] = str(filepath)
            
            # Speichere Metadaten und Analyse
            metadata = {
                "job_id": job_id,
                "results": results.get("metadata", {}),
                "analysis": analysis,
                "saved_files": saved_files,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            import json
            metadata_path = output_dir / "metadata.json"
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2, default=str)
            
            logger.info(f"Processing results saved for job {job_id}")
            
        except Exception as e:
            logger.error(f"Failed to save processing results: {e}")
            raise

    async def _update_job_status(
        self, 
        job_id: str, 
        status: str, 
        result_data: Optional[Dict[str, Any]] = None
    ):
        """Update Job-Status in der Datenbank"""
        try:
            # Hier würde die Integration mit der Job-Queue erfolgen
            # Vereinfachte Implementierung für jetzt
            logger.info(f"Job {job_id} status updated to: {status}")
            
        except Exception as e:
            logger.error(f"Failed to update job status: {e}")

    def is_ready(self) -> bool:
        """Prüfe ob der Processor bereit ist"""
        return self._is_ready

    def get_model_info(self) -> Dict[str, Any]:
        """Modell-Informationen für Status-Abfragen"""
        return {
            "sd_model": self.settings.SD_MODEL_NAME,
            "controlnet_model": self.settings.SD_CONTROLNET_MODEL,
            "blip_model": self.settings.BLIP_MODEL_NAME,
            "device": self.device_manager.get_device(),
            "ready": self._is_ready,
            "error": self._initialization_error
        }

    async def cleanup(self):
        """Cleanup-Routine für Ressourcen-Freigabe"""
        try:
            logger.info("Cleaning up AI Style Processor...")
            
            # Modelle aus GPU-Memory entfernen
            if self.sd_pipeline:
                del self.sd_pipeline
                
            if self.controlnet_pipeline:
                del self.controlnet_pipeline
                
            if self.blip_model:
                del self.blip_model
            
            # GPU-Cache leeren
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info("AI Style Processor cleanup complete")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")


# Utility Functions für Testing und Debugging
async def test_ai_processor():
    """Test-Funktion für den AI Processor"""
    from config.settings import get_test_settings
    
    settings = get_test_settings()
    processor = AIStyleProcessor(settings)
    
    try:
        # Initialisierung testen
        success = await processor.initialize()
        if not success:
            print("❌ Initialization failed")
            return
        
        print("✅ AI Processor initialized successfully")
        
        # Test mit einem Beispielbild (wenn verfügbar)
        test_image_path = "test_fashion_item.jpg"
        if os.path.exists(test_image_path):
            # Analyse testen
            analysis = await processor.analyze_image(test_image_path)
            print(f"📊 Analysis: {analysis['description']}")
            
            # Verbesserung testen
            results = await processor.enhance_image(test_image_path, "studio")
            print(f"✨ Enhancement completed: {len(results)} results")
        
        await processor.cleanup()
        print("🧹 Cleanup completed")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    # Test ausführen
    asyncio.run(test_ai_processor())
