/**
 * DressForPleasure AI Style Creator - Content Generation Service
 * =============================================================
 * 
 * KI-basierte Content-Generierung für Fashion E-Commerce:
 * - Deutsche Produktbeschreibungen mit Berlin/Atlanta Brand Voice
 * - SEO-optimierte Texte
 * - Styling-Tipps und Outfit-Suggestions
 * - Automatische Keyword-Integration
 * 
 * Author: DressForPleasure Dev Team
 * Version: 1.0.0
 */

const { pipeline } = require('@xenova/transformers');
const sharp = require('sharp');

class ContentGenerationService {
    constructor() {
        this.models = {
            textGeneration: null,
            imageAnalysis: null,
            translation: null
        };
        
        this.brandVoices = {
            berlin: {
                tone: 'urban, edgy, kreativ',
                keywords: ['Berlin', 'Street Style', 'urban', 'kreativ', 'einzigartig', 'trendy'],
                adjectives: ['cool', 'lässig', 'authentisch', 'durchdacht', 'individuell'],
                phrases: [
                    'für den urbanen Lifestyle',
                    'perfekt für Berliner Straßen',
                    'mit dem gewissen Etwas',
                    'kreativ und durchdacht'
                ]
            },
            atlanta: {
                tone: 'warm, einladend, sophisticated',
                keywords: ['Atlanta', 'Southern Style', 'elegant', 'warm', 'einladend', 'sophisticated'],
                adjectives: ['elegant', 'warm', 'einladend', 'charmant', 'stilvoll'],
                phrases: [
                    'mit südlichem Charme',
                    'eleganz trifft Komfort',
                    'zeitlos und charmant',
                    'für besondere Momente'
                ]
            }
        };
        
        this.fashionTerms = {
            categories: {
                'dress': ['Kleid', 'Abendkleid', 'Sommerkleid', 'Cocktailkleid'],
                'shirt': ['Shirt', 'Bluse', 'Top', 'T-Shirt'],
                'jacket': ['Jacke', 'Blazer', 'Mantel', 'Cardigan'],
                'pants': ['Hose', 'Jeans', 'Chino', 'Leggings'],
                'skirt': ['Rock', 'Minirock', 'Maxirock', 'Bleistiftrock'],
                'shoes': ['Schuhe', 'Sneaker', 'Stiefel', 'Pumps']
            },
            materials: [
                'Baumwolle', 'Leinen', 'Seide', 'Wolle', 'Kaschmir',
                'Polyester', 'Elastan', 'Viskose', 'Denim'
            ],
            styles: [
                'casual', 'elegant', 'sportlich', 'business', 'festlich',
                'vintage', 'modern', 'klassisch', 'trendy', 'zeitlos'
            ],
            occasions: [
                'Alltag', 'Büro', 'Freizeit', 'Party', 'Date',
                'Sport', 'Reise', 'Festival', 'Hochzeit', 'Business'
            ]
        };
        
        this.seoKeywords = {
            primary: [
                'Fashion', 'Mode', 'Kleidung', 'Style', 'Outfit',
                'Damenmode', 'Herrenmode', 'Trends', 'Shopping'
            ],
            secondary: [
                'online kaufen', 'günstig', 'sale', 'neu', 'kollektion',
                'designer', 'marke', 'qualität', 'versandkostenfrei'
            ],
            local: [
                'Berlin', 'Atlanta', 'Deutschland', 'USA',
                'europäische Mode', 'amerikanischer Style'
            ]
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialisiert die Content-Generation-Modelle
     */
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('📝 Initialisiere Content-Generation-Modelle...');
        
        try {
            // Text-Generation für deutsche Produktbeschreibungen
            console.log('Loading Text Generation Model...');
            this.models.textGeneration = await pipeline(
                'text-generation',
                'Xenova/distilgpt2',
                { device: 'cpu' }
            );
            
            // Bild-Analyse für kontextuelle Beschreibungen
            console.log('Loading Image Analysis Model...');
            this.models.imageAnalysis = await pipeline(
                'image-to-text',
                'Xenova/vit-gpt2-image-captioning',
                { device: 'cpu' }
            );
            
            this.isInitialized = true;
            console.log('✅ Content-Generation-Modelle erfolgreich geladen');
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Content-Generation-Modelle:', error);
            throw new Error(`Content generation initialization failed: ${error.message}`);
        }
    }

    /**
     * Generiert vollständigen Content für ein Produktbild
     */
    async generateProductContent(imageData, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        console.log('📝 Generiere Produktcontent...');
        
        const config = {
            brandVoice: options.brandVoice || 'berlin',
            category: options.category || 'fashion',
            targetAudience: options.targetAudience || 'general',
            language: options.language || 'de',
            includeSeO: options.includeSEO !== false,
            includeStylingTips: options.includeStylingTips !== false,
            wordCount: options.wordCount || 150,
            ...options
        };
        
        try {
            // 1. Bildanalyse für kontextuelle Beschreibung
            const imageAnalysis = await this.analyzeImage(imageData);
            console.log('🔍 Bildanalyse abgeschlossen');
            
            // 2. Produktbeschreibung generieren
            const productDescription = await this.generateProductDescription(
                imageAnalysis, 
                config
            );
            console.log('📝 Produktbeschreibung generiert');
            
            // 3. SEO-optimierte Texte
            let seoContent = {};
            if (config.includeSEO) {
                seoContent = await this.generateSEOContent(productDescription, config);
                console.log('🔍 SEO-Content generiert');
            }
            
            // 4. Styling-Tipps
            let stylingTips = [];
            if (config.includeStylingTips) {
                stylingTips = await this.generateStylingTips(imageAnalysis, config);
                console.log('💡 Styling-Tipps generiert');
            }
            
            // 5. Social Media Content
            const socialMediaContent = await this.generateSocialMediaContent(
                productDescription, 
                config
            );
            console.log('📱 Social Media Content generiert');
            
            const result = {
                productDescription: {
                    title: productDescription.title,
                    description: productDescription.description,
                    shortDescription: productDescription.shortDescription,
                    features: productDescription.features,
                    brandVoice: config.brandVoice
                },
                seo: seoContent,
                stylingTips,
                socialMedia: socialMediaContent,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    wordCount: this.countWords(productDescription.description),
                    language: config.language,
                    imageAnalysis: imageAnalysis.summary
                }
            };
            
            console.log('✅ Content-Generierung abgeschlossen');
            return result;
            
        } catch (error) {
            console.error('❌ Content-Generierung fehlgeschlagen:', error);
            throw new Error(`Content generation failed: ${error.message}`);
        }
    }

