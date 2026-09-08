'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Trophy,
  Radio,
  Swords,
  Menu,
  X,
  ChevronRight,
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
  { href: '/constructors', label: 'Teams & Drivers', icon: Users, aliases: ['/drivers'] },
  { href: '/head-to-head', label: 'Head-to-Head', icon: Swords },
  { href: '/standings', label: 'Standings', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const { state } = useSharedLiveSession();
  const isLiveActive = Boolean(state?.isActive);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile drawer when route changes during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const isActive = (item: NavItem) => {
    if (item.href === '/') {
      return pathname === '/';
    }
    if (pathname.startsWith(item.href)) {
      return true;
    }
    return Boolean(item.aliases?.some((alias) => pathname.startsWith(alias)));
  };

  // Lock body scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
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
                        ? 'bg-white/10 text-white font-bold shadow-sm'
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

            {/* Mobile Header Controls: Live Badge + Hamburger Trigger */}
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

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Sliding Drawer & Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-all duration-300',
          mobileMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        )}
      >
        {/* Backdrop overlay */}
        <div
          className={cn(
            'fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300',
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Sliding Panel from Right */}
        <div
          className={cn(
            'fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-zinc-950 border-l border-white/10 shadow-2xl z-10 flex flex-col',
            'transition-transform duration-300 ease-out',
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Drawer Top Header */}
          <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded italic font-extrabold text-xs shadow-sm">
                F1
              </span>
              <span className="font-black uppercase tracking-tight text-sm text-white">
                PURPLE SECTOR
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Navigation Links — Monolithic 1px Grid Architecture */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            <nav className="border-t border-l border-white/10 bg-zinc-950/60 rounded-2xl overflow-hidden shadow-lg">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between p-3.5 border-b border-r border-white/10 transition-colors group',
                      active
                        ? 'bg-zinc-900/90 text-white'
                        : 'bg-zinc-900/20 text-zinc-300 hover:text-white hover:bg-zinc-900/50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'p-2 rounded-xl border transition-all shrink-0',
                          active
                            ? 'bg-primary/20 border-primary/40 text-primary shadow-sm shadow-primary/20'
                            : 'bg-zinc-900 border-white/5 text-zinc-400 group-hover:text-zinc-200 group-hover:border-white/10'
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-bold tracking-tight', active ? 'text-white' : 'text-zinc-200 group-hover:text-white')}>
                            {item.label}
                          </span>
                          {item.isLive && isLiveActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        'size-4 transition-transform shrink-0 ml-2',
                        active
                          ? 'text-primary translate-x-0.5'
                          : 'text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5'
                      )}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}