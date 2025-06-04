import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Layout
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Pages
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CollectionsPage from '@/pages/CollectionsPage';
import CollectionDetailPage from '@/pages/CollectionDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import AccountPage from '@/pages/AccountPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ImprintPage from '@/pages/ImprintPage';

// Context
import { CartProvider } from '@/contexts/CartContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';

// Providers
import { QueryProvider } from '@/providers/QueryProvider';

// Cookie Consent
import CookieBanner from '@/components/CookieBanner';

function App() {
  return (
    <QueryProvider>
      <CookieConsentProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-white flex flex-col">
              <Header />
              <main className="flex-grow">
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
                </Routes>
              </main>
              <Footer />
              <CookieBanner />
              <Toaster />
            </div>
          </Router>
        </CartProvider>
      </CookieConsentProvider>
    </QueryProvider>
  );
}

export default App;
