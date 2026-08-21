'use client';

import { useState, useEffect } from 'react';
import Image, { type ImageProps } from 'next/image';

interface DriverImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  showSkeleton?: boolean;
}

const DEFAULT_FALLBACK =
  'https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/v1740000001/common/f1/2026/fallback/driver/2026fallbackdriverright.webp';

export function DriverImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  className,
  showSkeleton = true,
  onLoad,
  onError,
  unoptimized = false,
  ...props
}: DriverImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  return (
    <>
      {/* Loading Skeleton Shimmer */}
      {showSkeleton && isLoading && (
        <div
          className="absolute inset-0 z-0 flex items-center justify-center animate-pulse pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-gradient-to-t from-white/10 via-white/5 to-transparent rounded-2xl backdrop-blur-[2px]" />
        </div>
      )}

      <Image
        {...props}
        unoptimized={unoptimized}
        src={hasError ? fallbackSrc : imgSrc}
        alt={alt}
        className={[
          className,
          'transition-all duration-300 ease-out',
          isLoading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100',
        ]
          .filter(Boolean)
          .join(' ')}
        onLoad={(e) => {
          setIsLoading(false);
          onLoad?.(e);
        }}
        onError={(e) => {
          onError?.(e);
          if (!hasError) {
            setHasError(true);
            setImgSrc(fallbackSrc);
          } else {
            setIsLoading(false);
          }
        }}
      />
    </>
  );
}
