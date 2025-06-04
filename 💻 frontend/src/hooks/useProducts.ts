/**
 * React Hooks für Produkt-API-Integration
 * 
 * Verwendet React Query für effizientes Daten-Caching und State-Management
 */

import { useQuery, UseQueryResult } from 'react-query';
import { apiClient, Product, Category, Collection, ApiResponse, ProductFilters } from '@/services/api';

// Query Keys für React Query Caching
export const QUERY_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: 'product',
  FEATURED_PRODUCTS: 'featured-products',
  NEW_ARRIVALS: 'new-arrivals',
  BESTSELLERS: 'bestsellers',
  CATEGORIES: 'categories',
  CATEGORY: 'category',
  CATEGORY_PRODUCTS: 'category-products',
  COLLECTIONS: 'collections',
  COLLECTION: 'collection',
  COLLECTION_PRODUCTS: 'collection-products',
  SEARCH: 'search',
} as const;

// Default Query Options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 Minuten
  cacheTime: 10 * 60 * 1000, // 10 Minuten
  retry: 2,
  refetchOnWindowFocus: false,
};

// ==================
// PRODUCT HOOKS
// ==================

export function useProducts(filters?: ProductFilters): UseQueryResult<Product[], Error> {
  return useQuery(
    [QUERY_KEYS.PRODUCTS, filters],
    async () => {
      const response = await apiClient.getProducts(filters);
      return response.data;
    },
    {
      ...defaultQueryOptions,
      enabled: true,
    }
  );
}

export function useProduct(id: string): UseQueryResult<Product, Error> {
  return useQuery(
    [QUERY_KEYS.PRODUCT, id],
    async () => {
      const response = await apiClient.getProduct(id);
      return response.data;
    },
    {
      ...defaultQueryOptions,
      enabled: !!id,
    }
  );
}

export function useFeaturedProducts(): UseQueryResult<Product[], Error> {
  return useQuery(
    [QUERY_KEYS.FEATURED_PRODUCTS],
    async () => {
      const response = await apiClient.getFeaturedProducts();
      return response.data;
    },
    {
      ...defaultQueryOptions,
    }
  );
}

export function useNewArrivals(): UseQueryResult<Product[], Error> {
  return useQuery(
    [QUERY_KEYS.NEW_ARRIVALS],
    async () => {
      const response = await apiClient.getNewArrivals();
      return response.data;
    },
    {
      ...defaultQueryOptions,
    }
  );
}

export function useBestsellers(): UseQueryResult<Product[], Error> {
  return useQuery(
    [QUERY_KEYS.BESTSELLERS],
    async () => {
      const response = await apiClient.getBestsellers();
      return response.data;
    },
    {
      ...defaultQueryOptions,
    }
  );
}

// ==================
// CATEGORY HOOKS
// ==================

export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery(
    [QUERY_KEYS.CATEGORIES],
    async () => {
      const response = await apiClient.getCategories();
      return response.data;
    },
    {
      ...defaultQueryOptions,
    }
  );
}

export function useCategory(slug: string): UseQueryResult<Category, Error> {
  return useQuery(
    [QUERY_KEYS.CATEGORY, slug],
    async () => {
      const response = await apiClient.getCategory(slug);
      return response.data;
    },
    {
      ...defaultQueryOptions,
      enabled: !!slug,
    }
  );
}

export function useCategoryProducts(
  slug: string,
  filters?: ProductFilters
): UseQueryResult<Product[], Error> {
  return useQuery(
    [QUERY_KEYS.CATEGORY_PRODUCTS, slug, filters],
    async () => {
      const response = await apiClient.getCategoryProducts(slug, filters);
      return response.data;
    },
    {
      ...defaultQueryOptions,
      enabled: !!slug,
    }
  );
}

// ==================
// COLLECTION HOOKS
// ==================

export function useCollections(): UseQueryResult<Collection[], Error> {
  return useQuery(
    [QUERY_KEYS.COLLECTIONS],
    async () => {
      const response = await apiClient.getCollections();
      return response.data;
    },
    {
      ...defaultQueryOptions,
    }
  );
}

