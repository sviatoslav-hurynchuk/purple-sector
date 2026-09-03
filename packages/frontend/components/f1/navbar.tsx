'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, Trophy, Radio } from 'lucide-react';
import { useSharedLiveSession } from '@/components/live/live-session-provider';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live', label: 'Live Timing', icon: Radio, isLive: true },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/constructors', label: 'Teams & Drivers', icon: Users, aliases: ['/drivers'] },
  { href: '/standings', label: 'Standings', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const { state } = useSharedLiveSession();
  const isLiveActive = Boolean(state?.isActive);

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.href === '/') {
      return pathname === '/';
    }
    if (pathname.startsWith(item.href)) {
      return true;
    }
    if (item.aliases && item.aliases.some((alias) => pathname.startsWith(alias))) {
      return true;
    }
    return false;
  };

  return (
    <header className="border-b border-border bg-zinc-950/95 backdrop-blur-md sticky top-0 z-50">
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
                  className={[
                    'px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5',
                    active
                      ? 'bg-white/10 text-white font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                  ].join(' ')}
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
        </div>

        {/* Mobile Navigation Strip — Horizontal Scrollable Native Tabs */}
        <nav className="flex md:hidden items-center gap-1.5 overflow-x-auto py-2 -mx-4 px-4 border-t border-white/5 no-scrollbar scroll-smooth">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5',
                ].join(' ')}
              >
                <Icon className={['h-3.5 w-3.5', active ? 'text-primary-foreground' : (item.isLive && isLiveActive ? 'text-red-400' : 'text-zinc-400')].join(' ')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}