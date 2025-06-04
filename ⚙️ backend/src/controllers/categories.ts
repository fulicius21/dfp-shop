/**
 * Kategorien-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - CRUD-Operationen für Kategorien
 * - Hierarchische Kategorie-Struktur
 * - Kategorie-Produkt-Zuordnungen
 */

import { Request, Response } from 'express';
import { db } from '../db/connection';
import { categories, productCategories, products } from '../db/schema';
import { eq, and, or, like, ilike, desc, asc, sql, isNull } from 'drizzle-orm';
import { 
  generateSlug, 
  generateUniqueSlug, 
  createSuccessResponse, 
  createErrorResponse,
  calculatePagination 
} from '../utils';
import { 
  CategoryRequest, 
  CategoryResponse,
  PaginationParams,
  AuthRequest
} from '../types';

// ========================
// KATEGORIEN ABRUFEN
// ========================

/**
 * Alle Kategorien abrufen (mit Hierarchie)
 * GET /api/categories
 */
export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'sortOrder', 
      sortOrder = 'asc',
      includeInactive = false
    } = req.query as PaginationParams & { includeInactive?: boolean };

    // Base Query
    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        seoTitle: categories.seoTitle,
        seoDescription: categories.seoDescription,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt
      })
      .from(categories);

    // Aktive Kategorien Filter
    if (!includeInactive) {
      query = query.where(eq(categories.isActive, true));
    }

    // Sortierung
    const sortColumn = categories[sortBy as keyof typeof categories] || categories.sortOrder;
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(sortColumn));
    } else {
      query = query.orderBy(asc(sortColumn));
    }

    const categoryResults = await query;

    // Produktanzahl für jede Kategorie laden
    const categoriesWithCount = await Promise.all(
      categoryResults.map(async (category) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(productCategories)
          .innerJoin(products, eq(productCategories.productId, products.id))
          .where(and(
            eq(productCategories.categoryId, category.id),
            eq(products.status, 'active')
          ));

        return {
          ...category,
          productCount: count
        };
      })
    );

    // Hierarchische Struktur aufbauen
    const rootCategories: (CategoryResponse & { children?: CategoryResponse[] })[] = [];
    const categoryMap = new Map<number, CategoryResponse & { children?: CategoryResponse[] }>();

    // Alle Kategorien in Map speichern
    categoriesWithCount.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Hierarchie aufbauen
    categoriesWithCount.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(categoryMap.get(category.id)!);
        } else {
          // Parent nicht gefunden, als Root-Kategorie behandeln
          rootCategories.push(categoryMap.get(category.id)!);
        }
      } else {
        rootCategories.push(categoryMap.get(category.id)!);
      }
    });

    res.json(createSuccessResponse({
      categories: rootCategories,
      total: categoryResults.length
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kategorien', 500));
  }
}

/**
 * Flache Kategorien-Liste abrufen (ohne Hierarchie)
 * GET /api/categories/flat
 */
export async function getCategoriesFlat(req: Request, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'name', 
      sortOrder = 'asc',
      q
    } = req.query as PaginationParams & { q?: string };

    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt
      })
      .from(categories)
      .where(eq(categories.isActive, true));

    // Suchfilter
    if (q) {
      query = query.where(and(
        eq(categories.isActive, true),
        or(
          ilike(categories.name, `%${q}%`),
          ilike(categories.description, `%${q}%`)
        )
      ));
    }

    // Sortierung
    const sortColumn = categories[sortBy as keyof typeof categories] || categories.name;
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(sortColumn));
    } else {
      query = query.orderBy(asc(sortColumn));
    }

    // Gesamtanzahl für Pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.isActive, true));

    // Pagination
    const offset = (page - 1) * limit;
    const categoryResults = await query
      .limit(limit)
      .offset(offset);

    // Produktanzahl für jede Kategorie laden
    const categoriesWithCount = await Promise.all(
      categoryResults.map(async (category) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(productCategories)
          .innerJoin(products, eq(productCategories.productId, products.id))
          .where(and(
            eq(productCategories.categoryId, category.id),
            eq(products.status, 'active')
          ));

        return {
          ...category,
          productCount: count
        };
      })
    );

    const pagination = calculatePagination(page, limit, totalCount);

    res.json(createSuccessResponse({
      categories: categoriesWithCount,
      meta: pagination
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kategorien', 500));
  }
}

/**
 * Einzelne Kategorie abrufen
 * GET /api/categories/:id
 */
export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    const categoryId = parseInt(req.params.id);

    const categoryResult = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (categoryResult.length === 0) {
      res.status(404).json(createErrorResponse('Kategorie nicht gefunden', 404));
      return;
    }

    const category = categoryResult[0];

    // Produktanzahl laden
    const [{ count: productCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCategories)
      .innerJoin(products, eq(productCategories.productId, products.id))
      .where(and(
        eq(productCategories.categoryId, category.id),
        eq(products.status, 'active')
      ));

    // Parent-Kategorie laden falls vorhanden
    let parent = null;
    if (category.parentId) {
      const parentResult = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug
        })
        .from(categories)
        .where(eq(categories.id, category.parentId))
        .limit(1);

      if (parentResult.length > 0) {
        parent = parentResult[0];
      }
    }

    // Child-Kategorien laden
    const childrenResult = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive
      })
      .from(categories)
      .where(eq(categories.parentId, category.id))
      .orderBy(asc(categories.sortOrder));

    const categoryResponse: CategoryResponse & { 
      parent?: any, 
      children?: any[], 
      productCount: number 
    } = {
      ...category,
      productCount,
      parent,
      children: childrenResult
    };

    res.json(createSuccessResponse(categoryResponse));

  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorie:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kategorie', 500));
  }
}

