import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, ShoppingBag, Star, Truck, RotateCcw, Shield, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

// API Hooks
import { useProduct } from '@/hooks/useProducts';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const { addItem, getItemQuantity } = useCart();
  const { toast } = useToast();

  // API-Call für Produktdetails
  const { 
    data: product, 
    isLoading: loading, 
    error 
  } = useProduct(id || '');

  // Set default selections when product loads
  useEffect(() => {
    if (product) {
      if (product.colors.length > 0) {
        setSelectedColor(product.colors[0].code);
      }
      if (product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
    }
  }, [product]);

  // Simulierte Varianten-Logic (kann später durch echte Backend-Daten ersetzt werden)
  const getSelectedVariant = () => {
    if (!product) return null;
    // Simuliere Varianten basierend auf Auswahl
    return {
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      size: selectedSize,
      color: selectedColor,
      sku: `${product.sku || product.id}-${selectedSize}-${selectedColor}`,
      stock: Math.floor(Math.random() * 50) + 10, // Simulierter Stock
      price: product.price
    };
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

    if (!isInStock()) {
      toast({
        title: "Nicht verfügbar",
        description: "Dieses Produkt ist momentan nicht auf Lager.",
        variant: "destructive",
      });
      return;
    }

    const variant = getSelectedVariant();
    if (variant) {
      addItem({
        id: variant.id,
        productId: product.id,
        name: product.name,
        price: variant.price,
        image: product.images[0] || '',
        size: selectedSize,
        color: selectedColor,
        quantity: quantity
      });

      toast({
        title: "Zum Warenkorb hinzugefügt",
        description: `${product.name} (${selectedSize}, ${selectedColor}) wurde hinzugefügt.`,
      });
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Von Wunschliste entfernt" : "Zur Wunschliste hinzugefügt",
      description: product?.name || '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Produktdetails werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Alert className="mb-6 border-red-200 bg-red-50 max-w-md">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Fehler beim Laden des Produkts: {error.message}
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link to="/produkte">
              Zurück zu den Produkten
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Produkt nicht gefunden</h2>
          <p className="text-gray-600 mb-6">
            Das angeforderte Produkt konnte nicht gefunden werden.
          </p>
          <Button asChild>
            <Link to="/produkte">
              Zurück zu den Produkten
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentItemQuantity = getItemQuantity(getSelectedVariant()?.id || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">
            Home
          </Link>
          <span>/</span>
          <Link to="/produkte" className="hover:text-gray-900">
            Produkte
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/produkte">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu den Produkten
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img
                src={product.images[selectedImage] || '/images/products/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/products/placeholder.jpg';
                }}
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${
                      selectedImage === index ? 'border-black' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/products/placeholder.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex gap-2 mb-3">
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
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              <p className="text-gray-600 text-lg">
                {product.category} • {product.collection}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {product.price}€
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {product.originalPrice}€
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Farbe: {product.colors.find(c => c.code === selectedColor)?.name}
                </h3>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.code}
                      onClick={() => setSelectedColor(color.code)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color.code
                          ? 'border-gray-900 ring-2 ring-gray-300'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.code }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Größe: {selectedSize}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-4 text-sm font-medium rounded-md border ${
                        selectedSize === size
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Anzahl
              </h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(getMaxStock(), quantity + 1))}
                  disabled={quantity >= getMaxStock()}
                >
                  +
                </Button>
                <span className="text-sm text-gray-500 ml-2">
                  {getMaxStock()} verfügbar
                </span>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isInStock() ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${isInStock() ? 'text-green-600' : 'text-red-600'}`}>
                {isInStock() ? 'Auf Lager' : 'Nicht verfügbar'}
              </span>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!isInStock() || !selectedSize || !selectedColor}
                className="flex-1"
                size="lg"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                In den Warenkorb
                {currentItemQuantity > 0 && (
                  <span className="ml-2 bg-white text-black px-2 py-1 rounded-full text-xs">
                    {currentItemQuantity}
                  </span>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={toggleWishlist}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-600">Kostenloser Versand ab 50€</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-600">30 Tage Rückgabe</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-600">2 Jahre Garantie</p>
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
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Produktdetails</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Material</h4>
                      <p className="text-gray-600">
                        {product.material || 'Hochwertige Materialzusammensetzung'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Eigenschaften</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Atmungsaktiv</li>
                        <li>• Formbeständig</li>
                        <li>• Farbecht</li>
                        <li>• Nachhaltig produziert</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="care" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Pflegehinweise</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      {product.careInstructions || 'Maschinenwäsche bei 30°C, nicht bleichen, bei niedriger Temperatur bügeln'}
                    </p>
                    <ul className="text-gray-600 space-y-2">
                      <li>• Separat oder mit ähnlichen Farben waschen</li>
                      <li>• Nicht in den Trockner</li>
                      <li>• Bei Bedarf mit niedrigen Temperaturen bügeln</li>
                      <li>• Nicht chemisch reinigen</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sustainability" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Nachhaltigkeit</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Dieses Produkt wird unter fairen Arbeitsbedingungen und mit 
                      umweltfreundlichen Materialien hergestellt.
                    </p>
                    <ul className="text-gray-600 space-y-2">
                      <li>• GOTS-zertifizierte Bio-Baumwolle</li>
                      <li>• Faire Löhne für alle Arbeiter</li>
                      <li>• CO2-neutraler Versand</li>
                      <li>• Recycelbare Verpackung</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Kundenbewertungen</h3>
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Noch keine Bewertungen vorhanden.</p>
                    <p className="text-sm mt-2">Seien Sie der Erste, der dieses Produkt bewertet!</p>
                  </div>
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