    /**
     * Analysiert das Bild für kontextuelle Beschreibungen
     */
    async analyzeImage(imageData) {
        console.log('🔍 Analysiere Bild für Content-Kontext...');
        
        try {
            // Vereinfachte Bildanalyse basierend auf visuellen Merkmalen
            const image = sharp(imageData.buffer);
            const metadata = await image.metadata();
            const stats = await image.stats();
            
            // Dominante Farben extrahieren
            const dominantColors = await this.extractDominantColors(image);
            
            // Bildkomposition analysieren
            const composition = await this.analyzeComposition(image);
            
            // Erkannte Produktkategorie (vereinfacht)
            const detectedCategory = await this.detectProductCategory(imageData);
            
            return {
                dimensions: `${metadata.width}x${metadata.height}`,
                dominantColors,
                composition,
                detectedCategory,
                brightness: this.calculateBrightness(stats),
                contrast: this.calculateContrast(stats),
                summary: `${detectedCategory.name} in ${dominantColors.primary} mit ${composition.style} Komposition`
            };
            
        } catch (error) {
            console.warn('⚠️ Bildanalyse fehlgeschlagen, verwende Standard-Analyse');
            return {
                summary: 'Modeartikel mit professioneller Präsentation',
                detectedCategory: { name: 'fashion_item', confidence: 0.7 },
                dominantColors: { primary: 'neutral', secondary: 'accent' }
            };
        }
    }

