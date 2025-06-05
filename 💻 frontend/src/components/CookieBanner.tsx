import React, { useState } from 'react';
import { X, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCookieConsent, CookieConsent } from '@/contexts/CookieConsentContext';
import { Link } from 'react-router-dom';

const CookieBanner: React.FC = () => {
  const { showBanner, consent, acceptAll, acceptNecessary, updateConsent } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [customConsent, setCustomConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  if (!showBanner) return null;

  const handleToggle = (key: keyof CookieConsent) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    
    setCustomConsent(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveCustom = () => {
    updateConsent(customConsent);
  };

  const cookieTypes = [
    {
      key: 'necessary' as keyof CookieConsent,
      title: 'Notwendige Cookies',
      description: 'Diese Cookies sind für das Funktionieren der Website erforderlich und können nicht deaktiviert werden.',
      examples: 'Warenkorb, Anmeldestatus, Sicherheit',
      required: true,
    },
    {
      key: 'analytics' as keyof CookieConsent,
      title: 'Analyse-Cookies',
      description: 'Helfen uns zu verstehen, wie Besucher mit der Website interagieren.',
      examples: 'Google Analytics, Nutzungsstatistiken',
      required: false,
    },
    {
      key: 'marketing' as keyof CookieConsent,
      title: 'Marketing-Cookies',
      description: 'Werden verwendet, um Besuchern relevante Werbung und Marketingkampagnen zu zeigen.',
      examples: 'Facebook Pixel, Google Ads',
      required: false,
    },
    {
      key: 'preferences' as keyof CookieConsent,
      title: 'Präferenz-Cookies',
      description: 'Ermöglichen es der Website, sich an Ihre Präferenzen zu erinnern.',
      examples: 'Spracheinstellungen, Anzeigeoptionen',
      required: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Cookie-Einstellungen</CardTitle>
              <CardDescription className="mt-2">
                Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. 
                Sie können Ihre Präferenzen unten anpassen.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={acceptNecessary}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showDetails ? (
            // Simple view
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Wir respektieren Ihre Privatsphäre und verwenden Cookies nur mit Ihrer Zustimmung. 
                Notwendige Cookies sind für die Grundfunktionen der Website erforderlich.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={acceptAll}
                  className="flex-1"
                >
                  Alle akzeptieren
                </Button>
                <Button 
                  variant="outline"
                  onClick={acceptNecessary}
                  className="flex-1"
                >
                  Nur notwendige
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setShowDetails(true)}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Anpassen
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <Link to="/datenschutz" className="hover:underline">
                  Datenschutzerklärung
                </Link>
                <span>•</span>
                <Link to="/impressum" className="hover:underline">
                  Impressum
                </Link>
              </div>
            </div>
          ) : (
            // Detailed view
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cookie-Kategorien</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  Zurück
                </Button>
              </div>

              <div className="space-y-4">
                {cookieTypes.map((cookieType) => (
                  <div key={cookieType.key} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{cookieType.title}</h4>
                          {cookieType.required && (
                            <Badge variant="secondary" className="text-xs">
                              Erforderlich
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {cookieType.description}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Info className="h-3 w-3" />
                          <span>Beispiele: {cookieType.examples}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={customConsent[cookieType.key]}
                          onCheckedChange={() => handleToggle(cookieType.key)}
                          disabled={cookieType.required}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  onClick={handleSaveCustom}
                  className="flex-1"
                >
                  Auswahl speichern
                </Button>
                <Button 
                  variant="outline"
                  onClick={acceptAll}
                  className="flex-1"
                >
                  Alle akzeptieren
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Weitere Informationen finden Sie in unserer{' '}
                  <Link to="/datenschutz" className="hover:underline">
                    Datenschutzerklärung
                  </Link>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieBanner;
