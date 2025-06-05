import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * Loading Spinner Component für Lazy Loading und asynchrone Operationen
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Lädt...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${containerClasses[size]} ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mb-2`} />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
};

/**
 * Full Screen Loading Component für Page-Level Loading
 */
export const FullScreenLoader: React.FC<{ text?: string }> = ({ 
  text = 'Seite wird geladen...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

/**
 * Inline Loading Component für Component-Level Loading
 */
export const InlineLoader: React.FC<{ text?: string }> = ({ 
  text = 'Lädt...' 
}) => {
  return (
    <div className="flex items-center justify-center py-4">
      <LoadingSpinner size="sm" text={text} />
    </div>
  );
};

export default LoadingSpinner;
