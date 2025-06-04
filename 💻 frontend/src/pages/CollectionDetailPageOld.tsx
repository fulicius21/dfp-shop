import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount: number;
  category: string;
  collection: string;
  images: string[];
  sizes: string[];
  colors: Array<{ name: string; value: string; code: string }>;
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
}

const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load collection
        const collectionsResponse = await fetch('/data/collections.json');
        const collections = await collectionsResponse.json();
        const foundCollection = collections.find((c: Collection) => c.slug === slug);
        
        if (foundCollection) {
          setCollection(foundCollection);
          
          // Load products for this collection
          const productsResponse = await fetch('/data/products.json');
          const allProducts = await productsResponse.json();
          const collectionProducts = allProducts.filter((p: Product) => p.collection === foundCollection.name);
          setProducts(collectionProducts);
          setFilteredProducts(collectionProducts);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // Apply sorting
  useEffect(() => {
    let sorted = [...products];
    
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
        break;
      case 'name':
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    setFilteredProducts(sorted);
  }, [products, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kollektion nicht gefunden</h2>
          <p className="text-gray-600 mb-8">Die gesuchte Kollektion konnte nicht gefunden werden.</p>
          <Button asChild>
            <Link to="/kollektionen">Zurück zu den Kollektionen</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link to="/kollektionen" className="hover:text-gray-900">Kollektionen</Link>
          <span>/</span>
          <span className="text-gray-900">{collection.name}</span>
        </div>

        {/* Collection Hero */}
        <div className="mb-12">
          <div className="relative h-96 rounded-lg overflow-hidden mb-8">
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute inset-0 flex items-center justify-center text-center text-white">
              <div className="max-w-3xl px-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {collection.season}
                  </Badge>
                  {collection.featured && (
                    <Badge className="bg-yellow-500/80 text-white">Featured</Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">{collection.name}</h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-6">
                  {collection.longDescription}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {collection.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="border-white/50 text-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Produkte der Kollektion
            </h2>
            <p className="text-gray-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Produkt' : 'Produkte'} gefunden
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sortieren nach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price-low">Preis aufsteigend</SelectItem>
                <SelectItem value="price-high">Preis absteigend</SelectItem>
                <SelectItem value="newest">Neueste zuerst</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-gray-200 rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Link key={product.id} to={`/produkte/${product.id}`} className="group">
                  <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="relative">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.newArrival && (
                          <Badge className="bg-green-500 text-white">Neu</Badge>
                        )}
                        {product.bestseller && (
                          <Badge className="bg-blue-500 text-white">Bestseller</Badge>
                        )}
                        {product.discount > 0 && (
                          <Badge className="bg-red-500 text-white">-{product.discount}%</Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 group-hover:text-gray-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">€{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-gray-500 line-through text-sm">
                              €{product.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          {product.colors.slice(0, 3).map(color => (
                            <div
                              key={color.code}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map(product => (
                <Link key={product.id} to={`/produkte/${product.id}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="flex">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-48 h-32 object-cover"
                      />
                      <CardContent className="flex-1 p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-gray-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {product.description}
                            </p>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-lg">€{product.price}</span>
                                {product.originalPrice && (
                                  <span className="text-gray-500 line-through">
                                    €{product.originalPrice}
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                {product.colors.map(color => (
                                  <div
                                    key={color.code}
                                    className="w-5 h-5 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {product.newArrival && (
                              <Badge className="bg-green-500 text-white">Neu</Badge>
                            )}
                            {product.bestseller && (
                              <Badge className="bg-blue-500 text-white">Bestseller</Badge>
                            )}
                            {product.discount > 0 && (
                              <Badge className="bg-red-500 text-white">-{product.discount}%</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">
              Noch keine Produkte in dieser Kollektion verfügbar.
            </p>
            <Button asChild>
              <Link to="/produkte">Alle Produkte ansehen</Link>
            </Button>
          </div>
        )}

        {/* Back to Collections */}
        <div className="mt-16 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/kollektionen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zu allen Kollektionen
            </Link>
          </Button>
        </div>

        {/* Related Collections */}
        <div className="mt-16 pt-16 border-t">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Weitere Kollektionen entdecken
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link to="/kollektionen/berlin-collection" className="group">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="/images/collections/collection-1.jpg"
                    alt="Berlin Collection"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">Berlin Collection</h3>
                    <p className="text-gray-200">Urbane Mode aus der Hauptstadt</p>
                  </div>
                </div>
              </Card>
            </Link>
            
            <Link to="/kollektionen/atlanta-collection" className="group">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="/images/collections/collection-2.jpg"
                    alt="Atlanta Collection"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">Atlanta Collection</h3>
                    <p className="text-gray-200">Street Style meets Southern Charm</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;
