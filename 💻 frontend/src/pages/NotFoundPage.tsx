import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 404 Not Found Page mit deutschem UI und hilfreichen Aktionen
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-6xl font-bold text-gray-400">404</span>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Seite nicht gefunden
          </CardTitle>
          <p className="text-lg text-gray-600">
            Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-gray-600">
            <p>Das kann verschiedene Gründe haben:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Die URL wurde falsch eingegeben</li>
              <li>Die Seite wurde verschoben oder gelöscht</li>
              <li>Der Link ist veraltet</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={goBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <Button asChild className="flex items-center gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Startseite
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">
              Was können Sie stattdessen tun?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link to="/produkte">
                  <ShoppingBag className="w-4 h-4" />
                  Alle Produkte
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link to="/kollektionen">
                  <Search className="w-4 h-4" />
                  Kollektionen
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>
              Wenn Sie glauben, dass hier ein Fehler vorliegt, kontaktieren Sie bitte unseren{' '}
              <Link to="/kontakt" className="text-primary hover:underline">
                Kundenservice
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;
