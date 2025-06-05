import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const AccountPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');

  // Mock user data
  const userData = {
    name: 'Max Mustermann',
    email: 'max.mustermann@example.com',
    phone: '+49 30 12345678',
    address: {
      street: 'Unter den Linden 1',
      city: 'Berlin',
      postalCode: '10117',
      country: 'Deutschland',
    },
  };

  const mockOrders = [
    {
      id: '12345',
      date: '2024-01-15',
      status: 'Geliefert',
      total: 129.99,
      items: 2,
    },
    {
      id: '12346',
      date: '2024-01-10',
      status: 'Versandt',
      total: 89.99,
      items: 1,
    },
    {
      id: '12347',
      date: '2024-01-05',
      status: 'In Bearbeitung',
      total: 199.99,
      items: 3,
    },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {loginMode === 'login' ? 'Anmelden' : 'Registrieren'}
            </h1>
            <p className="text-gray-600">
              {loginMode === 'login' 
                ? 'Melden Sie sich bei Ihrem Konto an'
                : 'Erstellen Sie ein neues Konto'
              }
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form className="space-y-4">
                {loginMode === 'register' && (
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" type="text" placeholder="Ihr vollständiger Name" />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input id="email" type="email" placeholder="ihre@email.com" />
                </div>
                
                <div>
                  <Label htmlFor="password">Passwort</Label>
                  <Input id="password" type="password" placeholder="Ihr Passwort" />
                </div>

                {loginMode === 'register' && (
                  <div>
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input id="confirmPassword" type="password" placeholder="Passwort wiederholen" />
                  </div>
                )}

                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => setIsLoggedIn(true)}
                >
                  {loginMode === 'login' ? 'Anmelden' : 'Registrieren'}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {loginMode === 'login' 
                    ? 'Noch kein Konto?' 
                    : 'Bereits ein Konto?'
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setLoginMode(loginMode === 'login' ? 'register' : 'login')}
                  className="w-full"
                >
                  {loginMode === 'login' ? 'Jetzt registrieren' : 'Zur Anmeldung'}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Mit der Anmeldung stimmen Sie unseren{' '}
              <Link to="/agb" className="underline hover:text-gray-900">
                AGB
              </Link>{' '}
              und der{' '}
              <Link to="/datenschutz" className="underline hover:text-gray-900">
                Datenschutzerklärung
              </Link>{' '}
              zu.
            </p>
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
          <span className="text-gray-900">Mein Konto</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mein Konto</h1>
            <p className="text-gray-600">Willkommen zurück, {userData.name}!</p>
          </div>
          <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="orders">Bestellungen</TabsTrigger>
            <TabsTrigger value="wishlist">Wunschliste</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold text-lg">3</h3>
                  <p className="text-sm text-gray-600">Bestellungen</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Heart className="mx-auto h-8 w-8 text-red-500 mb-2" />
                  <h3 className="font-semibold text-lg">5</h3>
                  <p className="text-sm text-gray-600">Wunschliste</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <User className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <h3 className="font-semibold text-lg">VIP</h3>
                  <p className="text-sm text-gray-600">Status</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Settings className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold text-lg">€50</h3>
                  <p className="text-sm text-gray-600">Guthaben</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Aktuelle Bestellungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-semibold">Bestellung #{order.id}</p>
                        <p className="text-sm text-gray-600">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{order.total}</p>
                        <p className="text-sm text-gray-600">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link to="#" onClick={() => {/* Switch to orders tab */}}>
                    Alle Bestellungen anzeigen
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meine Bestellungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Bestellung #{order.id}</h3>
                          <p className="text-sm text-gray-600">Bestellt am {order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{order.total}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            order.status === 'Geliefert' 
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Versandt'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">{order.items} Artikel</p>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">
                            Details anzeigen
                          </Button>
                          {order.status === 'Geliefert' && (
                            <Button variant="outline" size="sm">
                              Erneut bestellen
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meine Wunschliste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ihre Wunschliste ist leer
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Fügen Sie Produkte zu Ihrer Wunschliste hinzu, um sie später zu kaufen.
                  </p>
                  <Button asChild>
                    <Link to="/produkte">
                      Produkte entdecken
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Persönliche Informationen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="profileName">Name</Label>
                    <Input id="profileName" defaultValue={userData.name} />
                  </div>
                  <div>
                    <Label htmlFor="profileEmail">E-Mail</Label>
                    <Input id="profileEmail" type="email" defaultValue={userData.email} />
                  </div>
                  <div>
                    <Label htmlFor="profilePhone">Telefon</Label>
                    <Input id="profilePhone" defaultValue={userData.phone} />
                  </div>
                  <Button>Änderungen speichern</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adresse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Straße</Label>
                    <Input id="street" defaultValue={userData.address.street} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">PLZ</Label>
                      <Input id="postalCode" defaultValue={userData.address.postalCode} />
                    </div>
                    <div>
                      <Label htmlFor="city">Stadt</Label>
                      <Input id="city" defaultValue={userData.address.city} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="country">Land</Label>
                    <Input id="country" defaultValue={userData.address.country} />
                  </div>
                  <Button>Adresse aktualisieren</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Konto-Einstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Passwort ändern</h3>
                  <div className="space-y-3">
                    <Input type="password" placeholder="Aktuelles Passwort" />
                    <Input type="password" placeholder="Neues Passwort" />
                    <Input type="password" placeholder="Neues Passwort bestätigen" />
                    <Button>Passwort aktualisieren</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Newsletter-Einstellungen</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Produktupdates und Angebote</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Neue Kollektionen</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Personalisierte Empfehlungen</span>
                    </label>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Konto löschen</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Das Löschen Ihres Kontos ist permanent und kann nicht rückgängig gemacht werden.
                  </p>
                  <Button variant="destructive">
                    Konto permanent löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountPage;
