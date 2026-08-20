'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Calendar, Users, Trophy } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/constructors', label: 'Teams & Drivers', icon: Users, aliases: ['/drivers'] },
  { href: '/standings', label: 'Standings', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
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
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
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
                  'px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  active
                    ? 'bg-white/10 text-white font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-background/95 backdrop-blur-xl border-b border-border z-50 flex flex-col px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    'flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-bold transition-all',
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-foreground hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <Icon className={['h-5 w-5', active ? 'text-primary-foreground' : 'text-zinc-400'].join(' ')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-8 text-center text-xs text-muted-foreground/60">
            Purple Sector © F1 Stats & Telemetry
          </div>
        </div>
      )}
    </header>
  );
}