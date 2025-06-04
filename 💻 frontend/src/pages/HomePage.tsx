import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Recycle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// API Hooks
import { useFeaturedProducts, useCollectionsWithFallback } from '@/hooks/useProducts';

const HomePage: React.FC = () => {
  // API-Calls für Featured Products und Collections
  const { 
    data: featuredProducts, 
    isLoading: productsLoading, 
    error: productsError 
  } = useFeaturedProducts();
  
  const { 
    collections, 
    isLoading: collectionsLoading, 
    error: collectionsError,
    isUsingFallback: collectionsUsingFallback 
  } = useCollectionsWithFallback();

  // Featured Collections filtern
  const featuredCollections = collections?.filter(c => c.featured) || [];

  const loading = productsLoading || collectionsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Startseite wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-700 text-white">
        <div className="absolute inset-0">
          <img
            src="/images/hero-banner.jpg"
            alt="DressForPleasure Fashion"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Urban Fashion
              <span className="block text-yellow-400">Redefined</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Nachhaltige Mode für moderne Menschen
            </p>
            <Button asChild size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Link to="/produkte">
                Jetzt entdecken
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Connection Status für Collections */}
      {collectionsUsingFallback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Alert className="border-orange-200 bg-orange-50">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Offline-Modus: Zeige gespeicherte Daten für Kollektionen
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Unsere Kollektionen
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Entdecken Sie unsere sorgfältig kuratierten Kollektionen, 
                die urbanen Stil mit nachhaltiger Mode verbinden.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCollections.map((collection) => (
                <Card key={collection.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={collection.image || '/images/collections/placeholder.jpg'}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/collections/placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{collection.name}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {collection.description}
                      </p>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/kollektionen/${collection.slug}`}>
                          Kollektion ansehen
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Produkte
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Unsere Lieblingsstücke der Saison - handverlesen für Sie.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.images?.[0] || '/images/products/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/products/placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        <Link 
                          to={`/produkte/${product.id}`}
                          className="hover:text-gray-600"
                        >
                          {product.name}
                        </Link>
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold">{product.price}€</p>
                          {product.originalPrice && (
                            <p className="text-sm text-gray-500 line-through">
                              {product.originalPrice}€
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {product.featured && (
                            <Badge variant="default" className="text-xs">Featured</Badge>
                          )}
                          {product.newArrival && (
                            <Badge variant="secondary" className="text-xs">Neu</Badge>
                          )}
                          {product.bestseller && (
                            <Badge variant="outline" className="text-xs">Bestseller</Badge>
                          )}
                        </div>
                      </div>
                      <Button asChild className="w-full" size="sm">
                        <Link to={`/produkte/${product.id}`}>
                          Details ansehen
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild size="lg">
                <Link to="/produkte">
                  Alle Produkte ansehen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Error State für Featured Products */}
      {productsError && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert className="border-red-200 bg-red-50">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Fehler beim Laden der Featured Products: {productsError.message}
              </AlertDescription>
            </Alert>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Warum DressForPleasure?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Wir stehen für nachhaltige Mode, faire Produktion und zeitloses Design.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium Qualität</h3>
              <p className="text-gray-600">
                Hochwertige Materialien und erstklassige Verarbeitung für langlebige Mode.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Kostenloser Versand</h3>
              <p className="text-gray-600">
                Gratis Lieferung ab 50€ - schnell, sicher und umweltfreundlich verpackt.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2">30 Tage Rückgabe</h3>
              <p className="text-gray-600">
                Nicht zufrieden? Kein Problem - 30 Tage kostenloses Rückgaberecht.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Recycle className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2">100% Nachhaltig</h3>
              <p className="text-gray-600">
                Faire Produktion, recycelte Materialien und CO2-neutraler Versand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bleiben Sie up-to-date
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Erhalten Sie exklusive Angebote, Style-Tipps und Neuigkeiten 
            direkt in Ihr Postfach.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              className="flex-1 px-4 py-2 rounded-md text-black"
            />
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
              Anmelden
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
