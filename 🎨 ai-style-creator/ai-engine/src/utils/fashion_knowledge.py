#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator - Fashion Knowledge Base
=========================================================

Fashion-spezifische Knowledge Base mit Informationen über:
- Produktkategorien und Eigenschaften
- Styling-Kombinationen und Trends
- Farb- und Material-Informationen
- Saisonale Empfehlungen
- Zielgruppen-spezifische Präferenzen

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import asyncio
import random
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import structlog

logger = structlog.get_logger()


class Season(Enum):
    """Jahreszeiten"""
    SPRING = "spring"
    SUMMER = "summer"
    AUTUMN = "autumn"
    WINTER = "winter"
    ALL_SEASON = "all_season"


class Occasion(Enum):
    """Anlässe"""
    BUSINESS = "business"
    CASUAL = "casual"
    FORMAL = "formal"
    PARTY = "party"
    SPORT = "sport"
    VACATION = "vacation"
    DATE = "date"
    EVERYDAY = "everyday"


class Style(Enum):
    """Style-Kategorien"""
    ELEGANT = "elegant"
    CASUAL = "casual"
    SPORTY = "sporty"
    BUSINESS = "business"
    VINTAGE = "vintage"
    MODERN = "modern"
    BOHEMIAN = "bohemian"
    MINIMALIST = "minimalist"
    URBAN = "urban"
    ROMANTIC = "romantic"


@dataclass
class ProductInfo:
    """Produktinformationen"""
    category: str
    subcategory: str
    materials: List[str]
    occasions: List[Occasion]
    seasons: List[Season]
    styles: List[Style]
    care_instructions: List[str]
    typical_colors: List[str]
    complementary_items: List[str]
    styling_tips: List[str]


@dataclass
class ColorInfo:
    """Farbinformationen"""
    name: str
    hex_code: str
    rgb: Tuple[int, int, int]
    complementary_colors: List[str]
    occasions: List[Occasion]
    seasons: List[Season]
    mood: str
    description: str


@dataclass
class StyleCombination:
    """Style-Kombinationen"""
    main_item: str
    complementary_items: List[str]
    accessories: List[str]
    occasions: List[Occasion]
    seasons: List[Season]
    description: str
    tips: List[str]


