/**
 * Fashion-Produktdaten für DressForPleasure
 * 
 * Echte Mode-Produktdaten mit Cloudinary-Bildern für eine vollständige E-Commerce-Experience
 */

import { db } from './connection';
import { 
  categories, collections, products, 
  productVariants, productCategories, productCollections, media
} from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Fashion-Kategorien
const fashionCategories = [
  {
    name: 'Kleider',
    slug: 'kleider',
    description: 'Elegante Kleider für jeden Anlass',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/categories/kleider.jpg',
    status: 'active' as const
  },
  {
    name: 'Oberteile',
    slug: 'oberteile',
    description: 'Stilvolle Shirts, Blusen und Tops',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/categories/oberteile.jpg',
    status: 'active' as const
  },
  {
    name: 'Hosen',
    slug: 'hosen',
    description: 'Komfortable und modische Hosen',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/categories/hosen.jpg',
    status: 'active' as const
  },
  {
    name: 'Jacken',
    slug: 'jacken',
    description: 'Stylische Jacken und Mäntel',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/categories/jacken.jpg',
    status: 'active' as const
  },
  {
    name: 'Röcke',
    slug: 'roecke',
    description: 'Feminine Röcke in verschiedenen Längen',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/categories/roecke.jpg',
    status: 'active' as const
  },
  {
    name: 'Accessoires',
    slug: 'accessoires',
    description: 'Taschen, Schmuck und weitere Accessoires',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/categories/accessoires.jpg',
    status: 'active' as const
  }
];

// Fashion-Kollektionen
const fashionCollections = [
  {
    name: 'Berlin Collection',
    slug: 'berlin',
    description: 'Urban-chic inspiriert von der Hauptstadt',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/collections/berlin.jpg',
    status: 'active' as const,
    featured: true,
    season: 'Herbst/Winter',
    year: 2024
  },
  {
    name: 'Munich Elegance',
    slug: 'munich',
    description: 'Zeitlose Eleganz mit bayerischem Flair',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/collections/munich.jpg',
    status: 'active' as const,
    featured: true,
    season: 'Herbst/Winter',
    year: 2024
  },
  {
    name: 'Hamburg Breeze',
    slug: 'hamburg',
    description: 'Maritime Mode für den Alltag',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/collections/hamburg.jpg',
    status: 'active' as const,
    featured: false,
    season: 'Frühling/Sommer',
    year: 2024
  },
  {
    name: 'Summer Vibes',
    slug: 'summer-vibes',
    description: 'Leichte Sommermode für heiße Tage',
    image: 'https://res.cloudinary.com/dressforp/image/upload/v1/collections/summer.jpg',
    status: 'active' as const,
    featured: false,
    season: 'Frühling/Sommer',
    year: 2024
  }
];

