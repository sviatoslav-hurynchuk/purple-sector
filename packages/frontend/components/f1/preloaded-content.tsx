'use client';

import { useState, useEffect, type ReactNode } from 'react';

interface PreloadedContentProps {
  imageUrls: string[];
  skeleton: ReactNode;
  children: ReactNode;
  maxWaitMs?: number;
}

export function PreloadedContent({
  imageUrls,
  skeleton,
  children,
  maxWaitMs = 1500,
}: PreloadedContentProps) {
  const hasValidUrls = imageUrls.some(Boolean);
  const [isReady, setIsReady] = useState(!hasValidUrls);

  const urlsKey = imageUrls.join(',');
  const [prevUrlsKey, setPrevUrlsKey] = useState(urlsKey);
  if (prevUrlsKey !== urlsKey) {
    setPrevUrlsKey(urlsKey);
    setIsReady(!hasValidUrls);
  }

  useEffect(() => {
    let isCancelled = false;

    const validUrls = Array.from(new Set(imageUrls.filter(Boolean)));
    if (validUrls.length === 0) {
      return;
    }

    let loadedCount = 0;
    const totalCount = validUrls.length;

    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= totalCount && !isCancelled) {
        setIsReady(true);
      }
    };

    const imageObjects: HTMLImageElement[] = [];

    for (const url of validUrls) {
      const img = new window.Image();
      img.onload = checkDone;
      img.onerror = checkDone; // Fail gracefully so missing assets don't block the UI
      img.src = url;
      imageObjects.push(img);
    }

    // Safety timeout to ensure user never gets stuck waiting on slow connections
    const timer = setTimeout(() => {
      if (!isCancelled) {
        setIsReady(true);
      }
    }, maxWaitMs);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      for (const img of imageObjects) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [imageUrls, maxWaitMs]);

  if (!isReady) {
    return <>{skeleton}</>;
  }

  return <div className="animate-in fade-in duration-300">{children}</div>;
}