class FashionKnowledgeBase:
    """
    Zentrale Fashion Knowledge Base
    """
    
    def __init__(self):
        """Initialisierung der Knowledge Base"""
        self.products: Dict[str, ProductInfo] = {}
        self.colors: Dict[str, ColorInfo] = {}
        self.combinations: List[StyleCombination] = []
        self.trends: Dict[str, Any] = {}
        self.size_guides: Dict[str, Any] = {}
        
        logger.info("FashionKnowledgeBase initialized")

    async def initialize(self):
        """Asynchrone Initialisierung der Knowledge Base"""
        try:
            logger.info("🧠 Initializing Fashion Knowledge Base...")
            
            await self._load_product_categories()
            await self._load_color_information()
            await self._load_style_combinations()
            await self._load_current_trends()
            await self._load_size_guides()
            
            logger.info("✅ Fashion Knowledge Base initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Fashion Knowledge Base: {e}")
            raise

    async def _load_product_categories(self):
        """Lade Produktkategorien-Informationen"""
        
        # Kleider
        self.products["dress"] = ProductInfo(
            category="dress",
            subcategory="clothing",
            materials=["silk", "cotton", "polyester", "viscose", "wool"],
            occasions=[Occasion.BUSINESS, Occasion.FORMAL, Occasion.PARTY, Occasion.DATE],
            seasons=[Season.SPRING, Season.SUMMER, Season.AUTUMN],
            styles=[Style.ELEGANT, Style.BUSINESS, Style.ROMANTIC, Style.MODERN],
            care_instructions=["30°C waschen", "nicht bleichen", "bügeln bei mittlerer Temperatur"],
            typical_colors=["black", "navy", "red", "blue", "white", "bordeaux"],
            complementary_items=["blazer", "cardigan", "belt", "scarf"],
            styling_tips=[
                "Kombiniere mit einem Blazer für Business-Look",
                "Accessoires mit Gürtel für betonte Taille",
                "Pumps für eleganten Auftritt"
            ]
        )
        
        # Blusen
        self.products["blouse"] = ProductInfo(
            category="blouse",
            subcategory="tops",
            materials=["silk", "cotton", "viscose", "polyester"],
            occasions=[Occasion.BUSINESS, Occasion.CASUAL, Occasion.FORMAL],
            seasons=[Season.ALL_SEASON],
            styles=[Style.BUSINESS, Style.ELEGANT, Style.CASUAL, Style.MODERN],
            care_instructions=["30°C waschen", "nicht bleichen", "bügeln empfohlen"],
            typical_colors=["white", "black", "navy", "cream", "pink"],
            complementary_items=["blazer", "trousers", "skirt", "jeans"],
            styling_tips=[
                "Klassiker: weiße Bluse zu allem kombinierbar",
                "In Hose eingesteckt für Business-Look",
                "Offen über Tank-Top für Casual-Style"
            ]
        )
        
        # Hosen
        self.products["trousers"] = ProductInfo(
            category="trousers",
            subcategory="bottoms",
            materials=["wool", "cotton", "polyester", "elastane"],
            occasions=[Occasion.BUSINESS, Occasion.CASUAL, Occasion.FORMAL],
            seasons=[Season.ALL_SEASON],
            styles=[Style.BUSINESS, Style.ELEGANT, Style.CASUAL, Style.MODERN],
            care_instructions=["30°C waschen", "nicht bleichen", "bügeln bei mittlerer Temperatur"],
            typical_colors=["black", "navy", "gray", "beige", "brown"],
            complementary_items=["blouse", "shirt", "blazer", "sweater"],
            styling_tips=[
                "Hohe Taille streckt die Silhouette",
                "Zu Pumps für eleganten Business-Look",
                "Cropped-Variante zu Sneakern für Casual"
            ]
        )
        
        # Jacken/Blazer
        self.products["blazer"] = ProductInfo(
            category="blazer",
            subcategory="outerwear",
            materials=["wool", "cotton", "polyester", "linen"],
            occasions=[Occasion.BUSINESS, Occasion.FORMAL, Occasion.CASUAL],
            seasons=[Season.SPRING, Season.AUTUMN, Season.WINTER],
            styles=[Style.BUSINESS, Style.ELEGANT, Style.MODERN, Style.CASUAL],
            care_instructions=["Reinigung empfohlen", "nicht waschen", "bügeln bei niedriger Temperatur"],
            typical_colors=["black", "navy", "gray", "beige", "white"],
            complementary_items=["blouse", "shirt", "trousers", "dress", "jeans"],
            styling_tips=[
                "Strukturierter Blazer für Business-Eleganz",
                "Oversized-Blazer für trendy Casual-Look",
                "Ärmel hochkrempeln für lässigen Stil"
            ]
        )
        
        # Röcke
        self.products["skirt"] = ProductInfo(
            category="skirt",
            subcategory="bottoms",
            materials=["wool", "cotton", "polyester", "silk"],
            occasions=[Occasion.BUSINESS, Occasion.FORMAL, Occasion.CASUAL, Occasion.DATE],
            seasons=[Season.SPRING, Season.SUMMER, Season.AUTUMN],
            styles=[Style.ELEGANT, Style.BUSINESS, Style.ROMANTIC, Style.MODERN],
            care_instructions=["30°C waschen", "nicht bleichen", "bügeln bei mittlerer Temperatur"],
            typical_colors=["black", "navy", "gray", "burgundy", "beige"],
            complementary_items=["blouse", "shirt", "sweater", "blazer"],
            styling_tips=[
                "Pencil-Skirt für klassischen Business-Look",
                "A-Linien-Rock für feminine Silhouette",
                "Midi-Länge ist vielseitig und elegant"
            ]
        )
        
        # Pullover/Strickwaren
        self.products["sweater"] = ProductInfo(
            category="sweater",
            subcategory="knitwear",
            materials=["wool", "cashmere", "cotton", "acrylic"],
            occasions=[Occasion.CASUAL, Occasion.BUSINESS, Occasion.EVERYDAY],
            seasons=[Season.AUTUMN, Season.WINTER, Season.SPRING],
            styles=[Style.CASUAL, Style.MODERN, Style.MINIMALIST, Style.BUSINESS],
            care_instructions=["Handwäsche empfohlen", "liegend trocknen", "nicht bügeln"],
            typical_colors=["navy", "gray", "cream", "black", "camel"],
            complementary_items=["jeans", "trousers", "skirt", "blazer"],
            styling_tips=[
                "Kaschmir für luxuriösen Komfort",
                "Layering mit Blusen für Business-Look",
                "Oversized für trendy Casual-Style"
            ]
        )

    async def _load_color_information(self):
        """Lade Farbinformationen"""
        
        self.colors["black"] = ColorInfo(
            name="Schwarz",
            hex_code="#000000",
            rgb=(0, 0, 0),
            complementary_colors=["white", "gold", "silver", "red"],
            occasions=[Occasion.BUSINESS, Occasion.FORMAL, Occasion.PARTY],
            seasons=[Season.ALL_SEASON],
            mood="elegant, sophisticated, powerful",
            description="Zeitlos elegant und vielseitig kombinierbar"
        )
        
        self.colors["white"] = ColorInfo(
            name="Weiß",
            hex_code="#FFFFFF",
            rgb=(255, 255, 255),
            complementary_colors=["black", "navy", "red", "blue"],
            occasions=[Occasion.BUSINESS, Occasion.CASUAL, Occasion.FORMAL],
            seasons=[Season.SPRING, Season.SUMMER],
            mood="clean, fresh, minimalist",
            description="Klassisch rein und perfekt für cleane Looks"
        )
        
        self.colors["navy"] = ColorInfo(
            name="Navy",
            hex_code="#000080",
            rgb=(0, 0, 128),
            complementary_colors=["white", "cream", "gold", "pink"],
            occasions=[Occasion.BUSINESS, Occasion.CASUAL, Occasion.FORMAL],
            seasons=[Season.ALL_SEASON],
            mood="professional, trustworthy, classic",
            description="Professionelle Alternative zu Schwarz"
        )
        
        self.colors["red"] = ColorInfo(
            name="Rot",
            hex_code="#FF0000",
            rgb=(255, 0, 0),
            complementary_colors=["black", "white", "navy", "gray"],
            occasions=[Occasion.PARTY, Occasion.DATE, Occasion.FORMAL],
            seasons=[Season.AUTUMN, Season.WINTER],
            mood="passionate, confident, bold",
            description="Kraftvoll und selbstbewusst für besondere Anlässe"
        )

    async def _load_style_combinations(self):
        """Lade Style-Kombinationen"""
        
        # Business-Look
        self.combinations.append(StyleCombination(
            main_item="blazer",
            complementary_items=["blouse", "trousers", "pumps"],
            accessories=["watch", "briefcase", "simple jewelry"],
            occasions=[Occasion.BUSINESS, Occasion.FORMAL],
            seasons=[Season.ALL_SEASON],
            description="Klassischer Business-Look für professionelle Auftritte",
            tips=[
                "Neutrale Farben für Seriosität",
                "Passform ist entscheidend",
                "Minimaler Schmuck für cleanen Look"
            ]
        ))
        
        # Casual-Chic
        self.combinations.append(StyleCombination(
            main_item="dress",
            complementary_items=["sneakers", "denim jacket", "crossbody bag"],
            accessories=["sunglasses", "baseball cap"],
            occasions=[Occasion.CASUAL, Occasion.EVERYDAY],
            seasons=[Season.SPRING, Season.SUMMER],
            description="Entspannter Casual-Look mit moderner Note",
            tips=[
                "Mix von elegant und sportlich",
                "Bequeme Schuhe für den Alltag",
                "Layering für verschiedene Temperaturen"
            ]
        ))

    async def _load_current_trends(self):
        """Lade aktuelle Trends"""
        
        self.trends = {
            "2024_spring": {
                "colors": ["sage green", "lavender", "coral", "butter yellow"],
                "styles": ["oversized blazers", "wide-leg trousers", "midi skirts"],
                "materials": ["linen", "organic cotton", "recycled polyester"],
                "patterns": ["floral prints", "geometric", "stripes"]
            },
            "sustainable_fashion": {
                "focus": "eco-friendly materials and production",
                "keywords": ["sustainable", "eco-friendly", "organic", "recycled"],
                "brands": ["conscious fashion", "green fashion", "ethical"]
            },
            "berlin_style": {
                "characteristics": ["minimalist", "urban", "avant-garde"],
                "colors": ["black", "white", "gray", "muted tones"],
                "attitude": ["effortless", "sophisticated", "creative"]
            }
        }

    async def _load_size_guides(self):
        """Lade Größentabellen"""
        
        self.size_guides = {
            "women_clothing": {
                "XS": {"bust": "82-86", "waist": "66-70", "hips": "90-94"},
                "S": {"bust": "86-90", "waist": "70-74", "hips": "94-98"},
                "M": {"bust": "90-94", "waist": "74-78", "hips": "98-102"},
                "L": {"bust": "94-98", "waist": "78-82", "hips": "102-106"},
                "XL": {"bust": "98-102", "waist": "82-86", "hips": "106-110"}
            },
            "international_sizes": {
                "DE": {"34": "XS", "36": "S", "38": "M", "40": "L", "42": "XL"},
                "US": {"2": "XS", "4": "S", "6": "M", "8": "L", "10": "XL"},
                "UK": {"6": "XS", "8": "S", "10": "M", "12": "L", "14": "XL"}
            }
        }

    # Public Methods für Fashion-Informationen

    def get_product_info(self, category: str) -> Optional[ProductInfo]:
        """Hole Produktinformationen für Kategorie"""
        return self.products.get(category.lower())

    def get_complementary_items(self, product_category: str) -> List[str]:
        """Hole komplementäre Items für Produkt"""
        product_info = self.get_product_info(product_category)
        if product_info:
            return product_info.complementary_items
        return []

    def get_styling_tips(self, product_category: str) -> List[str]:
        """Hole Styling-Tipps für Produkt"""
        product_info = self.get_product_info(product_category)
        if product_info:
            return product_info.styling_tips
        return []

    def get_outfit_combinations(self, main_item: str) -> List[Dict[str, Any]]:
        """Hole Outfit-Kombinationen für Hauptitem"""
        combinations = []
        
        for combo in self.combinations:
            if combo.main_item.lower() == main_item.lower():
                combinations.append({
                    "items": combo.complementary_items,
                    "accessories": combo.accessories,
                    "occasions": [occ.value for occ in combo.occasions],
                    "description": combo.description,
                    "tips": combo.tips
                })
        
        return combinations

    def get_seasonal_styling(self, product_category: str) -> Dict[str, List[str]]:
        """Hole saisonale Styling-Tipps"""
        product_info = self.get_product_info(product_category)
        
        seasonal_tips = {
            "spring": [],
            "summer": [],
            "autumn": [],
            "winter": []
        }
        
        if product_info:
            for season in product_info.seasons:
                if season == Season.SPRING:
                    seasonal_tips["spring"].extend([
                        "Layering mit leichten Cardigans",
                        "Pastellfarben für frischen Look",
                        "Leichte Materialien bevorzugen"
                    ])
                elif season == Season.SUMMER:
                    seasonal_tips["summer"].extend([
                        "Atmungsaktive Materialien wählen",
                        "Helle Farben reflektieren Sonnenlicht",
                        "Minimale Layering für Komfort"
                    ])
                elif season == Season.AUTUMN:
                    seasonal_tips["autumn"].extend([
                        "Warme Erdtöne bevorzugen",
                        "Layering für Temperaturwechsel",
                        "Strickwaren für Gemütlichkeit"
                    ])
                elif season == Season.WINTER:
                    seasonal_tips["winter"].extend([
                        "Warme Materialien wie Wolle",
                        "Dunkle Farben für Eleganz",
                        "Mehrschichtiger Look für Wärme"
                    ])
        
        return seasonal_tips

    def get_color_combinations(self, main_colors: List[str]) -> List[Dict[str, Any]]:
        """Hole Farbkombinationen für gegebene Farben"""
        combinations = []
        
        for color in main_colors:
            color_info = self.colors.get(color.lower())
            if color_info:
                combinations.append({
                    "main_color": color,
                    "complementary": color_info.complementary_colors,
                    "mood": color_info.mood,
                    "occasions": [occ.value for occ in color_info.occasions],
                    "seasons": [season.value for season in color_info.seasons]
                })
        
        return combinations

    def get_occasion_styling(self, product_category: str) -> Dict[str, List[str]]:
        """Hole Anlass-spezifische Styling-Tipps"""
        product_info = self.get_product_info(product_category)
        
        occasion_tips = {}
        
        if product_info:
            for occasion in product_info.occasions:
                if occasion == Occasion.BUSINESS:
                    occasion_tips["business"] = [
                        "Klassische Schnitte bevorzugen",
                        "Neutrale Farben für Professionalität",
                        "Minimaler Schmuck und Accessoires"
                    ]
                elif occasion == Occasion.CASUAL:
                    occasion_tips["casual"] = [
                        "Bequeme Passform wählen",
                        "Kreative Kombinationen erlaubt",
                        "Persönlicher Stil im Vordergrund"
                    ]
                elif occasion == Occasion.FORMAL:
                    occasion_tips["formal"] = [
                        "Elegante Silhouetten",
                        "Hochwertige Materialien",
                        "Zeitlose Eleganz bevorzugen"
                    ]
                elif occasion == Occasion.PARTY:
                    occasion_tips["party"] = [
                        "Auffällige Details erlaubt",
                        "Glänzende Materialien möglich",
                        "Statement-Accessoires"
                    ]
        
        return occasion_tips

    def get_matching_accessories(self, product_category: str) -> List[str]:
        """Hole passende Accessoires für Produkt"""
        accessory_map = {
            "dress": ["belt", "necklace", "earrings", "handbag", "scarf"],
            "blouse": ["brooch", "watch", "bracelet", "handbag"],
            "trousers": ["belt", "watch", "handbag", "shoes"],
            "blazer": ["pocket square", "watch", "briefcase", "brooch"],
            "skirt": ["belt", "tights", "handbag", "shoes"],
            "sweater": ["scarf", "necklace", "handbag", "boots"]
        }
        
        return accessory_map.get(product_category.lower(), [])

    def get_wardrobe_staples(self) -> List[str]:
        """Hole Garderobe-Basics"""
        return [
            "white blouse",
            "black trousers", 
            "navy blazer",
            "little black dress",
            "quality jeans",
            "cashmere sweater",
            "trench coat",
            "white sneakers",
            "black pumps",
            "versatile handbag"
        ]

    def get_current_trends(self, category: str = "general") -> Dict[str, Any]:
        """Hole aktuelle Trends"""
        if category in self.trends:
            return self.trends[category]
        return self.trends

    def get_brand_voice_elements(self) -> Dict[str, Any]:
        """Hole Marken-Voice Elemente"""
        return {
            "personality": ["sophisticated", "urban", "creative", "sustainable"],
            "tone": "inspiring yet accessible",
            "berlin_connection": ["metropolitan", "creative capital", "urban elegance"],
            "values": ["quality", "individuality", "sustainability", "creativity"],
            "style_descriptors": [
                "zeitlos elegant", "urban sophisticated", "kreativ individuell",
                "nachhaltig bewusst", "metropolitan chic"
            ]
        }

    def analyze_fashion_context(self, 
                               colors: List[str], 
                               materials: List[str], 
                               category: str) -> Dict[str, Any]:
        """Analysiere Fashion-Kontext für Content-Generierung"""
        
        analysis = {
            "primary_style": self._determine_primary_style(colors, materials, category),
            "suitable_occasions": self._get_suitable_occasions(colors, category),
            "seasonal_fit": self._analyze_seasonal_fit(colors, materials),
            "target_audience": self._suggest_target_audience(colors, category),
            "styling_direction": self._get_styling_direction(colors, materials, category),
            "trend_alignment": self._check_trend_alignment(colors, materials)
        }
        
        return analysis

    def _determine_primary_style(self, colors: List[str], materials: List[str], category: str) -> str:
        """Bestimme primären Stil basierend auf Eigenschaften"""
        
        # Einfache Regel-basierte Bestimmung
        if "black" in colors or "navy" in colors:
            if "silk" in materials or "wool" in materials:
                return "elegant"
            else:
                return "business"
        elif "white" in colors:
            return "minimalist"
        elif any(color in ["red", "pink", "purple"] for color in colors):
            return "romantic"
        else:
            return "modern"

    def _get_suitable_occasions(self, colors: List[str], category: str) -> List[str]:
        """Bestimme geeignete Anlässe"""
        occasions = []
        
        product_info = self.get_product_info(category)
        if product_info:
            occasions = [occ.value for occ in product_info.occasions]
        
        # Farb-basierte Anpassungen
        if "black" in colors:
            occasions.extend(["formal", "business"])
        if any(bright_color in colors for bright_color in ["red", "pink", "yellow"]):
            occasions.extend(["party", "date"])
        
        return list(set(occasions))  # Duplikate entfernen

    def _analyze_seasonal_fit(self, colors: List[str], materials: List[str]) -> List[str]:
        """Analysiere saisonale Eignung"""
        seasons = []
        
        # Material-basiert
        if any(warm_material in materials for warm_material in ["wool", "cashmere"]):
            seasons.extend(["autumn", "winter"])
        if any(light_material in materials for light_material in ["linen", "cotton"]):
            seasons.extend(["spring", "summer"])
        
        # Farb-basiert
        if any(dark_color in colors for dark_color in ["black", "navy", "burgundy"]):
            seasons.extend(["autumn", "winter"])
        if any(light_color in colors for light_color in ["white", "cream", "pastels"]):
            seasons.extend(["spring", "summer"])
        
        return list(set(seasons)) if seasons else ["all_season"]

    def _suggest_target_audience(self, colors: List[str], category: str) -> str:
        """Schlage Zielgruppe vor"""
        
        if category in ["blazer", "trousers"] and any(color in ["black", "navy", "gray"] for color in colors):
            return "young_professional"
        elif any(bright_color in colors for bright_color in ["red", "pink", "yellow"]):
            return "creative"
        elif "black" in colors and category in ["dress", "blouse"]:
            return "luxury"
        else:
            return "urban"

    def _get_styling_direction(self, colors: List[str], materials: List[str], category: str) -> List[str]:
        """Hole Styling-Richtungen"""
        directions = []
        
        # Basis-Richtungen aus Produktinfo
        product_info = self.get_product_info(category)
        if product_info:
            directions.extend(product_info.styling_tips[:2])  # Top 2 Tips
        
        # Material-spezifische Richtungen
        if "silk" in materials:
            directions.append("Luxuriöse Eleganz durch hochwertige Materialien")
        if "cotton" in materials:
            directions.append("Vielseitige Kombinierbarkeit für jeden Tag")
        
        return directions

    def _check_trend_alignment(self, colors: List[str], materials: List[str]) -> Dict[str, Any]:
        """Prüfe Trend-Übereinstimmung"""
        alignment = {
            "current_trends": [],
            "sustainable_aspect": False,
            "berlin_style": False
        }
        
        # Aktuelle Trends prüfen
        current_spring = self.trends.get("2024_spring", {})
        if any(color in current_spring.get("colors", []) for color in colors):
            alignment["current_trends"].append("spring_2024_colors")
        
        # Nachhaltigkeit
        if any(sustainable_material in materials for sustainable_material in ["organic cotton", "linen", "recycled"]):
            alignment["sustainable_aspect"] = True
        
        # Berlin Style
        berlin_colors = ["black", "white", "gray"]
        if any(color in berlin_colors for color in colors):
            alignment["berlin_style"] = True
        
        return alignment


# Test Function
async def test_fashion_knowledge_base():
    """Test-Funktion für Fashion Knowledge Base"""
    kb = FashionKnowledgeBase()
    
    try:
        await kb.initialize()
        print("✅ Fashion Knowledge Base initialized")
        
        # Test Produktinfo
        dress_info = kb.get_product_info("dress")
        if dress_info:
            print(f"👗 Dress materials: {dress_info.materials}")
            print(f"🎯 Dress occasions: {[occ.value for occ in dress_info.occasions]}")
        
        # Test Kombinationen
        combinations = kb.get_outfit_combinations("dress")
        print(f"👗 Dress combinations: {len(combinations)} found")
        
        # Test Farb-Kombinationen
        color_combos = kb.get_color_combinations(["black", "white"])
        print(f"🎨 Color combinations: {len(color_combos)} found")
        
        # Test Fashion-Kontext-Analyse
        analysis = kb.analyze_fashion_context(
            colors=["black", "white"],
            materials=["silk", "cotton"],
            category="dress"
        )
        print(f"📊 Fashion analysis: {analysis['primary_style']} style")
        
        print("✅ Fashion Knowledge Base test completed")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    asyncio.run(test_fashion_knowledge_base())
