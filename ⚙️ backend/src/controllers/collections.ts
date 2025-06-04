/**
 * Kollektionen-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - CRUD-Operationen für Kollektionen
 * - Kollektion-Produkt-Zuordnungen
 * - Featured Collections Management
 */

import { Request, Response } from 'express';
import { db } from '../db/connection';
import { collections, productCollections, products } from '../db/schema';
import { eq, and, or, like, ilike, desc, asc, sql } from 'drizzle-orm';
import { 
  generateSlug, 
  generateUniqueSlug, 
  createSuccessResponse, 
  createErrorResponse,
  calculatePagination 
} from '../utils';
import { 
  CollectionRequest, 
  CollectionResponse,
  PaginationParams,
  AuthRequest
} from '../types';

// ========================
// KOLLEKTIONEN ABRUFEN
// ========================

/**
 * Alle Kollektionen abrufen
 * GET /api/collections
 */
export async function getCollections(req: Request, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'sortOrder', 
      sortOrder = 'asc',
      featured,
      season,
      q,
      includeInactive = false
    } = req.query as PaginationParams & { 
      featured?: boolean; 
      season?: string; 
      q?: string;
      includeInactive?: boolean;
    };

    // Base Query
    let query = db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        longDescription: collections.longDescription,
        image: collections.image,
        featured: collections.featured,
        season: collections.season,
        tags: collections.tags,
        sortOrder: collections.sortOrder,
        isActive: collections.isActive,
        seoTitle: collections.seoTitle,
        seoDescription: collections.seoDescription,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt
      })
      .from(collections);

    // Filter-Bedingungen
    const conditions = [];

    // Aktive Kollektionen Filter
    if (!includeInactive) {
      conditions.push(eq(collections.isActive, true));
    }

    // Featured Filter
    if (featured !== undefined) {
      conditions.push(eq(collections.featured, featured));
    }

    // Season Filter
    if (season) {
      conditions.push(eq(collections.season, season));
    }

    // Suchtext-Filter
    if (q) {
      conditions.push(
        or(
          ilike(collections.name, `%${q}%`),
          ilike(collections.description, `%${q}%`),
          ilike(collections.longDescription, `%${q}%`),
          sql`${collections.tags}::text ILIKE ${`%${q}%`}`
        )
      );
    }

    // Conditions anwenden
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sortierung
    const sortColumn = collections[sortBy as keyof typeof collections] || collections.sortOrder;
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(sortColumn));
    } else {
      query = query.orderBy(asc(sortColumn));
    }

    // Gesamtanzahl für Pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(collections);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Pagination
    const offset = (page - 1) * limit;
    const collectionResults = await query
      .limit(limit)
      .offset(offset);

    // Produktanzahl für jede Kollektion laden
    const collectionsWithCount = await Promise.all(
      collectionResults.map(async (collection) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(productCollections)
          .innerJoin(products, eq(productCollections.productId, products.id))
          .where(and(
            eq(productCollections.collectionId, collection.id),
            eq(products.status, 'active')
          ));

        return {
          ...collection,
          productCount: count
        };
      })
    );

    const pagination = calculatePagination(page, limit, totalCount);

    res.json(createSuccessResponse({
      collections: collectionsWithCount,
      meta: pagination
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Kollektionen:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kollektionen', 500));
  }
}

/**
 * Featured Kollektionen abrufen
 * GET /api/collections/featured
 */
export async function getFeaturedCollections(req: Request, res: Response): Promise<void> {
  try {
    const collectionResults = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        longDescription: collections.longDescription,
        image: collections.image,
        featured: collections.featured,
        season: collections.season,
        tags: collections.tags,
        sortOrder: collections.sortOrder,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt
      })
      .from(collections)
      .where(and(
        eq(collections.featured, true),
        eq(collections.isActive, true)
      ))
      .orderBy(asc(collections.sortOrder));

    // Produktanzahl für jede Kollektion laden
    const collectionsWithCount = await Promise.all(
      collectionResults.map(async (collection) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(productCollections)
          .innerJoin(products, eq(productCollections.productId, products.id))
          .where(and(
            eq(productCollections.collectionId, collection.id),
            eq(products.status, 'active')
          ));

        return {
          ...collection,
          productCount: count
        };
      })
    );

    res.json(createSuccessResponse({
      collections: collectionsWithCount
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Featured-Kollektionen:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Featured-Kollektionen', 500));
  }
}

/**
 * Einzelne Kollektion abrufen
 * GET /api/collections/:id
 */
export async function getCollectionById(req: Request, res: Response): Promise<void> {
  try {
    const collectionId = parseInt(req.params.id);

    const collectionResult = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (collectionResult.length === 0) {
      res.status(404).json(createErrorResponse('Kollektion nicht gefunden', 404));
      return;
    }

    const collection = collectionResult[0];

    // Produktanzahl laden
    const [{ count: productCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(and(
        eq(productCollections.collectionId, collection.id),
        eq(products.status, 'active')
      ));

    // Beispielprodukte laden (erste 6)
    const sampleProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        featured: products.featured
      })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(and(
        eq(productCollections.collectionId, collection.id),
        eq(products.status, 'active')
      ))
      .limit(6)
      .orderBy(desc(products.featured), desc(products.createdAt));

    const collectionResponse: CollectionResponse & { 
      productCount: number;
      sampleProducts?: any[];
    } = {
      ...collection,
      productCount,
      sampleProducts
    };

    res.json(createSuccessResponse(collectionResponse));

  } catch (error) {
    console.error('Fehler beim Abrufen der Kollektion:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kollektion', 500));
  }
}

