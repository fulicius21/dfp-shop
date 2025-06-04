/**
 * API-Service für DressForPleasure Frontend
 * 
 * Zentraler Service für alle Backend-API-Aufrufe
 */

// Environment-basierte API-URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount: number;
  category: string;
  collection: string;
  images: string[];
  sizes: string[];
  colors: Array<{ name: string; value: string; code: string }>;
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
  inStock: boolean;
  stockCount?: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  material?: string;
  careInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
  image?: string;
  parentId?: string;
  status: 'active' | 'inactive';
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
  status: 'active' | 'inactive';
  featured: boolean;
  season?: string;
  year?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  category?: string[];
  collection?: string[];
  priceMin?: number;
  priceMax?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  inStock?: boolean;
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// API-Client-Klasse
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log(`API Response: ${url}`, data);
      
      return data;
    } catch (error) {
      console.error(`API Error: ${url}`, error);
      throw error;
    }
  }

  // ==================
  // PRODUCT ENDPOINTS
  // ==================

  async getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Product[]>(endpoint);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/products/${id}`);
  }

  async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products/featured');
  }

  async getNewArrivals(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products/new-arrivals');
  }

  async getBestsellers(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products/bestsellers');
  }

  // ====================
  // CATEGORY ENDPOINTS
  // ====================

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>('/categories');
  }

  async getCategory(slug: string): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/categories/${slug}`);
  }

  async getCategoryProducts(slug: string, filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/categories/${slug}/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Product[]>(endpoint);
  }

  // ======================
  // COLLECTION ENDPOINTS
  // ======================

  async getCollections(): Promise<ApiResponse<Collection[]>> {
    return this.request<Collection[]>('/collections');
  }

  async getCollection(slug: string): Promise<ApiResponse<Collection>> {
    return this.request<Collection>(`/collections/${slug}`);
  }

  async getCollectionProducts(slug: string, filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/collections/${slug}/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Product[]>(endpoint);
  }

  // ================
  // SEARCH ENDPOINT
  // ================

  async searchProducts(query: string, filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('search', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'search') {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/products/search?${queryString}`;
    
    return this.request<Product[]>(endpoint);
  }

  // ==================
  // HEALTH CHECK
  // ==================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

// API-Client-Instanz exportieren
export const apiClient = new ApiClient(API_BASE_URL);

// Convenience-Funktionen exportieren
export const {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getNewArrivals,
  getBestsellers,
  getCategories,
  getCategory,
  getCategoryProducts,
  getCollections,
  getCollection,
  getCollectionProducts,
  searchProducts,
  healthCheck,
} = apiClient;

export default apiClient;
