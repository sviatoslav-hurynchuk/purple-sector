'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Trophy,
  Radio,
  Swords,
} from 'lucide-react';
import { useSharedLiveSession } from '@/components/live/live-session-provider';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isLive?: boolean;
  aliases?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live', label: 'Live Timing', icon: Radio, isLive: true },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/head-to-head', label: 'Head-to-Head', icon: Swords },
  { href: '/constructors', label: 'Teams & Drivers', icon: Users, aliases: ['/drivers'] },
  { href: '/standings', label: 'Standings', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const { state } = useSharedLiveSession();
  const isLiveActive = Boolean(state?.isActive);
  const [isCompact, setIsCompact] = useState(false);
  const [selectedTab, setSelectedTab] = useState<number | null>(null);

  const isActive = useCallback(
    (item: NavItem) => {
      if (item.href === '/') {
        return pathname === '/';
      }
      if (pathname.startsWith(item.href)) {
        return true;
      }
      return Boolean(item.aliases?.some((alias) => pathname.startsWith(alias)));
    },
    [pathname]
  );

  const activeRouteIndex = NAV_ITEMS.findIndex(isActive);
  const currentActiveIndex = selectedTab !== null ? selectedTab : (activeRouteIndex >= 0 ? activeRouteIndex : 0);

  const [prevPathname, setPrevPathname] = useState(pathname);

  // Reset compact state and manual tab override when route changes during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsCompact(false);
    setSelectedTab(null);
  }

  // Scroll dynamics matching prototype: shrink on scroll-down (> 20px), expand on scroll-up, retain on idle
  useEffect(() => {
    let lastY = 0;

    const handleScroll = () => {
      const currentY = window.scrollY;

      // Scroll Down -> Shrink
      if (currentY > lastY && currentY > 20) {
        setIsCompact(true);
      }
      // Scroll Up -> Expand
      else if (currentY < lastY) {
        setIsCompact(false);
      }
      // Idle: no scroll fired, stays in its current state!

      lastY = currentY <= 0 ? 0 : currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Header Bar */}
      <header className="border-b border-border bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex justify-between items-center">
            {/* Brand / Logo */}
            <Link
              href="/"
              className="font-black tracking-tighter text-lg sm:text-xl flex items-center gap-2 shrink-0 select-none group"
            >
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded italic font-extrabold text-xs sm:text-sm shadow-sm group-hover:scale-105 transition-transform">
                F1
              </span>
              <span className="group-hover:text-primary transition-colors uppercase tracking-tight">
                PURPLE SECTOR
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5',
                      active
                        ? 'active-pill-glow text-white font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    {item.isLive && isLiveActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Header: Live Session Indicator */}
            <div className="flex md:hidden items-center gap-2">
              {isLiveActive && (
                <Link
                  href="/live"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-mono font-bold uppercase tracking-wider animate-pulse"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                  <span>Live</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating Liquid Glass Bottom Dock */}
      <div className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none z-50 px-3 md:hidden">
        <nav
          role="navigation"
          aria-label="Mobile Bottom Navigation"
          className={cn(
            'relative dock-physics pointer-events-auto liquid-glass-dock rounded-full grid grid-cols-6 items-center w-full',
            isCompact
              ? 'max-w-[270px] scale-90 opacity-95 py-1 px-2'
              : 'max-w-[310px] scale-100 opacity-100 py-1.5 px-2'
          )}
        >
          {/* Physical Sliding Active Indicator Pill */}
          <div
            className={cn(
              'absolute left-2 pointer-events-none z-0',
              'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              isCompact ? 'top-1 bottom-1' : 'top-1.5 bottom-1.5'
            )}
            style={{
              width: 'calc((100% - 16px) / 6)',
              transform: `translateX(${currentActiveIndex * 100}%)`,
            }}
          >
            <div className="w-full h-full rounded-full active-pill-glow" />
          </div>

          {NAV_ITEMS.map((item, index) => {
            const isTabActive = currentActiveIndex === index;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setIsCompact(false);
                  setSelectedTab(index);
                }}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  'dock-item w-full flex items-center justify-center rounded-full transition-colors duration-200 relative z-10',
                  isCompact ? 'h-8' : 'h-10',
                  isTabActive
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={cn('dock-icon transition-transform', isCompact ? 'w-4 h-4' : 'w-5 h-5')} />
                  {item.isLive && isLiveActive && (
                    <>
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#e10600] animate-ping" />
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#e10600]" />
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}