// Fashion-Produkte mit echten Daten
const fashionProducts = [
  // KLEIDER
  {
    name: 'Elegantes Abendkleid Berlin',
    slug: 'elegantes-abendkleid-berlin',
    description: 'Zeitloses schwarzes Abendkleid aus der Berlin Collection. Perfekt für besondere Anlässe mit seinem schlichten, aber eleganten Design.',
    longDescription: 'Dieses wunderschöne Abendkleid verkörpert urbane Eleganz. Der fließende Schnitt schmeichelt jeder Figur, während das hochwertige Material für Tragekomfort sorgt. Das Kleid ist vielseitig kombinierbar und ein Must-Have für jeden eleganten Anlass.',
    price: 89.99,
    originalPrice: 129.99,
    discount: 31,
    sku: 'BER-DRESS-001',
    status: 'active' as const,
    featured: true,
    newArrival: true,
    bestseller: false,
    weight: 400,
    material: '95% Polyester, 5% Elasthan',
    careInstructions: 'Maschinenwäsche bei 30°C, nicht bleichen, bei niedriger Temperatur bügeln',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Navy', value: 'navy', code: '#1a237e' }
    ],
    tags: ['elegant', 'abend', 'berlin', 'zeitlos'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-berlin-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-berlin-2.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-berlin-3.jpg'
    ]
  },
  {
    name: 'Casual Sommerkleid Hamburg',
    slug: 'casual-sommerkleid-hamburg',
    description: 'Leichtes Sommerkleid mit maritimem Flair aus der Hamburg Breeze Collection. Ideal für warme Sommertage.',
    longDescription: 'Dieses luftige Sommerkleid bringt maritime Frische in Ihren Kleiderschrank. Mit seinem bequemen Schnitt und den natürlichen Materialien ist es der perfekte Begleiter für entspannte Sommertage am Meer oder in der Stadt.',
    price: 49.99,
    originalPrice: null,
    discount: 0,
    sku: 'HAM-DRESS-001',
    status: 'active' as const,
    featured: false,
    newArrival: true,
    bestseller: true,
    weight: 250,
    material: '100% Baumwolle',
    careInstructions: 'Maschinenwäsche bei 40°C, kann gebleicht werden, bei mittlerer Temperatur bügeln',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Hellblau', value: 'lightblue', code: '#87ceeb' },
      { name: 'Weiß', value: 'white', code: '#ffffff' },
      { name: 'Gestreift', value: 'striped', code: '#4169e1' }
    ],
    tags: ['casual', 'sommer', 'hamburg', 'maritim', 'baumwolle'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-hamburg-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-hamburg-2.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-hamburg-3.jpg'
    ]
  },
  {
    name: 'Business Kleid Munich',
    slug: 'business-kleid-munich',
    description: 'Professionelles Business-Kleid aus der Munich Elegance Collection. Perfekt für das Büro.',
    longDescription: 'Dieses elegante Business-Kleid kombiniert Professionalität mit Stil. Der klassische Schnitt und die hochwertige Verarbeitung machen es zum perfekten Begleiter für wichtige Termine und den Arbeitsalltag.',
    price: 79.99,
    originalPrice: 99.99,
    discount: 20,
    sku: 'MUN-DRESS-001',
    status: 'active' as const,
    featured: true,
    newArrival: false,
    bestseller: true,
    weight: 380,
    material: '70% Polyester, 25% Viskose, 5% Elasthan',
    careInstructions: 'Professionelle Reinigung empfohlen',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Anthrazit', value: 'anthracite', code: '#2f4f4f' },
      { name: 'Dunkelblau', value: 'darkblue', code: '#191970' }
    ],
    tags: ['business', 'elegant', 'munich', 'professional'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-munich-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/dress-munich-2.jpg'
    ]
  },

  // OBERTEILE
  {
    name: 'Silk Bluse Berlin Premium',
    slug: 'silk-bluse-berlin-premium',
    description: 'Luxuriöse Seidenbluse aus der Berlin Collection. Zeitlos elegant für besondere Anlässe.',
    longDescription: 'Diese exquisite Seidenbluse verkörpert urbane Sophistication. Die glatte Seide fühlt sich wunderbar auf der Haut an und der klassische Schnitt macht sie zu einem vielseitigen Kleidungsstück für jeden Anlass.',
    price: 149.99,
    originalPrice: 199.99,
    discount: 25,
    sku: 'BER-BLOUSE-001',
    status: 'active' as const,
    featured: true,
    newArrival: true,
    bestseller: false,
    weight: 150,
    material: '100% Seide',
    careInstructions: 'Nur chemische Reinigung',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Creme', value: 'cream', code: '#f5f5dc' },
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Bordeaux', value: 'bordeaux', code: '#800020' }
    ],
    tags: ['seide', 'premium', 'berlin', 'elegant', 'bluse'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/blouse-berlin-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/blouse-berlin-2.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/blouse-berlin-3.jpg'
    ]
  },
  {
    name: 'Basic T-Shirt Hamburg',
    slug: 'basic-t-shirt-hamburg',
    description: 'Komfortables Basic T-Shirt aus Bio-Baumwolle. Teil der Hamburg Breeze Collection.',
    longDescription: 'Dieses hochwertige Basic T-Shirt ist ein unverzichtbares Grundelement für jeden Kleiderschrank. Aus nachhaltiger Bio-Baumwolle gefertigt, bietet es maximalen Komfort bei jedem Wetter.',
    price: 24.99,
    originalPrice: null,
    discount: 0,
    sku: 'HAM-TSHIRT-001',
    status: 'active' as const,
    featured: false,
    newArrival: false,
    bestseller: true,
    weight: 180,
    material: '100% Bio-Baumwolle',
    careInstructions: 'Maschinenwäsche bei 40°C, trocknergeeignet',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Weiß', value: 'white', code: '#ffffff' },
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Navy', value: 'navy', code: '#1a237e' },
      { name: 'Grau', value: 'grey', code: '#808080' }
    ],
    tags: ['basic', 'bio-baumwolle', 'hamburg', 'nachhaltig', 't-shirt'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/tshirt-hamburg-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/tshirt-hamburg-2.jpg'
    ]
  },

  // HOSEN
  {
    name: 'High-Waist Jeans Berlin',
    slug: 'high-waist-jeans-berlin',
    description: 'Trendige High-Waist Jeans im Berlin-Style. Perfekte Passform und nachhaltiger Denim.',
    longDescription: 'Diese stylische High-Waist Jeans bringt urbanen Chic in Ihren Alltag. Mit ihrer perfekten Passform und dem nachhaltigen Denim ist sie nicht nur modisch, sondern auch umweltbewusst.',
    price: 89.99,
    originalPrice: 119.99,
    discount: 25,
    sku: 'BER-JEANS-001',
    status: 'active' as const,
    featured: true,
    newArrival: true,
    bestseller: true,
    weight: 650,
    material: '98% Bio-Baumwolle, 2% Elasthan',
    careInstructions: 'Maschinenwäsche bei 30°C, auf links waschen',
    sizes: ['25', '26', '27', '28', '29', '30', '31', '32'],
    colors: [
      { name: 'Dark Blue', value: 'darkblue', code: '#191970' },
      { name: 'Black', value: 'black', code: '#000000' },
      { name: 'Light Blue', value: 'lightblue', code: '#87ceeb' }
    ],
    tags: ['jeans', 'high-waist', 'berlin', 'nachhaltig', 'denim'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/jeans-berlin-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/jeans-berlin-2.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/jeans-berlin-3.jpg'
    ]
  },
  {
    name: 'Anzughose Munich Professional',
    slug: 'anzughose-munich-professional',
    description: 'Elegante Anzughose für das Business. Teil der Munich Elegance Collection.',
    longDescription: 'Diese professionelle Anzughose ist der perfekte Begleiter für den Geschäftsalltag. Mit ihrem klassischen Schnitt und der hochwertigen Verarbeitung vermittelt sie Kompetenz und Stil.',
    price: 69.99,
    originalPrice: 89.99,
    discount: 22,
    sku: 'MUN-PANTS-001',
    status: 'active' as const,
    featured: false,
    newArrival: false,
    bestseller: true,
    weight: 450,
    material: '65% Polyester, 30% Viskose, 5% Elasthan',
    careInstructions: 'Professionelle Reinigung empfohlen',
    sizes: ['32', '34', '36', '38', '40', '42', '44'],
    colors: [
      { name: 'Anthrazit', value: 'anthracite', code: '#2f4f4f' },
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Dunkelblau', value: 'darkblue', code: '#191970' }
    ],
    tags: ['anzughose', 'business', 'munich', 'professional', 'elegant'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/pants-munich-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/pants-munich-2.jpg'
    ]
  },

  // JACKEN
  {
    name: 'Trenchcoat Berlin Classic',
    slug: 'trenchcoat-berlin-classic',
    description: 'Klassischer Trenchcoat im Berlin-Style. Zeitlos elegant und wasserdicht.',
    longDescription: 'Dieser ikonische Trenchcoat verkörpert zeitlose Eleganz mit modernem Twist. Wasserdicht und windabweisend ist er der perfekte Begleiter für jedes Wetter in der Großstadt.',
    price: 199.99,
    originalPrice: 279.99,
    discount: 29,
    sku: 'BER-COAT-001',
    status: 'active' as const,
    featured: true,
    newArrival: true,
    bestseller: true,
    weight: 950,
    material: '100% Polyester mit wasserabweisender Beschichtung',
    careInstructions: 'Professionelle Reinigung empfohlen',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Beige', value: 'beige', code: '#f5f5dc' },
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Navy', value: 'navy', code: '#1a237e' }
    ],
    tags: ['trenchcoat', 'berlin', 'wasserdicht', 'klassisch', 'elegant'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/coat-berlin-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/coat-berlin-2.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/coat-berlin-3.jpg'
    ]
  },
  {
    name: 'Blazer Munich Power',
    slug: 'blazer-munich-power',
    description: 'Kraftvoller Business-Blazer aus der Munich Elegance Collection. Für starke Auftritte.',
    longDescription: 'Dieser kraftvolle Blazer ist perfekt für wichtige Business-Termine. Mit seinem strukturierten Schnitt und den hochwertigen Details verleiht er Ihnen Autorität und Selbstbewusstsein.',
    price: 129.99,
    originalPrice: 169.99,
    discount: 24,
    sku: 'MUN-BLAZER-001',
    status: 'active' as const,
    featured: true,
    newArrival: false,
    bestseller: true,
    weight: 600,
    material: '70% Polyester, 25% Viskose, 5% Elasthan',
    careInstructions: 'Professionelle Reinigung empfohlen',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Anthrazit', value: 'anthracite', code: '#2f4f4f' },
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Dunkelblau', value: 'darkblue', code: '#191970' }
    ],
    tags: ['blazer', 'business', 'munich', 'power', 'elegant'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/blazer-munich-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/blazer-munich-2.jpg'
    ]
  },

  // RÖCKE
  {
    name: 'Midi Rock Berlin Chic',
    slug: 'midi-rock-berlin-chic',
    description: 'Eleganter Midi-Rock im Berlin-Style. Vielseitig kombinierbar für Office und Freizeit.',
    longDescription: 'Dieser vielseitige Midi-Rock ist ein wahres Multitalent. Ob im Büro oder in der Freizeit - mit seinen cleanen Linien und der perfekten Länge ist er immer die richtige Wahl.',
    price: 59.99,
    originalPrice: 79.99,
    discount: 25,
    sku: 'BER-SKIRT-001',
    status: 'active' as const,
    featured: false,
    newArrival: true,
    bestseller: false,
    weight: 280,
    material: '95% Polyester, 5% Elasthan',
    careInstructions: 'Maschinenwäsche bei 30°C, nicht bleichen',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Navy', value: 'navy', code: '#1a237e' },
      { name: 'Grau', value: 'grey', code: '#808080' }
    ],
    tags: ['midi', 'rock', 'berlin', 'vielseitig', 'office'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/skirt-berlin-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/skirt-berlin-2.jpg'
    ]
  },

  // ACCESSOIRES
  {
    name: 'Leder Handtasche Berlin',
    slug: 'leder-handtasche-berlin',
    description: 'Hochwertige Lederhandtasche im minimalistischen Berlin-Design. Handgefertigt aus italienischem Leder.',
    longDescription: 'Diese exquisite Handtasche verkörpert deutschen Minimalismus gepaart mit italienischer Lederkunst. Jede Tasche wird von Hand gefertigt und ist ein Unikat mit charakteristischen Details.',
    price: 249.99,
    originalPrice: 319.99,
    discount: 22,
    sku: 'BER-BAG-001',
    status: 'active' as const,
    featured: true,
    newArrival: true,
    bestseller: true,
    weight: 780,
    material: '100% italienisches Vollleder',
    careInstructions: 'Mit speziellem Lederpflegemittel behandeln',
    sizes: ['One Size'],
    colors: [
      { name: 'Schwarz', value: 'black', code: '#000000' },
      { name: 'Cognac', value: 'cognac', code: '#8b4513' },
      { name: 'Dunkelblau', value: 'darkblue', code: '#191970' }
    ],
    tags: ['handtasche', 'leder', 'berlin', 'handgefertigt', 'premium'],
    images: [
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/bag-berlin-1.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/bag-berlin-2.jpg',
      'https://res.cloudinary.com/dressforp/image/upload/v1/products/bag-berlin-3.jpg'
    ]
  }
];

