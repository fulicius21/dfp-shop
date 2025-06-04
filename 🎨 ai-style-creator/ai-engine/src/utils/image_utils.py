#!/usr/bin/env python3
"""
DressForPleasure AI Style Creator - Image Processing Utilities
=============================================================

Utility-Klassen für Bildverarbeitung, Optimierung und Analyse.
Unterstützt Fashion-spezifische Bildvorverarbeitung und Post-Processing.

Author: DressForPleasure Dev Team
Version: 1.0.0
"""

import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageStat
from typing import Tuple, List, Dict, Any, Optional
import colorsys
from sklearn.cluster import KMeans
import structlog

logger = structlog.get_logger()


class ImageProcessor:
    """
    Hauptklasse für Bildverarbeitung und -optimierung
    """
    
    def __init__(self):
        """Initialisierung des Image Processors"""
        self.supported_formats = ["JPEG", "PNG", "WEBP", "BMP"]
        logger.info("ImageProcessor initialized")

    def resize_image(self, image: Image.Image, max_size: int = 1024) -> Image.Image:
        """
        Ändere Bildgröße bei Beibehaltung des Seitenverhältnisses
        
        Args:
            image: PIL Image
            max_size: Maximale Größe für längste Seite
            
        Returns:
            Verkleinerte PIL Image
        """
        try:
            # Aktuelle Dimensionen
            width, height = image.size
            
            # Berechne neue Dimensionen
            if width > height:
                if width > max_size:
                    new_width = max_size
                    new_height = int((height * max_size) / width)
                else:
                    new_width, new_height = width, height
            else:
                if height > max_size:
                    new_height = max_size
                    new_width = int((width * max_size) / height)
                else:
                    new_width, new_height = width, height
            
            # Resize mit hochwertiger Resampling
            resized = image.resize((new_width, new_height), Image.LANCZOS)
            
            logger.debug(f"Image resized from {width}x{height} to {new_width}x{new_height}")
            return resized
            
        except Exception as e:
            logger.error(f"Image resize failed: {e}")
            return image

    def prepare_for_processing(self, image: Image.Image, target_size: int = 512) -> Image.Image:
        """
        Bereite Bild für KI-Processing vor
        
        Args:
            image: Eingabebild
            target_size: Zielgröße für Processing
            
        Returns:
            Vorbereitetes Bild
        """
        try:
            # In RGB konvertieren
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Größe anpassen
            processed = self.resize_image(image, target_size)
            
            # Grundlegende Optimierungen
            processed = self.enhance_for_ai(processed)
            
            return processed
            
        except Exception as e:
            logger.error(f"Image preparation failed: {e}")
            return image

    def enhance_for_ai(self, image: Image.Image) -> Image.Image:
        """
        Optimiere Bild für bessere KI-Verarbeitung
        
        Args:
            image: Eingabebild
            
        Returns:
            Optimiertes Bild
        """
        try:
            # Leichte Schärfung
            sharpened = image.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=2))
            
            # Kontrast leicht erhöhen
            enhancer = ImageEnhance.Contrast(sharpened)
            contrasted = enhancer.enhance(1.1)
            
            # Farbsättigung optimieren
            enhancer = ImageEnhance.Color(contrasted)
            enhanced = enhancer.enhance(1.05)
            
            return enhanced
            
        except Exception as e:
            logger.error(f"AI enhancement failed: {e}")
            return image

    def post_process_image(self, image: Image.Image, options: Dict[str, Any]) -> Image.Image:
        """
        Post-Processing nach KI-Generierung
        
        Args:
            image: Generiertes Bild
            options: Post-Processing Optionen
            
        Returns:
            Post-processed Bild
        """
        try:
            processed = image.copy()
            
            # Farbverbesserungen
            if options.get("enhance_colors", False):
                processed = self.enhance_colors(processed)
            
            # Schärfe-Verbesserung
            if options.get("sharpen", False):
                processed = self.sharpen_image(processed)
            
            # Rauschreduzierung
            if options.get("denoise", False):
                processed = self.reduce_noise(processed)
            
            # Belichtungskorrektur
            if options.get("auto_exposure", False):
                processed = self.auto_exposure_correction(processed)
            
            return processed
            
        except Exception as e:
            logger.error(f"Post-processing failed: {e}")
            return image

    def enhance_colors(self, image: Image.Image) -> Image.Image:
        """Verbessere Farbqualität"""
        try:
            # Farbsättigung erhöhen
            enhancer = ImageEnhance.Color(image)
            saturated = enhancer.enhance(1.15)
            
            # Lebendigkeit erhöhen
            enhancer = ImageEnhance.Brightness(saturated)
            brightened = enhancer.enhance(1.05)
            
            return brightened
            
        except Exception as e:
            logger.error(f"Color enhancement failed: {e}")
            return image

    def sharpen_image(self, image: Image.Image) -> Image.Image:
        """Schärfe das Bild"""
        try:
            return image.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        except Exception as e:
            logger.error(f"Sharpening failed: {e}")
            return image

    def reduce_noise(self, image: Image.Image) -> Image.Image:
        """Reduziere Bildrauschen"""
        try:
            # Konvertiere zu numpy für OpenCV
            img_array = np.array(image)
            
            # Non-local Means Denoising
            denoised = cv2.fastNlMeansDenoisingColored(img_array, None, 10, 10, 7, 21)
            
            return Image.fromarray(denoised)
            
        except Exception as e:
            logger.error(f"Noise reduction failed: {e}")
            return image

    def auto_exposure_correction(self, image: Image.Image) -> Image.Image:
        """Automatische Belichtungskorrektur"""
        try:
            # Histogram-Analyse
            img_array = np.array(image)
            
            # CLAHE (Contrast Limited Adaptive Histogram Equalization)
            lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            corrected = cv2.merge([l, a, b])
            corrected = cv2.cvtColor(corrected, cv2.COLOR_LAB2RGB)
            
            return Image.fromarray(corrected)
            
        except Exception as e:
            logger.error(f"Exposure correction failed: {e}")
            return image

    def analyze_image_properties(self, image: Image.Image) -> Dict[str, Any]:
        """
        Analysiere Bildeinschaften für Processing-Entscheidungen
        
        Args:
            image: Zu analysierendes Bild
            
        Returns:
            Dict mit Bildstatistiken
        """
        try:
            # Grundlegende Statistiken
            stat = ImageStat.Stat(image)
            
            # RGB zu numpy
            img_array = np.array(image)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Verschiedene Metriken berechnen
            brightness = np.mean(gray)
            contrast = np.std(gray)
            
            # Schärfe messen (Laplacian Variance)
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Farbsättigung
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            saturation = np.mean(hsv[:, :, 1])
            
            # Rauscheinschätzung
            noise_level = self._estimate_noise(gray)
            
            return {
                "brightness": float(brightness),
                "contrast": float(contrast),
                "sharpness": float(sharpness),
                "saturation": float(saturation),
                "noise_level": float(noise_level),
                "mean_rgb": stat.mean,
                "stddev_rgb": stat.stddev,
                "extrema": stat.extrema,
                "size": image.size,
                "mode": image.mode
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {}

    def _estimate_noise(self, gray_image: np.ndarray) -> float:
        """Schätze Rauschpegel im Bild"""
        try:
            # Verwende Laplacian für Rauscheinschätzung
            laplacian = cv2.Laplacian(gray_image, cv2.CV_64F)
            noise_estimate = laplacian.var() / (gray_image.var() + 1e-7)
            return min(noise_estimate, 1.0)  # Normalisiere auf 0-1
            
        except Exception as e:
            logger.error(f"Noise estimation failed: {e}")
            return 0.0

    def extract_dominant_colors(self, image: Image.Image, num_colors: int = 5) -> List[Dict[str, Any]]:
        """
        Extrahiere dominante Farben aus dem Bild
        
        Args:
            image: Eingabebild
            num_colors: Anzahl der zu extrahierenden Farben
            
        Returns:
            Liste mit dominanten Farben und Informationen
        """
        try:
            # Resize für Performance
            small_image = image.resize((150, 150))
            img_array = np.array(small_image)
            
            # Reshape für KMeans
            pixels = img_array.reshape((-1, 3))
            
            # KMeans Clustering
            kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
            kmeans.fit(pixels)
            
            colors = []
            for i, color in enumerate(kmeans.cluster_centers_):
                rgb = tuple(map(int, color))
                
                # Zusätzliche Farbinformationen
                hsv = colorsys.rgb_to_hsv(rgb[0]/255, rgb[1]/255, rgb[2]/255)
                
                # Farbname schätzen
                color_name = self._get_color_name(rgb)
                
                colors.append({
                    "rgb": rgb,
                    "hex": f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}",
                    "hsv": {
                        "hue": hsv[0] * 360,
                        "saturation": hsv[1] * 100,
                        "value": hsv[2] * 100
                    },
                    "name": color_name,
                    "percentage": float(np.sum(kmeans.labels_ == i) / len(kmeans.labels_) * 100)
                })
            
            # Sortiere nach Häufigkeit
            colors.sort(key=lambda x: x["percentage"], reverse=True)
            
            return colors
            
        except Exception as e:
            logger.error(f"Color extraction failed: {e}")
            return []

    def _get_color_name(self, rgb: Tuple[int, int, int]) -> str:
        """Einfache Farbnamenerkennung"""
        try:
            r, g, b = rgb
            
            # Einfache Regeln für Farbnamen
            if r > 200 and g > 200 and b > 200:
                return "white"
            elif r < 50 and g < 50 and b < 50:
                return "black"
            elif r > 150 and g < 100 and b < 100:
                return "red"
            elif r < 100 and g > 150 and b < 100:
                return "green"
            elif r < 100 and g < 100 and b > 150:
                return "blue"
            elif r > 150 and g > 150 and b < 100:
                return "yellow"
            elif r > 150 and g < 100 and b > 150:
                return "purple"
            elif r > 150 and g > 100 and b < 100:
                return "orange"
            elif r > 100 and g > 100 and b > 100:
                return "gray"
            else:
                return "mixed"
                
        except Exception:
            return "unknown"

    def create_thumbnail(self, image: Image.Image, size: Tuple[int, int] = (256, 256)) -> Image.Image:
        """Erstelle Thumbnail mit Seitenverhältnis"""
        try:
            # Kopie erstellen
            thumb = image.copy()
            
            # Thumbnail erstellen (behält Seitenverhältnis bei)
            thumb.thumbnail(size, Image.LANCZOS)
            
            return thumb
            
        except Exception as e:
            logger.error(f"Thumbnail creation failed: {e}")
            return image

    def create_web_optimized(self, image: Image.Image, quality: int = 85) -> Image.Image:
        """Erstelle web-optimierte Version"""
        try:
            # Web-optimale Größe
            web_image = self.resize_image(image, 1200)
            
            # Leichte Komprimierung für Web
            from io import BytesIO
            output = BytesIO()
            web_image.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)
            
            return Image.open(output)
            
        except Exception as e:
            logger.error(f"Web optimization failed: {e}")
            return image

    def remove_background(self, image: Image.Image) -> Image.Image:
        """
        Einfache Background-Entfernung für Produktfotos
        (Vereinfachte Version - für Production würde rembg oder U2Net verwendet)
        """
        try:
            # Konvertiere zu RGBA für Transparenz
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            img_array = np.array(image)
            
            # Einfache Edge-basierte Maske
            gray = cv2.cvtColor(img_array[:, :, :3], cv2.COLOR_RGB2GRAY)
            
            # Threshold für Background
            _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
            
            # Morphological operations
            kernel = np.ones((3, 3), np.uint8)
            mask = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            
            # Invertiere Maske (Background = 0, Objekt = 255)
            mask = cv2.bitwise_not(mask)
            
            # Anwenden der Maske
            img_array[:, :, 3] = mask
            
            return Image.fromarray(img_array, 'RGBA')
            
        except Exception as e:
            logger.error(f"Background removal failed: {e}")
            return image

    def detect_product_bounds(self, image: Image.Image) -> Dict[str, Any]:
        """
        Erkenne Produktgrenzen im Bild
        
        Returns:
            Dict mit Bounding Box und Confidence
        """
        try:
            img_array = np.array(image)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Edge Detection
            edges = cv2.Canny(gray, 50, 150)
            
            # Konturen finden
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Größte Kontur nehmen (wahrscheinlich das Produkt)
                largest_contour = max(contours, key=cv2.contourArea)
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                # Confidence basierend auf Konturfläche
                confidence = cv2.contourArea(largest_contour) / (image.width * image.height)
                
                return {
                    "bounding_box": {
                        "x": int(x),
                        "y": int(y),
                        "width": int(w),
                        "height": int(h)
                    },
                    "confidence": float(confidence),
                    "center": {
                        "x": int(x + w/2),
                        "y": int(y + h/2)
                    }
                }
            else:
                # Fallback: Gesamtes Bild
                return {
                    "bounding_box": {
                        "x": 0,
                        "y": 0,
                        "width": image.width,
                        "height": image.height
                    },
                    "confidence": 0.5,
                    "center": {
                        "x": image.width // 2,
                        "y": image.height // 2
                    }
                }
                
        except Exception as e:
            logger.error(f"Product bounds detection failed: {e}")
            return {}

    def validate_image_quality(self, image: Image.Image) -> Dict[str, Any]:
        """
        Validiere Bildqualität für Processing
        
        Returns:
            Dict mit Qualitätsbewertung und Empfehlungen
        """
        try:
            props = self.analyze_image_properties(image)
            
            quality_score = 100.0
            issues = []
            recommendations = []
            
            # Überprüfe Mindestgröße
            min_size = 256
            if min(image.size) < min_size:
                quality_score -= 30
                issues.append("image_too_small")
                recommendations.append(f"Increase image size to at least {min_size}px")
            
            # Überprüfe Schärfe
            if props.get("sharpness", 0) < 100:
                quality_score -= 20
                issues.append("image_blurry")
                recommendations.append("Improve image sharpness")
            
            # Überprüfe Belichtung
            brightness = props.get("brightness", 128)
            if brightness < 50 or brightness > 200:
                quality_score -= 15
                issues.append("poor_exposure")
                recommendations.append("Adjust image exposure/brightness")
            
            # Überprüfe Kontrast
            if props.get("contrast", 0) < 20:
                quality_score -= 10
                issues.append("low_contrast")
                recommendations.append("Increase image contrast")
            
            # Überprüfe Rauschen
            if props.get("noise_level", 0) > 0.5:
                quality_score -= 15
                issues.append("high_noise")
                recommendations.append("Reduce image noise")
            
            return {
                "quality_score": max(0, quality_score),
                "grade": self._get_quality_grade(quality_score),
                "issues": issues,
                "recommendations": recommendations,
                "properties": props,
                "suitable_for_ai": quality_score > 60
            }
            
        except Exception as e:
            logger.error(f"Quality validation failed: {e}")
            return {"quality_score": 0, "suitable_for_ai": False}

    def _get_quality_grade(self, score: float) -> str:
        """Konvertiere Score zu Grade"""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"


