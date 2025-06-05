import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List, Search, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';

// API Hooks
import { useProductsWithFallback, useCategoriesWithFallback } from '@/hooks/useProducts';
import { Product, Category, ProductFilters } from '@/services/api';

// Type Guards
import { getErrorMessage, isStringArray } from '@/lib/type-guards';

interface Filters {
  category: string[];
  collection: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  tags: string[];
  inStock: boolean;
}

const ProductsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const [filters, setFilters] = useState<Filters>({
    category: [],
    collection: [],
    priceRange: [0, 300],
    sizes: [],
    colors: [],
    tags: [],
    inStock: false,
  });

  // API-Calls mit Fallback - erstelle API-Filter
  const apiFilters: ProductFilters = useMemo(() => ({
    category: filters.category.length > 0 ? filters.category : undefined,
    collection: filters.collection.length > 0 ? filters.collection : undefined,
    priceMin: filters.priceRange[0],
    priceMax: filters.priceRange[1],
    sizes: filters.sizes.length > 0 ? filters.sizes : undefined,
    colors: filters.colors.length > 0 ? filters.colors : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    inStock: filters.inStock || undefined,
    search: searchTerm || undefined,
    sortBy: sortBy as any,
    sortOrder: 'asc',
  }), [filters, searchTerm, sortBy]);

  const { 
    products, 
    isLoading: productsLoading, 
    error: productsError,
    isUsingFallback: productsUsingFallback,
    refetch: refetchProducts 
  } = useProductsWithFallback(apiFilters);

  const { 
    categories, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    isUsingFallback: categoriesUsingFallback,
    refetch: refetchCategories 
  } = useCategoriesWithFallback();

  // Filter products locally if needed (nur für Fallback-Daten)
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];

    // Wenn wir Fallback-Daten verwenden, müssen wir lokal filtern
    if (productsUsingFallback) {
      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Category filter
      if (filters.category.length > 0) {
        filtered = filtered.filter(product => filters.category.includes(product.category));
      }

      // Collection filter
      if (filters.collection.length > 0) {
        filtered = filtered.filter(product => filters.collection.includes(product.collection));
      }

      // Price filter
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      );

      // Size filter
      if (filters.sizes.length > 0) {
        filtered = filtered.filter(product => 
          product.sizes.some(size => filters.sizes.includes(size))
        );
      }

      // Color filter
      if (filters.colors.length > 0) {
        filtered = filtered.filter(product => 
          product.colors.some(color => filters.colors.includes(color.name))
        );
      }

      // Sorting (für Fallback-Daten)
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
    }

    return filtered;
  }, [products, searchTerm, filters, sortBy, productsUsingFallback]);

  // Available filter options
  const availableCollections = useMemo((): string[] => {
    if (!products) return [];
    const collections = products.map(p => p.collection).filter((c): c is string => typeof c === 'string');
    return [...new Set(collections)] as string[];
  }, [products]);

  const availableSizes = useMemo((): string[] => {
    if (!products) return [];
    const sizes = products.flatMap(p => isStringArray(p.sizes) ? p.sizes : []).filter(Boolean);
    return [...new Set(sizes)] as string[];
  }, [products]);

  const availableColors = useMemo((): string[] => {
    if (!products) return [];
    const colors = products.flatMap(p => 
      Array.isArray(p.colors) 
        ? p.colors.map(c => (typeof c === 'object' && c && 'name' in c && typeof c.name === 'string') ? c.name : '')
        : []
    ).filter(Boolean);
    return [...new Set(colors)] as string[];
  }, [products]);

  const availableTags = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.flatMap(p => p.tags))].filter(Boolean);
  }, [products]);

  // Loading state
  if (productsLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Produkte werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Connection Status */}
      {(productsUsingFallback || categoriesUsingFallback) && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Offline-Modus: Zeige gespeicherte Daten. 
              {productsError && ` (${getErrorMessage(productsError)})`}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchProducts();
                refetchCategories();
              }}
            >
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!productsUsingFallback && !categoriesUsingFallback && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            Online: Aktuelle Daten vom Server
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Alle Produkte</h1>
          <p className="text-gray-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Produkt' : 'Produkte'} gefunden
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Produkte suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
          
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

      {/* Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter {showFilters ? 'ausblenden' : 'anzeigen'}
        </Button>

        <div className="flex-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-64">
              <SelectValue placeholder="Sortieren nach..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price">Preis (niedrig-hoch)</SelectItem>
              <SelectItem value="priceDesc">Preis (hoch-niedrig)</SelectItem>
              <SelectItem value="newest">Neueste zuerst</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar Filters */}
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white p-6 rounded-lg border sticky top-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
            </h2>

            {/* Categories */}
            {categories && categories.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Kategorien</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={filters.category.includes(category.slug)}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            category: checked
                              ? [...prev.category, category.slug]
                              : prev.category.filter(c => c !== category.slug)
                          }));
                        }}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {category.name} ({category.productCount})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collections */}
            {availableCollections.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Kollektionen</h3>
                <div className="space-y-2">
                  {availableCollections.map((collection) => (
                    <div key={collection} className="flex items-center space-x-2">
                      <Checkbox
                        id={`collection-${collection}`}
                        checked={filters.collection.includes(collection)}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            collection: checked
                              ? [...prev.collection, collection]
                              : prev.collection.filter(c => c !== collection)
                          }));
                        }}
                      />
                      <label
                        htmlFor={`collection-${collection}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {collection}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Preis</h3>
              <div className="px-2">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                  max={500}
                  min={0}
                  step={10}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{filters.priceRange[0]}€</span>
                  <span>{filters.priceRange[1]}€</span>
                </div>
              </div>
            </div>

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Größen</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <Button
                      key={size}
                      variant={filters.sizes.includes(size) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          sizes: filters.sizes.includes(size)
                            ? prev.sizes.filter(s => s !== size)
                            : [...prev.sizes, size]
                        }));
                      }}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* In Stock */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={filters.inStock}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: checked as boolean }))}
                />
                <label
                  htmlFor="inStock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Nur verfügbare Artikel
                </label>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  category: [],
                  collection: [],
                  priceRange: [0, 300],
                  sizes: [],
                  colors: [],
                  tags: [],
                  inStock: false,
                });
                setSearchTerm('');
              }}
              className="w-full"
            >
              Filter zurücksetzen
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Keine Produkte gefunden.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    category: [],
                    collection: [],
                    priceRange: [0, 300],
                    sizes: [],
                    colors: [],
                    tags: [],
                    inStock: false,
                  });
                  setSearchTerm('');
                }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
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
          )}
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

export default ProductsPage;
