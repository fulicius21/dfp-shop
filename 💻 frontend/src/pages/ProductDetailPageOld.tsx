import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, ShoppingBag, Star, Truck, RotateCcw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

// Types
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
  variants: Array<{
    id: string;
    size: string;
    color: string;
    sku: string;
    stock: number;
    price: number;
  }>;
  tags: string[];
  material: string;
  careInstructions: string;
  sustainabilityInfo: string;
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const { addItem, getItemQuantity } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch('/data/products.json');
        const products = await response.json();
        const foundProduct = products.find((p: Product) => p.id === id);
        
        if (foundProduct) {
          setProduct(foundProduct);
          // Set default selections
          if (foundProduct.colors.length > 0) {
            setSelectedColor(foundProduct.colors[0].code);
          }
          if (foundProduct.sizes.length > 0) {
            setSelectedSize(foundProduct.sizes[0]);
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const getSelectedVariant = () => {
    if (!product) return null;
    return product.variants.find(
      variant => variant.size === selectedSize && variant.color === selectedColor
    );
  };

  const getMaxStock = () => {
    const variant = getSelectedVariant();
    return variant ? variant.stock : 0;
  };

  const isInStock = () => {
    return getMaxStock() > 0;
  };

  const handleAddToCart = () => {
    if (!product || !selectedSize || !selectedColor) {
      toast({
        title: "Auswahl erforderlich",
        description: "Bitte wählen Sie Größe und Farbe aus.",
        variant: "destructive",
      });
      return;
    }

    const variant = getSelectedVariant();
    if (!variant) {
      toast({
        title: "Variante nicht verfügbar",
        description: "Die gewählte Kombination ist nicht verfügbar.",
        variant: "destructive",
      });
      return;
    }

    const selectedColorObj = product.colors.find(c => c.code === selectedColor);
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColorObj?.name || selectedColor,
      image: product.images[0],
      quantity: 1,
      maxStock: variant.stock,
    });

    toast({
      title: "Zum Warenkorb hinzugefügt",
      description: `${product.name} (${selectedSize}, ${selectedColorObj?.name}) wurde hinzugefügt.`,
    });
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Von Wunschliste entfernt" : "Zur Wunschliste hinzugefügt",
      description: product?.name,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link kopiert",
        description: "Der Produktlink wurde in die Zwischenablage kopiert.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produkt nicht gefunden</h2>
          <p className="text-gray-600 mb-8">Das gesuchte Produkt konnte nicht gefunden werden.</p>
          <Button asChild>
            <Link to="/produkte">Zurück zu den Produkten</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentVariantStock = getItemQuantity(getSelectedVariant()?.id || '');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link to="/produkte" className="hover:text-gray-900">Produkte</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-black'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
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
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold">€{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      €{product.originalPrice}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">(4.0)</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">{product.description}</p>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="font-semibold mb-3">
                Farbe: {product.colors.find(c => c.code === selectedColor)?.name}
              </h3>
              <div className="flex space-x-3">
                {product.colors.map((color) => (
                  <button
                    key={color.code}
                    onClick={() => setSelectedColor(color.code)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === color.code
                        ? 'border-black ring-2 ring-offset-2 ring-black'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="font-semibold mb-3">Größe: {selectedSize}</h3>
              <div className="grid grid-cols-6 gap-2">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    onClick={() => setSelectedSize(size)}
                    className="h-12"
                  >
                    {size}
                  </Button>
                ))}
              </div>
              <Link to="/size-guide" className="text-sm text-gray-600 hover:text-gray-900 underline mt-2 inline-block">
                Größentabelle anzeigen
              </Link>
            </div>

            {/* Quantity and Stock */}
            <div>
              <h3 className="font-semibold mb-3">Anzahl</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 text-center min-w-[3rem]">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(getMaxStock(), quantity + 1))}
                    disabled={quantity >= getMaxStock()}
                  >
                    +
                  </Button>
                </div>
                <span className="text-sm text-gray-600">
                  {isInStock() ? `${getMaxStock()} auf Lager` : 'Nicht verfügbar'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button
                onClick={handleAddToCart}
                disabled={!isInStock() || !selectedSize || !selectedColor}
                className="w-full h-12 text-lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                In den Warenkorb
              </Button>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={handleWishlist} className="flex-1">
                  <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  Wunschliste
                </Button>
                <Button variant="outline" onClick={handleShare} className="flex-1">
                  <Share2 className="mr-2 h-5 w-5" />
                  Teilen
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <span>Kostenloser Versand ab 75€</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <RotateCcw className="h-5 w-5 text-gray-400" />
                  <span>30 Tage Rückgabe</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <span>2 Jahre Garantie</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="care">Pflege</TabsTrigger>
              <TabsTrigger value="sustainability">Nachhaltigkeit</TabsTrigger>
              <TabsTrigger value="reviews">Bewertungen</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Produktdetails</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Material</h4>
                      <p className="text-gray-600">{product.material}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Kollektion</h4>
                      <p className="text-gray-600">{product.collection}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="care" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Pflegehinweise</h3>
                  <p className="text-gray-600">{product.careInstructions}</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sustainability" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Nachhaltigkeit</h3>
                  <p className="text-gray-600">{product.sustainabilityInfo}</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Kundenbewertungen</h3>
                  <p className="text-gray-600">
                    Bewertungen sind in Entwicklung. Bald können hier Kundenmeinungen 
                    und Bewertungen angezeigt werden.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
