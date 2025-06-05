import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Layout Components (nicht lazy geladen da immer benötigt)
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Error Boundary
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Loading Component
import LoadingSpinner from '@/components/LoadingSpinner';

// 404 Page Component
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// Lazy loaded Pages für bessere Performance
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const ProductsPage = React.lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('@/pages/ProductDetailPage'));
const CollectionsPage = React.lazy(() => import('@/pages/CollectionsPage'));
const CollectionDetailPage = React.lazy(() => import('@/pages/CollectionDetailPage'));
const CartPage = React.lazy(() => import('@/pages/CartPage'));
const CheckoutPage = React.lazy(() => import('@/pages/CheckoutPage'));
const AccountPage = React.lazy(() => import('@/pages/AccountPage'));
const PrivacyPage = React.lazy(() => import('@/pages/PrivacyPage'));
const ImprintPage = React.lazy(() => import('@/pages/ImprintPage'));

// Context
import { CartProvider } from '@/contexts/CartContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';

// Providers
import { QueryProvider } from '@/providers/QueryProvider';
import { AccessibilityProvider, SkipLink } from '@/components/AccessibilityProvider';

// Cookie Consent
import CookieBanner from '@/components/CookieBanner';

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <QueryProvider>
          <CookieConsentProvider>
            <CartProvider>
              <Router>
                <div className="min-h-screen bg-background text-foreground flex flex-col">
                  {/* Accessibility Skip Links */}
                  <SkipLink targetId="main-content">
                    Zum Hauptinhalt springen
                  </SkipLink>
                  <SkipLink targetId="navigation">
                    Zur Navigation springen
                  </SkipLink>
                  
                  <Header />
                  
                  <main 
                    id="main-content" 
                    className="flex-grow"
                    role="main"
                    aria-label="Hauptinhalt"
                  >
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="flex items-center justify-center min-h-[400px]">
                          <LoadingSpinner size="lg" text="Seite wird geladen..." />
                        </div>
                      }>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/produkte" element={<ProductsPage />} />
                          <Route path="/produkte/:id" element={<ProductDetailPage />} />
                          <Route path="/kollektionen" element={<CollectionsPage />} />
                          <Route path="/kollektionen/:slug" element={<CollectionDetailPage />} />
                          <Route path="/warenkorb" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/konto" element={<AccountPage />} />
                          <Route path="/datenschutz" element={<PrivacyPage />} />
                          <Route path="/impressum" element={<ImprintPage />} />
                          {/* 404 Route */}
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </Suspense>
                    </ErrorBoundary>
                  </main>
                  
                  <Footer />
                  <CookieBanner />
                  <Toaster />
                </div>
              </Router>
            </CartProvider>
          </CookieConsentProvider>
        </QueryProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