    /**
     * Generiert eine umfassende Produktbeschreibung
     */
    async generateProductDescription(imageAnalysis, config) {
        console.log('📝 Generiere Produktbeschreibung...');
        
        const brandVoice = this.brandVoices[config.brandVoice] || this.brandVoices.berlin;
        const category = imageAnalysis.detectedCategory.name || 'fashion_item';
        
        // Template-basierte Generierung für bessere Qualität
        const title = this.generateProductTitle(imageAnalysis, brandVoice, category);
        const description = this.generateDetailedDescription(imageAnalysis, brandVoice, config);
        const shortDescription = this.generateShortDescription(imageAnalysis, brandVoice);
        const features = this.generateProductFeatures(imageAnalysis, category);
        
        return {
            title,
            description,
            shortDescription,
            features
        };
    }

    /**
     * Generiert Produkttitel
     */
    generateProductTitle(imageAnalysis, brandVoice, category) {
        const categoryName = this.getCategoryName(category);
        const colorName = this.getColorName(imageAnalysis.dominantColors.primary);
        const styleAdjective = this.getRandomElement(brandVoice.adjectives);
        
        const titleTemplates = [
            `${styleAdjective} ${categoryName} in ${colorName}`,
            `${categoryName} - ${styleAdjective} und ${this.getRandomElement(brandVoice.adjectives)}`,
            `Exklusives ${categoryName} ${this.getRandomElement(brandVoice.phrases)}`,
            `${styleAdjective} ${categoryName} für den modernen Lifestyle`
        ];
        
        return this.getRandomElement(titleTemplates);
    }

    /**
     * Generiert detaillierte Beschreibung
     */
    generateDetailedDescription(imageAnalysis, brandVoice, config) {
        const category = this.getCategoryName(imageAnalysis.detectedCategory.name);
        const color = this.getColorName(imageAnalysis.dominantColors.primary);
        const style = imageAnalysis.composition?.style || 'elegant';
        
        const intro = this.generateIntro(category, brandVoice);
        const details = this.generateProductDetails(imageAnalysis, category);
        const styling = this.generateStylingSection(category, brandVoice);
        const closing = this.generateClosing(brandVoice);
        
        return `${intro}\n\n${details}\n\n${styling}\n\n${closing}`;
    }

    /**
     * Generiert Intro-Paragraph
     */
    generateIntro(category, brandVoice) {
        const adjective = this.getRandomElement(brandVoice.adjectives);
        const phrase = this.getRandomElement(brandVoice.phrases);
        
        const introTemplates = [
            `Entdecken Sie dieses ${adjective}e ${category}, das ${phrase} designed wurde.`,
            `Dieses ${category} verkörpert ${brandVoice.tone} und bietet zeitlosen Style.`,
            `Ein ${adjective}es ${category}, das Ihre Garderobe perfekt ergänzt.`,
            `Erleben Sie ${adjective}e Mode ${phrase} - dieses ${category} ist ein echtes Statement-Piece.`
        ];
        
        return this.getRandomElement(introTemplates);
    }

    /**
     * Generiert Produktdetails
     */
    generateProductDetails(imageAnalysis, category) {
        const material = this.getRandomElement(this.fashionTerms.materials);
        const style = this.getRandomElement(this.fashionTerms.styles);
        const color = this.getColorName(imageAnalysis.dominantColors.primary);
        
        const detailTemplates = [
            `Das hochwertige Material aus ${material} sorgt für Komfort und Langlebigkeit. Die ${style}e Passform betont Ihre Silhouette optimal.`,
            `Gefertigt aus feinstem ${material} in der Trendfarbe ${color}. Der ${style}e Schnitt garantiert eine perfekte Passform.`,
            `Die sorgfältige Verarbeitung und das weiche ${material} machen dieses Stück zu einem Favoriten für jeden Anlass.`,
            `Premium-${material} trifft auf ${style}es Design - eine Kombination, die überzeugt.`
        ];
        
        return this.getRandomElement(detailTemplates);
    }

    /**
     * Generiert Styling-Sektion
     */
    generateStylingSection(category, brandVoice) {
        const occasion = this.getRandomElement(this.fashionTerms.occasions);
        const adjective = this.getRandomElement(brandVoice.adjectives);
        
        const stylingTemplates = [
            `Perfekt für ${occasion} - kombinieren Sie es ${adjective} mit Ihren Lieblings-Accessoires.`,
            `Vielseitig styling-bar: von ${occasion} bis zu besonderen Anlässen - immer die richtige Wahl.`,
            `Lassen Sie Ihrer Kreativität freien Lauf und stylen Sie dieses ${category} nach Ihrem ${adjective}en Geschmack.`,
            `Ein echtes Must-Have für ${occasion} - ${adjective} und zeitlos zugleich.`
        ];
        
        return this.getRandomElement(stylingTemplates);
    }

