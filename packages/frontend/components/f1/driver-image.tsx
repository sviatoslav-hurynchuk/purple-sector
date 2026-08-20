'use client';
import { useState, useEffect } from 'react';
import Image, { type ImageProps } from 'next/image';

interface DriverImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK =
  'https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/v1740000001/common/f1/2026/fallback/driver/2026fallbackdriverright.webp';

export function DriverImage({ src, fallbackSrc = DEFAULT_FALLBACK, alt, ...props }: DriverImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);


  return (
    <Image
      {...props}
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}
