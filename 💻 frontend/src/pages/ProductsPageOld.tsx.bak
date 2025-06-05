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
import { ProductFilters } from '@/services/api';

// Types from API
import { Product, Category } from '@/services/api';

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

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter(item => item !== value)
        : [...(prev[key] as string[]), value]
    }));
  };

  const clearFilters = () => {
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
  };

  // Available filter options
  const availableCollections = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.collection))].filter(Boolean);
  }, [products]);

  const availableSizes = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.flatMap(p => p.sizes))].filter(Boolean);
  }, [products]);

  const availableColors = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.flatMap(p => p.colors.map(c => c.name)))].filter(Boolean);
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
              {productsError && ` (${productsError.message})`}
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
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filter</h3>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Zurücksetzen
                    </Button>
                  </div>

                  {/* Categories */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Kategorien</h4>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={filters.category.includes(category.name)}
                            onCheckedChange={() => toggleArrayFilter('category', category.name)}
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {category.name} ({category.productCount})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collections */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Kollektionen</h4>
                    <div className="space-y-2">
                      {allCollections.map(collection => (
                        <div key={collection} className="flex items-center space-x-2">
                          <Checkbox
                            id={`collection-${collection}`}
                            checked={filters.collection.includes(collection)}
                            onCheckedChange={() => toggleArrayFilter('collection', collection)}
                          />
                          <label
                            htmlFor={`collection-${collection}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {collection}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Preisbereich</h4>
                    <div className="space-y-4">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                        max={300}
                        min={0}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>€{filters.priceRange[0]}</span>
                        <span>€{filters.priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Größen</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {allSizes.map(size => (
                        <Button
                          key={size}
                          variant={filters.sizes.includes(size) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleArrayFilter('sizes', size)}
                          className="text-xs"
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleArrayFilter('tags', tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {filteredProducts.length} Produkte gefunden
              </p>
            </div>

            {viewMode === 'grid' ? (
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
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  Keine Produkte gefunden. Versuchen Sie, die Filter anzupassen.
                </p>
                <Button className="mt-4" onClick={clearFilters}>
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
