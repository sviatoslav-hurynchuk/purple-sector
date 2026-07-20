import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { ReactNode } from 'react';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: {
        default: 'F1 Data Hub',
        template: '%s | F1 Data Hub',
    },
    description: 'Formula 1 statistics, race results, standings and telemetry analytics.',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en" className={`${geistSans.variable} dark h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link href="/" className="font-black tracking-tighter text-xl flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded italic font-extrabold text-sm">F1</span>
                        <span className="hover:text-primary transition-colors">DATA HUB</span>
                    </Link>
                    <nav className="flex gap-6">
                        <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/calendar" className="text-sm font-semibold hover:text-primary transition-colors">
                            Calendar
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs text-muted-foreground font-mono">Live Timing Connection Ready</span>
                </div>
            </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
            {children}
        </main>

        <footer className="border-t border-border py-8 bg-card/25 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
                F1 Data Hub is an unofficial pet project and is not affiliated with the Formula 1 companies.
            </div>
        </footer>
        </body>
        </html>
    );
}