# Utility Functions
def load_image_safe(file_path: str) -> Optional[Image.Image]:
    """Sicheres Laden von Bildern mit Error Handling"""
    try:
        image = Image.open(file_path)
        
        # Grundlegende Validierung
        if image.width < 10 or image.height < 10:
            logger.warning(f"Image too small: {image.size}")
            return None
        
        return image
        
    except Exception as e:
        logger.error(f"Failed to load image {file_path}: {e}")
        return None


def save_image_optimized(image: Image.Image, output_path: str, format: str = "JPEG", quality: int = 95):
    """Optimiertes Speichern von Bildern"""
    try:
        # Format-spezifische Optimierungen
        save_kwargs = {
            "format": format,
            "optimize": True
        }
        
        if format.upper() in ["JPEG", "JPG"]:
            save_kwargs["quality"] = quality
            save_kwargs["progressive"] = True
        elif format.upper() == "PNG":
            save_kwargs["compress_level"] = 6
        elif format.upper() == "WEBP":
            save_kwargs["quality"] = quality
            save_kwargs["method"] = 6
        
        image.save(output_path, **save_kwargs)
        logger.debug(f"Image saved optimized: {output_path}")
        
    except Exception as e:
        logger.error(f"Failed to save image {output_path}: {e}")
        raise


