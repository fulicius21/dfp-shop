/**
 * Intelligentes API-Fallback System
 * Wechselt automatisch zwischen Backend-API und statischen Daten
 */

import { apiClient } from './api';
import { StaticApiClient, staticApi } from './static-api';
import type { ApiResponse } from './api';

class ApiFallbackManager {
  private staticClient: StaticApiClient;
  private useStaticMode: boolean = false;
  private healthCheckInProgress: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.staticClient = staticApi;
    
    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Prüft die Verfügbarkeit der Backend-API
   */
  private async performHealthCheck(): Promise<boolean> {
    if (this.healthCheckInProgress) {
      return !this.useStaticMode;
    }

    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return !this.useStaticMode;
    }

    this.healthCheckInProgress = true;
    this.lastHealthCheck = now;

    try {
      // Versuche einen einfachen API-Call
      const response = await Promise.race([
        apiClient.getCategories(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]) as ApiResponse<any>;

      if (response.success) {
        this.useStaticMode = false;
        console.log('✅ Backend-API verfügbar - verwende Live-Daten');
        return true;
      } else {
        throw new Error('API response not successful');
      }
    } catch (error) {
      this.useStaticMode = true;
      console.log('⚠️ Backend-API nicht verfügbar - wechsle zu statischen Daten');
      return false;
    } finally {
      this.healthCheckInProgress = false;
    }
  }

  /**
   * Führt API-Call mit Fallback aus
   */
  private async executeWithFallback<T>(
    apiCall: () => Promise<ApiResponse<T>>,
    staticCall: () => Promise<ApiResponse<T>>,
    operationName: string
  ): Promise<ApiResponse<T>> {
    // Verwende statischen Modus wenn bereits bekannt
    if (this.useStaticMode) {
      console.log(`📱 ${operationName} - verwende statische Daten`);
      return staticCall();
    }

    try {
      // Versuche zunächst die echte API
      const result = await Promise.race([
        apiCall(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API Timeout')), 5000)
        )
      ]) as ApiResponse<T>;

      if (result.success) {
        console.log(`🌐 ${operationName} - erfolgreich via Backend-API`);
        return result;
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.log(`🔄 ${operationName} - Fallback zu statischen Daten`);
      this.useStaticMode = true;
      return staticCall();
    }
  }

  // ====================
  // PUBLIC API METHODS
  // ====================

  async getProducts() {
    return this.executeWithFallback(
      () => apiClient.getProducts(),
      () => this.staticClient.getProducts(),
      'getProducts'
    );
  }

  async getProduct(id: string) {
    return this.executeWithFallback(
      () => apiClient.getProduct(id),
      () => this.staticClient.getProduct(id),
      `getProduct(${id})`
    );
  }

  async getFeaturedProducts() {
    return this.executeWithFallback(
      () => apiClient.getFeaturedProducts(),
      () => this.staticClient.getFeaturedProducts(),
      'getFeaturedProducts'
    );
  }

  async getNewArrivals() {
    return this.executeWithFallback(
      () => apiClient.getNewArrivals(),
      () => this.staticClient.getNewArrivals(),
      'getNewArrivals'
    );
  }

  async getBestsellers() {
    return this.executeWithFallback(
      () => apiClient.getBestsellers(),
      () => this.staticClient.getBestsellers(),
      'getBestsellers'
    );
  }

  async getCategories() {
    return this.executeWithFallback(
      () => apiClient.getCategories(),
      () => this.staticClient.getCategories(),
      'getCategories'
    );
  }

  async getCategory(slug: string) {
    return this.executeWithFallback(
      () => apiClient.getCategory(slug),
      () => this.staticClient.getCategory(slug),
      `getCategory(${slug})`
    );
  }

  async getCollections() {
    return this.executeWithFallback(
      () => apiClient.getCollections(),
      () => this.staticClient.getCollections(),
      'getCollections'
    );
  }

  async getCollection(slug: string) {
    return this.executeWithFallback(
      () => apiClient.getCollection(slug),
      () => this.staticClient.getCollection(slug),
      `getCollection(${slug})`
    );
  }

  async getProductsByCategory(categorySlug: string) {
    return this.executeWithFallback(
      () => apiClient.getCategoryProducts(categorySlug),
      () => this.staticClient.getProductsByCategory(categorySlug),
      `getProductsByCategory(${categorySlug})`
    );
  }

  async getProductsByCollection(collectionSlug: string) {
    return this.executeWithFallback(
      () => apiClient.getProducts({ collection: [collectionSlug] }),
      () => this.staticClient.getProductsByCollection(collectionSlug),
      `getProductsByCollection(${collectionSlug})`
    );
  }

  async searchProducts(query: string) {
    return this.executeWithFallback(
      () => apiClient.getProducts({ search: query }),
      () => this.staticClient.searchProducts(query),
      `searchProducts(${query})`
    );
  }

  // ====================
  // STATUS METHODS
  // ====================

  isUsingStaticMode(): boolean {
    return this.useStaticMode;
  }

  forceStaticMode(force: boolean): void {
    this.useStaticMode = force;
    console.log(`🔧 Statischer Modus ${force ? 'aktiviert' : 'deaktiviert'}`);
  }

  async checkApiHealth(): Promise<boolean> {
    return this.performHealthCheck();
  }

  getStatus() {
    return {
      useStaticMode: this.useStaticMode,
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      healthCheckInProgress: this.healthCheckInProgress
    };
  }
}

// Singleton Instance
export const apiFallback = new ApiFallbackManager();

// Export für direkten Zugriff
export default apiFallback;
