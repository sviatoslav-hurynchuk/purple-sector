import React from 'react';
import Image from 'next/image';
import { getCountryFlagUrl } from '@/lib/country-flags';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
  countryName?: string;
  width?: number;
  height?: number;
  className?: string;
  preload?: boolean;
}

export function CountryFlag({
  countryName,
  width = 28,
  height = 20,
  className,
  preload = false,
}: CountryFlagProps) {
  const flagUrl = getCountryFlagUrl(countryName);
  if (!flagUrl || !countryName) return null;

  return (
    <Image
      src={flagUrl}
      alt={`${countryName} flag`}
      width={width}
      height={height}
      preload={preload}
      className={cn('w-7 h-5 object-cover rounded-xs border border-zinc-700/60 shadow-sm shrink-0', className)}
    />
  );
}
