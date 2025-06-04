#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator - Content Generator
====================================================

KI-basierte Content-Generierung für Fashion-Produktbeschreibungen.
Erstellt automatisch Marketing-Texte, SEO-Content und Styling-Tipps.

Features:
- Fashion-spezifische Produktbeschreibungen
- SEO-optimierte Texte
- Styling-Tipps und Outfit-Vorschläge
- Multilingual Support (Deutsch/Englisch)
- Marken-Voice Konsistenz
- Zielgruppen-spezifische Ansprache

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import asyncio
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import structlog

# NLP und AI Models
from transformers import (
    pipeline, 
    AutoTokenizer, 
    AutoModelForCausalLM,
    BlipProcessor,
    BlipForConditionalGeneration
)
import torch

# Lokale Imports
from config.settings import Settings
from utils.text_utils import TextProcessor
from utils.fashion_knowledge import FashionKnowledgeBase

logger = structlog.get_logger()


class FashionContentTemplates:
    """
    Vordefinierte Templates für verschiedene Content-Arten
    """
    
    PRODUCT_DESCRIPTION_DE = {
        "intro": [
            "Entdecken Sie {product_name} - {style_description}",
            "Präsentieren Sie sich stilvoll mit {product_name}",
            "Das perfekte Piece für Ihren Look: {product_name}",
            "Zeitloser Style trifft auf moderne Eleganz: {product_name}"
        ],
        "features": [
            "Hochwertige Materialien sorgen für erstklassigen Tragekomfort",
            "Durchdachte Details unterstreichen den individuellen Charakter",
            "Vielseitig kombinierbar für verschiedene Anlässe",
            "Perfekte Passform für ein selbstbewusstes Auftreten"
        ],
        "styling": [
            "Kombinieren Sie dieses Piece mit {complementary_items} für einen {style_mood} Look",
            "Perfekt zu {accessories} für den {occasion} Look",
            "Ideale Ergänzung zu {wardrobe_staples} in Ihrer Garderobe"
        ],
        "cta": [
            "Verleihen Sie Ihrem Style das gewisse Etwas - jetzt bestellen",
            "Investieren Sie in zeitlose Eleganz",
            "Machen Sie dieses besondere Piece zu Ihrem neuen Lieblingsstück"
        ]
    }
    
    PRODUCT_DESCRIPTION_EN = {
        "intro": [
            "Discover {product_name} - {style_description}",
            "Present yourself stylishly with {product_name}",
            "The perfect piece for your look: {product_name}",
            "Timeless style meets modern elegance: {product_name}"
        ],
        "features": [
            "High-quality materials ensure first-class wearing comfort",
            "Thoughtful details emphasize the individual character",
            "Versatile to combine for different occasions",
            "Perfect fit for a confident appearance"
        ],
        "styling": [
            "Combine this piece with {complementary_items} for a {style_mood} look",
            "Perfect with {accessories} for the {occasion} look",
            "Ideal addition to {wardrobe_staples} in your wardrobe"
        ],
        "cta": [
            "Give your style that special something - order now",
            "Invest in timeless elegance",
            "Make this special piece your new favorite"
        ]
    }
    
    SEO_KEYWORDS_DE = [
        "fashion", "mode", "style", "trend", "outfit", "look", "design",
        "qualität", "premium", "nachhaltig", "elegant", "modern", "klassisch",
        "berlin", "urban", "street style", "business", "casual", "luxury"
    ]
    
    SEO_KEYWORDS_EN = [
        "fashion", "style", "trend", "outfit", "look", "design",
        "quality", "premium", "sustainable", "elegant", "modern", "classic",
        "berlin", "urban", "street style", "business", "casual", "luxury"
    ]


