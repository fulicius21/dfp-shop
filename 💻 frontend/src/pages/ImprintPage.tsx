import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ImprintPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Impressum</span>
        </div>

        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Impressum
            </h1>
            <p className="text-lg text-gray-600">
              Angaben gemäß § 5 TMG
            </p>
          </div>

          {/* Unternehmensangaben */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Unternehmensangaben
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">DressForPleasure GmbH</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Hauptsitz Berlin
                      </h4>
                      <div className="text-gray-700 space-y-1">
                        <p>Unter den Linden 1</p>
                        <p>10117 Berlin</p>
                        <p>Deutschland</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Produktionsstandort Atlanta
                      </h4>
                      <div className="text-gray-700 space-y-1">
                        <p>Peachtree Street 100</p>
                        <p>Atlanta, GA 30309</p>
                        <p>USA</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        Telefon
                      </h4>
                      <p className="text-gray-700">+49 30 12345678</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        E-Mail
                      </h4>
                      <p className="text-gray-700">
                        <a href="mailto:kontakt@dressforp.com" className="hover:underline">
                          kontakt@dressforp.com
                        </a>
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Globe className="mr-2 h-4 w-4" />
                        Website
                      </h4>
                      <p className="text-gray-700">www.dressforp.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rechtliche Angaben */}
          <Card>
            <CardHeader>
              <CardTitle>Rechtliche Angaben</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Geschäftsführung</h4>
                    <p className="text-gray-700">Max Muster, Maria Beispiel</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">Handelsregister</h4>
                    <p className="text-gray-700">
                      Amtsgericht Berlin-Charlottenburg<br />
                      HRB 12345 B
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">Umsatzsteuer-ID</h4>
                    <p className="text-gray-700">
                      DE123456789<br />
                      (gemäß § 27a UStG)
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Wirtschafts-ID</h4>
                    <p className="text-gray-700">DE123456789</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">Aufsichtsbehörde</h4>
                    <p className="text-gray-700">
                      Gewerbeamt Berlin Mitte<br />
                      Mathilde-Jacob-Platz 1<br />
                      10551 Berlin
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">Berufsbezeichnung</h4>
                    <p className="text-gray-700">
                      Handel mit Bekleidung<br />
                      (verliehen in Deutschland)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verantwortlich für den Inhalt */}
          <Card>
            <CardHeader>
              <CardTitle>Verantwortlich für den Inhalt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Redaktionell Verantwortlicher</h4>
                  <div className="text-gray-700">
                    <p>Max Muster</p>
                    <p>Unter den Linden 1</p>
                    <p>10117 Berlin</p>
                    <p className="mt-2">
                      <a href="mailto:redaktion@dressforp.com" className="hover:underline">
                        redaktion@dressforp.com
                      </a>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Datenschutzbeauftragte</h4>
                  <div className="text-gray-700">
                    <p>Maria Beispiel</p>
                    <p>Unter den Linden 1</p>
                    <p>10117 Berlin</p>
                    <p className="mt-2">
                      <a href="mailto:datenschutz@dressforp.com" className="hover:underline">
                        datenschutz@dressforp.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streitschlichtung */}
          <Card>
            <CardHeader>
              <CardTitle>EU-Streitschlichtung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                </p>
                <p>
                  <a 
                    href="https://ec.europa.eu/consumers/odr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p className="text-gray-700">
                  Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Verbraucherstreitbeilegung</h4>
                  <p className="text-blue-700 text-sm">
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                    Verbraucherschlichtungsstelle teilzunehmen. Gerne lösen wir Konflikte jedoch 
                    direkt mit Ihnen. Kontaktieren Sie uns einfach über unseren Kundenservice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Haftungsausschluss */}
          <Card>
            <CardHeader>
              <CardTitle>Haftungsausschluss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Haftung für Inhalte</h4>
                  <p className="text-gray-700 text-sm">
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen 
                    Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind 
                    wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder 
                    gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, 
                    die auf eine rechtswidrige Tätigkeit hinweisen.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Haftung für Links</h4>
                  <p className="text-gray-700 text-sm">
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir 
                    keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine 
                    Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige 
                    Anbieter oder Betreiber der Seiten verantwortlich.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Urheberrecht</h4>
                  <p className="text-gray-700 text-sm">
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten 
                    unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, 
                    Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
                    bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card>
            <CardHeader>
              <CardTitle>Haben Sie Fragen?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Mail className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold mb-1">E-Mail</h4>
                  <a href="mailto:kontakt@dressforp.com" className="text-blue-600 hover:underline text-sm">
                    kontakt@dressforp.com
                  </a>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Phone className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <h4 className="font-semibold mb-1">Telefon</h4>
                  <p className="text-green-600 text-sm">+49 30 12345678</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Globe className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold mb-1">Online</h4>
                  <Link to="/konto" className="text-purple-600 hover:underline text-sm">
                    Kundenkonto
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-8 border-t">
            <p>
              Dieses Impressum wurde zuletzt am 15. Januar 2024 aktualisiert.<br />
              Bei rechtlichen Fragen wenden Sie sich an: <a href="mailto:recht@dressforp.com" className="underline">recht@dressforp.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprintPage;