/**
 * Kollektion nach Slug abrufen
 * GET /api/collections/slug/:slug
 */
export async function getCollectionBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = req.params.slug;

    const collectionResult = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);

    if (collectionResult.length === 0) {
      res.status(404).json(createErrorResponse('Kollektion nicht gefunden', 404));
      return;
    }

    // Gleiche Logik wie getCollectionById
    req.params.id = collectionResult[0].id.toString();
    return getCollectionById(req, res);

  } catch (error) {
    console.error('Fehler beim Abrufen der Kollektion:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kollektion', 500));
  }
}

/**
 * Produkte einer Kollektion abrufen
 * GET /api/collections/:id/products
 */
export async function getCollectionProducts(req: Request, res: Response): Promise<void> {
  try {
    const collectionId = parseInt(req.params.id);
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query as PaginationParams;

    // Prüfen ob Kollektion existiert
    const collectionExists = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (collectionExists.length === 0) {
      res.status(404).json(createErrorResponse('Kollektion nicht gefunden', 404));
      return;
    }

    // Produkte der Kollektion abrufen
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
        featured: products.featured,
        newArrival: products.newArrival,
        bestseller: products.bestseller,
        status: products.status,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt
      })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(and(
        eq(productCollections.collectionId, collectionId),
        eq(products.status, 'active')
      ));

    // Sortierung
    const sortColumn = products[sortBy as keyof typeof products] || products.createdAt;
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(sortColumn));
    } else {
      query = query.orderBy(asc(sortColumn));
    }

    // Gesamtanzahl für Pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(and(
        eq(productCollections.collectionId, collectionId),
        eq(products.status, 'active')
      ));

    // Pagination
    const offset = (page - 1) * limit;
    const productResults = await query
      .limit(limit)
      .offset(offset);

    const pagination = calculatePagination(page, limit, totalCount);

    res.json(createSuccessResponse({
      products: productResults,
      meta: pagination
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Kollektionsprodukte:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kollektionsprodukte', 500));
  }
}

// ========================
// KOLLEKTIONEN ERSTELLEN
// ========================

/**
 * Neue Kollektion erstellen
 * POST /api/collections
 */
export async function createCollection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const collectionData: CollectionRequest = req.body;

    // Slug generieren falls nicht vorhanden
    let slug = collectionData.slug || generateSlug(collectionData.name);

    // Prüfen ob Slug bereits existiert
    const existingSlugs = await db
      .select({ slug: collections.slug })
      .from(collections)
      .where(like(collections.slug, `${slug}%`));

    slug = generateUniqueSlug(slug, existingSlugs.map(c => c.slug));

    // Kollektion erstellen
    const [newCollection] = await db
      .insert(collections)
      .values({
        name: collectionData.name,
        slug,
        description: collectionData.description,
        longDescription: collectionData.longDescription,
        image: collectionData.image,
        featured: collectionData.featured || false,
        season: collectionData.season,
        tags: collectionData.tags,
        sortOrder: collectionData.sortOrder || 0,
        isActive: collectionData.isActive !== false,
        seoTitle: collectionData.seoTitle || collectionData.name,
        seoDescription: collectionData.seoDescription || collectionData.description
      })
      .returning();

    res.status(201).json(createSuccessResponse(
      { ...newCollection, productCount: 0 },
      'Kollektion erfolgreich erstellt'
    ));

  } catch (error) {
    console.error('Fehler beim Erstellen der Kollektion:', error);
    res.status(500).json(createErrorResponse('Fehler beim Erstellen der Kollektion', 500));
  }
}

// ========================
// KOLLEKTIONEN AKTUALISIEREN
// ========================

/**
 * Kollektion aktualisieren
 * PUT /api/collections/:id
 */