class BrandVoiceConfig:
    """
    Konfiguration für DressForPleasure Marken-Voice
    """
    
    BRAND_PERSONALITY = {
        "tone": "confident, inspiring, sophisticated",
        "style": "modern, urban, premium",
        "values": ["quality", "individuality", "sustainability", "creativity"],
        "voice_attributes": [
            "authentic", "inspiring", "sophisticated", "accessible",
            "trend-conscious", "quality-focused", "berlin-inspired"
        ]
    }
    
    BERLIN_REFERENCES = [
        "berliner eleganz", "urban sophistication", "metropolitan style",
        "hauptstadt chic", "creative capital", "kulturelle vielfalt"
    ]
    
    TARGET_AUDIENCES = {
        "young_professional": {
            "age_range": "25-35",
            "style": "business casual, modern, versatile",
            "keywords": ["career", "versatile", "professional", "confident"]
        },
        "creative": {
            "age_range": "20-40", 
            "style": "artistic, unique, expressive",
            "keywords": ["creative", "individual", "artistic", "unique"]
        },
        "luxury": {
            "age_range": "30-50",
            "style": "premium, exclusive, sophisticated",
            "keywords": ["luxury", "exclusive", "premium", "sophisticated"]
        },
        "urban": {
            "age_range": "18-35",
            "style": "street style, casual, trendy", 
            "keywords": ["urban", "trendy", "casual", "street style"]
        }
    }


