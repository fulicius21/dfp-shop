import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
}

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load products
        const productsResponse = await fetch('/data/products.json');
        const products = await productsResponse.json();
        setFeaturedProducts(products.filter((p: Product) => p.featured));

        // Load collections
        const collectionsResponse = await fetch('/data/collections.json');
        const collectionsData = await collectionsResponse.json();
        setCollections(collectionsData.filter((c: Collection) => c.featured));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: 'Kostenloser Versand',
      description: 'Ab 75€ Bestellwert',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: '30 Tage Rückgabe',
      description: 'Einfach & unkompliziert',
    },
    {
      icon: <Recycle className="h-6 w-6" />,
      title: 'Nachhaltig',
      description: 'Faire Produktion',
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: 'Premium Qualität',
      description: 'Hochwertige Materialien',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/hero-banner.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Urban Fashion<br />
            <span className="text-gray-300">Berlin & Atlanta</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Entdecken Sie nachhaltige Mode, die Berlin's urbanen Stil mit Atlanta's 
            Street-Culture vereint.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
              <Link to="/kollektionen">
                Kollektionen entdecken
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
              <Link to="/produkte">
                Alle Produkte
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-none shadow-none bg-transparent">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4 text-black">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Unsere Kollektionen
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Von Berlin inspiriert, in Atlanta verfeinert. Entdecken Sie unsere 
              sorgfältig kuratierten Kollektionen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {collections.map((collection) => (
              <Link 
                key={collection.id}
                to={`/kollektionen/${collection.slug}`}
                className="group"
              >
                <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300"></div>
                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">{collection.name}</h3>
                      <p className="text-gray-200">{collection.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <Link to="/kollektionen">
                Alle Kollektionen ansehen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ausgewählte Produkte
            </h2>
            <p className="text-lg text-gray-600">
              Unsere aktuellen Highlights für Sie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Link 
                key={product.id}
                to={`/produkte/${product.id}`}
                className="group"
              >
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.newArrival && (
                        <Badge className="bg-green-500 text-white">Neu</Badge>
                      )}
                      {product.bestseller && (
                        <Badge className="bg-blue-500 text-white">Bestseller</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-gray-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold">€{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-gray-500 line-through">
                          €{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link to="/produkte">
                Alle Produkte ansehen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Berlin trifft Atlanta
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                DressForPleasure wurde aus der Vision geboren, zwei pulsierende 
                Städte durch Mode zu verbinden. Unser Design-Team in Berlin 
                entwickelt minimalistische, urbane Looks, während unser 
                Produktionsteam in Atlanta für nachhaltige Herstellung sorgt.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Jedes Stück erzählt eine Geschichte von Innovation, Nachhaltigkeit 
                und urbanem Lifestyle. Wir glauben an Mode, die nicht nur gut 
                aussieht, sondern auch gut für unseren Planeten ist.
              </p>
              <Button asChild size="lg">
                <Link to="/kollektionen">
                  Unsere Geschichte entdecken
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <img
                src="/images/collections/collection-3.png"
                alt="Berlin Atlanta Fashion"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
