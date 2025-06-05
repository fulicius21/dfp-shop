import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Datenschutzerklärung</span>
        </div>

        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Datenschutzerklärung
            </h1>
            <p className="text-lg text-gray-600">
              Ihre Privatsphäre ist uns wichtig. Hier erfahren Sie, wie wir Ihre Daten verarbeiten.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Stand: Januar 2024
            </p>
          </div>

          {/* Quick Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Kurze Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Bei DressForPleasure nehmen wir den Schutz Ihrer persönlichen Daten sehr ernst. 
                  Diese Datenschutzerklärung informiert Sie über die Art, den Umfang und den Zweck 
                  der Erhebung und Verwendung Ihrer Daten.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">DSGVO-konform</h3>
                    <p className="text-sm text-green-700">
                      Wir halten alle europäischen Datenschutzstandards ein
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Ihre Rechte</h3>
                    <p className="text-sm text-blue-700">
                      Sie haben jederzeit Kontrolle über Ihre Daten
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">Sicher</h3>
                    <p className="text-sm text-purple-700">
                      Moderne Verschlüsselung und Sicherheitsmaßnahmen
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verantwortlicher */}
          <Card>
            <CardHeader>
              <CardTitle>1. Verantwortlicher</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Verantwortlicher für die Datenverarbeitung auf dieser Website ist:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="font-semibold">DressForPleasure GmbH</p>
                  <p>Unter den Linden 1</p>
                  <p>10117 Berlin, Deutschland</p>
                  <p className="mt-2">
                    <strong>E-Mail:</strong> datenschutz@dressforp.com<br />
                    <strong>Telefon:</strong> +49 30 12345678
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datenerfassung */}
          <Card>
            <CardHeader>
              <CardTitle>2. Welche Daten erfassen wir?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">2.1 Automatisch erfasste Daten</h3>
                  <p className="text-gray-700 mb-3">
                    Beim Besuch unserer Website werden automatisch folgende Daten erfasst:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>IP-Adresse (anonymisiert)</li>
                    <li>Browsertyp und -version</li>
                    <li>Betriebssystem</li>
                    <li>Referrer URL</li>
                    <li>Uhrzeit des Zugriffs</li>
                    <li>Übertragene Datenmenge</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">2.2 Von Ihnen bereitgestellte Daten</h3>
                  <p className="text-gray-700 mb-3">
                    Sie können uns freiwillig folgende Daten zur Verfügung stellen:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Name und Kontaktdaten (bei Registrierung)</li>
                    <li>Lieferadresse (bei Bestellungen)</li>
                    <li>Zahlungsinformationen (verschlüsselt)</li>
                    <li>E-Mail-Adresse (für Newsletter)</li>
                    <li>Produktbewertungen und Kommentare</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zweck der Datenverarbeitung */}
          <Card>
            <CardHeader>
              <CardTitle>3. Zweck der Datenverarbeitung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Vertragserfüllung</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Bestellabwicklung</li>
                      <li>• Zahlungsabwicklung</li>
                      <li>• Versand der Waren</li>
                      <li>• Kundenservice</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Berechtigte Interessen</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Website-Sicherheit</li>
                      <li>• Betrugsprävention</li>
                      <li>• Analyse und Optimierung</li>
                      <li>• Marketing (mit Einwilligung)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>4. Cookies und Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Unsere Website verwendet Cookies und ähnliche Technologien. Sie können 
                  Ihre Cookie-Einstellungen jederzeit in unserem Cookie-Banner anpassen.
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-800">Notwendige Cookies</h4>
                    <p className="text-sm text-gray-700">
                      Erforderlich für die Grundfunktionen der Website (Warenkorb, Anmeldung)
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-800">Analyse-Cookies</h4>
                    <p className="text-sm text-gray-700">
                      Helfen uns, die Website-Nutzung zu verstehen und zu verbessern
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-purple-800">Marketing-Cookies</h4>
                    <p className="text-sm text-gray-700">
                      Ermöglichen personalisierte Werbung und Remarketing
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ihre Rechte */}
          <Card>
            <CardHeader>
              <CardTitle>5. Ihre Rechte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Sie haben folgende Rechte bezüglich Ihrer persönlichen Daten:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Recht auf Auskunft</h4>
                      <p className="text-sm text-gray-600">
                        Information über gespeicherte Daten
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Recht auf Berichtigung</h4>
                      <p className="text-sm text-gray-600">
                        Korrektur falscher Daten
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Recht auf Löschung</h4>
                      <p className="text-sm text-gray-600">
                        "Recht auf Vergessenwerden"
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Recht auf Datenübertragbarkeit</h4>
                      <p className="text-sm text-gray-600">
                        Export Ihrer Daten
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Recht auf Widerspruch</h4>
                      <p className="text-sm text-gray-600">
                        Widerspruch gegen Verarbeitung
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Recht auf Beschwerde</h4>
                      <p className="text-sm text-gray-600">
                        Bei der Datenschutzbehörde
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-6">
                  <h4 className="font-semibold text-blue-800 mb-2">Kontakt für Datenschutzanfragen</h4>
                  <p className="text-blue-700">
                    E-Mail: <a href="mailto:datenschutz@dressforp.com" className="underline">datenschutz@dressforp.com</a><br />
                    Oder nutzen Sie unser <Link to="/konto" className="underline">Kundenkonto</Link> für Datenanfragen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drittanbieter */}
          <Card>
            <CardHeader>
              <CardTitle>6. Drittanbieter-Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Wir arbeiten mit vertrauenswürdigen Drittanbietern zusammen:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Zahlungsabwicklung</h4>
                    <p className="text-sm text-gray-600">
                      Stripe Inc. (USA) - EU-US Data Privacy Framework zertifiziert
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">E-Mail-Versand</h4>
                    <p className="text-sm text-gray-600">
                      Newsletter und Transaktions-E-Mails über EU-Server
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold">Analyse</h4>
                    <p className="text-sm text-gray-600">
                      Anonymisierte Website-Analyse (nur mit Ihrer Einwilligung)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aktionen */}
          <Card>
            <CardHeader>
              <CardTitle>Ihre Datenschutz-Einstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Verwalten Sie Ihre Datenschutz-Einstellungen:
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => {
                      // Trigger cookie banner
                      localStorage.removeItem('dressforp-cookie-consent');
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Cookie-Einstellungen ändern
                  </button>
                  
                  <Link 
                    to="/konto"
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Datenschutz-Center
                  </Link>
                  
                  <a 
                    href="mailto:datenschutz@dressforp.com"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Datenschutz-Anfrage
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-8 border-t">
            <p>
              Diese Datenschutzerklärung wurde zuletzt am 15. Januar 2024 aktualisiert.<br />
              Bei Fragen wenden Sie sich an: <a href="mailto:datenschutz@dressforp.com" className="underline">datenschutz@dressforp.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
