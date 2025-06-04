#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator - Text Processing Utilities
============================================================

Utility-Klassen für Textverarbeitung, Content-Optimierung und NLP.
Unterstützt Fashion-spezifische Text-Generierung und -Optimierung.

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import re
import string
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter
import structlog

logger = structlog.get_logger()


class TextProcessor:
    """
    Hauptklasse für Text-Processing und Content-Optimierung
    """
    
    def __init__(self):
        """Initialisierung des Text Processors"""
        self.fashion_terms = self._load_fashion_vocabulary()
        self.stopwords_de = self._load_stopwords_de()
        self.stopwords_en = self._load_stopwords_en()
        logger.info("TextProcessor initialized")

    def _load_fashion_vocabulary(self) -> Dict[str, List[str]]:
        """Lade Fashion-spezifisches Vokabular"""
        return {
            "materials": [
                "baumwolle", "cotton", "seide", "silk", "wolle", "wool", 
                "leinen", "linen", "denim", "leder", "leather", "polyester",
                "viscose", "modal", "kaschmir", "cashmere", "satin", "chiffon"
            ],
            "styles": [
                "elegant", "casual", "business", "formal", "sporty", "vintage",
                "modern", "klassisch", "trendy", "urban", "bohemian", "minimalist",
                "sophisticated", "relaxed", "chic", "edgy", "feminine", "masculine"
            ],
            "colors": [
                "schwarz", "black", "weiß", "white", "rot", "red", "blau", "blue",
                "grün", "green", "gelb", "yellow", "rosa", "pink", "lila", "purple",
                "orange", "braun", "brown", "grau", "gray", "beige", "navy", "bordeaux"
            ],
            "occasions": [
                "business", "freizeit", "party", "hochzeit", "büro", "urlaub",
                "casual", "formal", "sport", "evening", "weekend", "travel",
                "work", "date", "celebration", "everyday"
            ],
            "fits": [
                "slim", "regular", "relaxed", "oversized", "tailored", "loose",
                "tight", "fitted", "straight", "wide", "narrow", "cropped"
            ]
        }

    def _load_stopwords_de(self) -> List[str]:
        """Deutsche Stopwörter"""
        return [
            "der", "die", "das", "und", "oder", "aber", "mit", "für", "von",
            "zu", "in", "an", "auf", "bei", "durch", "über", "unter", "nach",
            "vor", "zwischen", "ist", "war", "wird", "haben", "sein", "werden",
            "können", "müssen", "sollen", "wollen", "dürfen", "mögen"
        ]

    def _load_stopwords_en(self) -> List[str]:
        """Englische Stopwörter"""
        return [
            "the", "and", "or", "but", "with", "for", "from", "to", "in", "on",
            "at", "by", "through", "over", "under", "after", "before", "between",
            "is", "was", "will", "have", "be", "can", "must", "should", "would",
            "could", "may", "might", "do", "does", "did"
        ]

    def clean_and_format(self, text: str) -> str:
        """
        Bereinige und formatiere Text
        
        Args:
            text: Roher Text
            
        Returns:
            Bereinigter und formatierter Text
        """
        try:
            if not text:
                return ""
            
            # Grundlegende Bereinigung
            cleaned = text.strip()
            
            # Mehrfache Leerzeichen entfernen
            cleaned = re.sub(r'\s+', ' ', cleaned)
            
            # Mehrfache Satzzeichen entfernen
            cleaned = re.sub(r'[.]{2,}', '.', cleaned)
            cleaned = re.sub(r'[!]{2,}', '!', cleaned)
            cleaned = re.sub(r'[?]{2,}', '?', cleaned)
            
            # Unerwünschte Zeichen entfernen
            cleaned = re.sub(r'[^\w\s.,!?äöüßÄÖÜ\-]', '', cleaned)
            
            # Satzzeichen-Spacing korrigieren
            cleaned = re.sub(r'\s+([.,!?])', r'\1', cleaned)
            cleaned = re.sub(r'([.,!?])(\w)', r'\1 \2', cleaned)
            
            # Ersten Buchstaben großschreiben
            if cleaned:
                cleaned = cleaned[0].upper() + cleaned[1:]
            
            # Sätze korrekt beenden
            if cleaned and not cleaned.endswith(('.', '!', '?')):
                cleaned += '.'
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Text cleaning failed: {e}")
            return text

    def create_short_version(self, text: str, max_length: int = 100) -> str:
        """
        Erstelle kurze Version des Textes
        
        Args:
            text: Originaltext
            max_length: Maximale Länge
            
        Returns:
            Verkürzte Version
        """
        try:
            if len(text) <= max_length:
                return text
            
            # Bei Sätzen kürzen
            sentences = self._split_sentences(text)
            
            short_text = ""
            for sentence in sentences:
                if len(short_text + sentence) <= max_length - 3:  # -3 für "..."
                    short_text += sentence + " "
                else:
                    break
            
            # Falls nicht gekürzt werden konnte, bei Wörtern abschneiden
            if not short_text.strip():
                words = text.split()
                short_text = ""
                for word in words:
                    if len(short_text + word) <= max_length - 3:
                        short_text += word + " "
                    else:
                        break
            
            short_text = short_text.strip()
            
            # Ellipsis hinzufügen wenn gekürzt
            if len(short_text) < len(text.strip()):
                short_text += "..."
            
            return short_text
            
        except Exception as e:
            logger.error(f"Short version creation failed: {e}")
            return text[:max_length] + "..." if len(text) > max_length else text

    def create_long_version(self, text: str, target_length: int = 400) -> str:
        """
        Erstelle erweiterte Version des Textes
        
        Args:
            text: Originaltext
            target_length: Ziel-Länge
            
        Returns:
            Erweiterte Version
        """
        try:
            if len(text) >= target_length:
                return text
            
            # Erweitere mit Fashion-spezifischen Zusätzen
            extended = text
            
            # Füge Qualitäts-Statements hinzu
            quality_additions = [
                " Hergestellt aus hochwertigen Materialien für langanhaltenden Tragekomfort.",
                " Die sorgfältige Verarbeitung garantiert eine perfekte Passform.",
                " Zeitloses Design trifft auf moderne Funktionalität.",
                " Nachhaltig produziert für bewusste Fashion-Liebhaber.",
                " Vielseitig kombinierbar für verschiedene Anlässe."
            ]
            
            # Style-Ergänzungen
            style_additions = [
                " Ein Must-have für die moderne Garderobe.",
                " Perfekt für den urbanen Lifestyle.",
                " Verleiht jedem Outfit das gewisse Etwas.",
                " Unterstreicht Ihren individuellen Stil.",
                " Ein zeitloser Klassiker neu interpretiert."
            ]
            
            # Füge Ergänzungen hinzu bis Ziel-Länge erreicht
            all_additions = quality_additions + style_additions
            
            for addition in all_additions:
                if len(extended + addition) <= target_length:
                    extended += addition
                else:
                    break
            
            return extended
            
        except Exception as e:
            logger.error(f"Long version creation failed: {e}")
            return text

    def create_bullet_points(self, text: str) -> List[str]:
        """
        Konvertiere Text zu Bullet Points
        
        Args:
            text: Eingabetext
            
        Returns:
            Liste von Bullet Points
        """
        try:
            # Teile Text in Sätze
            sentences = self._split_sentences(text)
            
            bullet_points = []
            
            for sentence in sentences:
                # Bereinige Satz
                cleaned = sentence.strip()
                if not cleaned:
                    continue
                
                # Entferne Artikel am Anfang für prägnantere Bullets
                cleaned = re.sub(r'^(Der|Die|Das|Ein|Eine)\s+', '', cleaned, flags=re.IGNORECASE)
                
                # Stelle sicher, dass Bullet Point sinnvoll ist
                if len(cleaned) > 10 and len(cleaned) < 150:
                    # Ersten Buchstaben großschreiben
                    cleaned = cleaned[0].upper() + cleaned[1:] if cleaned else ""
                    bullet_points.append(cleaned)
            
            # Falls zu wenig Punkte, aus Keywords erstellen
            if len(bullet_points) < 3:
                additional_points = self._create_feature_bullets(text)
                bullet_points.extend(additional_points)
            
            return bullet_points[:6]  # Maximal 6 Bullet Points
            
        except Exception as e:
            logger.error(f"Bullet point creation failed: {e}")
            return [text]

    def _create_feature_bullets(self, text: str) -> List[str]:
        """Erstelle Feature-basierte Bullet Points"""
        features = [
            "Hochwertige Materialqualität",
            "Perfekte Passform",
            "Vielseitig kombinierbar",
            "Zeitloser Stil",
            "Komfortabler Tragekomfort",
            "Sorgfältige Verarbeitung"
        ]
        
        return features[:3]  # Maximal 3 zusätzliche Features

    def _split_sentences(self, text: str) -> List[str]:
        """Teile Text in Sätze"""
        try:
            # Einfacher Sentence Splitter
            sentences = re.split(r'[.!?]+', text)
            return [s.strip() for s in sentences if s.strip()]
        except Exception:
            return [text]

    def extract_keywords(self, text: str, language: str = "de", max_keywords: int = 10) -> List[str]:
        """
        Extrahiere Keywords aus Text
        
        Args:
            text: Eingabetext
            language: Sprache (de/en)
            max_keywords: Maximale Anzahl Keywords
            
        Returns:
            Liste relevanter Keywords
        """
        try:
            # Text normalisieren
            normalized = self._normalize_text(text)
            
            # Wörter extrahieren
            words = normalized.split()
            
            # Stopwörter entfernen
            stopwords = self.stopwords_de if language == "de" else self.stopwords_en
            filtered_words = [word for word in words if word.lower() not in stopwords]
            
            # Häufigkeiten zählen
            word_freq = Counter(filtered_words)
            
            # Fashion-spezifische Wörter bevorzugen
            fashion_keywords = []
            other_keywords = []
            
            for word, freq in word_freq.most_common():
                if self._is_fashion_term(word):
                    fashion_keywords.append(word)
                else:
                    other_keywords.append(word)
            
            # Kombiniere Fashion-Keywords mit anderen
            keywords = fashion_keywords + other_keywords
            
            return keywords[:max_keywords]
            
        except Exception as e:
            logger.error(f"Keyword extraction failed: {e}")
            return []

    def _normalize_text(self, text: str) -> str:
        """Normalisiere Text für Keyword-Extraktion"""
        try:
            # Kleinbuchstaben
            normalized = text.lower()
            
            # Satzzeichen entfernen
            normalized = normalized.translate(str.maketrans('', '', string.punctuation))
            
            # Mehrfache Leerzeichen entfernen
            normalized = re.sub(r'\s+', ' ', normalized)
            
            return normalized.strip()
            
        except Exception:
            return text

    def _is_fashion_term(self, word: str) -> bool:
        """Prüfe ob Wort ein Fashion-Term ist"""
        word_lower = word.lower()
        
        for category, terms in self.fashion_terms.items():
            if word_lower in [term.lower() for term in terms]:
                return True
        
        return False

    def optimize_for_seo(self, text: str, primary_keywords: List[str]) -> str:
        """
        Optimiere Text für SEO
        
        Args:
            text: Originaltext
            primary_keywords: Haupt-Keywords
            
        Returns:
            SEO-optimierter Text
        """
        try:
            optimized = text
            
            # Stelle sicher, dass primäre Keywords vorkommen
            for keyword in primary_keywords[:3]:  # Top 3 Keywords
                if keyword.lower() not in optimized.lower():
                    # Füge Keyword natürlich ein
                    optimized = self._insert_keyword_naturally(optimized, keyword)
            
            # Keyword-Dichte prüfen und anpassen
            optimized = self._optimize_keyword_density(optimized, primary_keywords)
            
            return optimized
            
        except Exception as e:
            logger.error(f"SEO optimization failed: {e}")
            return text

    def _insert_keyword_naturally(self, text: str, keyword: str) -> str:
        """Füge Keyword natürlich in Text ein"""
        try:
            # Einfache Implementierung: Füge am Ende hinzu
            if not text.endswith('.'):
                text += '.'
            
            text += f" {keyword.capitalize()} für anspruchsvolle Stil-Liebhaber."
            
            return text
            
        except Exception:
            return text

    def _optimize_keyword_density(self, text: str, keywords: List[str]) -> str:
        """Optimiere Keyword-Dichte"""
        # Vereinfachte Implementierung
        # In einer echten Anwendung würde hier komplexere NLP-Analyse stattfinden
        return text

    def create_meta_description(self, text: str, max_length: int = 160) -> str:
        """
        Erstelle Meta-Beschreibung für SEO
        
        Args:
            text: Originaltext
            max_length: Maximale Länge
            
        Returns:
            Meta-Beschreibung
        """
        try:
            # Erste relevante Sätze extrahieren
            sentences = self._split_sentences(text)
            
            meta = ""
            for sentence in sentences:
                if len(meta + sentence) <= max_length - 3:
                    meta += sentence + " "
                else:
                    break
            
            meta = meta.strip()
            
            # Call-to-Action hinzufügen wenn Platz
            cta_phrases = ["Jetzt entdecken", "Jetzt kaufen", "Mehr erfahren"]
            
            for cta in cta_phrases:
                if len(meta + " " + cta + ".") <= max_length:
                    meta += " " + cta + "."
                    break
            
            return meta
            
        except Exception as e:
            logger.error(f"Meta description creation failed: {e}")
            return text[:max_length]

    def generate_title_variations(self, base_title: str, keywords: List[str]) -> List[str]:
        """
        Generiere Title-Variationen für A/B-Testing
        
        Args:
            base_title: Basis-Titel
            keywords: Relevante Keywords
            
        Returns:
            Liste von Title-Variationen
        """
        try:
            variations = [base_title]
            
            # Keyword-erweiterte Variationen
            for keyword in keywords[:3]:
                variations.append(f"{keyword.capitalize()} - {base_title}")
                variations.append(f"{base_title} | {keyword.capitalize()}")
            
            # Style-Variationen
            style_prefixes = [
                "Premium", "Exklusiv", "Trendy", "Modern", "Elegant", "Stylisch"
            ]
            
            for prefix in style_prefixes[:2]:
                variations.append(f"{prefix} {base_title}")
            
            # CTA-Variationen
            cta_suffixes = [
                "| Jetzt kaufen", "- Online bestellen", "| DressForPleasure"
            ]
            
            for suffix in cta_suffixes[:2]:
                if len(base_title + " " + suffix) <= 60:  # Google Title Limit
                    variations.append(base_title + " " + suffix)
            
            return variations[:8]  # Maximal 8 Variationen
            
        except Exception as e:
            logger.error(f"Title variation generation failed: {e}")
            return [base_title]

    def analyze_readability(self, text: str, language: str = "de") -> Dict[str, Any]:
        """
        Analysiere Lesbarkeit des Textes
        
        Args:
            text: Zu analysierender Text
            language: Sprache
            
        Returns:
            Lesbarkeits-Analyse
        """
        try:
            # Grundlegende Statistiken
            words = len(text.split())
            sentences = len(self._split_sentences(text))
            
            # Durchschnittliche Satzlänge
            avg_sentence_length = words / max(sentences, 1)
            
            # Durchschnittliche Wortlänge
            word_lengths = [len(word) for word in text.split()]
            avg_word_length = sum(word_lengths) / max(len(word_lengths), 1)
            
            # Lesbarkeits-Score (vereinfacht)
            readability_score = 100 - (avg_sentence_length * 1.5) - (avg_word_length * 2)
            readability_score = max(0, min(100, readability_score))
            
            # Bewertung
            if readability_score >= 80:
                grade = "Sehr gut"
            elif readability_score >= 60:
                grade = "Gut"
            elif readability_score >= 40:
                grade = "Durchschnittlich"
            else:
                grade = "Schwer"
            
            return {
                "score": readability_score,
                "grade": grade,
                "word_count": words,
                "sentence_count": sentences,
                "avg_sentence_length": avg_sentence_length,
                "avg_word_length": avg_word_length,
                "recommendations": self._get_readability_recommendations(
                    avg_sentence_length, avg_word_length
                )
            }
            
        except Exception as e:
            logger.error(f"Readability analysis failed: {e}")
            return {"score": 50, "grade": "Unbekannt"}

    def _get_readability_recommendations(self, avg_sentence_length: float, avg_word_length: float) -> List[str]:
        """Gib Empfehlungen für bessere Lesbarkeit"""
        recommendations = []
        
        if avg_sentence_length > 20:
            recommendations.append("Verwenden Sie kürzere Sätze (max. 20 Wörter)")
        
        if avg_word_length > 7:
            recommendations.append("Verwenden Sie einfachere Wörter")
        
        if not recommendations:
            recommendations.append("Text ist gut lesbar")
        
        return recommendations

    def format_for_platform(self, text: str, platform: str) -> str:
        """
        Formatiere Text für spezifische Plattformen
        
        Args:
            text: Originaltext
            platform: Zielplattform (website, instagram, facebook, etc.)
            
        Returns:
            Plattform-optimierter Text
        """
        try:
            if platform == "instagram":
                # Instagram: Hashtags und Emojis
                formatted = text + "\n\n#fashion #style #dressforp #berlin #outfit 👗✨"
                return formatted
            
            elif platform == "facebook":
                # Facebook: Engaging Fragen
                formatted = text + "\n\nWas ist euer Lieblings-Style? Kommentiert unten! 💬"
                return formatted
            
            elif platform == "website":
                # Website: Strukturierter Text
                return text
            
            elif platform == "newsletter":
                # Newsletter: Persönliche Ansprache
                formatted = f"Liebe Fashion-Liebhaber,\n\n{text}\n\nIhr DressForPleasure Team"
                return formatted
            
            else:
                return text
                
        except Exception as e:
            logger.error(f"Platform formatting failed: {e}")
            return text


