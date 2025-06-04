import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List, Search, Wifi, WifiOff } from 'lucide-react';
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

interface Filters {
  category: string[];
  collection: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  tags: string[];
  inStock: boolean;
}

const defaultFilters: Filters = {
  category: [],
  collection: [],
  priceRange: [0, 300],
  sizes: [],
  colors: [],
  tags: [],
  inStock: false,
};

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'price', label: 'Preis (niedrig-hoch)' },
  { value: 'priceDesc', label: 'Preis (hoch-niedrig)' },
  { value: 'newest', label: 'Neueste zuerst' },
];

const ProductsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchTerm('');
  }, []);

  // API-Calls mit Fallback
  const apiFilters: ProductFilters = useMemo(() => ({
    category: filters.category.length ? filters.category : undefined,
    collection: filters.collection.length ? filters.collection : undefined,
    priceMin: filters.priceRange[0],
    priceMax: filters.priceRange[1],
    sizes: filters.sizes.length ? filters.sizes : undefined,
    colors: filters.colors.length ? filters.colors : undefined,
    tags: filters.tags.length ? filters.tags : undefined,
    inStock: filters.inStock || undefined,
    search: searchTerm || undefined,
    sortBy: sortBy as any,
    sortOrder: 'asc',
  }), [filters, searchTerm, sortBy]);

  const { products, isLoading: productsLoading, error: productsError, isUsingFallback: productsUsingFallback, refetch: refetchProducts } = useProductsWithFallback(apiFilters);
  const { categories, isLoading: categoriesLoading, error: categoriesError, isUsingFallback: categoriesUsingFallback, refetch: refetchCategories } = useCategoriesWithFallback();

  // Fallback-Filterung
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = [...products];

    if (productsUsingFallback) {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.tags.some(tag => tag.toLowerCase().includes(term))
        );
      }
      if (filters.category.length)
        filtered = filtered.filter(product => filters.category.includes(product.category));
      if (filters.collection.length)
        filtered = filtered.filter(product => filters.collection.includes(product.collection));
      filtered = filtered.filter(product =>
        product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      );
      if (filters.sizes.length)
        filtered = filtered.filter(product => product.sizes.some(size => filters.sizes.includes(size)));
      if (filters.colors.length)
        filtered = filtered.filter(product => product.colors.some(color => filters.colors.includes(color.name)));
      // Sort
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'price': return a.price - b.price;
          case 'priceDesc': return b.price - a.price;
          case 'name': return a.name.localeCompare(b.name);
          case 'newest': return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          default: return 0;
        }
      });
    }
    return filtered;
  }, [products, searchTerm, filters, sortBy, productsUsingFallback]);

  // Optionen für Filter
  const availableCollections = useMemo(() => products ? [...new Set(products.map(p => p.collection))].filter(Boolean) : [], [products]);
  const availableSizes = useMemo(() => products ? [...new Set(products.flatMap(p => p.sizes))].filter(Boolean) : [], [products]);
  const availableColors = useMemo(() => products ? [...new Set(products.flatMap(p => p.colors.map(c => c.name)))].filter(Boolean) : [], [products]);
  const availableTags = useMemo(() => products ? [...new Set(products.flatMap(p => p.tags))].filter(Boolean) : [], [products]);

  // Ladezustand
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
            <Button variant="outline" size="sm" onClick={() => { refetchProducts(); refetchCategories(); }}>
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {!productsUsingFallback && !categoriesUsingFallback && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Wifi className="h-4 w-4" />
          <AlertDescription>Online: Aktuelle Daten vom Server</AlertDescription>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Produkte suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
          <div className="flex rounded-md border">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-r-none">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-l-none">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filter {showFilters ? 'ausblenden' : 'anzeigen'}
        </Button>
        <div className="flex-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-64">
              <SelectValue placeholder="Sortieren nach..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar Filters */}
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white p-6 rounded-lg border sticky top-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filter
            </h2>
            {/* Kategorien */}
            {categories && categories.length > 0 && (
              <FilterGroup
                title="Kategorien"
                options={categories.map(c => ({ label: `${c.name} (${c.productCount})`, value: c.slug }))}
                selected={filters.category}
                onToggle={slug =>
                  setFilters(prev => ({
                    ...prev,
                    category: prev.category.includes(slug)
                      ? prev.category.filter(c => c !== slug)
                      : [...prev.category, slug],
                  }))
                }
              />
            )}
            {/* Kollektionen */}
            {availableCollections.length > 0 && (
              <FilterGroup
                title="Kollektionen"
                options={availableCollections.map(c => ({ label: c, value: c }))}
                selected={filters.collection}
                onToggle={coll =>
                  setFilters(prev => ({
                    ...prev,
                    collection: prev.collection.includes(coll)
                      ? prev.collection.filter(c => c !== coll)
                      : [...prev.collection, coll],
                  }))
                }
              />
            )}
            {/* Preis */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Preis</h3>
              <div className="px-2">
                <Slider
                  value={filters.priceRange}
                  onValueChange={value => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
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
            {/* Größen */}
            {availableSizes.length > 0 && (
              <ButtonGroup
                title="Größen"
                options={availableSizes}
                selected={filters.sizes}
                onToggle={size =>
                  setFilters(prev => ({
                    ...prev,
                    sizes: prev.sizes.includes(size)
                      ? prev.sizes.filter(s => s !== size)
                      : [...prev.sizes, size],
                  }))
                }
              />
            )}
            {/* In Stock */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={filters.inStock}
                  onCheckedChange={checked => setFilters(prev => ({ ...prev, inStock: checked as boolean }))}
                />
                <label htmlFor="inStock" className="text-sm font-medium cursor-pointer">
                  Nur verfügbare Artikel
                </label>
              </div>
            </div>
            {/* Filter zurücksetzen */}
            <Button variant="outline" onClick={resetFilters} className="w-full">
              Filter zurücksetzen
            </Button>
          </div>
        </div>
        {/* Products Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Keine Produkte gefunden.</p>
              <Button variant="outline" onClick={resetFilters}>
                Filter zurücksetzen
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hilfskomponenten für Filtergruppen
interface FilterGroupProps {
  title: string;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}
const FilterGroup: React.FC<FilterGroupProps> = ({ title, options, selected, onToggle }) => (
  <div className="mb-6">
    <h3 className="font-medium mb-3">{title}</h3>
    <div className="space-y-2">
      {options.map(opt => (
        <div key={opt.value} className="flex items-center space-x-2">
          <Checkbox
            id={`${title}-${opt.value}`}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => onToggle(opt.value)}
          />
          <label htmlFor={`${title}-${opt.value}`} className="text-sm font-medium cursor-pointer">
            {opt.label}
          </label>
        </div>
      ))}
    </div>
  </div>
);

interface ButtonGroupProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}
const ButtonGroup: React.FC<ButtonGroupProps> = ({ title, options, selected, onToggle }) => (
  <div className="mb-6">
    <h3 className="font-medium mb-3">{title}</h3>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <Button
          key={opt}
          variant={selected.includes(opt) ? "default" : "outline"}
          size="sm"
          onClick={() => onToggle(opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  </div>
);

// Produktkarte
interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}
const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  const imageSrc = product.images?.[0] || '/images/products/placeholder.jpg';
  const onImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = '/images/products/placeholder.jpg';
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex">
            <div className="w-48 h-48 flex-shrink-0">
              <img src={imageSrc} alt={product.name} className="w-full h-full object-cover rounded-l-lg" onError={onImageError} />
            </div>
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    <Link to={`/produkte/${product.id}`} className="hover:text-gray-600">{product.name}</Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{product.price}€</p>
                  {product.originalPrice && (
                    <p className="text-sm text-gray-500 line-through">{product.originalPrice}€</p>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {product.featured && <Badge variant="default">Featured</Badge>}
                  {product.newArrival && <Badge variant="secondary">Neu</Badge>}
                  {product.bestseller && <Badge variant="outline">Bestseller</Badge>}
                  {product.discount > 0 && <Badge variant="destructive">-{product.discount}%</Badge>}
                </div>
                <Button asChild>
                  <Link to={`/produkte/${product.id}`}>Details</Link>
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
          <img src={imageSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" onError={onImageError} />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold mb-1 line-clamp-1">
                <Link to={`/produkte/${product.id}`} className="hover:text-gray-600">{product.name}</Link>
              </h3>
              <p className="text-gray-600 text-sm">{product.category}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold">{product.price}€</p>
              {product.originalPrice && <p className="text-sm text-gray-500 line-through">{product.originalPrice}€</p>}
            </div>
            <div className="flex gap-1">
              {product.featured && <Badge variant="default" className="text-xs">F</Badge>}
              {product.newArrival && <Badge variant="secondary" className="text-xs">N</Badge>}
              {product.bestseller && <Badge variant="outline" className="text-xs">B</Badge>}
              {product.discount > 0 && <Badge variant="destructive" className="text-xs">-{product.discount}%</Badge>}
            </div>
          </div>
          <Button asChild className="w-full" size="sm">
            <Link to={`/produkte/${product.id}`}>Details ansehen</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsPage;
