import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useViewportOptimization } from '@/hooks/usePerformanceOptimization';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazyLoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Wrapper component for lazy loading content when it enters the viewport
 */
export function LazyLoadingWrapper({
  children,
  fallback,
  className,
  threshold = 0.1,
  rootMargin = '50px',
}: LazyLoadingWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { observeElement } = useViewportOptimization();

  useEffect(() => {
    if (!elementRef.current) return;

    const cleanup = observeElement(
      elementRef.current,
      (visible) => {
        setIsVisible(visible);
        if (visible && !shouldLoad) {
          setShouldLoad(true);
        }
      },
      { threshold, rootMargin }
    );

    return cleanup;
  }, [observeElement, threshold, rootMargin, shouldLoad]);

  const defaultFallback = (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <div
      ref={elementRef}
      className={cn(
        'min-h-[100px] transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-70',
        className
      )}
    >
      {shouldLoad ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
}

/**
 * Higher-order component for creating lazy-loaded components
 */
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return React.forwardRef<any, P & LazyLoadingWrapperProps>((props, ref) => {
    const { className, threshold, rootMargin, ...componentProps } = props;

    return (
      <LazyLoadingWrapper
        className={className}
        threshold={threshold}
        rootMargin={rootMargin}
        fallback={fallback}
      >
        <Component {...(componentProps as P)} ref={ref} />
      </LazyLoadingWrapper>
    );
  });
}

/**
 * Lazy image component with progressive loading
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
}

export function LazyImage({
  src,
  alt,
  placeholderSrc,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { observeElement } = useViewportOptimization();

  useEffect(() => {
    if (!imgRef.current) return;

    const cleanup = observeElement(
      imgRef.current,
      (visible) => {
        if (visible) {
          setIsInView(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    return cleanup;
  }, [observeElement]);

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-8 h-8 text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}