# Test Function
def test_image_processor():
    """Test-Funktion für ImageProcessor"""
    processor = ImageProcessor()
    
    try:
        # Test mit einem Beispielbild (wenn verfügbar)
        test_image_path = "test_image.jpg"
        
        # Erstelle ein Test-Bild wenn keines existiert
        test_image = Image.new('RGB', (800, 600), color='red')
        test_image.save(test_image_path)
        
        # Lade Bild
        image = load_image_safe(test_image_path)
        if image:
            print(f"✅ Image loaded: {image.size}")
            
            # Analysiere Eigenschaften
            props = processor.analyze_image_properties(image)
            print(f"📊 Analysis: brightness={props.get('brightness', 0):.1f}")
            
            # Validiere Qualität
            quality = processor.validate_image_quality(image)
            print(f"🎯 Quality: {quality['grade']} ({quality['quality_score']:.1f})")
            
            # Extrahiere Farben
            colors = processor.extract_dominant_colors(image, 3)
            print(f"🎨 Colors: {[c['name'] for c in colors]}")
            
            # Bereite für Processing vor
            processed = processor.prepare_for_processing(image)
            print(f"⚙️ Processed: {processed.size}")
            
        else:
            print("❌ Failed to load test image")
        
        # Cleanup
        import os
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
            
        print("✅ ImageProcessor test completed")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    test_image_processor()
