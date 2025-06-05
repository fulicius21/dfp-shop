/**
 * Produkt-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - CRUD-Operationen für Produkte
 * - Produktvarianten-Management
 * - Produktsuche und Filterung
 * - Medien-Management
 * - Inventar-Updates
 */

import { Request, Response } from 'express';
import { db } from '../db/connection';
import { 
  products, 
  productVariants, 
  productCategories, 
  productCollections, 
  categories, 
  collections, 
  media, 
  inventory 
} from '../db/schema';
import { eq, and, or, like, ilike, desc, asc, sql, inArray } from 'drizzle-orm';
import { 
  generateSlug, 
  generateUniqueSlug, 
  createSuccessResponse, 
  createErrorResponse,
  calculatePagination 
} from '../utils';
import { 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductResponse, 
  ProductVariantRequest,
  SearchParams,
  AuthRequest
} from '../types';

// ========================
// PRODUKTE ABRUFEN
// ========================

/**
 * Alle Produkte abrufen (mit Filterung und Pagination)
 * GET /api/products
 */
export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const params = req.query as SearchParams;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      q,
      category,
      collection,
      featured,
      status = 'active',
      minPrice,
      maxPrice
    } = params;

    // Base Query
    let query = db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        basePrice: products.basePrice,
        originalPrice: products.originalPrice,
        discount: products.discount,
        sku: products.sku,
        material: products.material,
        careInstructions: products.careInstructions,
        sustainabilityInfo: products.sustainabilityInfo,
        tags: products.tags,
        sizes: products.sizes,
        colors: products.colors,
        status: products.status,
        featured: products.featured,
        newArrival: products.newArrival,
        bestseller: products.bestseller,
        weight: products.weight,
        dimensions: products.dimensions,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt
      })
      .from(products);

    // Filtering
    const conditions = [];

    // Status-Filter
    if (status) {
      conditions.push(eq(products.status, status));
    }

    // Suchtext-Filter
    if (q) {
      conditions.push(
        or(
          ilike(products.name, `%${q}%`),
          ilike(products.description, `%${q}%`),
          sql`${products.tags}::text ILIKE ${`%${q}%`}`
        )
      );
    }

    // Featured-Filter
    if (featured !== undefined) {
      conditions.push(eq(products.featured, featured));
    }

    // Preis-Filter
    if (minPrice !== undefined) {
      conditions.push(sql`${products.basePrice}::numeric >= ${minPrice}`);
    }
    if (maxPrice !== undefined) {
      conditions.push(sql`${products.basePrice}::numeric <= ${maxPrice}`);
    }

    // Kategorie-Filter
    if (category) {
      const categoryResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);

      if (categoryResult.length > 0) {
        const productIds = await db
          .select({ productId: productCategories.productId })
          .from(productCategories)
          .where(eq(productCategories.categoryId, categoryResult[0].id));

        if (productIds.length > 0) {
          conditions.push(inArray(products.id, productIds.map(p => p.productId)));
        } else {
          // Keine Produkte in dieser Kategorie
          res.json(createSuccessResponse({
            products: [],
            meta: calculatePagination(page, limit, 0)
          }));
          return;
        }
      }
    }

    // Kollektions-Filter
    if (collection) {
      const collectionResult = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, collection))
        .limit(1);

      if (collectionResult.length > 0) {
        const productIds = await db
          .select({ productId: productCollections.productId })
          .from(productCollections)
          .where(eq(productCollections.collectionId, collectionResult[0].id));

        if (productIds.length > 0) {
          conditions.push(inArray(products.id, productIds.map(p => p.productId)));
        } else {
          // Keine Produkte in dieser Kollektion
          res.json(createSuccessResponse({
            products: [],
            meta: calculatePagination(page, limit, 0)
          }));
          return;
        }
      }
    }

    // Conditions anwenden
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sortierung
    const sortColumn = products[sortBy as keyof typeof products] || products.createdAt;
    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Gesamtanzahl für Pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Pagination
    const offset = (page - 1) * limit;
    const productResults = await query
      .limit(limit)
      .offset(offset);

    // Zusätzliche Daten für jeden Produkt laden
    const enrichedProducts = await Promise.all(
      productResults.map(async (product) => {
        // Varianten laden
        const variants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, product.id));

        // Kategorien laden
        const productCategoriesResult = await db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug
          })
          .from(productCategories)
          .innerJoin(categories, eq(productCategories.categoryId, categories.id))
          .where(eq(productCategories.productId, product.id));

        // Kollektionen laden
        const productCollectionsResult = await db
          .select({
            id: collections.id,
            name: collections.name,
            slug: collections.slug
          })
          .from(productCollections)
          .innerJoin(collections, eq(productCollections.collectionId, collections.id))
          .where(eq(productCollections.productId, product.id));

        // Medien laden
        const mediaResult = await db
          .select()
          .from(media)
          .where(eq(media.productId, product.id))
          .orderBy(asc(media.sortOrder));

        return {
          ...product,
          variants,
          categories: productCategoriesResult,
          collections: productCollectionsResult,
          media: mediaResult
        };
      })
    );

    const pagination = calculatePagination(page, limit, totalCount);

    res.json(createSuccessResponse({
      products: enrichedProducts,
      meta: pagination
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Produkte:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Produkte', 500));
  }
}

/**
 * Einzelnes Produkt abrufen
 * GET /api/products/:id
 */
export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.id);

    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productResult.length === 0) {
      res.status(404).json(createErrorResponse('Produkt nicht gefunden', 404));
      return;
    }

    const product = productResult[0];

    // Varianten laden
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.size), asc(productVariants.color));

    // Inventar für Varianten laden
    const variantsWithInventory = await Promise.all(
      variants.map(async (variant) => {
        const inventoryResult = await db
          .select()
          .from(inventory)
          .where(eq(inventory.variantId, variant.id))
          .limit(1);

        return {
          ...variant,
          inventory: inventoryResult[0] || null
        };
      })
    );

    // Kategorien laden
    const productCategoriesResult = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description
      })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, product.id));

    // Kollektionen laden
    const productCollectionsResult = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description
      })
      .from(productCollections)
      .innerJoin(collections, eq(productCollections.collectionId, collections.id))
      .where(eq(productCollections.productId, product.id));

    // Medien laden
    const mediaResult = await db
      .select()
      .from(media)
      .where(eq(media.productId, product.id))
      .orderBy(desc(media.isPrimary), asc(media.sortOrder));

    const enrichedProduct: ProductResponse = {
      ...product,
      variants: variantsWithInventory,
      categories: productCategoriesResult,
      collections: productCollectionsResult,
      media: mediaResult
    };

    res.json(createSuccessResponse(enrichedProduct));

  } catch (error) {
    console.error('Fehler beim Abrufen des Produkts:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen des Produkts', 500));
  }
}