export async function updateCollection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const collectionId = parseInt(req.params.id);
    const updateData: Partial<CollectionRequest> = req.body;

    // Prüfen ob Kollektion existiert
    const existingCollection = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (existingCollection.length === 0) {
      res.status(404).json(createErrorResponse('Kollektion nicht gefunden', 404));
      return;
    }

    // Slug aktualisieren falls Name geändert wurde
    let slug = updateData.slug;
    if (updateData.name && !slug) {
      slug = generateSlug(updateData.name);
      
      // Prüfen ob neuer Slug bereits existiert (außer bei aktueller Kollektion)
      const existingSlugs = await db
        .select({ slug: collections.slug })
        .from(collections)
        .where(and(
          like(collections.slug, `${slug}%`),
          sql`${collections.id} != ${collectionId}`
        ));

      slug = generateUniqueSlug(slug, existingSlugs.map(c => c.slug));
    }

    // Update-Felder vorbereiten
    const updateFields: any = {
      updatedAt: new Date()
    };

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof CollectionRequest] !== undefined) {
        updateFields[key] = updateData[key as keyof CollectionRequest];
      }
    });

    if (slug) {
      updateFields.slug = slug;
    }

    // Kollektion aktualisieren
    const [updatedCollection] = await db
      .update(collections)
      .set(updateFields)
      .where(eq(collections.id, collectionId))
      .returning();

    res.json(createSuccessResponse(updatedCollection, 'Kollektion erfolgreich aktualisiert'));

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kollektion:', error);
    res.status(500).json(createErrorResponse('Fehler beim Aktualisieren der Kollektion', 500));
  }
}

// ========================
// KOLLEKTIONEN LÖSCHEN
// ========================

/**
 * Kollektion löschen
 * DELETE /api/collections/:id
 */
export async function deleteCollection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const collectionId = parseInt(req.params.id);

    // Prüfen ob Kollektion existiert
    const existingCollection = await db
      .select({ id: collections.id, name: collections.name })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (existingCollection.length === 0) {
      res.status(404).json(createErrorResponse('Kollektion nicht gefunden', 404));
      return;
    }

    // Prüfen ob Kollektion Produkte hat
    const collectionProducts = await db
      .select({ productId: productCollections.productId })
      .from(productCollections)
      .where(eq(productCollections.collectionId, collectionId));

    if (collectionProducts.length > 0) {
      res.status(400).json(createErrorResponse(
        'Kollektion kann nicht gelöscht werden, da sie Produkte enthält', 
        400
      ));
      return;
    }

    // Kollektion löschen
    await db
      .delete(collections)
      .where(eq(collections.id, collectionId));

    res.json(createSuccessResponse(
      { 
        id: collectionId, 
        name: existingCollection[0].name 
      },
      'Kollektion erfolgreich gelöscht'
    ));

  } catch (error) {
    console.error('Fehler beim Löschen der Kollektion:', error);
    res.status(500).json(createErrorResponse('Fehler beim Löschen der Kollektion', 500));
  }
}

/**
 * Kollektion deaktivieren (Soft Delete)
 * PATCH /api/collections/:id/deactivate
 */
export async function deactivateCollection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const collectionId = parseInt(req.params.id);

    const [updatedCollection] = await db
      .update(collections)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(collections.id, collectionId))
      .returning();

    if (!updatedCollection) {
      res.status(404).json(createErrorResponse('Kollektion nicht gefunden', 404));
      return;
    }

    res.json(createSuccessResponse(updatedCollection, 'Kollektion deaktiviert'));

  } catch (error) {
    console.error('Fehler beim Deaktivieren der Kollektion:', error);
    res.status(500).json(createErrorResponse('Fehler beim Deaktivieren der Kollektion', 500));
  }
}

/**
 * Featured-Status einer Kollektion ändern
 * PATCH /api/collections/:id/featured
 */
export async function toggleFeatured(req: AuthRequest, res: Response): Promise<void> {
  try {
    const collectionId = parseInt(req.params.id);
    const { featured } = req.body;

    const [updatedCollection] = await db
      .update(collections)
      .set({
        featured: featured,
        updatedAt: new Date()
      })
      .where(eq(collections.id, collectionId))
      .returning();

    if (!updatedCollection) {
      res.status(404).json(createErrorResponse('Kollektion nicht gefunden', 404));
      return;
    }

    const message = featured ? 'Kollektion als Featured markiert' : 'Featured-Status entfernt';
    res.json(createSuccessResponse(updatedCollection, message));

  } catch (error) {
    console.error('Fehler beim Ändern des Featured-Status:', error);
    res.status(500).json(createErrorResponse('Fehler beim Ändern des Featured-Status', 500));
  }
}

// ========================
// VERFÜGBARE SEASONS ABRUFEN
// ========================

/**
 * Alle verfügbaren Seasons abrufen
 * GET /api/collections/seasons
 */
export async function getAvailableSeasons(req: Request, res: Response): Promise<void> {
  try {
    const seasonsResult = await db
      .selectDistinct({ season: collections.season })
      .from(collections)
      .where(and(
        eq(collections.isActive, true),
        sql`${collections.season} IS NOT NULL`
      ))
      .orderBy(asc(collections.season));

    const seasons = seasonsResult
      .map(s => s.season)
      .filter(Boolean); // Null-Werte entfernen

    res.json(createSuccessResponse({ seasons }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Seasons:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Seasons', 500));
  }
}

// ========================
// EXPORT
// ========================

export default {
  getCollections,
  getFeaturedCollections,
  getCollectionById,
  getCollectionBySlug,
  getCollectionProducts,
  createCollection,
  updateCollection,
  deleteCollection,
  deactivateCollection,
  toggleFeatured,
  getAvailableSeasons
};