/**
 * Kategorie nach Slug abrufen
 * GET /api/categories/slug/:slug
 */
export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = req.params.slug;

    const categoryResult = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (categoryResult.length === 0) {
      res.status(404).json(createErrorResponse('Kategorie nicht gefunden', 404));
      return;
    }

    // Gleiche Logik wie getCategoryById
    req.params.id = categoryResult[0].id.toString();
    return getCategoryById(req, res);

  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorie:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kategorie', 500));
  }
}

// ========================
// KATEGORIEN ERSTELLEN
// ========================

/**
 * Neue Kategorie erstellen
 * POST /api/categories
 */
export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const categoryData: CategoryRequest = req.body;

    // Slug generieren falls nicht vorhanden
    let slug = categoryData.slug || generateSlug(categoryData.name);

    // Prüfen ob Slug bereits existiert
    const existingSlugs = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(like(categories.slug, `${slug}%`));

    slug = generateUniqueSlug(slug, existingSlugs.map(c => c.slug));

    // Parent-Kategorie validieren falls angegeben
    if (categoryData.parentId) {
      const parentExists = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, categoryData.parentId))
        .limit(1);

      if (parentExists.length === 0) {
        res.status(400).json(createErrorResponse('Parent-Kategorie nicht gefunden', 400));
        return;
      }
    }

    // Kategorie erstellen
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: categoryData.name,
        slug,
        description: categoryData.description,
        image: categoryData.image,
        parentId: categoryData.parentId,
        sortOrder: categoryData.sortOrder || 0,
        isActive: categoryData.isActive !== false,
        seoTitle: categoryData.seoTitle || categoryData.name,
        seoDescription: categoryData.seoDescription || categoryData.description
      })
      .returning();

    res.status(201).json(createSuccessResponse(
      { ...newCategory, productCount: 0 },
      'Kategorie erfolgreich erstellt'
    ));

  } catch (error) {
    console.error('Fehler beim Erstellen der Kategorie:', error);
    res.status(500).json(createErrorResponse('Fehler beim Erstellen der Kategorie', 500));
  }
}

// ========================
// KATEGORIEN AKTUALISIEREN
// ========================

/**
 * Kategorie aktualisieren
 * PUT /api/categories/:id
 */