/**
 * Produkt nach Slug abrufen
 * GET /api/products/slug/:slug
 */
export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = req.params.slug;

    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (productResult.length === 0) {
      res.status(404).json(createErrorResponse('Produkt nicht gefunden', 404));
      return;
    }

    // Gleiche Logik wie getProductById
    req.params.id = productResult[0].id.toString();
    return getProductById(req, res);

  } catch (error) {
    console.error('Fehler beim Abrufen des Produkts:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen des Produkts', 500));
  }
}

// ========================
// PRODUKTE ERSTELLEN
// ========================

/**
 * Neues Produkt erstellen
 * POST /api/products
 */
export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const productData: CreateProductRequest = req.body;

    // Slug generieren falls nicht vorhanden
    let slug = productData.slug || generateSlug(productData.name);

    // Prüfen ob Slug bereits existiert
    const existingSlugs = await db
      .select({ slug: products.slug })
      .from(products)
      .where(like(products.slug, `${slug}%`));

    slug = generateUniqueSlug(slug, existingSlugs.map(p => p.slug));

    // SKU generieren falls nicht vorhanden
    let sku = productData.sku;
    if (!sku) {
      const skuPrefix = productData.name.substring(0, 3).toUpperCase();
      const skuNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      sku = `${skuPrefix}-${skuNumber}`;
    }

    // Produkt erstellen
    const [newProduct] = await db
      .insert(products)
      .values({
        name: productData.name,
        slug,
        description: productData.description,
        shortDescription: productData.shortDescription,
        basePrice: productData.basePrice.toString(),
        originalPrice: productData.originalPrice?.toString(),
        discount: productData.discount || 0,
        sku,
        material: productData.material,
        careInstructions: productData.careInstructions,
        sustainabilityInfo: productData.sustainabilityInfo,
        tags: productData.tags,
        sizes: productData.sizes,
        colors: productData.colors,
        status: productData.status || 'draft',
        featured: productData.featured || false,
        newArrival: productData.newArrival || false,
        bestseller: productData.bestseller || false,
        weight: productData.weight?.toString(),
        dimensions: productData.dimensions,
        seoTitle: productData.seoTitle || productData.name,
        seoDescription: productData.seoDescription || productData.shortDescription
      })
      .returning();

    // Kategorien zuordnen
    if (productData.categoryIds && productData.categoryIds.length > 0) {
      const categoryAssignments = productData.categoryIds.map(categoryId => ({
        productId: newProduct.id,
        categoryId
      }));

      await db.insert(productCategories).values(categoryAssignments);
    }

    // Kollektionen zuordnen
    if (productData.collectionIds && productData.collectionIds.length > 0) {
      const collectionAssignments = productData.collectionIds.map(collectionId => ({
        productId: newProduct.id,
        collectionId
      }));

      await db.insert(productCollections).values(collectionAssignments);
    }

    // Vollständiges Produkt mit Beziehungen laden
    req.params.id = newProduct.id.toString();
    return getProductById(req, res);

  } catch (error) {
    console.error('Fehler beim Erstellen des Produkts:', error);
    res.status(500).json(createErrorResponse('Fehler beim Erstellen des Produkts', 500));
  }
}

