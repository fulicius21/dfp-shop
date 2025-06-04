import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, X, ShoppingBag, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const CartPage: React.FC = () => {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { toast } = useToast();

  const shippingCost = total >= 75 ? 0 : 4.99;
  const finalTotal = total + shippingCost;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      toast({
        title: "Artikel entfernt",
        description: "Der Artikel wurde aus dem Warenkorb entfernt.",
      });
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeItem(itemId);
    toast({
      title: "Artikel entfernt",
      description: `${itemName} wurde aus dem Warenkorb entfernt.`,
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Warenkorb geleert",
      description: "Alle Artikel wurden aus dem Warenkorb entfernt.",
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
            <Link to="/" className="hover:text-gray-900">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Warenkorb</span>
          </div>

          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-8" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ihr Warenkorb ist leer
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Entdecken Sie unsere Kollektionen und fügen Sie Artikel zu Ihrem Warenkorb hinzu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/produkte">
                  Produkte entdecken
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/kollektionen">
                  Kollektionen ansehen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Warenkorb</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Warenkorb ({itemCount} {itemCount === 1 ? 'Artikel' : 'Artikel'})
          </h1>
          <Button asChild variant="ghost">
            <Link to="/produkte">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Weiter einkaufen
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Artikel in Ihrem Warenkorb</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleClearCart}>
                  Warenkorb leeren
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex space-x-4 py-4 border-b last:border-b-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Größe: {item.size} | Farbe: {item.color}
                          </p>
                          <p className="text-lg font-bold">€{item.price}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.name)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Anzahl:</span>
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-4 py-2 text-center min-w-[3rem]">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-xs text-gray-500">
                            (Max: {item.maxStock})
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            €{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Truck className="h-5 w-5 text-gray-400" />
                    <span>Kostenloser Versand ab €75</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <span>30 Tage Rückgabe</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                    <span>Sichere Zahlung</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Bestellübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Zwischensumme ({itemCount} Artikel)</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Versandkosten</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Kostenlos</span>
                    ) : (
                      `€${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>

                {total < 75 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Noch €{(75 - total).toFixed(2)} für kostenlosen Versand!
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Gesamtsumme</span>
                  <span>€{finalTotal.toFixed(2)}</span>
                </div>

                <div className="text-xs text-gray-500">
                  inkl. MwSt., zzgl. Versandkosten
                </div>

                <Button asChild className="w-full" size="lg">
                  <Link to="/checkout">
                    Zur Kasse gehen
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link to="/produkte">
                    Weiter einkaufen
                  </Link>
                </Button>

                {/* Payment Methods */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">Sichere Zahlungsmethoden:</p>
                  <div className="flex space-x-2">
                    <div className="w-12 h-8 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs font-bold">VISA</span>
                    </div>
                    <div className="w-12 h-8 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs font-bold">MC</span>
                    </div>
                    <div className="w-12 h-8 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs font-bold">PP</span>
                    </div>
                    <div className="w-12 h-8 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs font-bold">GPay</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