    /**
     * Generiert Abschluss-Paragraph
     */
    generateClosing(brandVoice) {
        const phrase = this.getRandomElement(brandVoice.phrases);
        
        const closingTemplates = [
            `Investieren Sie in Qualität und Style - ${phrase}.`,
            `Ein Stück, das in keiner modernen Garderobe fehlen sollte.`,
            `Überzeugen Sie sich selbst von der außergewöhnlichen Qualität und dem ${brandVoice.tone} Design.`,
            `Mode, die begeistert - ${phrase}.`
        ];
        
        return this.getRandomElement(closingTemplates);
    }

    /**
     * Generiert kurze Beschreibung
     */
    generateShortDescription(imageAnalysis, brandVoice) {
        const category = this.getCategoryName(imageAnalysis.detectedCategory.name);
        const adjective = this.getRandomElement(brandVoice.adjectives);
        
        const shortTemplates = [
            `${adjective}es ${category} für den modernen Lifestyle`,
            `Zeitloses ${category} mit besonderem Charme`,
            `Premium ${category} - ${adjective} und komfortabel`,
            `${category} mit Wow-Faktor - ${adjective} und stilvoll`
        ];
        
        return this.getRandomElement(shortTemplates);
    }

    /**
     * Generiert Produktfeatures
     */
    generateProductFeatures(imageAnalysis, category) {
        const material = this.getRandomElement(this.fashionTerms.materials);
        const style = this.getRandomElement(this.fashionTerms.styles);
        
        const features = [
            `Hochwertiges ${material}`,
            `${style}er Schnitt`,
            'Pflegeleicht und langlebig',
            'Perfekte Passform',
            'Vielseitig kombinierbar'
        ];
        
        // Kategorie-spezifische Features hinzufügen
        if (category.includes('dress') || category.includes('kleid')) {
            features.push('Feminin und elegant');
            features.push('Für verschiedene Anlässe geeignet');
        } else if (category.includes('shirt') || category.includes('top')) {
            features.push('Angenehmer Tragekomfort');
            features.push('Atmungsaktiv');
        }
        
        return features.slice(0, 5); // Maximal 5 Features
    }

    /**
     * Generiert SEO-optimierte Inhalte
     */
    async generateSEOContent(productDescription, config) {
        console.log('🔍 Generiere SEO-Content...');
        
        const category = config.category || 'fashion';
        const brandLocation = config.brandVoice || 'berlin';
        
        return {
            metaTitle: this.generateMetaTitle(productDescription.title, category),
            metaDescription: this.generateMetaDescription(productDescription.shortDescription, category),
            keywords: this.generateKeywords(productDescription, category, brandLocation),
            h1: productDescription.title,
            h2Headings: [
                'Produktdetails',
                'Styling-Tipps',
                'Pflegehinweise',
                'Größentabelle'
            ],
            altText: this.generateAltText(productDescription.title, category),
            structuredData: this.generateStructuredData(productDescription, config)
        };
    }

    /**
     * Generiert Meta Title
     */
    generateMetaTitle(title, category) {
        const seoTitle = `${title} | DressForPleasure - Premium ${category} online kaufen`;
        return seoTitle.length > 60 ? title.substring(0, 57) + '...' : seoTitle;
    }

    /**
     * Generiert Meta Description
     */
    generateMetaDescription(shortDescription, category) {
        const seoDescription = `${shortDescription} ✓ Schneller Versand ✓ Einfache Rückgabe ✓ Premium Qualität | DressForPleasure`;
        return seoDescription.length > 160 ? seoDescription.substring(0, 157) + '...' : seoDescription;
    }

