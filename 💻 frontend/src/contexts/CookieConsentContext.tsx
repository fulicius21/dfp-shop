import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentContextType {
  consent: CookieConsent | null;
  showBanner: boolean;
  acceptAll: () => void;
  acceptNecessary: () => void;
  updateConsent: (consent: CookieConsent) => void;
  resetConsent: () => void;
}

// Default consent state
const defaultConsent: CookieConsent = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
};

// Context
const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

// Provider
export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const savedConsent = localStorage.getItem('dressforp-cookie-consent');
    if (savedConsent) {
      try {
        const consentData = JSON.parse(savedConsent);
        setConsent(consentData);
        setShowBanner(false);
      } catch (error) {
        console.error('Error loading cookie consent:', error);
        setShowBanner(true);
      }
    } else {
      // First visit, show banner
      setShowBanner(true);
    }
  }, []);

  // Save consent to localStorage and apply settings
  const saveConsent = (newConsent: CookieConsent) => {
    setConsent(newConsent);
    setShowBanner(false);
    localStorage.setItem('dressforp-cookie-consent', JSON.stringify(newConsent));
    
    // Apply cookie settings
    applyCookieSettings(newConsent);
  };

  const acceptAll = () => {
    const allAccepted: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAccepted);
  };

  const acceptNecessary = () => {
    saveConsent(defaultConsent);
  };

  const updateConsent = (newConsent: CookieConsent) => {
    saveConsent({ ...newConsent, necessary: true }); // Necessary always true
  };

  const resetConsent = () => {
    setConsent(null);
    setShowBanner(true);
    localStorage.removeItem('dressforp-cookie-consent');
    
    // Clear non-necessary cookies
    clearNonNecessaryCookies();
  };

  const value: CookieConsentContextType = {
    consent,
    showBanner,
    acceptAll,
    acceptNecessary,
    updateConsent,
    resetConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

// Helper function to apply cookie settings
function applyCookieSettings(consent: CookieConsent) {
  // Enable/disable Google Analytics
  if (consent.analytics) {
    // Enable analytics tracking
    console.log('Analytics cookies enabled');
    // Here you would initialize Google Analytics or other analytics tools
  } else {
    // Disable analytics tracking
    console.log('Analytics cookies disabled');
    // Here you would disable analytics
  }

  // Enable/disable marketing cookies
  if (consent.marketing) {
    console.log('Marketing cookies enabled');
    // Here you would enable marketing pixels, remarketing, etc.
  } else {
    console.log('Marketing cookies disabled');
    // Here you would disable marketing tools
  }

  // Enable/disable preferences cookies
  if (consent.preferences) {
    console.log('Preferences cookies enabled');
    // Here you would enable user preference storage
  } else {
    console.log('Preferences cookies disabled');
    // Here you would clear preference cookies
  }
}

// Helper function to clear non-necessary cookies
function clearNonNecessaryCookies() {
  // This function would clear all non-necessary cookies
  // For demo purposes, we'll just log the action
  console.log('Clearing non-necessary cookies');
  
  // Example: Clear specific cookies
  // document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  // document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Hook
export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
