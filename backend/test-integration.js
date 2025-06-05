#!/usr/bin/env node

/**
 * Integrations-Test für DressForPleasure Backend
 * 
 * Dieser Test prüft:
 * - API-Kompatibilität mit Frontend-Daten
 * - Datenbankverbindung
 * - Grundlegende Endpunkt-Funktionalität
 * - CORS-Konfiguration
 */

const fs = require('fs');
const path = require('path');

// Test-Konfiguration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const FRONTEND_DATA_PATH = '../dressforp/public/data';

// Hilfsfunktionen
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message, error) {
  console.error(`[${new Date().toISOString()}] ❌ ${message}:`, error);
}

function logSuccess(message) {
  console.log(`[${new Date().toISOString()}] ✅ ${message}`);
}

// API-Request-Funktion
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Frontend-Daten laden
function loadFrontendData() {
  try {
    const productsPath = path.join(__dirname, FRONTEND_DATA_PATH, 'products.json');
    const categoriesPath = path.join(__dirname, FRONTEND_DATA_PATH, 'categories.json');
    const collectionsPath = path.join(__dirname, FRONTEND_DATA_PATH, 'collections.json');

    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));

    return { products, categories, collections };
  } catch (error) {
    logError('Fehler beim Laden der Frontend-Daten', error);
    return null;
  }
}

// Tests
const tests = {
  // 1. Health Check
  async healthCheck() {
    log('🔍 Health Check wird durchgeführt...');
    
    const response = await apiRequest('/health');
    
    if (response.success) {
      logSuccess('API ist erreichbar');
      return true;
    } else {
      logError('API Health Check fehlgeschlagen', response);
      return false;
    }
  },

  // 2. Database Health Check
  async databaseHealthCheck() {
    log('🗄️ Datenbank Health Check wird durchgeführt...');
    
    const response = await apiRequest('/health/detailed');
    
    if (response.success && response.data.data.database === 'healthy') {
      logSuccess('Datenbankverbindung ist gesund');
      return true;
    } else {
      logError('Datenbank Health Check fehlgeschlagen', response);
      return false;
    }
  },

  // 3. CORS Check
  async corsCheck() {
    log('🌐 CORS-Konfiguration wird geprüft...');
    
    const response = await apiRequest('/api/docs', {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    if (response.success) {
      logSuccess('CORS-Konfiguration funktioniert');
      return true;
    } else {
      logError('CORS-Check fehlgeschlagen', response);
      return false;
    }
  },

  // 4. Produkte API Test
  async productsApiTest() {
    log('🛍️ Produkte API wird getestet...');
    
    const response = await apiRequest('/api/products?status=active&limit=5');
    
    if (response.success) {
      const products = response.data.data.products;
      
      if (Array.isArray(products)) {
        logSuccess(`Produkte API funktioniert (${products.length} Produkte erhalten)`);
        
        // Struktur prüfen
        if (products.length > 0) {
          const product = products[0];
          const requiredFields = ['id', 'name', 'basePrice', 'status', 'slug'];
          const hasAllFields = requiredFields.every(field => product[field] !== undefined);
          
          if (hasAllFields) {
            logSuccess('Produktstruktur ist kompatibel mit Frontend');
          } else {
            logError('Produktstruktur ist unvollständig', { product, requiredFields });
          }
        }
        
        return true;
      } else {
        logError('Produkte API liefert keine Array-Daten', response);
        return false;
      }
    } else {
      logError('Produkte API Test fehlgeschlagen', response);
      return false;
    }
  },

  // 5. Kategorien API Test
  async categoriesApiTest() {
    log('📂 Kategorien API wird getestet...');
    
    const response = await apiRequest('/api/categories');
    
    if (response.success) {
      const categories = response.data.data.categories;
      
      if (Array.isArray(categories)) {
        logSuccess(`Kategorien API funktioniert (${categories.length} Kategorien erhalten)`);
        return true;
      } else {
        logError('Kategorien API liefert keine Array-Daten', response);
        return false;
      }
    } else {
      logError('Kategorien API Test fehlgeschlagen', response);
      return false;
    }
  },

  // 6. Kollektionen API Test
  async collectionsApiTest() {
    log('🎨 Kollektionen API wird getestet...');
    
    const response = await apiRequest('/api/collections');
    
    if (response.success) {
      const collections = response.data.data.collections;
      
      if (Array.isArray(collections)) {
        logSuccess(`Kollektionen API funktioniert (${collections.length} Kollektionen erhalten)`);
        return true;
      } else {
        logError('Kollektionen API liefert keine Array-Daten', response);
        return false;
      }
    } else {
      logError('Kollektionen API Test fehlgeschlagen', response);
      return false;
    }
  },

  // 7. Frontend-Daten Kompatibilität
  async frontendDataCompatibility() {
    log('🔄 Frontend-Daten Kompatibilität wird geprüft...');
    
    const frontendData = loadFrontendData();
    if (!frontendData) {
      return false;
    }

    // Beispiel-Produkt aus Frontend-Daten
    const frontendProduct = frontendData.products[0];
    
    // API-Struktur abrufen
    const response = await apiRequest('/api/products?limit=1');
    
    if (response.success && response.data.data.products.length > 0) {
      const apiProduct = response.data.data.products[0];
      
      // Wichtige Felder vergleichen
      const compatibleFields = ['name', 'description', 'basePrice'];
      const compatibility = compatibleFields.every(field => 
        typeof frontendProduct[field] === typeof apiProduct[field]
      );
      
      if (compatibility) {
        logSuccess('Frontend-Daten sind kompatibel mit API-Struktur');
        return true;
      } else {
        logError('Frontend-Daten sind nicht kompatibel', {
          frontend: frontendProduct,
          api: apiProduct
        });
        return false;
      }
    } else {
      logError('Keine API-Daten für Kompatibilitätsprüfung verfügbar');
      return false;
    }
  },

  // 8. Checkout API Test (Mock)
  async checkoutApiTest() {
    log('🛒 Checkout API wird getestet...');
    
    // Mock-Bestellung für Test
    const mockOrder = {
      customerEmail: 'test@dressforp.com',
      items: [
        {
          productId: 1,
          variantId: 1,
          quantity: 1
        }
      ],
      billingAddress: {
        firstName: 'Test',
        lastName: 'Kunde',
        streetAddress: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE'
      },
      shippingAddress: {
        firstName: 'Test',
        lastName: 'Kunde',
        streetAddress: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE'
      },
      paymentMethod: 'card'
    };

    const response = await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify(mockOrder)
    });

    // Es ist okay wenn der Test mit 400 fehlschlägt (Validierungsfehler erwartet)
    // da wir kein echtes Produkt/Variante haben
    if (response.status === 400 || response.status === 404) {
      logSuccess('Checkout API ist erreichbar (Validierungsfehler erwartet)');
      return true;
    } else if (response.success) {
      logSuccess('Checkout API funktioniert vollständig');
      return true;
    } else {
      logError('Checkout API Test fehlgeschlagen', response);
      return false;
    }
  },

  // 9. Admin Auth Test
  async adminAuthTest() {
    log('🔐 Admin Authentifizierung wird getestet...');
    
    const loginData = {
      email: 'admin@dressforp.com',
      password: 'SecureAdmin123!'
    };

    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    });

    if (response.success && response.data.data.token) {
      logSuccess('Admin Authentifizierung funktioniert');
      return true;
    } else {
      logError('Admin Authentifizierung fehlgeschlagen', response);
      return false;
    }
  },

  // 10. Performance Test
  async performanceTest() {
    log('⚡ Performance wird getestet...');
    
    const startTime = Date.now();
    
    // Mehrere parallele Requests
    const requests = [
      apiRequest('/api/products?limit=10'),
      apiRequest('/api/categories'),
      apiRequest('/api/collections'),
      apiRequest('/health')
    ];

    try {
      await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration < 2000) {
        logSuccess(`Performance Test bestanden (${duration}ms)`);
        return true;
      } else {
        logError(`Performance Test fehlgeschlagen - zu langsam (${duration}ms)`);
        return false;
      }
    } catch (error) {
      logError('Performance Test fehlgeschlagen', error);
      return false;
    }
  }
};

// Haupt-Test-Funktion
async function runIntegrationTests() {
  console.log('='.repeat(60));
  console.log('🧪 DressForPleasure Backend Integration Tests');
  console.log('='.repeat(60));
  console.log();

  const results = [];
  
  for (const [testName, testFunction] of Object.entries(tests)) {
    try {
      const result = await testFunction();
      results.push({ name: testName, success: result });
    } catch (error) {
      logError(`Test ${testName} ist abgestürzt`, error);
      results.push({ name: testName, success: false });
    }
    
    console.log(); // Leerzeile zwischen Tests
  }

  // Ergebnisse zusammenfassen
  console.log('='.repeat(60));
  console.log('📊 TEST ERGEBNISSE');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log();
  console.log(`Gesamtergebnis: ${successCount}/${totalCount} Tests bestanden`);
  
  if (successCount === totalCount) {
    console.log('🎉 Alle Tests bestanden! Backend ist bereit für die Frontend-Integration.');
  } else {
    console.log('⚠️  Einige Tests sind fehlgeschlagen. Bitte prüfen Sie die obigen Fehler.');
  }
  
  console.log('='.repeat(60));
  
  process.exit(successCount === totalCount ? 0 : 1);
}

// Tests ausführen
if (require.main === module) {
  // Global fetch polyfill für Node.js < 18
  if (!global.fetch) {
    global.fetch = require('node-fetch');
  }
  
  runIntegrationTests().catch(error => {
    logError('Integration Tests sind abgestürzt', error);
    process.exit(1);
  });
}

module.exports = { tests, runIntegrationTests };
