import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// API Hooks
import { useCollectionsWithFallback } from '@/hooks/useProducts';

// Type Guards
import { getErrorMessage } from '@/lib/type-guards';

const CollectionsPage: React.FC = () => {
  const { 
    collections, 
    isLoading: loading, 
    error,
    isUsingFallback,
    refetch 
  } = useCollectionsWithFallback();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Kollektionen werden geladen...</p>
        </div>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Keine Kollektionen gefunden</h2>
          <p className="text-gray-600 mb-6">
            Momentan sind keine Kollektionen verfügbar.
          </p>
          <Button asChild>
            <Link to="/produkte">
              Alle Produkte ansehen
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const featuredCollections = collections.filter(c => c.featured);
  const regularCollections = collections.filter(c => !c.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        {isUsingFallback && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Offline-Modus: Zeige gespeicherte Kollektionen. 
                {error && ` (${getErrorMessage(error)})`}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
              >
                Erneut versuchen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isUsingFallback && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Online: Aktuelle Kollektionen vom Server
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unsere Kollektionen
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Entdecken Sie unsere sorgfältig kuratierten Kollektionen, die urbanen Stil 
            mit nachhaltiger Mode und zeitlosem Design verbinden.
          </p>
        </div>

        {/* Featured Collections */}
        {featuredCollections.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Featured Kollektionen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredCollections.map((collection) => (
                <Card key={collection.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={collection.image || '/images/collections/placeholder.jpg'}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/collections/placeholder.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
                      <div className="absolute top-4 left-4">
                        <Badge variant="default" className="bg-yellow-400 text-black">
                          Featured
                        </Badge>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {collection.name}
                        </h3>
                        {collection.season && (
                          <Badge variant="outline">
                            {collection.season}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                        {collection.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {collection.productCount || 0} Produkte
                        </span>
                        <Button asChild size="lg" className="group">
                          <Link to={`/kollektionen/${collection.slug}`}>
                            Kollektion entdecken
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Regular Collections */}
        {regularCollections.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Alle Kollektionen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularCollections.map((collection) => (
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
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {collection.name}
                        </h3>
                        {collection.season && (
                          <Badge variant="outline" className="text-xs">
                            {collection.season}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {collection.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {collection.productCount || 0} Produkte
                        </span>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/kollektionen/${collection.slug}`}>
                            Ansehen
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="mt-16 text-center bg-white rounded-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Finden Sie Ihren Style
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Durchstöbern Sie alle unsere Produkte oder lassen Sie sich von unseren 
            Styling-Tipps inspirieren.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/produkte">
                Alle Produkte ansehen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/produkte?featured=true">
                Featured Produkte
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CollectionsPage;
