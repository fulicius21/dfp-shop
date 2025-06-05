/**
 * Performance Monitoring und Web Vitals Tracking
 */

import { config } from '@/lib/config';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface WebVitalsMetric extends PerformanceMetric {
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'performance' in window;
    
    if (this.isSupported) {
      this.initializeObservers();
      this.trackNavigationTiming();
      this.trackResourceTiming();
    }
  }

  /**
   * Initialize Performance Observers
   */
  private initializeObservers(): void {
    try {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry) {
            this.recordMetric({
              name: 'LCP',
              value: lastEntry.startTime,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        let clsEntries: any[] = [];
        let sessionValue = 0;
        let sessionEntries: any[] = [];

        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              const firstSessionEntry = sessionEntries[0];
              const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

              if (sessionValue && 
                  entry.startTime - lastSessionEntry.startTime < 1000 &&
                  entry.startTime - firstSessionEntry.startTime < 5000) {
                sessionValue += entry.value;
                sessionEntries.push(entry);
              } else {
                sessionValue = entry.value;
                sessionEntries = [entry];
              }

              if (sessionValue > clsValue) {
                clsValue = sessionValue;
                clsEntries = [...sessionEntries];
                
                this.recordMetric({
                  name: 'CLS',
                  value: clsValue,
                  timestamp: Date.now(),
                  url: window.location.href,
                  userAgent: navigator.userAgent,
                });
              }
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  /**
   * Track Navigation Timing
   */
  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // Time to First Byte (TTFB)
          this.recordMetric({
            name: 'TTFB',
            value: navigation.responseStart - navigation.requestStart,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });

          // DOM Content Loaded
          this.recordMetric({
            name: 'DCL',
            value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });

          // Load Complete
          this.recordMetric({
            name: 'Load',
            value: navigation.loadEventEnd - navigation.fetchStart,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });
        }
      }, 0);
    });
  }

  /**
   * Track Resource Timing
   */
  private trackResourceTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        
        // Track slow resources
        resources.forEach((resource: PerformanceResourceTiming) => {
          const duration = resource.responseEnd - resource.startTime;
          
          if (duration > 1000) { // Resources taking more than 1 second
            this.recordMetric({
              name: 'SlowResource',
              value: duration,
              timestamp: Date.now(),
              url: resource.name,
              userAgent: navigator.userAgent,
            });
          }
        });

        // Calculate total resources size
        const totalSize = resources.reduce((total, resource: any) => {
          return total + (resource.transferSize || 0);
        }, 0);

        this.recordMetric({
          name: 'TotalResourceSize',
          value: totalSize,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      }, 1000);
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    if (config.development.debugMode) {
      console.log('Performance Metric:', metric);
    }

    // Send to analytics in production
    if (config.app.environment === 'production' && config.analytics.enabled) {
      this.sendToAnalytics(metric);
    }
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    try {
      // Example: Send to Google Analytics
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'performance_metric', {
          metric_name: metric.name,
          metric_value: metric.value,
          custom_parameter_url: metric.url,
        });
      }

      // Example: Send to custom analytics endpoint
      if (config.api.baseUrl) {
        fetch(`${config.api.baseUrl}/analytics/performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
        }).catch(error => {
          console.warn('Failed to send performance metric:', error);
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metric to analytics:', error);
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Mark a custom timing point
   */
  mark(name: string): void {
    if (this.isSupported) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.isSupported) return null;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : null;
    } catch (error) {
      console.warn('Failed to measure performance:', error);
      return null;
    }
  }

  /**
   * Get current memory usage (if available)
   */
  getMemoryUsage(): any {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }
}

/**
 * Web Vitals Helper Functions
 */
export const getWebVitalsRating = (metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[metricName as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

/**
 * Performance utility functions
 */
export const performance_utils = {
  /**
   * Track component render time
   */
  trackComponentRender: (componentName: string) => {
    return {
      start: () => performance.mark(`${componentName}-render-start`),
      end: () => {
        performance.mark(`${componentName}-render-end`);
        const duration = performanceMonitor.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
        
        if (duration !== null) {
          performanceMonitor.recordMetric({
            name: 'ComponentRender',
            value: duration,
            timestamp: Date.now(),
            url: `component:${componentName}`,
            userAgent: navigator.userAgent,
          });
        }
      },
    };
  },

  /**
   * Track API call performance
   */
  trackApiCall: (endpoint: string) => {
    const startTime = Date.now();
    
    return {
      success: () => {
        const duration = Date.now() - startTime;
        performanceMonitor.recordMetric({
          name: 'ApiCallSuccess',
          value: duration,
          timestamp: Date.now(),
          url: endpoint,
          userAgent: navigator.userAgent,
        });
      },
      error: () => {
        const duration = Date.now() - startTime;
        performanceMonitor.recordMetric({
          name: 'ApiCallError',
          value: duration,
          timestamp: Date.now(),
          url: endpoint,
          userAgent: navigator.userAgent,
        });
      },
    };
  },

  /**
   * Track user interaction performance
   */
  trackInteraction: (interaction: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric({
        name: 'UserInteraction',
        value: duration,
        timestamp: Date.now(),
        url: `interaction:${interaction}`,
        userAgent: navigator.userAgent,
      });
    };
  },
};

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.disconnect();
  });
}

export default performanceMonitor;
