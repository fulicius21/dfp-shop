import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  lazy?: boolean;
  aspectRatio?: 'square' | 'video' | 'auto' | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  blurDataURL?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimierte Image-Komponente mit Lazy Loading, Error Handling und Performance-Features
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  lazy = true,
  aspectRatio = 'auto',
  objectFit = 'cover',
  blurDataURL,
  priority = false,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(blurDataURL || fallbackSrc);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer für Lazy Loading
  useEffect(() => {
    if (!lazy || priority || !imageRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(imageRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [imageRef, lazy, priority]);

  // Load actual image when in view
  useEffect(() => {
    if (!isInView || hasError) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };
    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };
    img.src = src;
  }, [isInView, src, fallbackSrc, hasError, onLoad, onError]);

  // Aspect ratio classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      case 'auto':
        return '';
      default:
        return aspectRatio;
    }
  };

  // Object fit classes
  const getObjectFitClass = () => {
    switch (objectFit) {
      case 'cover':
        return 'object-cover';
      case 'contain':
        return 'object-contain';
      case 'fill':
        return 'object-fill';
      case 'none':
        return 'object-none';
      case 'scale-down':
        return 'object-scale-down';
      default:
        return 'object-cover';
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        getAspectRatioClass(),
        className
      )}
    >
      <img
        ref={(ref) => setImageRef(ref)}
        src={isInView ? imageSrc : (blurDataURL || fallbackSrc)}
        alt={alt}
        className={cn(
          'w-full h-full transition-all duration-300',
          getObjectFitClass(),
          isLoading && isInView ? 'scale-110 blur-sm' : 'scale-100 blur-0',
          hasError ? 'opacity-50' : 'opacity-100'
        )}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        decoding="async"
        {...props}
      />
      
      {/* Loading State */}
      {isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Bild konnte nicht geladen werden</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Product Image Component mit optimierten Defaults für E-Commerce
 */
export const ProductImage: React.FC<OptimizedImageProps> = (props) => {
  return (
    <OptimizedImage
      aspectRatio="square"
      objectFit="cover"
      fallbackSrc="/images/products/placeholder.jpg"
      {...props}
    />
  );
};

/**
 * Hero Image Component mit optimierten Defaults für Hero-Bereiche
 */
export const HeroImage: React.FC<OptimizedImageProps> = (props) => {
  return (
    <OptimizedImage
      aspectRatio="video"
      objectFit="cover"
      priority={true}
      lazy={false}
      fallbackSrc="/images/hero-placeholder.jpg"
      {...props}
    />
  );
};

export default OptimizedImage;
