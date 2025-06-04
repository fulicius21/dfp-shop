import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const CheckoutPage: React.FC = () => {
  const { items, total, itemCount, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Personal Info
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    
    // Shipping Address
    shippingStreet: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: 'Deutschland',
    
    // Billing Address
    billingStreet: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: 'Deutschland',
    sameBillingAddress: true,
    
    // Delivery
    deliveryMethod: 'standard',
    deliveryNotes: '',
    
    // Payment
    paymentMethod: 'stripe',
    
    // Terms
    acceptTerms: false,
    subscribeNewsletter: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const shippingCost = total >= 75 ? 0 : 4.99;
  const finalTotal = total + shippingCost;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Contact Info
        if (!formData.email) newErrors.email = 'E-Mail ist erforderlich';
        if (!formData.firstName) newErrors.firstName = 'Vorname ist erforderlich';
        if (!formData.lastName) newErrors.lastName = 'Nachname ist erforderlich';
        break;
        
      case 2: // Shipping
        if (!formData.shippingStreet) newErrors.shippingStreet = 'Straße ist erforderlich';
        if (!formData.shippingCity) newErrors.shippingCity = 'Stadt ist erforderlich';
        if (!formData.shippingPostalCode) newErrors.shippingPostalCode = 'PLZ ist erforderlich';
        
        if (!formData.sameBillingAddress) {
          if (!formData.billingStreet) newErrors.billingStreet = 'Rechnungsstraße ist erforderlich';
          if (!formData.billingCity) newErrors.billingCity = 'Rechnungsstadt ist erforderlich';
          if (!formData.billingPostalCode) newErrors.billingPostalCode = 'Rechnungs-PLZ ist erforderlich';
        }
        break;
        
      case 4: // Review
        if (!formData.acceptTerms) newErrors.acceptTerms = 'AGB müssen akzeptiert werden';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(4, currentStep + 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart and redirect to success
      clearCart();
      navigate('/order-success');
      
      toast({
        title: "Bestellung erfolgreich!",
        description: "Ihre Bestellung wurde erfolgreich aufgegeben.",
      });
    } catch (error) {
      toast({
        title: "Fehler bei der Bestellung",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Warenkorb ist leer</h2>
          <p className="text-gray-600 mb-8">Fügen Sie Artikel hinzu, um fortzufahren.</p>
          <Button asChild>
            <Link to="/produkte">Jetzt einkaufen</Link>
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Kontakt', completed: currentStep > 1 },
    { number: 2, title: 'Versand', completed: currentStep > 2 },
    { number: 3, title: 'Zahlung', completed: currentStep > 3 },
    { number: 4, title: 'Überprüfung', completed: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link to="/warenkorb">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Warenkorb
              </Link>
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Kasse</h1>
            <p className="text-gray-600">{itemCount} Artikel • €{finalTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === step.number
                    ? 'border-black text-black'
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {step.completed ? '✓' : step.number}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Contact Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Kontaktinformationen</h2>
                    
                    <div>
                      <Label htmlFor="email">E-Mail-Adresse *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Vorname *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          className={errors.firstName ? 'border-red-500' : ''}
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Nachname *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          className={errors.lastName ? 'border-red-500' : ''}
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefon (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Shipping */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Lieferadresse</h2>
                    
                    <div>
                      <Label htmlFor="shippingStreet">Straße und Hausnummer *</Label>
                      <Input
                        id="shippingStreet"
                        value={formData.shippingStreet}
                        onChange={(e) => updateFormData('shippingStreet', e.target.value)}
                        className={errors.shippingStreet ? 'border-red-500' : ''}
                      />
                      {errors.shippingStreet && <p className="text-red-500 text-sm mt-1">{errors.shippingStreet}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="shippingPostalCode">PLZ *</Label>
                        <Input
                          id="shippingPostalCode"
                          value={formData.shippingPostalCode}
                          onChange={(e) => updateFormData('shippingPostalCode', e.target.value)}
                          className={errors.shippingPostalCode ? 'border-red-500' : ''}
                        />
                        {errors.shippingPostalCode && <p className="text-red-500 text-sm mt-1">{errors.shippingPostalCode}</p>}
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="shippingCity">Stadt *</Label>
                        <Input
                          id="shippingCity"
                          value={formData.shippingCity}
                          onChange={(e) => updateFormData('shippingCity', e.target.value)}
                          className={errors.shippingCity ? 'border-red-500' : ''}
                        />
                        {errors.shippingCity && <p className="text-red-500 text-sm mt-1">{errors.shippingCity}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="shippingCountry">Land</Label>
                      <Input
                        id="shippingCountry"
                        value={formData.shippingCountry}
                        onChange={(e) => updateFormData('shippingCountry', e.target.value)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameBillingAddress"
                        checked={formData.sameBillingAddress}
                        onCheckedChange={(checked) => updateFormData('sameBillingAddress', checked)}
                      />
                      <Label htmlFor="sameBillingAddress">
                        Rechnungsadresse ist identisch mit Lieferadresse
                      </Label>
                    </div>

                    {!formData.sameBillingAddress && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Rechnungsadresse</h3>
                        
                        <div>
                          <Label htmlFor="billingStreet">Straße und Hausnummer *</Label>
                          <Input
                            id="billingStreet"
                            value={formData.billingStreet}
                            onChange={(e) => updateFormData('billingStreet', e.target.value)}
                            className={errors.billingStreet ? 'border-red-500' : ''}
                          />
                          {errors.billingStreet && <p className="text-red-500 text-sm mt-1">{errors.billingStreet}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="billingPostalCode">PLZ *</Label>
                            <Input
                              id="billingPostalCode"
                              value={formData.billingPostalCode}
                              onChange={(e) => updateFormData('billingPostalCode', e.target.value)}
                              className={errors.billingPostalCode ? 'border-red-500' : ''}
                            />
                            {errors.billingPostalCode && <p className="text-red-500 text-sm mt-1">{errors.billingPostalCode}</p>}
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="billingCity">Stadt *</Label>
                            <Input
                              id="billingCity"
                              value={formData.billingCity}
                              onChange={(e) => updateFormData('billingCity', e.target.value)}
                              className={errors.billingCity ? 'border-red-500' : ''}
                            />
                            {errors.billingCity && <p className="text-red-500 text-sm mt-1">{errors.billingCity}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-4">Lieferoptionen</h3>
                      <RadioGroup
                        value={formData.deliveryMethod}
                        onValueChange={(value) => updateFormData('deliveryMethod', value)}
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="flex-1">
                            <div className="flex justify-between">
                              <span>Standardversand (3-5 Werktage)</span>
                              <span>{shippingCost === 0 ? 'Kostenlos' : `€${shippingCost}`}</span>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="express" id="express" />
                          <Label htmlFor="express" className="flex-1">
                            <div className="flex justify-between">
                              <span>Expressversand (1-2 Werktage)</span>
                              <span>€9.99</span>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="deliveryNotes">Lieferhinweise (optional)</Label>
                      <Textarea
                        id="deliveryNotes"
                        placeholder="z.B. Hinterhof, 2. Stock links"
                        value={formData.deliveryNotes}
                        onChange={(e) => updateFormData('deliveryNotes', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Zahlungsmethode</h2>
                    
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value) => updateFormData('paymentMethod', value)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="stripe" id="stripe" />
                          <Label htmlFor="stripe" className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <CreditCard className="h-5 w-5" />
                                <span>Kreditkarte / Debitkarte</span>
                              </div>
                              <div className="flex space-x-2">
                                <div className="w-8 h-5 bg-blue-500 rounded text-xs text-white flex items-center justify-center font-bold">VISA</div>
                                <div className="w-8 h-5 bg-red-500 rounded text-xs text-white flex items-center justify-center font-bold">MC</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                          <RadioGroupItem value="paypal" id="paypal" disabled />
                          <Label htmlFor="paypal" className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>PayPal (Bald verfügbar)</span>
                              <div className="w-12 h-5 bg-blue-600 rounded text-xs text-white flex items-center justify-center font-bold">PayPal</div>
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                          <RadioGroupItem value="klarna" id="klarna" disabled />
                          <Label htmlFor="klarna" className="flex-1">
                            <span>Klarna (Bald verfügbar)</span>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {formData.paymentMethod === 'stripe' && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Sichere Zahlung</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Ihre Zahlungsdaten werden sicher über Stripe verarbeitet. 
                          Wir speichern keine Kreditkarteninformationen.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Bestellung überprüfen</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Kontakt</h3>
                        <p className="text-gray-700">{formData.email}</p>
                        <p className="text-gray-700">{formData.firstName} {formData.lastName}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Lieferadresse</h3>
                        <p className="text-gray-700">
                          {formData.shippingStreet}<br />
                          {formData.shippingPostalCode} {formData.shippingCity}<br />
                          {formData.shippingCountry}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Zahlungsmethode</h3>
                        <p className="text-gray-700">
                          {formData.paymentMethod === 'stripe' ? 'Kreditkarte / Debitkarte' : 'PayPal'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="acceptTerms"
                          checked={formData.acceptTerms}
                          onCheckedChange={(checked) => updateFormData('acceptTerms', checked)}
                        />
                        <Label htmlFor="acceptTerms" className="text-sm">
                          Ich akzeptiere die{' '}
                          <Link to="/agb" className="underline text-blue-600">
                            Allgemeinen Geschäftsbedingungen
                          </Link>
                          {' '}und{' '}
                          <Link to="/datenschutz" className="underline text-blue-600">
                            Datenschutzerklärung
                          </Link>
                          {' *'}
                        </Label>
                      </div>
                      {errors.acceptTerms && <p className="text-red-500 text-sm">{errors.acceptTerms}</p>}
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="subscribeNewsletter"
                          checked={formData.subscribeNewsletter}
                          onCheckedChange={(checked) => updateFormData('subscribeNewsletter', checked)}
                        />
                        <Label htmlFor="subscribeNewsletter" className="text-sm">
                          Ich möchte den Newsletter abonnieren und über neue Produkte informiert werden
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 mt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Zurück
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button onClick={nextStep}>
                      Weiter
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="min-w-[150px]"
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Verarbeitung...</span>
                        </div>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Jetzt bestellen
                        </>
                      )}
                    </Button>
                  )}
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
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-600">
                          {item.size} • {item.color}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.quantity}x €{item.price}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        €{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Zwischensumme</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Versand</span>
                    <span>
                      {shippingCost === 0 ? 'Kostenlos' : `€${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Gesamt</span>
                    <span>€{finalTotal.toFixed(2)}</span>
                  </div>
                  
                  <p className="text-xs text-gray-500">inkl. MwSt.</p>
                </div>

                {/* Security Info */}
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>SSL-verschlüsselte Übertragung</span>
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

export default CheckoutPage;