// ========================
// PRODUKTE AKTUALISIEREN
// ========================

/**
 * Produkt aktualisieren
 * PUT /api/products/:id
 */
export async function updateProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.id);
    const updateData: UpdateProductRequest = req.body;

    // Prüfen ob Produkt existiert
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      res.status(404).json(createErrorResponse('Produkt nicht gefunden', 404));
      return;
    }

    // Slug aktualisieren falls Name geändert wurde
    let slug = updateData.slug;
    if (updateData.name && !slug) {
      slug = generateSlug(updateData.name);
      
      // Prüfen ob neuer Slug bereits existiert (außer beim aktuellen Produkt)
      const existingSlugs = await db
        .select({ slug: products.slug })
        .from(products)
        .where(and(
          like(products.slug, `${slug}%`),
          sql`${products.id} != ${productId}`
        ));

      slug = generateUniqueSlug(slug, existingSlugs.map(p => p.slug));
    }

    // Produkt aktualisieren
    const updateFields: any = {
      updatedAt: new Date()
    };

    // Nur definierte Felder aktualisieren
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateProductRequest] !== undefined) {
        switch (key) {
          case 'basePrice':
          case 'originalPrice':
          case 'weight':
            updateFields[key] = updateData[key as keyof UpdateProductRequest]?.toString();
            break;
          default:
            updateFields[key] = updateData[key as keyof UpdateProductRequest];
        }
      }
    });

    if (slug) {
      updateFields.slug = slug;
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateFields)
      .where(eq(products.id, productId))
      .returning();

    // Kategorien aktualisieren falls angegeben
    if (updateData.categoryIds !== undefined) {
      // Bestehende Zuordnungen löschen
      await db
        .delete(productCategories)
        .where(eq(productCategories.productId, productId));

      // Neue Zuordnungen erstellen
      if (updateData.categoryIds.length > 0) {
        const categoryAssignments = updateData.categoryIds.map(categoryId => ({
          productId,
          categoryId
        }));

        await db.insert(productCategories).values(categoryAssignments);
      }
    }

    // Kollektionen aktualisieren falls angegeben
    if (updateData.collectionIds !== undefined) {
      // Bestehende Zuordnungen löschen
      await db
        .delete(productCollections)
        .where(eq(productCollections.productId, productId));

      // Neue Zuordnungen erstellen
      if (updateData.collectionIds.length > 0) {
        const collectionAssignments = updateData.collectionIds.map(collectionId => ({
          productId,
          collectionId
        }));

        await db.insert(productCollections).values(collectionAssignments);
      }
    }

    // Vollständiges Produkt mit Beziehungen laden
    return getProductById(req, res);

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Produkts:', error);
    res.status(500).json(createErrorResponse('Fehler beim Aktualisieren des Produkts', 500));
  }
}

// ========================
// PRODUKTE LÖSCHEN
// ========================