/**
 * Fashion-Daten in die Datenbank einfügen
 */
export async function seedFashionData() {
  console.log('🌟 Füge Fashion-Produktdaten hinzu...');

  try {
    // 1. Kategorien erstellen
    console.log('📂 Erstelle Kategorien...');
    const insertedCategories = await db.insert(categories).values(fashionCategories).returning();
    const categoryMap = new Map(insertedCategories.map(cat => [cat.slug, cat.id]));

    // 2. Kollektionen erstellen
    console.log('🏷️ Erstelle Kollektionen...');
    const insertedCollections = await db.insert(collections).values(fashionCollections).returning();
    const collectionMap = new Map(insertedCollections.map(coll => [coll.slug, coll.id]));

    // 3. Produkte erstellen
    console.log('👗 Erstelle Produkte...');
    for (const productData of fashionProducts) {
      // Produkt einfügen
      const [product] = await db.insert(products).values({
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        longDescription: productData.longDescription,
        price: productData.price,
        originalPrice: productData.originalPrice,
        discount: productData.discount,
        sku: productData.sku,
        status: productData.status,
        featured: productData.featured,
        newArrival: productData.newArrival,
        bestseller: productData.bestseller,
        weight: productData.weight,
        material: productData.material,
        careInstructions: productData.careInstructions,
        seoTitle: productData.name,
        seoDescription: productData.description,
        tags: productData.tags
      }).returning();

      // Kategorie-Zuordnung basierend auf Produktname
      let categorySlug = 'accessoires'; // Default
      if (productData.name.toLowerCase().includes('kleid')) categorySlug = 'kleider';
      else if (productData.name.toLowerCase().includes('bluse') || productData.name.toLowerCase().includes('shirt')) categorySlug = 'oberteile';
      else if (productData.name.toLowerCase().includes('hose') || productData.name.toLowerCase().includes('jeans')) categorySlug = 'hosen';
      else if (productData.name.toLowerCase().includes('jacke') || productData.name.toLowerCase().includes('blazer') || productData.name.toLowerCase().includes('coat')) categorySlug = 'jacken';
      else if (productData.name.toLowerCase().includes('rock')) categorySlug = 'roecke';

      const categoryId = categoryMap.get(categorySlug);
      if (categoryId) {
        await db.insert(productCategories).values({
          productId: product.id,
          categoryId: categoryId
        });
      }

      // Kollektions-Zuordnung basierend auf Produktname
      let collectionSlug = 'summer-vibes'; // Default
      if (productData.name.toLowerCase().includes('berlin')) collectionSlug = 'berlin';
      else if (productData.name.toLowerCase().includes('munich')) collectionSlug = 'munich';
      else if (productData.name.toLowerCase().includes('hamburg')) collectionSlug = 'hamburg';

      const collectionId = collectionMap.get(collectionSlug);
      if (collectionId) {
        await db.insert(productCollections).values({
          productId: product.id,
          collectionId: collectionId
        });
      }

      // Produktbilder einfügen
      for (const [index, imageUrl] of productData.images.entries()) {
        await db.insert(media).values({
          entityType: 'product',
          entityId: product.id,
          type: 'image',
          url: imageUrl,
          altText: `${productData.name} Bild ${index + 1}`,
          title: productData.name,
          sortOrder: index
        });
      }

      // Produktvarianten für Größen und Farben erstellen
      for (const size of productData.sizes) {
        for (const color of productData.colors) {
          await db.insert(productVariants).values({
            productId: product.id,
            sku: `${productData.sku}-${size}-${color.value}`,
            name: `${productData.name} - ${size} - ${color.name}`,
            price: productData.price,
            stockQuantity: Math.floor(Math.random() * 50) + 10, // Random Stock zwischen 10-60
            attributes: {
              size: size,
              color: color.name,
              colorCode: color.code
            }
          });
        }
      }

      console.log(`✅ Produkt erstellt: ${productData.name}`);
    }

    console.log('🎉 Fashion-Daten erfolgreich eingefügt!');
    console.log(`📊 Erstellt: ${insertedCategories.length} Kategorien, ${insertedCollections.length} Kollektionen, ${fashionProducts.length} Produkte`);

  } catch (error) {
    console.error('❌ Fehler beim Einfügen der Fashion-Daten:', error);
    throw error;
  }
}

export default seedFashionData;