    /**
     * Generiert Keywords
     */
    generateKeywords(productDescription, category, brandLocation) {
        const keywords = [
            ...this.seoKeywords.primary,
            ...this.seoKeywords.secondary.slice(0, 3),
            category,
            brandLocation
        ];
        
        // Aus Produktbeschreibung extrahierte Keywords
        const textKeywords = this.extractKeywordsFromText(productDescription.description);
        keywords.push(...textKeywords.slice(0, 5));
        
        return [...new Set(keywords)]; // Duplikate entfernen
    }

    /**
     * Generiert Styling-Tipps
     */
    async generateStylingTips(imageAnalysis, config) {
        console.log('💡 Generiere Styling-Tipps...');
        
        const category = imageAnalysis.detectedCategory.name || 'fashion_item';
        const color = imageAnalysis.dominantColors.primary;
        const brandVoice = this.brandVoices[config.brandVoice];
        
        const tips = [];
        
        // Kategorie-spezifische Tipps
        if (category.includes('dress')) {
            tips.push(
                'Kombinieren Sie das Kleid mit einer schicken Jacke für den Büro-Look.',
                'Für den Abend: Statement-Schmuck und elegante Pumps.',
                'Lässig mit Sneakern für den Alltag - ein echter Hingucker!'
            );
        } else if (category.includes('shirt')) {
            tips.push(
                'Perfekt unter einem Blazer für den Business-Look.',
                'Lässig in die Jeans gesteckt mit cooler Jacke darüber.',
                'Als Layering-Piece unter einem Pullover - sehr trendy!'
            );
        } else if (category.includes('jacket')) {
            tips.push(
                'Der perfekte Begleiter für jeden Look - von casual bis elegant.',
                'Über einem Basic-Shirt für den entspannten City-Look.',
                'Zu einem Kleid für den perfekten Business-Outfit.'
            );
        }
        
        // Farb-spezifische Tipps
        tips.push(this.getColorStylingTip(color));
        
        // Brand-spezifische Tipps
        tips.push(`${brandVoice.phrases[0]} - ein echtes Statement-Piece!`);
        
        return tips.slice(0, 5); // Maximal 5 Tipps
    }

    /**
     * Generiert Social Media Content
     */
    async generateSocialMediaContent(productDescription, config) {
        console.log('📱 Generiere Social Media Content...');
        
        const hashtags = this.generateHashtags(config);
        
        return {
            instagram: {
                caption: `${productDescription.shortDescription} ✨\n\n#${hashtags.join(' #')}`,
                story: `Neuer Lieblings-Look gefunden! 💕`,
                hashtags: hashtags
            },
            facebook: {
                post: `Entdecken Sie unseren neuesten Favoriten: ${productDescription.title}\n\n${productDescription.shortDescription}\n\nJetzt online shoppen!`,
                hashtags: hashtags.slice(0, 3)
            },
            pinterest: {
                title: productDescription.title,
                description: `${productDescription.shortDescription} | Fashion Inspiration | Style Guide | Outfit Ideas`,
                hashtags: hashtags
            }
        };
    }

