/**
 * Datenbank-Seed-Skript für DressForPleasure
 * 
 * Dieses Skript befüllt die Datenbank mit Anfangsdaten:
 * - Admin-Benutzer und Rollen
 * - Kategorien und Kollektionen
 * - Beispielprodukte (basierend auf dem Frontend)
 * - DSGVO-konforme Grundkonfiguration
 */

import { db } from './connection';
import { 
  users, roles, userRoles, categories, collections, products, 
  productVariants, productCategories, productCollections, media, inventory
} from './schema';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

// Konstanten für das Seeding
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dressforp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SecureAdmin123!';

/**
 * Admin-Benutzer und Rollen erstellen
 */
async function seedUsersAndRoles() {
  console.log('👤 Erstelle Benutzer und Rollen...');

  // Rollen erstellen
  const [adminRole] = await db.insert(roles).values([
    {
      name: 'admin',
      description: 'Vollzugriff auf das System',
      permissions: ['*']
    },
    {
      name: 'manager',
      description: 'Produktmanagement und Bestellverwaltung',
      permissions: ['products.*', 'orders.*', 'customers.read']
    },
    {
      name: 'editor',
      description: 'Content-Management',
      permissions: ['products.read', 'products.update', 'media.*']
    }
  ]).returning();

  // Admin-Benutzer erstellen
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const [adminUser] = await db.insert(users).values({
    email: ADMIN_EMAIL,
    passwordHash: hashedPassword,
    firstName: 'System',
    lastName: 'Administrator',
    isActive: true,
    emailVerifiedAt: new Date()
  }).returning();

  // Admin-Rolle zuweisen
  await db.insert(userRoles).values({
    userId: adminUser.id,
    roleId: adminRole.id
  });

  console.log(`✅ Admin-Benutzer erstellt: ${ADMIN_EMAIL}`);
}

/**
 * Kategorien erstellen (basierend auf Frontend-Daten)
 */
async function seedCategories() {
  console.log('📂 Erstelle Kategorien...');

  const categoriesData = [
    {
      name: 'Kleider',
      slug: 'kleider',
      description: 'Elegante Kleider für jeden Anlass',
      image: '/images/collections/collection-1.jpg',
      isActive: true
    },
    {
      name: 'Shirts',
      slug: 'shirts',
      description: 'Hochwertige T-Shirts und Oberteile',
      image: '/images/collections/collection-2.jpg',
      isActive: true
    },
    {
      name: 'Jacken',
      slug: 'jacken',
      description: 'Premium Jacken und Outerwear',
      image: '/images/collections/collection-3.png',
      isActive: true
    },
    {
      name: 'Hosen',
      slug: 'hosen',
      description: 'Stilvolle Hosen für jeden Tag',
      image: '/images/collections/collection-1.jpg',
      isActive: true
    }
  ];

  await db.insert(categories).values(categoriesData);
  console.log('✅ Kategorien erstellt');
}

/**
 * Kollektionen erstellen (basierend auf Frontend-Daten)
 */
async function seedCollections() {
  console.log('🎨 Erstelle Kollektionen...');

  const collectionsData = [
    {
      name: 'Berlin Collection',
      slug: 'berlin-collection',
      description: 'Urbane Mode inspiriert von der Hauptstadt',
      longDescription: 'Unsere Berlin Collection verkörpert den einzigartigen Stil der deutschen Hauptstadt. Von minimalistischen Designs bis hin zu urbanen Statements - jedes Stück erzählt die Geschichte einer pulsierenden Metropole.',
      image: '/images/collections/collection-1.jpg',
      featured: true,
      season: 'Herbst/Winter 2024',
      tags: ['Urban', 'Minimalistisch', 'Berlin', 'Nachhaltig'],
      isActive: true
    },
    {
      name: 'Atlanta Collection',
      slug: 'atlanta-collection',
      description: 'Street Style trifft auf südlichen Charme',
      longDescription: 'Die Atlanta Collection vereint den lässigen Street Style mit der warmen Ausstrahlung des amerikanischen Südens. Komfortable Materialien und zeitlose Schnitte für den modernen urbanen Lebensstil.',
      image: '/images/collections/collection-2.jpg',
      featured: true,
      season: 'Frühling/Sommer 2024',
      tags: ['Street Style', 'Casual', 'Atlanta', 'Comfort'],
      isActive: true
    },
    {
      name: 'Sustainable Basics',
      slug: 'sustainable-basics',
      description: 'Nachhaltige Grundausstattung für bewusste Mode',
      longDescription: 'Unsere Sustainable Basics setzen auf zeitlose Designs und umweltfreundliche Materialien. Jedes Stück wird mit Sorgfalt und Respekt für unseren Planeten hergestellt.',
      image: '/images/collections/collection-3.png',
      featured: false,
      season: 'Ganzjährig',
      tags: ['Nachhaltig', 'Bio', 'Zeitlos', 'Basics'],
      isActive: true
    }
  ];

  await db.insert(collections).values(collectionsData);
  console.log('✅ Kollektionen erstellt');
}

