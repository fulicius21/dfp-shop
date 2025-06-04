import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, Grid, List, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

// API Hooks
import { useCollection, useCollectionProducts } from '@/hooks/useProducts';
import { Product, ProductFilters } from '@/services/api';

const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');

  // API-Calls
  const { 
    data: collection, 
    isLoading: collectionLoading, 
    error: collectionError 
  } = useCollection(slug || '');

  // API-Filter für Kollektions-Produkte
  const apiFilters: ProductFilters = useMemo(() => ({
    sortBy: sortBy as any,
    sortOrder: 'asc',
  }), [sortBy]);

  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError 
  } = useCollectionProducts(slug || '', apiFilters);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];

    // Sort products (falls Backend-Sortierung nicht funktioniert)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, sortBy]);

  const loading = collectionLoading || productsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Kollektion wird geladen...</p>
        </div>
      </div>
    );
  }

  if (collectionError || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Alert className="mb-6 border-red-200 bg-red-50 max-w-md">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {collectionError ? `Fehler: ${collectionError.message}` : 'Kollektion nicht gefunden'}
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link to="/kollektionen">
              Zurück zu den Kollektionen
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">
            Home
          </Link>
          <span>/</span>
          <Link to="/kollektionen" className="hover:text-gray-900">
            Kollektionen
          </Link>
          <span>/</span>
          <span className="text-gray-900">{collection.name}</span>
        </div>

        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/kollektionen">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu den Kollektionen
          </Link>
        </Button>

        {/* Connection Status für Produkte */}
        {productsError && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Fehler beim Laden der Produkte: {productsError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Collection Header */}
        <div className="relative overflow-hidden rounded-lg mb-12">
          <div className="aspect-[3/1] bg-gray-200">
            <img
              src={collection.image || '/images/collections/placeholder.jpg'}
              alt={collection.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/collections/placeholder.jpg';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-center text-white">
            <div className="max-w-3xl px-4">
              <div className="flex justify-center gap-2 mb-4">
                {collection.featured && (
                  <Badge variant="default" className="bg-yellow-400 text-black">
                    Featured
                  </Badge>
                )}
                {collection.season && (
                  <Badge variant="outline" className="text-white border-white">
                    {collection.season}
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {collection.name}
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-6">
                {collection.description}
              </p>
              {filteredProducts.length > 0 && (
                <p className="text-lg">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Produkt' : 'Produkte'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Long Description */}
        {collection.description && (
          <div className="bg-white rounded-lg p-8 mb-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Über die {collection.name} Kollektion
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {collection.description}
              </p>
            </div>
          </div>
        )}

        {/* Products Section */}
        {filteredProducts.length > 0 ? (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Produkte ({filteredProducts.length})
              </h2>
              
              <div className="flex gap-4 items-center">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sortieren nach..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="price">Preis (niedrig-hoch)</SelectItem>
                    <SelectItem value="priceDesc">Preis (hoch-niedrig)</SelectItem>
                    <SelectItem value="newest">Neueste zuerst</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex rounded-md border">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-6"
            }>
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  viewMode={viewMode} 
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Keine Produkte gefunden
            </h2>
            <p className="text-gray-600 mb-8">
              In dieser Kollektion sind momentan keine Produkte verfügbar.
            </p>
            <Button asChild>
              <Link to="/produkte">
                Alle Produkte ansehen
              </Link>
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Entdecken Sie mehr Kollektionen
          </h2>
          <p className="text-gray-600 mb-6">
            Durchstöbern Sie unsere anderen Kollektionen für mehr Urban Fashion.
          </p>
          <Button asChild size="lg">
            <Link to="/kollektionen">
              Alle Kollektionen ansehen
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex">
            <div className="w-48 h-48 flex-shrink-0">
              <img
                src={product.images?.[0] || '/images/products/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover rounded-l-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/products/placeholder.jpg';
                }}
              />
            </div>
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    <Link 
                      to={`/produkte/${product.id}`}
                      className="hover:text-gray-600"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{product.price}€</p>
                  {product.originalPrice && (
                    <p className="text-sm text-gray-500 line-through">
                      {product.originalPrice}€
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {product.featured && (
                    <Badge variant="default">Featured</Badge>
                  )}
                  {product.newArrival && (
                    <Badge variant="secondary">Neu</Badge>
                  )}
                  {product.bestseller && (
                    <Badge variant="outline">Bestseller</Badge>
                  )}
                  {product.discount > 0 && (
                    <Badge variant="destructive">-{product.discount}%</Badge>
                  )}
                </div>
                
                <Button asChild>
                  <Link to={`/produkte/${product.id}`}>
                    Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow">
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
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold mb-1 line-clamp-1">
                <Link 
                  to={`/produkte/${product.id}`}
                  className="hover:text-gray-600"
                >
                  {product.name}
                </Link>
              </h3>
              <p className="text-gray-600 text-sm">{product.category}</p>
            </div>
          </div>
          
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
                <Badge variant="default" className="text-xs">F</Badge>
              )}
              {product.newArrival && (
                <Badge variant="secondary" className="text-xs">N</Badge>
              )}
              {product.bestseller && (
                <Badge variant="outline" className="text-xs">B</Badge>
              )}
              {product.discount > 0 && (
                <Badge variant="destructive" className="text-xs">-{product.discount}%</Badge>
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
  );
};

export default CollectionDetailPage;