export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const categoryId = parseInt(req.params.id);
    const updateData: Partial<CategoryRequest> = req.body;

    // Prüfen ob Kategorie existiert
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      res.status(404).json(createErrorResponse('Kategorie nicht gefunden', 404));
      return;
    }

    // Slug aktualisieren falls Name geändert wurde
    let slug = updateData.slug;
    if (updateData.name && !slug) {
      slug = generateSlug(updateData.name);
      
      // Prüfen ob neuer Slug bereits existiert (außer bei aktueller Kategorie)
      const existingSlugs = await db
        .select({ slug: categories.slug })
        .from(categories)
        .where(and(
          like(categories.slug, `${slug}%`),
          sql`${categories.id} != ${categoryId}`
        ));

      slug = generateUniqueSlug(slug, existingSlugs.map(c => c.slug));
    }

    // Parent-Kategorie validieren falls geändert
    if (updateData.parentId) {
      // Zirkuläre Referenzen verhindern
      if (updateData.parentId === categoryId) {
        res.status(400).json(createErrorResponse('Kategorie kann nicht ihr eigener Parent sein', 400));
        return;
      }

      const parentExists = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, updateData.parentId))
        .limit(1);

      if (parentExists.length === 0) {
        res.status(400).json(createErrorResponse('Parent-Kategorie nicht gefunden', 400));
        return;
      }
    }

    // Update-Felder vorbereiten
    const updateFields: any = {
      updatedAt: new Date()
    };

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof CategoryRequest] !== undefined) {
        updateFields[key] = updateData[key as keyof CategoryRequest];
      }
    });

    if (slug) {
      updateFields.slug = slug;
    }

    // Kategorie aktualisieren
    const [updatedCategory] = await db
      .update(categories)
      .set(updateFields)
      .where(eq(categories.id, categoryId))
      .returning();

    res.json(createSuccessResponse(updatedCategory, 'Kategorie erfolgreich aktualisiert'));

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kategorie:', error);
    res.status(500).json(createErrorResponse('Fehler beim Aktualisieren der Kategorie', 500));
  }
}

// ========================
// KATEGORIEN LÖSCHEN
// ========================

/**
 * Kategorie löschen
 * DELETE /api/categories/:id
 */
export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const categoryId = parseInt(req.params.id);

    // Prüfen ob Kategorie existiert
    const existingCategory = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      res.status(404).json(createErrorResponse('Kategorie nicht gefunden', 404));
      return;
    }

    // Prüfen ob Kategorie Child-Kategorien hat
    const childCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    if (childCategories.length > 0) {
      res.status(400).json(createErrorResponse(
        'Kategorie kann nicht gelöscht werden, da sie Unterkategorien enthält', 
        400
      ));
      return;
    }

    // Prüfen ob Kategorie Produkte hat
    const categoryProducts = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, categoryId));

    if (categoryProducts.length > 0) {
      res.status(400).json(createErrorResponse(
        'Kategorie kann nicht gelöscht werden, da sie Produkte enthält', 
        400
      ));
      return;
    }

    // Kategorie löschen
    await db
      .delete(categories)
      .where(eq(categories.id, categoryId));

    res.json(createSuccessResponse(
      { 
        id: categoryId, 
        name: existingCategory[0].name 
      },
      'Kategorie erfolgreich gelöscht'
    ));

  } catch (error) {
    console.error('Fehler beim Löschen der Kategorie:', error);
    res.status(500).json(createErrorResponse('Fehler beim Löschen der Kategorie', 500));
  }
}

/**
 * Kategorie deaktivieren (Soft Delete)
 * PATCH /api/categories/:id/deactivate
 */
export async function deactivateCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const categoryId = parseInt(req.params.id);

    const [updatedCategory] = await db
      .update(categories)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(categories.id, categoryId))
      .returning();

    if (!updatedCategory) {
      res.status(404).json(createErrorResponse('Kategorie nicht gefunden', 404));
      return;
    }

    res.json(createSuccessResponse(updatedCategory, 'Kategorie deaktiviert'));

  } catch (error) {
    console.error('Fehler beim Deaktivieren der Kategorie:', error);
    res.status(500).json(createErrorResponse('Fehler beim Deaktivieren der Kategorie', 500));
  }
}

// ========================
// EXPORT
// ========================

export default {
  getCategories,
  getCategoriesFlat,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  deactivateCategory
};