export function useCollection(slug: string): UseQueryResult<Collection, Error> {
  return useQuery(
    [QUERY_KEYS.COLLECTION, slug],
    async () => {
      const response = await apiClient.getCollection(slug);
      return response.data;
    },
    {
      ...defaultQueryOptions,
      enabled: !!slug,
    }
  );
}

export function useCollectionProducts(
  slug: string,
  filters?: ProductFilters
): UseQueryResult<Product[], Error> {
  return useQuery(
    [QUERY_KEYS.COLLECTION_PRODUCTS, slug, filters],
    async () => {
      const response = await apiClient.getCollectionProducts(slug, filters);
      return response.data;
    },
    {
      ...defaultQueryOptions,
      enabled: !!slug,
    }
  );
}

// ==================
// SEARCH HOOKS
// ==================

export function useProductSearch(
  query: string,
  filters?: ProductFilters
): UseQueryResult<Product[], Error> {
  return useQuery(
    [QUERY_KEYS.SEARCH, query, filters],
    async () => {
      const response = await apiClient.searchProducts(query, filters);
      return response.data;
    },
    {
      ...defaultQueryOptions,
      enabled: !!query && query.length >= 2, // Nur suchen wenn mindestens 2 Zeichen
    }
  );
}

// ==================
// UTILITY HOOKS
// ==================

export function useApiHealth() {
  return useQuery(
    ['api-health'],
    async () => {
      return await apiClient.healthCheck();
    },
    {
      staleTime: 30 * 1000, // 30 Sekunden
      cacheTime: 60 * 1000, // 1 Minute
      retry: 1,
      refetchInterval: 60 * 1000, // Alle 60 Sekunden prüfen
    }
  );
}

// Hook für Fehlerbehandlung und Retry-Logic
export function useProductsWithFallback(filters?: ProductFilters) {
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useProducts(filters);

  // Fallback zu statischen Daten wenn API nicht verfügbar
  const fallbackProducts = useQuery(
    ['fallback-products'],
    async () => {
      console.warn('API nicht verfügbar, lade Fallback-Daten...');
      const response = await fetch('/data/products.json');
      return await response.json();
    },
    {
      enabled: !!error && !isLoading,
      staleTime: Infinity, // Fallback-Daten nie als veraltet markieren
    }
  );

  return {
    products: products || fallbackProducts.data || [],
    isLoading: isLoading || fallbackProducts.isLoading,
    error: error && fallbackProducts.error,
    isUsingFallback: !!error && !!fallbackProducts.data,
    refetch,
  };
}

export function useCategoriesWithFallback() {
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useCategories();

  const fallbackCategories = useQuery(
    ['fallback-categories'],
    async () => {
      console.warn('API nicht verfügbar, lade Fallback-Kategorien...');
      const response = await fetch('/data/categories.json');
      return await response.json();
    },
    {
      enabled: !!error && !isLoading,
      staleTime: Infinity,
    }
  );

  return {
    categories: categories || fallbackCategories.data || [],
    isLoading: isLoading || fallbackCategories.isLoading,
    error: error && fallbackCategories.error,
    isUsingFallback: !!error && !!fallbackCategories.data,
    refetch,
  };
}

export function useCollectionsWithFallback() {
  const {
    data: collections,
    isLoading,
    error,
    refetch,
  } = useCollections();

  const fallbackCollections = useQuery(
    ['fallback-collections'],
    async () => {
      console.warn('API nicht verfügbar, lade Fallback-Kollektionen...');
      const response = await fetch('/data/collections.json');
      return await response.json();
    },
    {
      enabled: !!error && !isLoading,
      staleTime: Infinity,
    }
  );

  return {
    collections: collections || fallbackCollections.data || [],
    isLoading: isLoading || fallbackCollections.isLoading,
    error: error && fallbackCollections.error,
    isUsingFallback: !!error && !!fallbackCollections.data,
    refetch,
  };
}
