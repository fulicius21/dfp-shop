/**
 * Statische API für DressForPleasure Frontend
 * Optimiert für Vercel-Deployment ohne Backend
 */

import type { Product, Category, Collection, ApiResponse } from './api';

// Statische Daten Cache
let productsCache: Product[] | null = null;
let categoriesCache: Category[] | null = null;
let collectionsCache: Collection[] | null = null;

/**
 * Lade statische JSON-Daten
 */
async function loadStaticData<T>(filename: string): Promise<T[]> {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

/**
 * Statischer API-Client für lokale JSON-Daten
 */
export class StaticApiClient {
  
  // ====================
  // PRODUCT ENDPOINTS
  // ====================

  async getProducts(): Promise<ApiResponse<Product[]>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    return {
      success: true,
      data: productsCache,
      message: 'Produkte erfolgreich geladen (statisch)'
    };
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    const product = productsCache.find(p => p.id === id);
    
    if (!product) {
      return {
        success: false,
        data: null,
        message: 'Produkt nicht gefunden',
        error: 'PRODUCT_NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: product,
      message: 'Produkt erfolgreich geladen'
    };
  }

  async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    const featured = productsCache.filter(p => p.featured);
    
    return {
      success: true,
      data: featured,
      message: 'Featured Produkte erfolgreich geladen'
    };
  }

  async getNewArrivals(): Promise<ApiResponse<Product[]>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    const newArrivals = productsCache.filter(p => p.newArrival);
    
    return {
      success: true,
      data: newArrivals,
      message: 'Neue Arrivals erfolgreich geladen'
    };
  }

  async getBestsellers(): Promise<ApiResponse<Product[]>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    const bestsellers = productsCache.filter(p => p.bestseller);
    
    return {
      success: true,
      data: bestsellers,
      message: 'Bestseller erfolgreich geladen'
    };
  }

  async getProductsByCategory(categorySlug: string): Promise<ApiResponse<Product[]>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    const categoryProducts = productsCache.filter(p => 
      p.category.toLowerCase() === categorySlug.toLowerCase()
    );
    
    return {
      success: true,
      data: categoryProducts,
      message: `Produkte für Kategorie ${categorySlug} erfolgreich geladen`
    };
  }

  async getProductsByCollection(collectionSlug: string): Promise<ApiResponse<Product[]>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    const collectionProducts = productsCache.filter(p => 
      p.collection.toLowerCase().includes(collectionSlug.toLowerCase())
    );
    
    return {
      success: true,
      data: collectionProducts,
      message: `Produkte für Kollektion ${collectionSlug} erfolgreich geladen`
    };
  }

  // ====================
  // CATEGORY ENDPOINTS
  // ====================

  async getCategories(): Promise<ApiResponse<Category[]>> {
    if (!categoriesCache) {
      categoriesCache = await loadStaticData<Category>('categories.json');
    }
    
    return {
      success: true,
      data: categoriesCache,
      message: 'Kategorien erfolgreich geladen'
    };
  }

  async getCategory(slug: string): Promise<ApiResponse<Category>> {
    if (!categoriesCache) {
      categoriesCache = await loadStaticData<Category>('categories.json');
    }
    
    const category = categoriesCache.find(c => c.slug === slug);
    
    if (!category) {
      return {
        success: false,
        data: null,
        message: 'Kategorie nicht gefunden',
        error: 'CATEGORY_NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: category,
      message: 'Kategorie erfolgreich geladen'
    };
  }

  // ====================
  // COLLECTION ENDPOINTS
  // ====================

  async getCollections(): Promise<ApiResponse<Collection[]>> {
    if (!collectionsCache) {
      collectionsCache = await loadStaticData<Collection>('collections.json');
    }
    
    return {
      success: true,
      data: collectionsCache,
      message: 'Kollektionen erfolgreich geladen'
    };
  }

  async getCollection(slug: string): Promise<ApiResponse<Collection>> {
    if (!collectionsCache) {
      collectionsCache = await loadStaticData<Collection>('collections.json');
    }
    
    const collection = collectionsCache.find(c => c.slug === slug);
    
    if (!collection) {
      return {
        success: false,
        data: null,
        message: 'Kollektion nicht gefunden',
        error: 'COLLECTION_NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: collection,
      message: 'Kollektion erfolgreich geladen'
    };
  }

  // ====================
  // SEARCH ENDPOINTS
  // ====================

  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    if (!productsCache) {
      productsCache = await loadStaticData<Product>('products.json');
    }
    
    const searchQuery = query.toLowerCase();
    const results = productsCache.filter(p => 
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery) ||
      p.collection.toLowerCase().includes(searchQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );
    
    return {
      success: true,
      data: results,
      message: `${results.length} Suchergebnisse für "${query}"`
    };
  }

  // ====================
  // UTILITY METHODS
  // ====================

  async warmCache(): Promise<void> {
    console.log('🔥 Warming static data cache...');
    await Promise.all([
      this.getProducts(),
      this.getCategories(),
      this.getCollections()
    ]);
    console.log('✅ Static data cache warmed');
  }

  clearCache(): void {
    productsCache = null;
    categoriesCache = null;
    collectionsCache = null;
    console.log('🗑️ Static data cache cleared');
  }
}

// Singleton Instance
export const staticApi = new StaticApiClient();

// Auto-warm cache on import
staticApi.warmCache();