/**
 * Produkt löschen
 * DELETE /api/products/:id
 */
export async function deleteProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.id);

    // Prüfen ob Produkt existiert
    const existingProduct = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      res.status(404).json(createErrorResponse('Produkt nicht gefunden', 404));
      return;
    }

    // Produkt löschen (Cascade-Deletion durch DB-Constraints)
    await db
      .delete(products)
      .where(eq(products.id, productId));

    res.json(createSuccessResponse(
      { 
        id: productId, 
        name: existingProduct[0].name 
      },
      'Produkt erfolgreich gelöscht'
    ));

  } catch (error) {
    console.error('Fehler beim Löschen des Produkts:', error);
    res.status(500).json(createErrorResponse('Fehler beim Löschen des Produkts', 500));
  }
}

// ========================
// PRODUKTVARIANTEN
// ========================

/**
 * Produktvariante erstellen
 * POST /api/products/:id/variants
 */
export async function createProductVariant(req: AuthRequest, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.id);
    const variantData: ProductVariantRequest = req.body;

    // Prüfen ob Produkt existiert
    const existingProduct = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      res.status(404).json(createErrorResponse('Produkt nicht gefunden', 404));
      return;
    }

    // Variante erstellen
    const [newVariant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: variantData.sku,
        size: variantData.size,
        color: variantData.color,
        colorCode: variantData.colorCode,
        price: variantData.price.toString(),
        stock: variantData.stock,
        lowStockThreshold: variantData.lowStockThreshold || 5,
        weight: variantData.weight?.toString(),
        isActive: variantData.isActive !== false
      })
      .returning();

    // Inventar-Eintrag erstellen
    await db.insert(inventory).values({
      variantId: newVariant.id,
      quantityOnHand: variantData.stock,
      quantityReserved: 0,
      quantityAvailable: variantData.stock,
      reorderPoint: variantData.lowStockThreshold || 5,
      reorderQuantity: Math.max(10, Math.floor(variantData.stock / 2))
    });

    res.status(201).json(createSuccessResponse(newVariant, 'Produktvariante erstellt'));

  } catch (error) {
    console.error('Fehler beim Erstellen der Produktvariante:', error);
    res.status(500).json(createErrorResponse('Fehler beim Erstellen der Produktvariante', 500));
  }
}

/**
 * Produktvariante aktualisieren
 * PUT /api/products/:id/variants/:variantId
 */
export async function updateProductVariant(req: AuthRequest, res: Response): Promise<void> {
  try {
    const variantId = parseInt(req.params.variantId);
    const updateData = req.body;

    // Variante aktualisieren
    const [updatedVariant] = await db
      .update(productVariants)
      .set({
        ...updateData,
        price: updateData.price?.toString(),
        weight: updateData.weight?.toString(),
        updatedAt: new Date()
      })
      .where(eq(productVariants.id, variantId))
      .returning();

    if (!updatedVariant) {
      res.status(404).json(createErrorResponse('Produktvariante nicht gefunden', 404));
      return;
    }

    // Inventar aktualisieren falls Stock geändert wurde
    if (updateData.stock !== undefined) {
      await db
        .update(inventory)
        .set({
          quantityOnHand: updateData.stock,
          quantityAvailable: updateData.stock,
          updatedAt: new Date()
        })
        .where(eq(inventory.variantId, variantId));
    }

    res.json(createSuccessResponse(updatedVariant, 'Produktvariante aktualisiert'));

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Produktvariante:', error);
    res.status(500).json(createErrorResponse('Fehler beim Aktualisieren der Produktvariante', 500));
  }
}

/**
 * Produktvariante löschen
 * DELETE /api/products/:id/variants/:variantId
 */
export async function deleteProductVariant(req: AuthRequest, res: Response): Promise<void> {
  try {
    const variantId = parseInt(req.params.variantId);

    await db
      .delete(productVariants)
      .where(eq(productVariants.id, variantId));

    res.json(createSuccessResponse(
      { id: variantId },
      'Produktvariante gelöscht'
    ));

  } catch (error) {
    console.error('Fehler beim Löschen der Produktvariante:', error);
    res.status(500).json(createErrorResponse('Fehler beim Löschen der Produktvariante', 500));
  }
}

// ========================
// EXPORT
// ========================

export default {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant
};