    /**
     * Generiert Hashtags
     */
    generateHashtags(config) {
        const baseHashtags = ['DressForPleasure', 'Fashion', 'Style', 'OOTD', 'Mode'];
        const brandHashtags = config.brandVoice === 'berlin' ? 
            ['BerlinStyle', 'UrbanFashion', 'StreetStyle'] :
            ['AtlantaStyle', 'SouthernChic', 'ElegantFashion'];
        
        return [...baseHashtags, ...brandHashtags, 'NewIn', 'ShopNow', 'FashionLove'];
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Extrahiert dominante Farben (vereinfacht)
     */
    async extractDominantColors(image) {
        try {
            const stats = await image.stats();
            
            if (stats.channels && stats.channels.length >= 3) {
                const r = Math.round(stats.channels[0].mean);
                const g = Math.round(stats.channels[1].mean);
                const b = Math.round(stats.channels[2].mean);
                
                return {
                    primary: this.rgbToColorName(r, g, b),
                    rgb: [r, g, b]
                };
            }
            
            return { primary: 'neutral', rgb: [128, 128, 128] };
        } catch (error) {
            return { primary: 'neutral', rgb: [128, 128, 128] };
        }
    }

    /**
     * Konvertiert RGB zu Farbnamen
     */
    rgbToColorName(r, g, b) {
        const colorMap = {
            'schwarz': () => r < 50 && g < 50 && b < 50,
            'weiß': () => r > 200 && g > 200 && b > 200,
            'rot': () => r > g + 30 && r > b + 30,
            'blau': () => b > r + 30 && b > g + 30,
            'grün': () => g > r + 30 && g > b + 30,
            'gelb': () => r > 150 && g > 150 && b < 100,
            'grau': () => Math.abs(r - g) < 30 && Math.abs(g - b) < 30
        };
        
        for (const [color, condition] of Object.entries(colorMap)) {
            if (condition()) return color;
        }
        
        return 'neutral';
    }

    /**
     * Analysiert Bildkomposition
     */
    async analyzeComposition(image) {
        // Vereinfachte Kompositionsanalyse
        return {
            style: 'professionell',
            lighting: 'optimal',
            background: 'clean'
        };
    }

    /**
     * Erkennt Produktkategorie
     */
    async detectProductCategory(imageData) {
        // Vereinfachte Kategorieerkennung
        // In einer echten Implementierung würde hier ein Klassifikationsmodell verwendet
        return {
            name: 'fashion_item',
            confidence: 0.8,
            subcategory: 'clothing'
        };
    }

    /**
     * Gibt Kategoriename auf Deutsch zurück
     */
    getCategoryName(category) {
        const categoryMap = {
            'dress': 'Kleid',
            'shirt': 'Shirt',
            'jacket': 'Jacke',
            'pants': 'Hose',
            'skirt': 'Rock',
            'shoes': 'Schuhe',
            'fashion_item': 'Modeartikel'
        };
        
        return categoryMap[category] || 'Modeartikel';
    }

    /**
     * Gibt Farbname auf Deutsch zurück
     */
    getColorName(color) {
        const colorMap = {
            'schwarz': 'Schwarz',
            'weiß': 'Weiß',
            'rot': 'Rot',
            'blau': 'Blau',
            'grün': 'Grün',
            'gelb': 'Gelb',
            'grau': 'Grau',
            'neutral': 'Neutral'
        };
        
        return colorMap[color] || 'Neutral';
    }

    /**
     * Gibt farb-spezifische Styling-Tipps
     */
    getColorStylingTip(color) {
        const colorTips = {
            'schwarz': 'Zeitlos elegant - kombiniert sich perfekt mit jeder Farbe.',
            'weiß': 'Frisch und clean - ideal für den Sommer-Look.',
            'rot': 'Ein echter Eyecatcher - perfekt für besondere Anlässe.',
            'blau': 'Vielseitig und stilvoll - von casual bis business.',
            'grün': 'Natürlich und harmonisch - perfekt für entspannte Looks.',
            'grau': 'Klassisch und versatil - die perfekte Basis für jeden Style.'
        };
        
        return colorTips[color] || 'Ein vielseitiges Stück für jeden Anlass.';
    }

    /**
     * Extrahiert Keywords aus Text
     */
    extractKeywordsFromText(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\säöüß]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    /**
     * Generiert Structured Data
     */
    generateStructuredData(productDescription, config) {
        return {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": productDescription.title,
            "description": productDescription.description,
            "brand": {
                "@type": "Brand",
                "name": "DressForPleasure"
            },
            "category": config.category || "Fashion",
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "priceCurrency": "EUR"
            }
        };
    }

    /**
     * Generiert Alt-Text für SEO
     */
    generateAltText(title, category) {
        return `${title} - ${this.getCategoryName(category)} von DressForPleasure`;
    }

    /**
     * Zählt Wörter in Text
     */
    countWords(text) {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Helligkeits-Berechnung
     */
    calculateBrightness(stats) {
        if (!stats.channels || stats.channels.length === 0) return 0.5;
        const avgBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
        return Math.min(Math.max(avgBrightness / 255, 0), 1);
    }

    /**
     * Kontrast-Berechnung
     */
    calculateContrast(stats) {
        if (!stats.channels || stats.channels.length === 0) return 0.5;
        const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;
        return Math.min(Math.max(avgStdDev / 128, 0), 1);
    }

    /**
     * Zufälliges Element aus Array
     */
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

module.exports = ContentGenerationService;