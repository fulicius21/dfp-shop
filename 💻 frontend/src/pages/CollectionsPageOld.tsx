import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types
interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  image: string;
  featured: boolean;
  season: string;
  productCount: number;
  tags: string[];
}

const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const response = await fetch('/data/collections.json');
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const featuredCollections = collections.filter(c => c.featured);
  const regularCollections = collections.filter(c => !c.featured);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Kollektionen</span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Unsere Kollektionen
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Entdecken Sie unsere sorgfältig kuratierten Kollektionen, die Berlin's urbanen 
            Stil mit Atlanta's Street-Culture vereinen. Jede Kollektion erzählt eine eigene 
            Geschichte von Innovation, Nachhaltigkeit und modernem Design.
          </p>
        </div>

        {/* Featured Collections */}
        {featuredCollections.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Ausgewählte Kollektionen</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredCollections.map((collection) => (
                <Link 
                  key={collection.id}
                  to={`/kollektionen/${collection.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="relative h-96 overflow-hidden">
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-8 text-white">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge className="bg-white/20 text-white border-white/30">
                            {collection.season}
                          </Badge>
                          <Badge className="bg-white/20 text-white border-white/30">
                            {collection.productCount} Produkte
                          </Badge>
                        </div>
                        <h3 className="text-3xl font-bold mb-3">{collection.name}</h3>
                        <p className="text-gray-200 text-lg mb-4 line-clamp-2">
                          {collection.longDescription}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {collection.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="border-white/30 text-white">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Collections */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Alle Kollektionen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <Link 
                key={collection.id}
                to={`/kollektionen/${collection.slug}`}
                className="group"
              >
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300"></div>
                    <div className="absolute top-4 left-4">
                      {collection.featured && (
                        <Badge className="bg-yellow-500 text-white">Featured</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold group-hover:text-gray-600 transition-colors">
                        {collection.name}
                      </h3>
                      <Badge variant="outline">{collection.productCount}</Badge>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {collection.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {collection.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{collection.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-16 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verpassen Sie nichts
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Abonnieren Sie unseren Newsletter und erfahren Sie als Erste von neuen 
            Kollektionen, exklusiven Angeboten und besonderen Events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
            <Button>Newsletter abonnieren</Button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Mit der Anmeldung stimmen Sie unserer{' '}
            <Link to="/datenschutz" className="underline hover:text-gray-700">
              Datenschutzerklärung
            </Link>{' '}
            zu.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CollectionsPage;