/**
 * Produkte erstellen (basierend auf Frontend-Daten)
 */
async function seedProducts() {
  console.log('👕 Erstelle Produkte...');

  // Kategorien und Kollektionen für Verknüpfungen abrufen
  const allCategories = await db.select().from(categories);
  const allCollections = await db.select().from(collections);

  const kleiderCategory = allCategories.find(c => c.slug === 'kleider');
  const shirtsCategory = allCategories.find(c => c.slug === 'shirts');
  const jackenCategory = allCategories.find(c => c.slug === 'jacken');

  const berlinCollection = allCollections.find(c => c.slug === 'berlin-collection');
  const atlantaCollection = allCollections.find(c => c.slug === 'atlanta-collection');

  // Produkt 1: Berlin Urban Dress
  const [product1] = await db.insert(products).values({
    name: 'Berlin Urban Dress',
    slug: 'berlin-urban-dress',
    description: 'Ein elegantes schwarzes Kleid, inspiriert von der urbanen Kultur Berlins. Hochwertige Materialien und nachhaltiger Produktionsprozess.',
    basePrice: '129.99',
    originalPrice: '159.99',
    discount: 19,
    sku: 'BUD-001',
    material: '95% Bio-Baumwolle, 5% Elasthan',
    careInstructions: 'Maschinenwäsche bei 30°C, Bügeln bei niedriger Temperatur',
    sustainabilityInfo: 'Hergestellt in Berlin mit nachhaltigen Materialien',
    tags: ['Berlin', 'Urban', 'Sustainable', 'Premium'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Schwarz', value: '#000000', code: 'black' },
      { name: 'Navy', value: '#1e3a8a', code: 'navy' }
    ],
    status: 'active',
    featured: true,
    newArrival: true,
    bestseller: false
  }).returning();

  // Varianten für Produkt 1
  const product1Variants = [
    {
      productId: product1.id,
      sku: 'BUD-001-BLK-S',
      size: 'S',
      color: 'black',
      colorCode: 'black',
      price: '129.99',
      stock: 15,
      isActive: true
    },
    {
      productId: product1.id,
      sku: 'BUD-001-BLK-M',
      size: 'M',
      color: 'black',
      colorCode: 'black',
      price: '129.99',
      stock: 20,
      isActive: true
    },
    {
      productId: product1.id,
      sku: 'BUD-001-NAV-S',
      size: 'S',
      color: 'navy',
      colorCode: 'navy',
      price: '129.99',
      stock: 10,
      isActive: true
    }
  ];

  const insertedProduct1Variants = await db.insert(productVariants).values(product1Variants).returning();

  // Produkt 2: Atlanta Street Shirt
  const [product2] = await db.insert(products).values({
    name: 'Atlanta Street Shirt',
    slug: 'atlanta-street-shirt',
    description: 'Lässiges T-Shirt im Atlanta-Street-Style. Perfekt für den urbanen Alltag mit hochwertiger Bio-Baumwolle.',
    basePrice: '39.99',
    originalPrice: '49.99',
    discount: 20,
    sku: 'ASS-002',
    material: '100% Bio-Baumwolle',
    careInstructions: 'Maschinenwäsche bei 40°C',
    sustainabilityInfo: 'Fair Trade zertifiziert, produziert in Atlanta',
    tags: ['Atlanta', 'Casual', 'Bio-Baumwolle', 'Street'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Weiß', value: '#ffffff', code: 'white' },
      { name: 'Grau', value: '#6b7280', code: 'gray' },
      { name: 'Schwarz', value: '#000000', code: 'black' }
    ],
    status: 'active',
    featured: false,
    newArrival: true,
    bestseller: true
  }).returning();

  // Varianten für Produkt 2
  const product2Variants = [
    {
      productId: product2.id,
      sku: 'ASS-002-WHT-M',
      size: 'M',
      color: 'white',
      colorCode: 'white',
      price: '39.99',
      stock: 25,
      isActive: true
    },
    {
      productId: product2.id,
      sku: 'ASS-002-GRY-L',
      size: 'L',
      color: 'gray',
      colorCode: 'gray',
      price: '39.99',
      stock: 30,
      isActive: true
    }
  ];

  const insertedProduct2Variants = await db.insert(productVariants).values(product2Variants).returning();

  // Produkt 3: Premium Urban Jacket
  const [product3] = await db.insert(products).values({
    name: 'Premium Urban Jacket',
    slug: 'premium-urban-jacket',
    description: 'Hochwertige Jacke für den urbanen Lifestyle. Kombiniert Berliner Design mit Atlanta Street-Vibes.',
    basePrice: '199.99',
    sku: 'PUJ-003',
    material: '60% Recyceltes Polyester, 40% Bio-Baumwolle',
    careInstructions: 'Professionelle Reinigung empfohlen',
    sustainabilityInfo: 'Hergestellt aus recycelten Materialien',
    tags: ['Premium', 'Urban', 'Berlin', 'Design'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Schwarz', value: '#000000', code: 'black' },
      { name: 'Khaki', value: '#6b7280', code: 'khaki' }
    ],
    status: 'active',
    featured: true,
    newArrival: false,
    bestseller: true
  }).returning();

  // Varianten für Produkt 3
  const product3Variants = [
    {
      productId: product3.id,
      sku: 'PUJ-003-BLK-M',
      size: 'M',
      color: 'black',
      colorCode: 'black',
      price: '199.99',
      stock: 12,
      isActive: true
    },
    {
      productId: product3.id,
      sku: 'PUJ-003-KHK-L',
      size: 'L',
      color: 'khaki',
      colorCode: 'khaki',
      price: '199.99',
      stock: 8,
      isActive: true
    }
  ];

  const insertedProduct3Variants = await db.insert(productVariants).values(product3Variants).returning();

  // Kategorie-Zuordnungen
  if (kleiderCategory) {
    await db.insert(productCategories).values({
      productId: product1.id,
      categoryId: kleiderCategory.id
    });
  }

  if (shirtsCategory) {
    await db.insert(productCategories).values({
      productId: product2.id,
      categoryId: shirtsCategory.id
    });
  }

  if (jackenCategory) {
    await db.insert(productCategories).values({
      productId: product3.id,
      categoryId: jackenCategory.id
    });
  }

  // Kollektions-Zuordnungen
  if (berlinCollection) {
    await db.insert(productCollections).values([
      { productId: product1.id, collectionId: berlinCollection.id },
      { productId: product3.id, collectionId: berlinCollection.id }
    ]);
  }

  if (atlantaCollection) {
    await db.insert(productCollections).values({
      productId: product2.id,
      collectionId: atlantaCollection.id
    });
  }

  // Medien hinzufügen
  const mediaData = [
    {
      productId: product1.id,
      type: 'image',
      url: '/images/products/dress-1.jpg',
      altText: 'Berlin Urban Dress',
      isPrimary: true,
      sortOrder: 1
    },
    {
      productId: product2.id,
      type: 'image',
      url: '/images/products/shirt-1.jpg',
      altText: 'Atlanta Street Shirt',
      isPrimary: true,
      sortOrder: 1
    },
    {
      productId: product3.id,
      type: 'image',
      url: '/images/products/jacket-1.jpg',
      altText: 'Premium Urban Jacket',
      isPrimary: true,
      sortOrder: 1
    }
  ];

  await db.insert(media).values(mediaData);

  // Inventar für alle Varianten erstellen
  const allVariants = [...insertedProduct1Variants, ...insertedProduct2Variants, ...insertedProduct3Variants];
  const inventoryData = allVariants.map(variant => ({
    variantId: variant.id,
    quantityOnHand: variant.stock,
    quantityReserved: 0,
    quantityAvailable: variant.stock,
    reorderPoint: 5,
    reorderQuantity: Math.max(10, Math.floor(variant.stock / 2))
  }));

  await db.insert(inventory).values(inventoryData);

  console.log('✅ Produkte, Varianten und Inventar erstellt');
}

/**
 * Hauptfunktion zum Ausführen aller Seeds
 */
async function seedDatabase() {
  console.log('🌱 Starte Datenbank-Seeding...');

  try {
    await seedUsersAndRoles();
    await seedCategories();
    await seedCollections();
    await seedProducts();

    console.log('🎉 Datenbank-Seeding erfolgreich abgeschlossen!');
    console.log('\n📋 Erstellt:');
    console.log('  - 3 Benutzerrollen (admin, manager, editor)');
    console.log('  - 1 Admin-Benutzer');
    console.log('  - 4 Produktkategorien');
    console.log('  - 3 Kollektionen');
    console.log('  - 3 Produkte mit Varianten');
    console.log('  - Inventar-Einträge');
    console.log('  - Produktbilder');
    console.log('\n🔐 Admin-Zugang:');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Passwort: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  WICHTIG: Ändern Sie das Admin-Passwort nach dem ersten Login!');

  } catch (error) {
    console.error('❌ Seed-Fehler:', error);
    throw error;
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };
