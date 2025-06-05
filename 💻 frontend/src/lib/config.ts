/**
 * Application Configuration
 * Zentralisierte Konfiguration für alle Environment-spezifischen Einstellungen
 */

export interface AppConfig {
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    cacheTtl: number;
  };
  
  // Application Info
  app: {
    name: string;
    version: string;
    description: string;
    environment: 'development' | 'staging' | 'production';
  };
  
  // SEO Configuration
  seo: {
    siteUrl: string;
    siteName: string;
    description: string;
    keywords: string[];
  };
  
  // Social Media
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  
  // Analytics
  analytics: {
    enabled: boolean;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  
  // Payment
  payment: {
    stripe: {
      publishableKey?: string;
    };
    paypal: {
      clientId?: string;
    };
  };
  
  // Feature Flags
  features: {
    pwa: boolean;
    analytics: boolean;
    chatSupport: boolean;
    wishlist: boolean;
    reviews: boolean;
    imageLazyLoading: boolean;
  };
  
  // Performance
  performance: {
    cacheTtl: number;
    bundleAnalyzer: boolean;
  };
  
  // Development
  development: {
    debugMode: boolean;
    mockApi: boolean;
    errorReporting: boolean;
  };
  
  // Security
  security: {
    cspEnabled: boolean;
    securityHeaders: boolean;
  };
}

/**
 * Get environment variable with fallback
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

/**
 * Get boolean environment variable
 */
const getEnvBool = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvVar(key).toLowerCase();
  return value === 'true' || value === '1';
};

/**
 * Get number environment variable
 */
const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = getEnvVar(key);
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Environment Detection
 */
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  if (import.meta.env.DEV) return 'development';
  if (getEnvVar('VITE_APP_ENV') === 'staging') return 'staging';
  return 'production';
};

/**
 * Application Configuration
 */
export const config: AppConfig = {
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001/api'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 10000),
    retries: 3,
    cacheTtl: getEnvNumber('VITE_CACHE_TTL', 300000), // 5 minutes
  },
  
  app: {
    name: getEnvVar('VITE_APP_NAME', 'DressForPleasure'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    description: getEnvVar('VITE_APP_DESCRIPTION', 'Premium Mode & Fashion Online Shop'),
    environment: getEnvironment(),
  },
  
  seo: {
    siteUrl: getEnvVar('VITE_SITE_URL', 'https://dressforp.com'),
    siteName: getEnvVar('VITE_SITE_NAME', 'DressForPleasure'),
    description: getEnvVar('VITE_SITE_DESCRIPTION', 'Premium Mode & Fashion Online Shop mit exklusiven Kollektionen'),
    keywords: [
      'mode', 'fashion', 'kleidung', 'online shop', 'premium', 'style', 'accessoires', 
      'dressforp', 'kollektionen', 'trends', 'designer', 'nachhaltigkeit'
    ],
  },
  
  social: {
    facebook: getEnvVar('VITE_FACEBOOK_URL'),
    instagram: getEnvVar('VITE_INSTAGRAM_URL'),
    twitter: getEnvVar('VITE_TWITTER_URL'),
  },
  
  analytics: {
    enabled: getEnvBool('VITE_ENABLE_ANALYTICS', false),
    googleAnalyticsId: getEnvVar('VITE_GOOGLE_ANALYTICS_ID'),
    facebookPixelId: getEnvVar('VITE_FACEBOOK_PIXEL_ID'),
  },
  
  payment: {
    stripe: {
      publishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
    },
    paypal: {
      clientId: getEnvVar('VITE_PAYPAL_CLIENT_ID'),
    },
  },
  
  features: {
    pwa: getEnvBool('VITE_ENABLE_PWA', true),
    analytics: getEnvBool('VITE_ENABLE_ANALYTICS', false),
    chatSupport: getEnvBool('VITE_ENABLE_CHAT_SUPPORT', false),
    wishlist: getEnvBool('VITE_ENABLE_WISHLIST', true),
    reviews: getEnvBool('VITE_ENABLE_REVIEWS', true),
    imageLazyLoading: getEnvBool('VITE_IMAGE_LAZY_LOADING', true),
  },
  
  performance: {
    cacheTtl: getEnvNumber('VITE_CACHE_TTL', 300000),
    bundleAnalyzer: getEnvBool('VITE_BUNDLE_ANALYZER', false),
  },
  
  development: {
    debugMode: getEnvBool('VITE_DEBUG_MODE', import.meta.env.DEV),
    mockApi: getEnvBool('VITE_MOCK_API', false),
    errorReporting: getEnvBool('VITE_ERROR_REPORTING', true),
  },
  
  security: {
    cspEnabled: getEnvBool('VITE_CSP_ENABLED', true),
    securityHeaders: getEnvBool('VITE_SECURITY_HEADERS', true),
  },
};

/**
 * Debug Configuration (Development only)
 */
if (config.development.debugMode) {
  console.group('🔧 Application Configuration');
  console.log('Environment:', config.app.environment);
  console.log('API Base URL:', config.api.baseUrl);
  console.log('Features:', config.features);
  console.log('Full Config:', config);
  console.groupEnd();
}

/**
 * Configuration Validation
 */
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate required production settings
  if (config.app.environment === 'production') {
    if (!config.api.baseUrl.startsWith('https://')) {
      errors.push('Production API URL must use HTTPS');
    }
    
    if (!config.seo.siteUrl.startsWith('https://')) {
      errors.push('Production site URL must use HTTPS');
    }
    
    if (config.development.debugMode) {
      errors.push('Debug mode should be disabled in production');
    }
  }
  
  // Validate API configuration
  if (!config.api.baseUrl) {
    errors.push('API base URL is required');
  }
  
  // Validate SEO configuration
  if (!config.seo.siteName) {
    errors.push('Site name is required for SEO');
  }
  
  if (!config.seo.description) {
    errors.push('Site description is required for SEO');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate configuration on startup
const validation = validateConfig();
if (!validation.valid) {
  console.error('❌ Configuration validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  
  if (config.app.environment === 'production') {
    throw new Error('Invalid configuration for production environment');
  }
}

export default config;