class ContentGenerator:
    """
    Hauptklasse für KI-basierte Content-Generierung
    """
    
    def __init__(self, settings: Settings):
        """
        Initialisierung des Content Generators
        
        Args:
            settings: Anwendungseinstellungen
        """
        self.settings = settings
        self.text_processor = TextProcessor()
        self.fashion_kb = FashionKnowledgeBase()
        
        # Model instances
        self.language_model: Optional[Any] = None
        self.tokenizer: Optional[Any] = None
        self.blip_processor: Optional[BlipProcessor] = None
        self.blip_model: Optional[BlipForConditionalGeneration] = None
        
        # Content pipelines
        self.text_generator: Optional[Any] = None
        self.summarizer: Optional[Any] = None
        
        # Status tracking
        self._is_ready = False
        self._initialization_error: Optional[str] = None
        
        logger.info("ContentGenerator initialized")

    async def initialize(self) -> bool:
        """
        Asynchrone Initialisierung aller Content-Generation-Modelle
        
        Returns:
            bool: True wenn erfolgreich initialisiert
        """
        try:
            logger.info("🖋️ Initializing Content Generator...")
            
            # Language Models laden
            await self._load_language_models()
            await self._load_image_analysis_models()
            await self._setup_content_pipelines()
            await self._initialize_fashion_knowledge()
            
            self._is_ready = True
            logger.info("✅ Content Generator initialization complete!")
            return True
            
        except Exception as e:
            self._initialization_error = str(e)
            logger.error(f"❌ Failed to initialize Content Generator: {e}")
            return False

    async def _load_language_models(self):
        """Lade Language Models für Text-Generierung"""
        logger.info("Loading language models...")
        
        try:
            # Verwende GPT-ähnliches Modell für Content-Generierung
            model_name = self.settings.CONTENT_MODEL_NAME
            
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                cache_dir=self.settings.HF_CACHE_DIR,
                use_auth_token=self.settings.HUGGINGFACE_TOKEN
            )
            
            self.language_model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if self.settings.USE_HALF_PRECISION else torch.float32,
                cache_dir=self.settings.HF_CACHE_DIR,
                use_auth_token=self.settings.HUGGINGFACE_TOKEN
            )
            
            # Padding Token setzen falls nicht vorhanden
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            logger.info("✅ Language models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load language models: {e}")
            raise

    async def _load_image_analysis_models(self):
        """Lade Bildanalyse-Modelle für Content-Basis"""
        logger.info("Loading image analysis models for content generation...")
        
        try:
            # BLIP für detaillierte Bildanalyse
            self.blip_processor = BlipProcessor.from_pretrained(
                self.settings.BLIP_MODEL_NAME,
                cache_dir=self.settings.HF_CACHE_DIR
            )
            
            self.blip_model = BlipForConditionalGeneration.from_pretrained(
                self.settings.BLIP_MODEL_NAME,
                torch_dtype=torch.float16 if self.settings.USE_HALF_PRECISION else torch.float32,
                cache_dir=self.settings.HF_CACHE_DIR
            )
            
            logger.info("✅ Image analysis models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load image analysis models: {e}")
            raise

    async def _setup_content_pipelines(self):
        """Setup für Content-Generation Pipelines"""
        logger.info("Setting up content generation pipelines...")
        
        try:
            # Text-Generation Pipeline
            self.text_generator = pipeline(
                "text-generation",
                model=self.language_model,
                tokenizer=self.tokenizer,
                device=0 if torch.cuda.is_available() else -1,
                torch_dtype=torch.float16 if self.settings.USE_HALF_PRECISION else torch.float32
            )
            
            # Summarization Pipeline für kompakte Beschreibungen
            self.summarizer = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("✅ Content generation pipelines setup complete")
            
        except Exception as e:
            logger.error(f"Failed to setup content pipelines: {e}")
            raise

    async def _initialize_fashion_knowledge(self):
        """Initialisiere Fashion Knowledge Base"""
        logger.info("Initializing fashion knowledge base...")
        
        try:
            await self.fashion_kb.initialize()
            logger.info("✅ Fashion knowledge base initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize fashion knowledge base: {e}")
            raise

    async def generate_content_async(
        self,
        job_id: str,
        image_url: str,
        generation_options: Dict[str, Any]
    ):
        """
        Asynchrone Content-Generierung für Background Tasks
        
        Args:
            job_id: Job-ID für Tracking
            image_url: URL zum Produktbild
            generation_options: Generierungsoptionen
        """
        try:
            logger.info(f"Starting async content generation for job {job_id}")
            
            # Lade und analysiere Bild
            image_analysis = await self._analyze_image_for_content(image_url)
            
            # Generiere verschiedene Content-Arten
            content_results = await self.generate_comprehensive_content(
                image_analysis,
                generation_options
            )
            
            # Speichere Ergebnisse
            await self._save_content_results(job_id, content_results, image_analysis)
            
            # Job als abgeschlossen markieren
            await self._update_job_status(job_id, "completed", content_results)
            
            logger.info(f"Content generation completed for job {job_id}")
            
        except Exception as e:
            logger.error(f"Content generation failed for job {job_id}: {e}")
            await self._update_job_status(job_id, "failed", {"error": str(e)})

    async def _analyze_image_for_content(self, image_url: str) -> Dict[str, Any]:
        """Analysiere Bild für Content-Generierung"""
        try:
            # Vereinfachte Bildanalyse - in Realität würde hier das Bild geladen
            # und mit BLIP analysiert werden
            
            # Simulierte Analyse basierend auf URL/Kontext
            analysis = {
                "description": "A stylish fashion item with modern design",
                "colors": ["black", "white", "gray"],
                "style": "modern",
                "category": "clothing",
                "occasion": "casual",
                "season": "all-season",
                "materials": ["cotton", "polyester"],
                "fit": "regular"
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Image analysis for content failed: {e}")
            raise

    async def generate_comprehensive_content(
        self,
        image_analysis: Dict[str, Any],
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generiere umfassenden Content basierend auf Bildanalyse
        
        Args:
            image_analysis: Ergebnisse der Bildanalyse
            options: Generierungsoptionen
            
        Returns:
            Dict mit generiertem Content
        """
        try:
            results = {}
            
            # Sprache bestimmen
            language = options.get("language", "de")
            
            # Zielgruppe bestimmen
            target_audience = options.get("target_audience", "general")
            
            # 1. Produktbeschreibung generieren
            if options.get("generate_description", True):
                description = await self._generate_product_description(
                    image_analysis, 
                    language, 
                    target_audience
                )
                results["description"] = description
            
            # 2. SEO-Content generieren
            if options.get("include_seo", True):
                seo_content = await self._generate_seo_content(
                    image_analysis,
                    language
                )
                results["seo"] = seo_content
            
            # 3. Styling-Tipps generieren
            if options.get("include_styling_tips", True):
                styling_tips = await self._generate_styling_tips(
                    image_analysis,
                    language,
                    target_audience
                )
                results["styling_tips"] = styling_tips
            
            # 4. Technische Spezifikationen
            if options.get("include_specs", True):
                specifications = await self._generate_specifications(
                    image_analysis,
                    language
                )
                results["specifications"] = specifications
            
            # 5. Social Media Content
            if options.get("include_social", False):
                social_content = await self._generate_social_media_content(
                    image_analysis,
                    language
                )
                results["social_media"] = social_content
            
            # Metadaten hinzufügen
            results["metadata"] = {
                "language": language,
                "target_audience": target_audience,
                "generation_options": options,
                "image_analysis": image_analysis,
                "timestamp": datetime.now().isoformat(),
                "brand_voice": BrandVoiceConfig.BRAND_PERSONALITY
            }
            
            logger.info("Comprehensive content generation completed")
            return results
            
        except Exception as e:
            logger.error(f"Comprehensive content generation failed: {e}")
            raise

    async def _generate_product_description(
        self,
        analysis: Dict[str, Any],
        language: str,
        target_audience: str
    ) -> Dict[str, Any]:
        """Generiere Produktbeschreibung"""
        try:
            # Template basierend auf Sprache auswählen
            if language == "de":
                templates = FashionContentTemplates.PRODUCT_DESCRIPTION_DE
            else:
                templates = FashionContentTemplates.PRODUCT_DESCRIPTION_EN
            
            # Zielgruppen-spezifische Anpassungen
            audience_config = BrandVoiceConfig.TARGET_AUDIENCES.get(
                target_audience, 
                BrandVoiceConfig.TARGET_AUDIENCES["young_professional"]
            )
            
            # Content-Prompt erstellen
            prompt = self._create_description_prompt(analysis, templates, audience_config, language)
            
            # Text generieren
            generated_text = await self._generate_text(prompt, max_length=300)
            
            # Post-Processing
            processed_description = self.text_processor.clean_and_format(generated_text)
            
            # Verschiedene Längen-Varianten
            short_description = self.text_processor.create_short_version(processed_description, 100)
            long_description = self.text_processor.create_long_version(processed_description, 400)
            
            return {
                "short": short_description,
                "medium": processed_description,
                "long": long_description,
                "bullet_points": self.text_processor.create_bullet_points(processed_description),
                "language": language,
                "target_audience": target_audience
            }
            
        except Exception as e:
            logger.error(f"Product description generation failed: {e}")
            raise

    def _create_description_prompt(
        self,
        analysis: Dict[str, Any],
        templates: Dict[str, List[str]],
        audience_config: Dict[str, Any],
        language: str
    ) -> str:
        """Erstelle Prompt für Produktbeschreibung"""
        
        # Produkt-Informationen extrahieren
        product_type = analysis.get("category", "fashion item")
        colors = ", ".join(analysis.get("colors", ["stylish"]))
        style = analysis.get("style", "modern")
        
        # Template-Variablen
        template_vars = {
            "product_name": f"{style} {product_type}",
            "style_description": f"{style} design in {colors}",
            "complementary_items": self.fashion_kb.get_complementary_items(product_type),
            "style_mood": audience_config["style"],
            "occasion": analysis.get("occasion", "various occasions"),
            "accessories": self.fashion_kb.get_matching_accessories(product_type),
            "wardrobe_staples": self.fashion_kb.get_wardrobe_staples()
        }
        
        # Prompt konstruieren
        if language == "de":
            prompt = f"""Schreibe eine überzeugende Produktbeschreibung für ein {product_type} im {style} Stil.

Zielgruppe: {audience_config['style']} 
Farben: {colors}
Stil: {style}
Anlass: {analysis.get('occasion', 'vielseitig')}

Die Beschreibung soll:
- Inspirierend und überzeugend sein
- Die Qualität und Einzigartigkeit betonen
- Berlin/urbanen Lifestyle widerspiegeln
- Konkrete Styling-Vorschläge enthalten
- Emotional ansprechen

Produktbeschreibung:"""
        else:
            prompt = f"""Write a compelling product description for a {product_type} in {style} style.

Target audience: {audience_config['style']}
Colors: {colors}
Style: {style}
Occasion: {analysis.get('occasion', 'versatile')}

The description should:
- Be inspiring and convincing
- Emphasize quality and uniqueness
- Reflect Berlin/urban lifestyle
- Include concrete styling suggestions
- Appeal emotionally

Product description:"""
        
        return prompt

    async def _generate_seo_content(
        self,
        analysis: Dict[str, Any],
        language: str
    ) -> Dict[str, Any]:
        """Generiere SEO-optimierten Content"""
        try:
            # Keywords basierend auf Sprache
            if language == "de":
                base_keywords = FashionContentTemplates.SEO_KEYWORDS_DE
            else:
                base_keywords = FashionContentTemplates.SEO_KEYWORDS_EN
            
            # Produkt-spezifische Keywords
            product_keywords = self._extract_seo_keywords(analysis)
            all_keywords = base_keywords + product_keywords
            
            # Meta-Beschreibung generieren
            meta_description = await self._generate_meta_description(analysis, language)
            
            # Title-Tags generieren
            title_tags = await self._generate_title_variations(analysis, language)
            
            # H1/H2 Headlines
            headlines = await self._generate_seo_headlines(analysis, language)
            
            return {
                "keywords": all_keywords[:20],  # Top 20 Keywords
                "primary_keywords": product_keywords[:5],
                "meta_description": meta_description,
                "title_tags": title_tags,
                "headlines": headlines,
                "alt_text": self._generate_alt_text(analysis, language),
                "schema_markup": self._generate_schema_markup(analysis)
            }
            
        except Exception as e:
            logger.error(f"SEO content generation failed: {e}")
            raise

    def _extract_seo_keywords(self, analysis: Dict[str, Any]) -> List[str]:
        """Extrahiere SEO-Keywords aus der Bildanalyse"""
        keywords = []
        
        # Kategorie-basierte Keywords
        category = analysis.get("category", "")
        if category:
            keywords.append(category)
        
        # Farb-Keywords
        colors = analysis.get("colors", [])
        keywords.extend(colors)
        
        # Stil-Keywords
        style = analysis.get("style", "")
        if style:
            keywords.append(style)
            keywords.append(f"{style} fashion")
            keywords.append(f"{style} style")
        
        # Anlass-Keywords
        occasion = analysis.get("occasion", "")
        if occasion:
            keywords.append(occasion)
            keywords.append(f"{occasion} outfit")
        
        # Material-Keywords
        materials = analysis.get("materials", [])
        keywords.extend(materials)
        
        return keywords

    async def _generate_styling_tips(
        self,
        analysis: Dict[str, Any],
        language: str,
        target_audience: str
    ) -> Dict[str, Any]:
        """Generiere Styling-Tipps und Outfit-Vorschläge"""
        try:
            product_type = analysis.get("category", "fashion item")
            style = analysis.get("style", "modern")
            occasion = analysis.get("occasion", "casual")
            
            # Styling-Prompt erstellen
            if language == "de":
                prompt = f"""Erstelle praktische Styling-Tipps für ein {product_type} im {style} Stil.

Anlass: {occasion}
Zielgruppe: {target_audience}

Gib konkrete Tipps für:
1. Kombinationsmöglichkeiten
2. Passende Accessoires
3. Schuhe und Taschen
4. Verschiedene Anlässe
5. Saisonale Variationen

Styling-Tipps:"""
            else:
                prompt = f"""Create practical styling tips for a {product_type} in {style} style.

Occasion: {occasion}
Target audience: {target_audience}

Give concrete tips for:
1. Combination possibilities
2. Matching accessories
3. Shoes and bags
4. Different occasions
5. Seasonal variations

Styling tips:"""
            
            # Tips generieren
            generated_tips = await self._generate_text(prompt, max_length=200)
            
            # Strukturierte Tips erstellen
            outfit_combinations = self.fashion_kb.get_outfit_combinations(product_type)
            seasonal_tips = self.fashion_kb.get_seasonal_styling(product_type)
            accessory_suggestions = self.fashion_kb.get_accessory_suggestions(product_type)
            
            return {
                "general_tips": generated_tips,
                "outfit_combinations": outfit_combinations,
                "seasonal_styling": seasonal_tips,
                "accessories": accessory_suggestions,
                "occasion_specific": self.fashion_kb.get_occasion_styling(product_type),
                "color_combinations": self.fashion_kb.get_color_combinations(analysis.get("colors", []))
            }
            
        except Exception as e:
            logger.error(f"Styling tips generation failed: {e}")
            raise

    async def _generate_text(self, prompt: str, max_length: int = 200) -> str:
        """Generiere Text mit dem Language Model"""
        try:
            # Text mit Pipeline generieren
            generated = self.text_generator(
                prompt,
                max_length=len(prompt.split()) + max_length,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                truncation=True
            )
            
            # Generierten Text extrahieren (ohne Original-Prompt)
            full_text = generated[0]["generated_text"]
            generated_part = full_text[len(prompt):].strip()
            
            return generated_part
            
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            # Fallback: Einfacher Template-basierter Text
            return "Stylisches Fashion-Piece mit hochwertigem Design und erstklassiger Qualität."

    async def _save_content_results(
        self,
        job_id: str,
        content_results: Dict[str, Any],
        image_analysis: Dict[str, Any]
    ):
        """Speichere Content-Generierung Ergebnisse"""
        try:
            # Erstelle Ausgabeverzeichnis
            from pathlib import Path
            output_dir = Path(self.settings.PROCESSED_DIR) / job_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Speichere Content als JSON
            import json
            content_path = output_dir / "generated_content.json"
            with open(content_path, "w", encoding="utf-8") as f:
                json.dump(content_results, f, indent=2, ensure_ascii=False)
            
            # Speichere als leicht lesbare Textdateien
            await self._save_readable_content(output_dir, content_results)
            
            logger.info(f"Content results saved for job {job_id}")
            
        except Exception as e:
            logger.error(f"Failed to save content results: {e}")
            raise

    async def _save_readable_content(
        self,
        output_dir: Path,
        content_results: Dict[str, Any]
    ):
        """Speichere Content in lesbaren Textdateien"""
        try:
            # Produktbeschreibung
            if "description" in content_results:
                desc_path = output_dir / "product_description.txt"
                with open(desc_path, "w", encoding="utf-8") as f:
                    desc = content_results["description"]
                    f.write(f"Kurze Beschreibung:\n{desc.get('short', '')}\n\n")
                    f.write(f"Mittlere Beschreibung:\n{desc.get('medium', '')}\n\n")
                    f.write(f"Lange Beschreibung:\n{desc.get('long', '')}\n\n")
                    f.write(f"Stichpunkte:\n" + "\n".join(f"• {point}" for point in desc.get('bullet_points', [])))
            
            # SEO-Content
            if "seo" in content_results:
                seo_path = output_dir / "seo_content.txt"
                with open(seo_path, "w", encoding="utf-8") as f:
                    seo = content_results["seo"]
                    f.write(f"Meta-Beschreibung:\n{seo.get('meta_description', '')}\n\n")
                    f.write(f"Title-Tags:\n" + "\n".join(f"• {title}" for title in seo.get('title_tags', [])) + "\n\n")
                    f.write(f"Keywords:\n" + ", ".join(seo.get('keywords', [])))
            
            # Styling-Tipps
            if "styling_tips" in content_results:
                styling_path = output_dir / "styling_tips.txt"
                with open(styling_path, "w", encoding="utf-8") as f:
                    styling = content_results["styling_tips"]
                    f.write(f"Allgemeine Styling-Tipps:\n{styling.get('general_tips', '')}\n\n")
                    f.write(f"Outfit-Kombinationen:\n" + "\n".join(f"• {combo}" for combo in styling.get('outfit_combinations', [])))
                    
        except Exception as e:
            logger.error(f"Failed to save readable content: {e}")

    async def _update_job_status(
        self,
        job_id: str,
        status: str,
        result_data: Optional[Dict[str, Any]] = None
    ):
        """Update Job-Status"""
        try:
            logger.info(f"Content generation job {job_id} status updated to: {status}")
            
        except Exception as e:
            logger.error(f"Failed to update job status: {e}")

    def is_ready(self) -> bool:
        """Prüfe ob der Generator bereit ist"""
        return self._is_ready

    def get_model_info(self) -> Dict[str, Any]:
        """Modell-Informationen"""
        return {
            "content_model": self.settings.CONTENT_MODEL_NAME,
            "blip_model": self.settings.BLIP_MODEL_NAME,
            "supported_languages": self.settings.SUPPORTED_LANGUAGES,
            "ready": self._is_ready,
            "error": self._initialization_error
        }

    async def cleanup(self):
        """Cleanup-Routine"""
        try:
            logger.info("Cleaning up Content Generator...")
            
            if self.language_model:
                del self.language_model
            if self.blip_model:
                del self.blip_model
            
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info("Content Generator cleanup complete")
            
        except Exception as e:
            logger.error(f"Content Generator cleanup failed: {e}")


# Test Function
async def test_content_generator():
    """Test-Funktion für den Content Generator"""
    from config.settings import get_test_settings
    
    settings = get_test_settings()
    generator = ContentGenerator(settings)
    
    try:
        success = await generator.initialize()
        if not success:
            print("❌ Initialization failed")
            return
        
        print("✅ Content Generator initialized successfully")
        
        # Test Content-Generierung
        test_analysis = {
            "category": "dress",
            "style": "elegant",
            "colors": ["black", "white"],
            "occasion": "business",
            "materials": ["silk", "cotton"]
        }
        
        content = await generator.generate_comprehensive_content(
            test_analysis,
            {"language": "de", "target_audience": "young_professional"}
        )
        
        print(f"📝 Generated content: {len(content)} sections")
        
        await generator.cleanup()
        print("🧹 Cleanup completed")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    asyncio.run(test_content_generator())
