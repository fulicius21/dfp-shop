/**
 * Enhanced API Client mit Retry-Logic, Error Handling und Performance-Optimierungen
 */

// Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  signal?: AbortSignal;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// Cache implementation
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Enhanced API Client Class
 */
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private cache: SimpleCache;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: any) => any> = [];

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...defaultHeaders,
    };
    this.cache = new SimpleCache();
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: (response: any) => any): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Create API Error
   */
  private createApiError(message: string, status?: number, details?: any): ApiError {
    const error = new Error(message) as ApiError;
    error.name = 'ApiError';
    error.status = status;
    error.details = details;
    return error;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build cache key
   */
  private buildCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = config.timeout ? setTimeout(() => controller.abort(), config.timeout) : null;

    try {
      // Apply request interceptors
      let finalConfig = { ...config };
      for (const interceptor of this.requestInterceptors) {
        finalConfig = interceptor(finalConfig);
      }

      const requestInit: RequestInit = {
        method: finalConfig.method || 'GET',
        headers: {
          ...this.defaultHeaders,
          ...finalConfig.headers,
        },
        signal: finalConfig.signal || controller.signal,
      };

      if (finalConfig.body && finalConfig.method !== 'GET') {
        requestInit.body = typeof finalConfig.body === 'string' 
          ? finalConfig.body 
          : JSON.stringify(finalConfig.body);
      }

      const response = await fetch(`${this.baseURL}${url}`, requestInit);

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails: any = null;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData;
        } catch {
          // If JSON parsing fails, use the default error message
        }

        throw this.createApiError(errorMessage, response.status, errorDetails);
      }

      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        // Handle non-JSON responses
        data = {
          success: true,
          data: null as any,
          message: 'Response processed successfully',
        };
      }

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        data = interceptor(data);
      }

      return data;

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createApiError('Request timeout', 408);
      }

      // Handle network errors and retry logic
      const maxRetries = config.retries || 3;
      const retryDelay = config.retryDelay || 1000;

      if (attempt < maxRetries && this.shouldRetry(error as ApiError)) {
        console.warn(`Request failed (attempt ${attempt}/${maxRetries}):`, error);
        await this.sleep(retryDelay * Math.pow(2, attempt - 1)); // Exponential backoff
        return this.executeRequest<T>(url, config, attempt + 1);
      }

      if (error instanceof Error) {
        throw error;
      }

      throw this.createApiError('Unknown error occurred');
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: ApiError): boolean {
    // Retry on network errors or server errors (5xx)
    if (!error.status) return true; // Network error
    if (error.status >= 500) return true; // Server error
    if (error.status === 408) return true; // Timeout
    if (error.status === 429) return true; // Rate limit
    return false;
  }

  /**
   * Main request method
   */
  async request<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const cacheKey = this.buildCacheKey(url, config);
    
    // Check cache for GET requests
    if ((config.method || 'GET') === 'GET' && config.cache !== false) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const response = await this.executeRequest<T>(url, config);
      
      // Cache successful GET responses
      if ((config.method || 'GET') === 'GET' && config.cache !== false && response.success) {
        this.cache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config: Omit<RequestConfig, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body: data, cache: false });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config: Omit<RequestConfig, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data, cache: false });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE', cache: false });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config: Omit<RequestConfig, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data, cache: false });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000, retries: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

// Create default instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
export const apiClient = new ApiClient(API_BASE_URL);

// Add default interceptors
apiClient.addRequestInterceptor((config) => {
  // Add authentication token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

apiClient.addResponseInterceptor((response) => {
  // Log API calls in development
  if (import.meta.env.DEV) {
    console.log('API Response:', response);
  }
  return response;
});

export default apiClient;
