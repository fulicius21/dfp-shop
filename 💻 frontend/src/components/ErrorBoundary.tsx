import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Serialisiert Fehler für die Anzeige und Logging
 */
const serializeError = (error: any): string => {
  if (error instanceof Error) {
    return error.message + (process.env.NODE_ENV === 'development' ? '\n' + error.stack : '');
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
};

/**
 * Sendet Error-Reports an einen Logging-Service (falls konfiguriert)
 */
const reportError = (error: Error, errorInfo: React.ErrorInfo): void => {
  if (process.env.NODE_ENV === 'production') {
    // In Produktion: Error Reporting Service integrieren
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Beispiel für Sentry Integration:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    
    // Beispiel für Custom Analytics:
    // analytics.track('error_boundary_triggered', { error: error.message, stack: error.stack });
  } else {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  showDetails: boolean;
  toggleDetails: () => void;
}

/**
 * Standard Error Fallback Component mit deutschem UI
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  showDetails,
  toggleDetails,
}) => {
  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Etwas ist schiefgelaufen
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Es tut uns leid, aber es ist ein unerwarteter Fehler aufgetreten. 
            Unser Team wurde automatisch benachrichtigt.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sie können versuchen, die Seite neu zu laden oder zur Startseite zurückzukehren.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Seite neu laden
            </Button>
            <Button variant="outline" onClick={goHome} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Zur Startseite
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDetails}
                className="flex items-center gap-2 w-full justify-center"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                {showDetails ? 'Details verbergen' : 'Fehlerdetails anzeigen'}
              </Button>
              
              {showDetails && error && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Fehlerdetails:</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-60">
                    {serializeError(error)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Erweiterte Error Boundary mit deutschem UI und erweiterten Features
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to logging service
    reportError(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = (): void => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }));
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          showDetails={this.state.showDetails}
          toggleDetails={this.toggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook für Error Handling in funktionalen Komponenten
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    reportError(error, { componentStack: '' });
  }, []);

  // Throw error to be caught by Error Boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

export default ErrorBoundary;