# Utility Functions
def clean_text_simple(text: str) -> str:
    """Einfache Text-Bereinigung"""
    if not text:
        return ""
    
    # Grundlegende Bereinigung
    cleaned = re.sub(r'\s+', ' ', text.strip())
    return cleaned


def extract_sentences(text: str) -> List[str]:
    """Extrahiere Sätze aus Text"""
    sentences = re.split(r'[.!?]+', text)
    return [s.strip() for s in sentences if s.strip()]


def word_count(text: str) -> int:
    """Zähle Wörter in Text"""
    return len(text.split())


def character_count(text: str, include_spaces: bool = True) -> int:
    """Zähle Zeichen in Text"""
    return len(text) if include_spaces else len(text.replace(' ', ''))


# Test Function
def test_text_processor():
    """Test-Funktion für TextProcessor"""
    processor = TextProcessor()
    
    try:
        # Test-Text
        test_text = """Das ist ein  wunderschönes    Kleid in eleganten Schwarz.  
        Es ist perfekt für Business-Anlässe geeignet!! 
        Die hochwertige Seide sorgt für erstklassigen Tragekomfort."""
        
        print(f"Original: {test_text}")
        
        # Bereinigung testen
        cleaned = processor.clean_and_format(test_text)
        print(f"✅ Cleaned: {cleaned}")
        
        # Kurze Version
        short = processor.create_short_version(cleaned, 50)
        print(f"📝 Short: {short}")
        
        # Bullet Points
        bullets = processor.create_bullet_points(cleaned)
        print(f"📋 Bullets: {bullets}")
        
        # Keywords
        keywords = processor.extract_keywords(cleaned, "de", 5)
        print(f"🔑 Keywords: {keywords}")
        
        # Lesbarkeit
        readability = processor.analyze_readability(cleaned)
        print(f"📊 Readability: {readability['grade']} ({readability['score']:.1f})")
        
        print("✅ TextProcessor test completed")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    test_text_processor()
