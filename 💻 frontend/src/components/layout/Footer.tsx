import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">DressForPleasure</h3>
            <p className="text-gray-300 text-sm">
              Premium Fashion aus Berlin und Atlanta. Nachhaltig produziert, 
              zeitlos designt für den urbanen Lifestyle.
            </p>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-black rounded-full"></div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Shop</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/produkte" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Alle Produkte
              </Link>
              <Link 
                to="/kollektionen" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Kollektionen
              </Link>
              <Link 
                to="/kollektionen/berlin-collection" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Berlin Collection
              </Link>
              <Link 
                to="/kollektionen/atlanta-collection" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Atlanta Collection
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Kundenservice</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/konto" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Mein Konto
              </Link>
              <a 
                href="mailto:help@dressforp.com" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Hilfe & Support
              </a>
              <a 
                href="/size-guide" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Größentabelle
              </a>
              <a 
                href="/shipping" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Versand & Rücksendung
              </a>
            </nav>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Kontakt</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Berlin & Atlanta</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                <a 
                  href="mailto:kontakt@dressforp.com" 
                  className="hover:text-white transition-colors"
                >
                  kontakt@dressforp.com
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Phone className="h-4 w-4" />
                <span>+49 30 12345678</span>
              </div>
            </div>
            
            {/* Legal Links */}
            <div className="pt-4 border-t border-gray-700">
              <nav className="flex flex-col space-y-2">
                <Link 
                  to="/impressum" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Impressum
                </Link>
                <Link 
                  to="/datenschutz" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Datenschutz
                </Link>
                <a 
                  href="/agb" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  AGB
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="max-w-md">
            <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-300 text-sm mb-4">
              Erhalten Sie Updates zu neuen Kollektionen und exklusiven Angeboten.
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
              <button className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                Anmelden
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Mit der Anmeldung stimmen Sie unserer{' '}
              <Link to="/datenschutz" className="underline hover:text-gray-300">
                Datenschutzerklärung
              </Link>{' '}
              zu.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2024 DressForPleasure. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-300 text-sm">Made with ❤️ in Berlin & Atlanta</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
